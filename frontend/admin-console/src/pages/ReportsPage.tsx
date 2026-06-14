import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, ArrowUp, ArrowDown, Activity, AlertTriangle, Clock } from 'lucide-react';
import apiClient from '../api/client';

// Simple inline SVG area chart that doesn't need recharts
function SimpleAreaChart({ data, height = 120 }: { data: { date: string; value: number }[]; height?: number }) {
  if (!data.length) return <div className="h-32 flex items-center justify-center text-gray-300 text-sm">Chưa có dữ liệu</div>;
  const max = Math.max(...data.map(d => d.value)) || 1;
  const width = 600;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (d.value / max) * (height - 10) - 5,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      {pts.filter((_, i) => i % Math.ceil(pts.length / 6) === 0).map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r="3" fill="#3b82f6" />
          <text x={pt.x} y={height} textAnchor="middle" className="text-gray-400" style={{ fontSize: 9, fill: '#9ca3af' }}>
            {data[i * Math.ceil(pts.length / 6)]?.date?.slice(5)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function GrowthBadge({ value }: { value: number }) {
  const isPos = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full ${isPos ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {isPos ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function formatMoney(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString('vi-VN');
}

export default function ReportsPage() {
  const [range, setRange] = useState('30');

  const { data: summary } = useQuery({
    queryKey: ['admin-analytics-summary', range],
    queryFn: () => apiClient.get(`/admin/analytics/summary?period=${range}`).then(r => r.data.data),
  });

  const { data: orderAnalytics } = useQuery({
    queryKey: ['admin-analytics-orders', range],
    queryFn: () => apiClient.get(`/admin/analytics/orders?period=${range}`).then(r => r.data.data),
  });

  const { data: topSellers } = useQuery({
    queryKey: ['admin-analytics-top-sellers', range],
    queryFn: () => apiClient.get(`/admin/analytics/top-sellers?days=${range}&limit=10`).then(r => r.data.data || []),
  });

  const { data: topCategories } = useQuery({
    queryKey: ['admin-analytics-top-categories', range],
    queryFn: () => apiClient.get(`/admin/analytics/top-categories?days=${range}&limit=8`).then(r => r.data.data || []),
  });

  const { data: realtime } = useQuery({
    queryKey: ['admin-analytics-realtime'],
    queryFn: () => apiClient.get('/admin/analytics/realtime').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const dailyChartData = (orderAnalytics?.dailyRevenue || []).map((d: any) => ({
    date: d.date,
    value: Number(d.revenue || 0),
  }));

  const statusData = orderAnalytics?.ordersByStatus || [];
  const maxStatusCount = Math.max(...statusData.map((s: any) => s._count), 1);

  const STATUS_LABELS: Record<string, string> = {
    AWAITING_SELLER_CONFIRM: 'Chờ xác nhận',
    SELLER_CONFIRMED: 'Đã xác nhận',
    PACKED: 'Đã đóng gói',
    SHIPPING: 'Đang giao',
    DELIVERED: 'Đã giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    RETURN_REQUESTED: 'Đổi trả',
  };

  const topCats: any[] = topCategories || [];
  const maxCatRevenue = Math.max(...topCats.map(c => c.revenue), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo & Thống kê</h1>
        <select value={range} onChange={e => setRange(e.target.value)} className="input max-w-[150px]">
          <option value="7">7 ngày qua</option>
          <option value="30">30 ngày qua</option>
          <option value="90">90 ngày qua</option>
        </select>
      </div>

      {/* Real-time metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3 border-l-4 border-l-blue-500">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Đơn đang xử lý</p>
            <p className="text-2xl font-bold text-gray-800">{realtime?.processingOrders || 0}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 border-l-4 border-l-orange-500">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Tranh chấp mở</p>
            <p className="text-2xl font-bold text-gray-800">{realtime?.openDisputes || 0}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 border-l-4 border-l-yellow-500">
          <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Seller chờ duyệt</p>
            <p className="text-2xl font-bold text-gray-800">{realtime?.pendingSellers || 0}</p>
          </div>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={18} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 truncate">Doanh thu {range} ngày</p>
              <p className="text-xl font-bold text-gray-800">{formatMoney(summary?.revenue || 0)}₫</p>
            </div>
          </div>
          {summary?.revenueGrowth !== undefined && <GrowthBadge value={summary.revenueGrowth} />}
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ShoppingBag size={18} /></div>
            <div>
              <p className="text-xs text-gray-500">Đơn hàng</p>
              <p className="text-xl font-bold text-gray-800">{(summary?.orders || 0).toLocaleString()}</p>
            </div>
          </div>
          {summary?.ordersGrowth !== undefined && <GrowthBadge value={Number(summary.ordersGrowth)} />}
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users size={18} /></div>
            <div>
              <p className="text-xs text-gray-500">Người dùng mới</p>
              <p className="text-xl font-bold text-gray-800">{summary?.newUsers || 0}</p>
              <p className="text-xs text-gray-400">Tổng: {summary?.totalUsers?.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><TrendingUp size={18} /></div>
            <div>
              <p className="text-xs text-gray-500">Seller hoạt động</p>
              <p className="text-xl font-bold text-gray-800">{summary?.activeSellers || 0}</p>
              <p className="text-xs text-gray-400">Chờ duyệt: {summary?.pendingSellers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-bold text-gray-800 mb-1">Doanh thu theo ngày</h2>
          <p className="text-xs text-gray-500 mb-4">{range} ngày qua (đơn hoàn thành/đang giao)</p>
          <SimpleAreaChart data={dailyChartData} height={160} />
        </div>

        {/* Orders by status */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4">Đơn hàng theo trạng thái</h2>
          <div className="space-y-2">
            {statusData.filter((s: any) => s._count > 0).map((s: any) => (
              <div key={s.status}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{STATUS_LABELS[s.status] || s.status}</span>
                  <span className="font-medium text-gray-700">{s._count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(s._count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top sellers */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800">Top người bán (GMV)</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500">#</th>
                <th className="text-left px-4 py-2 text-gray-500">Shop</th>
                <th className="text-right px-4 py-2 text-gray-500">Đơn</th>
                <th className="text-right px-4 py-2 text-gray-500">Hoàn thành</th>
                <th className="text-right px-4 py-2 text-gray-500">GMV</th>
              </tr>
            </thead>
            <tbody>
              {(topSellers || []).slice(0, 8).map((seller: any, i: number) => (
                <tr key={seller.shopId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800 text-xs">{seller.shopName}</td>
                  <td className="px-4 py-2.5 text-right text-xs">{seller.ordersCount}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`text-xs ${seller.completionRate >= 80 ? 'text-green-600' : seller.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {seller.completionRate}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-green-600 text-xs">{formatMoney(seller.gmv)}₫</td>
                </tr>
              ))}
              {!topSellers?.length && (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400 text-sm">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top categories */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4">Top danh mục bán chạy</h2>
          <div className="space-y-3">
            {topCats.slice(0, 8).map((cat: any, i: number) => (
              <div key={cat.categoryId}>
                <div className="flex justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 text-xs flex items-center justify-center rounded-full font-bold flex-shrink-0 ${i < 3 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{i+1}</span>
                    <span className="text-gray-700 font-medium">{cat.categoryName}</span>
                  </div>
                  <span className="text-green-600 font-bold text-xs">{formatMoney(cat.revenue)}₫</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-7">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                    style={{ width: `${(cat.revenue / maxCatRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!topCats.length && (
              <div className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
