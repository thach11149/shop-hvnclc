import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700', REJECTED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-green-100 text-green-700', INACTIVE: 'bg-orange-100 text-orange-600',
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('PENDING_APPROVAL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', activeTab],
    queryFn: () => apiClient.get(`/admin/products?status=${activeTab}`).then(r => r.data.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/products/${id}/approve`),
    onSuccess: () => { toast.success('Đã duyệt sản phẩm'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => apiClient.patch(`/admin/products/${id}/reject`, { reason }),
    onSuccess: () => { toast.success('Đã từ chối'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const tabs = [
    { key: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
    { key: 'ACTIVE', label: 'Đang bán' },
    { key: 'REJECTED', label: 'Bị từ chối' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý sản phẩm</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm ${activeTab === tab.key ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
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
                <th className="text-left px-4 py-3 text-gray-500">Sản phẩm</th>
                <th className="text-left px-4 py-3 text-gray-500">Shop</th>
                <th className="text-left px-4 py-3 text-gray-500">Danh mục</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((product: any) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={product.images?.[0]?.url || 'https://via.placeholder.com/40'}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <span className="font-medium line-clamp-1">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{product.shop?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{product.category?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[product.status] || ''}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {product.status === 'PENDING_APPROVAL' && (
                      <div className="flex gap-2">
                        <button onClick={() => approve.mutate(product.id)} className="text-green-600 text-xs hover:underline">Duyệt</button>
                        <button onClick={() => reject.mutate({ id: product.id, reason: 'Không đạt yêu cầu' })} className="text-red-500 text-xs hover:underline">Từ chối</button>
                      </div>
                    )}
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
