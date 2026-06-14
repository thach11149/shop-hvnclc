import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import apiClient from '../api/client';

function RevenueChart({ data }: { data: { date: string; revenue: number; ordersCount: number }[] }) {
  if (!data?.length)
    return (
      <div className="h-48 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-sm">
        Chưa có dữ liệu
      </div>
    );
  const max = Math.max(...data.map(d => d.revenue), 1);
  const W = 600,
    H = 140;
  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: H - (d.revenue / max) * H * 0.85,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40">
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#rg)" />
        <path d={line} fill="none" stroke="#10b981" strokeWidth="2.5" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function GrowthBadge({ curr, prev }: { curr: number; prev: number }) {
  if (!prev) return null;
  const growth = ((curr - prev) / prev) * 100;
  const isUp = growth >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
        isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? '+' : ''}
      {growth.toFixed(1)}%
    </span>
  );
}

export default function ReportsPage() {
  const [range, setRange] = useState(30);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['seller-report', range],
    queryFn: () =>
      apiClient.get(`/seller/finance/report?days=${range}`).then(r => r.data.data),
  });

  const { data: topProducts, isLoading: topLoading } = useQuery({
    queryKey: ['seller-top-products'],
    queryFn: () =>
      apiClient.get('/seller/analytics/top-products?limit=10').then(r => r.data.data),
  });

  const summary = report?.summary || {};
  const daily: any[] = report?.daily || [];
  const dailySorted = [...daily].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const products: any[] = topProducts?.data || [];
  const maxRevenue = Math.max(...products.map((p: any) => p.revenue || 0), 1);

  const handleExport = () => {
    const baseURL = (apiClient.defaults as any).baseURL || '';
    window.open(`${baseURL}/export/seller-report?days=${range}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo doanh số</h1>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === d
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d} ngày
            </button>
          ))}
          <button
            onClick={handleExport}
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Doanh thu</p>
          <p className="text-xl font-bold text-green-600 mb-1">
            {Number(summary.revenue || 0).toLocaleString('vi-VN')}₫
          </p>
          <GrowthBadge curr={summary.revenue || 0} prev={summary.prevRevenue || 0} />
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Số đơn hàng</p>
          <p className="text-xl font-bold text-blue-600 mb-1">{summary.ordersCount || 0}</p>
          <GrowthBadge curr={summary.ordersCount || 0} prev={summary.prevOrdersCount || 0} />
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Phí nền tảng</p>
          <p className="text-xl font-bold text-red-500 mb-1">
            {Number(summary.platformFee || 0).toLocaleString('vi-VN')}₫
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Thực nhận</p>
          <p className="text-xl font-bold text-gray-800 mb-1">
            {Number(summary.netRevenue || 0).toLocaleString('vi-VN')}₫
          </p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Biểu đồ doanh thu</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                viewMode === 'chart' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Biểu đồ
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                viewMode === 'table' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Bảng
            </button>
          </div>
        </div>

        {reportLoading ? (
          <div className="h-40 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-sm">
            Đang tải...
          </div>
        ) : viewMode === 'chart' ? (
          <RevenueChart data={daily} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Ngày</th>
                  <th className="text-right px-3 py-2 text-gray-500 font-medium">Đơn hàng</th>
                  <th className="text-right px-3 py-2 text-gray-500 font-medium">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {dailySorted.map((day: any) => (
                  <tr key={day.date} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">{day.date}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{day.ordersCount}</td>
                    <td className="px-3 py-2 text-right font-medium text-green-600">
                      {Number(day.revenue).toLocaleString('vi-VN')}₫
                    </td>
                  </tr>
                ))}
                {dailySorted.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-gray-400">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top products */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-800">Top sản phẩm bán chạy</h2>
        </div>
        {topLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : products.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-center px-3 py-3 text-gray-500 font-medium w-10">#</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Sản phẩm</th>
                <th className="text-right px-3 py-3 text-gray-500 font-medium">Đã bán</th>
                <th className="text-right px-3 py-3 text-gray-500 font-medium">Doanh thu</th>
                <th className="text-right px-3 py-3 text-gray-500 font-medium">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item: any, index: number) => {
                const product = item.product || {};
                const img = product.images?.[0];
                const revenueWidth = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                return (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-3 text-center text-gray-400 font-medium">{index + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {img ? (
                          <img
                            src={img}
                            alt={product.name}
                            className="w-9 h-9 rounded object-cover flex-shrink-0 bg-gray-100"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded bg-gray-100 flex-shrink-0" />
                        )}
                        <span className="font-medium text-gray-800 line-clamp-2 max-w-[200px]">
                          {product.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700">{item.soldCount || 0}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-semibold text-green-600">
                          {Number(item.revenue || 0).toLocaleString('vi-VN')}₫
                        </span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-400 rounded-full"
                            style={{ width: `${revenueWidth}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {item.avgRating != null ? (
                        <span className="text-yellow-500 font-medium">
                          ★ {Number(item.avgRating).toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-400">Chưa có dữ liệu sản phẩm</div>
        )}
      </div>
    </div>
  );
}
