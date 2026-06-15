import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TrendingUp, ShoppingCart, Users, Store, BarChart3, Target } from 'lucide-react';
import apiClient from '../api/client';

const RANGE_OPTIONS = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
];

function GrowthBadge({ value }: { value: number }) {
  return (
    <span className={`text-xs font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {value >= 0 ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function KPICard({ label, value, growth, icon: Icon, color, prefix = '' }: {
  label: string; value: number; growth: number; icon: any; color: string; prefix?: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{prefix}{value?.toLocaleString('vi-VN')}</p>
          <div className="mt-1.5 flex items-center gap-1">
            <GrowthBadge value={growth} />
            <span className="text-xs text-gray-400">vs tháng trước</span>
          </div>
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function AreaChart({ data, label }: { data: { date: string; value: number }[]; label: string }) {
  if (!data?.length) return <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Không có dữ liệu</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 600;
  const H = 120;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - (d.value / max) * (H - 10);
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,${H} ${points} ${W},${H}`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="bi-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#bi-grad)" />
        <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="2" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * W;
          const y = H - (d.value / max) * (H - 10);
          return <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function ConversionFunnel({ data }: { data: { stage: string; count: number; rate?: number }[] }) {
  if (!data?.length) return null;
  const max = data[0]?.count || 1;
  return (
    <div className="space-y-3">
      {data.map((step, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700">{step.stage}</span>
            <div className="flex items-center gap-3">
              <span className="font-medium">{step.count?.toLocaleString('vi-VN')}</span>
              {step.rate !== undefined && (
                <span className="text-xs text-gray-400">({step.rate.toFixed(1)}%)</span>
              )}
            </div>
          </div>
          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg flex items-center px-3 text-white text-xs font-medium"
              style={{
                width: `${(step.count / max) * 100}%`,
                background: `hsl(${240 - i * 40}, 70%, ${55 + i * 5}%)`,
              }}
            >
              {step.count?.toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BIDashboardPage() {
  const [range, setRange] = useState('30');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-bi-overview', range],
    queryFn: () => apiClient.get(`/admin/analytics/bi/overview?days=${range}`).then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: funnelData } = useQuery({
    queryKey: ['admin-bi-funnel', range],
    queryFn: () => apiClient.get(`/admin/analytics/bi/funnel?days=${range}`).then(r => r.data),
  });

  const { data: revenueChart } = useQuery({
    queryKey: ['admin-bi-revenue-chart', range],
    queryFn: () => apiClient.get(`/admin/analytics/revenue-chart?days=${range}`).then(r => r.data),
  });

  const stats = overview?.data || overview;
  const funnel = funnelData?.data || funnelData || [];
  const chartData = (revenueChart?.data || revenueChart || []).map((d: any) => ({
    date: d.date,
    value: d.revenue || d.gmv || d.value || 0,
  }));

  const dailyGmv = stats?.dailyGmv || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 size={24} className="text-primary-600" /> BI Dashboard
        </h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                range === opt.value ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {overviewLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPICard
            label="GMV" value={stats?.gmv ?? 0} growth={stats?.gmvGrowth ?? 0}
            icon={TrendingUp} color="text-primary-600 bg-primary-50"
          />
          <KPICard
            label="Đơn hàng" value={stats?.orders ?? 0} growth={stats?.ordersGrowth ?? 0}
            icon={ShoppingCart} color="text-blue-600 bg-blue-50"
          />
          <KPICard
            label="Người mua" value={stats?.buyers ?? 0} growth={stats?.buyersGrowth ?? 0}
            icon={Users} color="text-green-600 bg-green-50"
          />
          <KPICard
            label="Người bán" value={stats?.sellers ?? 0} growth={stats?.sellersGrowth ?? 0}
            icon={Store} color="text-orange-600 bg-orange-50"
          />
        </div>
      )}

      {/* Revenue Chart */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Doanh thu theo ngày ({range} ngày gần nhất)</h2>
        <AreaChart
          data={chartData.length ? chartData : dailyGmv.map((d: any) => ({ date: d.date, value: d.gmv || 0 }))}
          label="GMV"
        />
        {stats?.avgOrderValue && (
          <p className="text-xs text-gray-500 mt-2">
            Giá trị đơn trung bình: <span className="font-semibold">{Number(stats.avgOrderValue).toLocaleString('vi-VN')}₫</span>
          </p>
        )}
      </div>

      {/* Conversion Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Target size={18} className="text-primary-500" /> Phễu chuyển đổi
          </h2>
          {funnel.length > 0 ? (
            <ConversionFunnel data={funnel} />
          ) : (
            <ConversionFunnel data={[
              { stage: 'Xem trang sản phẩm', count: stats?.pageViews || 0, rate: 100 },
              { stage: 'Thêm vào giỏ', count: stats?.addToCart || 0, rate: stats?.pageViews ? Math.round((stats.addToCart / stats.pageViews) * 100) : 0 },
              { stage: 'Bắt đầu thanh toán', count: stats?.checkoutInitiated || 0, rate: stats?.addToCart ? Math.round((stats.checkoutInitiated / stats.addToCart) * 100) : 0 },
              { stage: 'Hoàn thành đơn hàng', count: stats?.orders || 0, rate: stats?.checkoutInitiated ? Math.round((stats.orders / stats.checkoutInitiated) * 100) : 0 },
            ].filter(s => s.count > 0)} />
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Chỉ số hiệu suất</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Tỷ lệ chuyển đổi', value: `${(stats?.conversionRate || 0).toFixed(2)}%` },
              { label: 'GMV trung bình/ngày', value: `${Math.round((stats?.gmv || 0) / Number(range)).toLocaleString('vi-VN')}₫` },
              { label: 'Đơn/ngày', value: `${Math.round((stats?.orders || 0) / Number(range)).toLocaleString('vi-VN')}` },
              { label: 'Người mua mới/ngày', value: `${Math.round((stats?.newBuyers || stats?.buyers || 0) / Number(range)).toLocaleString('vi-VN')}` },
              { label: 'Tỷ lệ hủy đơn', value: `${(stats?.cancelRate || 0).toFixed(1)}%` },
              { label: 'Tỷ lệ hoàn trả', value: `${(stats?.returnRate || 0).toFixed(1)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1 border-b last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Top danh mục</h2>
          {!stats?.topCategories?.length ? (
            <p className="text-gray-400 text-center py-4 text-sm">Không có dữ liệu</p>
          ) : (
            <div className="space-y-2">
              {stats.topCategories.map((cat: any, i: number) => {
                const maxGmv = stats.topCategories[0].gmv;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-0.5">
                      <span className="text-gray-700">{i + 1}. {cat.name}</span>
                      <div className="flex gap-3 text-right">
                        <span className="font-medium">{Number(cat.gmv).toLocaleString('vi-VN')}₫</span>
                        <span className="text-gray-400 w-14">{cat.orders?.toLocaleString()} đơn</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-primary-400 rounded-full" style={{ width: `${(cat.gmv / maxGmv) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Top shop</h2>
          {!stats?.topShops?.length ? (
            <p className="text-gray-400 text-center py-4 text-sm">Không có dữ liệu</p>
          ) : (
            <div className="space-y-2">
              {stats.topShops.map((shop: any, i: number) => {
                const maxGmv = stats.topShops[0].gmv;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-0.5">
                      <span className="text-gray-700">{i + 1}. {shop.name}</span>
                      <div className="flex gap-3 text-right">
                        <span className="font-medium">{Number(shop.gmv).toLocaleString('vi-VN')}₫</span>
                        <span className="text-gray-400 w-14">{shop.orders?.toLocaleString()} đơn</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-orange-400 rounded-full" style={{ width: `${(shop.gmv / maxGmv) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
