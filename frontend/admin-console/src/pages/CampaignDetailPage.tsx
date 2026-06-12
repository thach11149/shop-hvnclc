import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'products' | 'sellers' | 'settings'>('products');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['admin-campaign', id],
    queryFn: () => apiClient.get(`/admin/campaigns/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: ({ itemId, approve }: { itemId: string; approve: boolean }) =>
      apiClient.patch(`/admin/flash-sale-items/${itemId}/${approve ? 'approve' : 'reject'}`),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-campaign', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const updateCampaignMutation = useMutation({
    mutationFn: (data: any) => apiClient.patch(`/admin/campaigns/${id}`, data),
    onSuccess: () => {
      toast.success('Cập nhật campaign thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-campaign', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi cập nhật'),
  });

  if (isLoading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!campaign) return <div className="p-8 text-center">Không tìm thấy campaign</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/campaigns')} className="text-gray-500 hover:text-gray-700">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">{campaign.name}</h1>
          <p className="text-sm text-gray-500">
            {new Date(campaign.startDate).toLocaleDateString('vi-VN')} - {new Date(campaign.endDate).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
          campaign.status === 'ENDED' ? 'bg-gray-100 text-gray-600' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {campaign.status}
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {(['products', 'sellers', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm capitalize ${
              activeTab === tab ? 'bg-white shadow-sm font-medium' : 'text-gray-500'
            }`}>
            {tab === 'products' ? 'Sản phẩm' : tab === 'sellers' ? 'Seller' : 'Cài đặt'}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Sản phẩm đăng ký tham gia</h2>
          {!campaign.products?.length ? (
            <p className="text-center text-gray-400 py-6">Chưa có sản phẩm</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2 text-left">Sản phẩm</th>
                  <th className="pb-2 text-left">Seller</th>
                  <th className="pb-2 text-center">Trạng thái</th>
                  <th className="pb-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {campaign.products.map((item: any) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">
                      <p className="font-medium">{item.product?.name || item.productId}</p>
                    </td>
                    <td className="py-2 text-gray-500">{item.shop?.name}</td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{item.status}</span>
                    </td>
                    <td className="py-2 text-right">
                      {item.status === 'PENDING' && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => approveMutation.mutate({ itemId: item.id, approve: true })}
                            className="text-xs text-green-600 hover:underline">Duyệt</button>
                          <button onClick={() => approveMutation.mutate({ itemId: item.id, approve: false })}
                            className="text-xs text-red-500 hover:underline">Từ chối</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'sellers' && (
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Seller tham gia</h2>
          {!campaign.sellers?.length ? (
            <p className="text-center text-gray-400 py-6">Chưa có seller</p>
          ) : (
            <div className="space-y-2">
              {campaign.sellers.map((seller: any) => (
                <div key={seller.id} className="flex items-center justify-between border rounded p-2">
                  <span className="text-sm">{seller.shop?.name}</span>
                  <span className="text-xs text-gray-400">{new Date(seller.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-700 mb-4">Cài đặt campaign</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Tên:</span> <span className="font-medium ml-2">{campaign.name}</span></p>
            <p><span className="text-gray-500">Mô tả:</span> <span className="ml-2">{campaign.description || 'Không có'}</span></p>
            <p><span className="text-gray-500">Thời gian:</span> <span className="ml-2">{new Date(campaign.startDate).toLocaleString('vi-VN')} - {new Date(campaign.endDate).toLocaleString('vi-VN')}</span></p>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => updateCampaignMutation.mutate({ status: 'ACTIVE' })}
              disabled={campaign.status === 'ACTIVE'}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              Kích hoạt
            </button>
            <button
              onClick={() => updateCampaignMutation.mutate({ status: 'PAUSED' })}
              disabled={campaign.status === 'PAUSED'}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              Tạm dừng
            </button>
            <button
              onClick={() => updateCampaignMutation.mutate({ status: 'ENDED' })}
              disabled={campaign.status === 'ENDED'}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              Kết thúc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
