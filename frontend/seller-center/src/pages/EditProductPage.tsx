import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

type ProductForm = { name: string; description: string; categoryId: string };

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.get(`/seller/products/${id}`).then(r => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then(r => r.data.data),
  });

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProductForm>({
    values: product ? { name: product.name, description: product.description || '', categoryId: product.categoryId } : undefined,
  });

  const update = useMutation({
    mutationFn: (payload: any) => apiClient.patch(`/seller/products/${id}`, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật sản phẩm');
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      navigate('/products');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Chỉnh sửa sản phẩm</h1>
      <form onSubmit={handleSubmit(d => update.mutate(d))} className="space-y-6">
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
            <input {...register('name', { required: true })} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea {...register('description')} rows={4} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
            <select {...register('categoryId', { required: true })} className="input w-full">
              <option value="">-- Chọn danh mục --</option>
              {categories?.data?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {product?.skus?.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-700 mb-3">Phân loại hiện tại</h2>
            <div className="space-y-2">
              {product.skus.map((sku: any) => (
                <div key={sku.id} className="flex items-center gap-4 text-sm border rounded p-2">
                  <span className="text-gray-500">SKU: {sku.sku}</span>
                  <span className="font-medium">{Number(sku.price).toLocaleString('vi-VN')}₫</span>
                  <span className="text-gray-500">Kho: {sku.stock?.totalQuantity || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting || update.isPending} className="btn-primary disabled:opacity-50">
            {update.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button type="button" onClick={() => navigate('/products')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
