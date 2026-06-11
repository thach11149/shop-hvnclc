import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp', PENDING_APPROVAL: 'Chờ duyệt', APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối', ACTIVE: 'Đang bán', INACTIVE: 'Tạm dừng',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700', REJECTED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-green-100 text-green-700', INACTIVE: 'bg-orange-100 text-orange-600',
};

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-products'],
    queryFn: () => apiClient.get('/seller/products').then(r => r.data.data),
  });

  const submitApproval = useMutation({
    mutationFn: (id: string) => apiClient.post(`/seller/products/${id}/submit-approval`),
    onSuccess: () => {
      toast.success('Đã gửi duyệt sản phẩm');
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sản phẩm</h1>
        <Link to="/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm sản phẩm
        </Link>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : data?.data?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="mx-auto mb-2 text-gray-300" size={40} />
            <p>Chưa có sản phẩm nào</p>
            <Link to="/products/new" className="btn-primary mt-3 inline-block">Thêm sản phẩm đầu tiên</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Sản phẩm</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Danh mục</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Giá</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((product: any) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]?.url || 'https://via.placeholder.com/40'}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <span className="font-medium line-clamp-1">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{product.category?.name}</td>
                  <td className="px-4 py-3 text-right">
                    {product.skus?.[0] ? `${Number(product.skus[0].price).toLocaleString('vi-VN')}₫` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[product.status] || ''}`}>
                      {STATUS_LABELS[product.status] || product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/products/${product.id}/edit`} className="text-blue-600 hover:underline flex items-center gap-1 text-xs">
                        <Edit size={12} /> Sửa
                      </Link>
                      {product.status === 'DRAFT' && (
                        <button
                          onClick={() => submitApproval.mutate(product.id)}
                          className="text-green-600 hover:underline flex items-center gap-1 text-xs"
                        >
                          <Send size={12} /> Gửi duyệt
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

function Package({ className, size }: { className: string; size: number }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>;
}
