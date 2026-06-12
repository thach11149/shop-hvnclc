import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  ENDED: 'bg-red-100 text-red-700',
};

const TYPE_LABELS: Record<string, string> = {
  SPONSORED_PRODUCT: 'Sản phẩm tài trợ',
  BANNER: 'Banner',
  SEARCH_ADS: 'Tìm kiếm',
};

export default function AdsPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ads', activeFilter],
    queryFn: () => apiClient.get(`/admin/ads${activeFilter !== 'all' ? `?status=${activeFilter}` : ''}`).then(r => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/ads/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'ACTIVE', label: 'Đang chạy' },
    { key: 'PAUSED', label: 'Tạm dừng' },
    { key: 'DRAFT', label: 'Nháp' },
    { key: 'ENDED', label: 'Đã kết thúc' },
  ];

  const totalBudget = data?.data?.reduce((sum: number, c: any) => sum + Number(c.totalBudget || 0), 0) || 0;
  const activeCampaigns = data?.data?.filter((c: any) => c.status === 'ACTIVE').length || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý quảng cáo</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Tổng chiến dịch</p>
          <p className="text-2xl font-bold">{data?.data?.length || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Đang chạy</p>
          <p className="text-2xl font-bold text-green-600">{activeCampaigns}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Tổng ngân sách</p>
          <p className="text-xl font-bold text-blue-600">{Number(totalBudget).toLocaleString('vi-VN')}₫</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Tỷ lệ hoạt động</p>
          <p className="text-2xl font-bold text-purple-600">
            {data?.data?.length ? Math.round((activeCampaigns / data.data.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm ${activeFilter === tab.key ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center text-gray-500">Chưa có chiến dịch quảng cáo nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Chiến dịch</th>
                <th className="text-left px-4 py-3 text-gray-500">Shop</th>
                <th className="text-left px-4 py-3 text-gray-500">Loại</th>
                <th className="text-right px-4 py-3 text-gray-500">Ngân sách/ngày</th>
                <th className="text-right px-4 py-3 text-gray-500">Giá thầu</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((campaign: any) => (
                <tr key={campaign.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-xs text-gray-500">{campaign._count?.items || 0} sản phẩm</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{campaign.shop?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{TYPE_LABELS[campaign.type] || campaign.type}</td>
                  <td className="px-4 py-3 text-right">{Number(campaign.dailyBudget).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3 text-right">{Number(campaign.bidAmount).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[campaign.status] || 'bg-gray-100'}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {campaign.status === 'ACTIVE' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: campaign.id, status: 'PAUSED' })}
                          className="text-xs text-yellow-600 hover:underline"
                        >
                          Tạm dừng
                        </button>
                      )}
                      {['DRAFT', 'PAUSED'].includes(campaign.status) && (
                        <button
                          onClick={() => updateStatus.mutate({ id: campaign.id, status: 'ACTIVE' })}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Kích hoạt
                        </button>
                      )}
                      {campaign.status !== 'ENDED' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: campaign.id, status: 'ENDED' })}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Dừng
                        </button>
                      )}
                    </div>
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
