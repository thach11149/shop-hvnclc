import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

interface AffiliateStats {
  totalClicks: number;
  totalOrders: number;
  totalGmv: number;
  totalCommissionPaid: number;
  publishers: { id: string; name: string; clicks: number; orders: number; gmv: number }[];
  topLinks: { url: string; clicks: number; conversions: number }[];
}

export default function AffiliatePage() {
  const { data, isLoading } = useQuery<{ data: AffiliateStats }>({
    queryKey: ['seller-affiliate'],
    queryFn: () => apiClient.get('/seller/affiliate/stats').then(r => r.data),
  });

  const stats = data?.data;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Chương trình Affiliate</h1>

      {isLoading ? <p>Đang tải...</p> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {
              [
                { label: 'Tổng clicks', value: stats?.totalClicks?.toLocaleString() },
                { label: 'Đơn hàng', value: stats?.totalOrders?.toLocaleString() },
                { label: 'GMV từ Affiliate', value: `${stats?.totalGmv?.toLocaleString('vi-VN')}đ` },
                { label: 'Hoa hồng đã trả', value: `${stats?.totalCommissionPaid?.toLocaleString('vi-VN')}đ` },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold mt-1">{s.value ?? '--'}</p>
                </div>
              ))
            }
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-5">
              <h2 className="font-semibold text-gray-700 mb-3">Top Publishers</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Publisher</th>
                    <th className="pb-2 text-right">Clicks</th>
                    <th className="pb-2 text-right">Đơn</th>
                    <th className="pb-2 text-right">GMV</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats?.publishers?.map(p => (
                    <tr key={p.id}>
                      <td className="py-2">{p.name}</td>
                      <td className="py-2 text-right">{p.clicks?.toLocaleString()}</td>
                      <td className="py-2 text-right">{p.orders}</td>
                      <td className="py-2 text-right">{p.gmv?.toLocaleString('vi-VN')}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <h2 className="font-semibold text-gray-700 mb-3">Link nổi bật</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">URL</th>
                    <th className="pb-2 text-right">Clicks</th>
                    <th className="pb-2 text-right">Chuyển đổi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats?.topLinks?.map((link, i) => (
                    <tr key={i}>
                      <td className="py-2 font-mono text-xs truncate max-w-[200px]">{link.url}</td>
                      <td className="py-2 text-right">{link.clicks?.toLocaleString()}</td>
                      <td className="py-2 text-right">{link.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
