import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import apiClient from '../api/client';

type SKUForm = { price: string; stock: string; attributes: string };
type ProductForm = {
  name: string;
  description: string;
  categoryId: string;
  skus: SKUForm[];
};

export default function NewProductPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<ProductForm>({
    defaultValues: { skus: [{ price: '', stock: '', attributes: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'skus' });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then(r => r.data.data),
  });

  const createProduct = useMutation({
    mutationFn: (payload: any) => apiClient.post('/seller/products', payload),
    onSuccess: () => { toast.success('Đã tạo sản phẩm'); navigate('/products'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const onSubmit = (data: ProductForm) => {
    createProduct.mutate({
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      skus: data.skus.map(s => ({
        price: Number(s.price),
        stock: Number(s.stock),
        attributes: s.attributes ? JSON.parse(s.attributes) : {},
      })),
    });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thêm sản phẩm mới</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Thông tin cơ bản</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
            <input {...register('name', { required: true })} className="input w-full" placeholder="Nhập tên sản phẩm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea {...register('description')} rows={4} className="input w-full" placeholder="Mô tả sản phẩm..." />
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

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Phân loại & Giá</h2>
            <button type="button" onClick={() => append({ price: '', stock: '', attributes: '' })} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <Plus size={14} /> Thêm phân loại
            </button>
          </div>
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Giá (₫) *</label>
                  <input {...register(`skus.${i}.price`, { required: true })} type="number" className="input w-full" placeholder="100000" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tồn kho *</label>
                  <input {...register(`skus.${i}.stock`, { required: true })} type="number" className="input w-full" placeholder="100" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Thuộc tính (JSON)</label>
                    <input {...register(`skus.${i}.attributes`)} className="input w-full text-xs" placeholder='{"color":"đỏ"}' />
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 pb-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting || createProduct.isPending} className="btn-primary disabled:opacity-50">
            {createProduct.isPending ? 'Đang lưu...' : 'Tạo sản phẩm'}
          </button>
          <button type="button" onClick={() => navigate('/products')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
