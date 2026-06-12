import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

export default function SellersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sellers', activeTab],
    queryFn: () => apiClient.get(`/admin/sellers${activeTab !== 'all' ? `?status=${activeTab}` : ''}`).then(r => r.data.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/sellers/${id}/approve`),
    onSuccess: () => { toast.success('Đã duyệt người bán'); queryClient.invalidateQueries({ queryKey: ['admin-sellers'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const reject = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/sellers/${id}/reject`),
    onSuccess: () => { toast.success('Đã từ chối'); queryClient.invalidateQueries({ queryKey: ['admin-sellers'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'ACTIVE', label: 'Đang hoạt động' },
    { key: 'SUSPENDED', label: 'Bị tạm dừng' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý người bán</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${activeTab === tab.key ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Shop</th>
                <th className="text-left px-4 py-3 text-gray-500">Email</th>
                <th className="text-right px-4 py-3 text-gray-500">Sản phẩm</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày đăng ký</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((seller: any) => (
                <tr key={seller.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {seller.shop?.logo && <img src={seller.shop.logo} className="w-8 h-8 rounded-full object-cover" alt="" />}
                      <span className="font-medium">{seller.shop?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{seller.user?.email}</td>
                  <td className="px-4 py-3 text-right">{seller.shop?._count?.products || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[seller.shop?.status] || 'bg-gray-100'}`}>
                      {seller.shop?.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(seller.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {seller.shop?.status === 'PENDING' && (
                        <>
                          <button onClick={() => approve.mutate(seller.id)} className="text-green-600 text-xs hover:underline">Duyệt</button>
                          <button onClick={() => reject.mutate(seller.id)} className="text-red-500 text-xs hover:underline">Từ chối</button>
                        </>
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
