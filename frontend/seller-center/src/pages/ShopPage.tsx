import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

type ShopForm = { name: string; description: string; logo: string; banner: string };

export default function ShopPage() {
  const queryClient = useQueryClient();

  const { data: shop, isLoading } = useQuery({
    queryKey: ['seller-shop'],
    queryFn: () => apiClient.get('/seller/shop').then(r => r.data.data),
  });

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ShopForm>({
    values: shop ? { name: shop.name, description: shop.description || '', logo: shop.logo || '', banner: shop.banner || '' } : undefined,
  });

  const update = useMutation({
    mutationFn: (payload: any) => apiClient.patch('/seller/shop', payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin shop');
      queryClient.invalidateQueries({ queryKey: ['seller-shop'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Chờ duyệt', ACTIVE: 'Đang hoạt động', SUSPENDED: 'Bị tạm dừng', CLOSED: 'Đã đóng',
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thông tin Shop</h1>

      {shop && (
        <div className="card p-4 mb-6 flex items-center gap-4">
          {shop.logo && <img src={shop.logo} alt="logo" className="w-16 h-16 rounded-full object-cover" />}
          <div>
            <h2 className="font-bold text-lg">{shop.name}</h2>
            <p className="text-sm text-gray-500">{shop.slug}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${shop.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {STATUS_LABELS[shop.status] || shop.status}
            </span>
          </div>
          <div className="ml-auto text-right text-sm text-gray-500">
            <p>⭐ {Number(shop.rating || 0).toFixed(1)}</p>
            <p>{shop._count?.products || 0} sản phẩm</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(d => update.mutate(d))} className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Chỉnh sửa thông tin</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên shop *</label>
          <input {...register('name', { required: true })} className="input w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea {...register('description')} rows={3} className="input w-full" placeholder="Giới thiệu về shop..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Logo</label>
          <input {...register('logo')} className="input w-full" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Banner</label>
          <input {...register('banner')} className="input w-full" placeholder="https://..." />
        </div>
        <button type="submit" disabled={isSubmitting || update.isPending} className="btn-primary disabled:opacity-50">
          {update.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}
