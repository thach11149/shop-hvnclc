import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

interface BIOverview {
  gmv: number;
  gmvGrowth: number;
  orders: number;
  ordersGrowth: number;
  buyers: number;
  buyersGrowth: number;
  sellers: number;
  sellersGrowth: number;
  avgOrderValue: number;
  topCategories: { name: string; gmv: number; orders: number }[];
  topShops: { name: string; gmv: number; orders: number }[];
  dailyGmv: { date: string; gmv: number }[];
}

function MetricCard({ label, value, growth, prefix = '' }: { label: string; value: number; growth: number; prefix?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{prefix}{value?.toLocaleString('vi-VN')}</p>
      <p className={`text-sm mt-1 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {growth >= 0 ? '▲' : '▼'} {Math.abs(growth)}% so với tháng trước
      </p>
    </div>
  );
}

export default function BIDashboardPage() {
  const { data, isLoading } = useQuery<{ data: BIOverview }>({
    queryKey: ['admin-bi-overview'],
    queryFn: () => apiClient.get('/admin/analytics/bi/overview').then(r => r.data),
    refetchInterval: 60000,
  });

  const stats = data?.data;

  if (isLoading) return <div className="p-6"><p>Đang tải dữ liệu BI...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">BI Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="GMV" value={stats?.gmv ?? 0} growth={stats?.gmvGrowth ?? 0} prefix="" />
        <MetricCard label="Đơn hàng" value={stats?.orders ?? 0} growth={stats?.ordersGrowth ?? 0} />
        <MetricCard label="Người mua" value={stats?.buyers ?? 0} growth={stats?.buyersGrowth ?? 0} />
        <MetricCard label="Người bán" value={stats?.sellers ?? 0} growth={stats?.sellersGrowth ?? 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Top danh mục</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Danh mục</th>
                <th className="pb-2 text-right">GMV</th>
                <th className="pb-2 text-right">Đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats?.topCategories?.map((cat, i) => (
                <tr key={i}>
                  <td className="py-2">{cat.name}</td>
                  <td className="py-2 text-right">{cat.gmv?.toLocaleString('vi-VN')}đ</td>
                  <td className="py-2 text-right">{cat.orders?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Top shop</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Shop</th>
                <th className="pb-2 text-right">GMV</th>
                <th className="pb-2 text-right">Đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats?.topShops?.map((shop, i) => (
                <tr key={i}>
                  <td className="py-2">{shop.name}</td>
                  <td className="py-2 text-right">{shop.gmv?.toLocaleString('vi-VN')}đ</td>
                  <td className="py-2 text-right">{shop.orders?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-3">GMV theo ngày (30 ngày gần nhất)</h2>
        <div className="flex items-end gap-1 h-32">
          {stats?.dailyGmv?.map((d, i) => {
            const max = Math.max(...(stats.dailyGmv?.map(x => x.gmv) ?? [1]));
            const height = max > 0 ? (d.gmv / max) * 100 : 0;
            return (
              <div key={i} title={`${d.date}: ${d.gmv?.toLocaleString('vi-VN')}đ`} className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors" style={{ height: `${height}%` }} />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{stats?.dailyGmv?.[0]?.date}</span>
          <span>{stats?.dailyGmv?.[stats.dailyGmv.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
}
