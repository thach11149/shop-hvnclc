import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function ComboDealsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-combo-deals'],
    queryFn: () => apiClient.get('/seller/combo-deals').then(r => r.data.data),
  });

  const createDeal = useMutation({
    mutationFn: (data: any) => apiClient.post('/seller/combo-deals', data),
    onSuccess: () => {
      toast.success('Combo deal đã được tạo');
      queryClient.invalidateQueries({ queryKey: ['seller-combo-deals'] });
      setShowForm(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo combo'),
  });

  const deleteDeal = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/seller/combo-deals/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa combo');
      queryClient.invalidateQueries({ queryKey: ['seller-combo-deals'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Combo Deals</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4 py-2">
          + Tạo Combo
        </button>
      </div>

      {showForm && (
        <div className="card p-4 mb-6">
          <h2 className="font-semibold mb-4">Tạo Combo Deal mới</h2>
          <form onSubmit={handleSubmit((data) => createDeal.mutate(data))} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tên combo *</label>
              <input {...register('name', { required: true })} className="input mt-1" placeholder="Tên combo deal" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Mô tả</label>
              <textarea {...register('description')} rows={2} className="input mt-1 resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Loại giảm giá *</label>
                <select {...register('discountType', { required: true })} className="input mt-1">
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                  <option value="FIXED_AMOUNT">Số tiền cố định (₫)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Giá trị giảm *</label>
                <input {...register('discountValue', { required: true, valueAsNumber: true })} type="number" className="input mt-1" placeholder="10" min={0} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ngày bắt đầu *</label>
                <input {...register('startAt', { required: true })} type="datetime-local" className="input mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Ngày kết thúc *</label>
              <input {...register('endAt', { required: true })} type="datetime-local" className="input mt-1 max-w-xs" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createDeal.isPending} className="btn-primary disabled:opacity-50">
                {createDeal.isPending ? 'Đang tạo...' : 'Tạo combo'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">Chưa có combo deal nào</p>
            <p className="text-sm">Tạo combo để tăng doanh số và giá trị đơn hàng trung bình!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Tên combo</th>
                <th className="text-left px-4 py-3 text-gray-500">Giảm giá</th>
                <th className="text-left px-4 py-3 text-gray-500">Thời gian</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((deal: any) => (
                <tr key={deal.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{deal.name}</p>
                    {deal.description && <p className="text-xs text-gray-500 mt-0.5">{deal.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-green-600 font-medium">
                      {deal.discountType === 'PERCENTAGE' ? `${deal.discountValue}%` : `${Number(deal.discountValue).toLocaleString('vi-VN')}₫`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(deal.startAt).toLocaleDateString('vi-VN')} - {new Date(deal.endAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${deal.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {deal.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteDeal.mutate(deal.id)} className="text-red-500 text-xs hover:underline">
                      Xóa
                    </button>
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
