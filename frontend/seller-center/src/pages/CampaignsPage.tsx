import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export default function CampaignsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['seller-campaigns'],
    queryFn: () => apiClient.get('/seller/campaigns').then(r => r.data.data),
  });

  const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    ACTIVE: 'bg-green-100 text-green-700',
    ENDED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-orange-100 text-orange-600',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Chiến dịch</h1>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">Chưa tham gia chiến dịch nào</p>
            <p className="text-sm">Các chiến dịch từ admin sẽ hiển thị để bạn đăng ký tham gia</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tên chiến dịch</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Loại</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Thời gian</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((campaign: any) => (
                <tr key={campaign.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{campaign.name}</td>
                  <td className="px-4 py-3 text-gray-500">{campaign.type}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(campaign.startDate).toLocaleDateString('vi-VN')} - {new Date(campaign.endDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[campaign.status] || 'bg-gray-100'}`}>
                      {campaign.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
