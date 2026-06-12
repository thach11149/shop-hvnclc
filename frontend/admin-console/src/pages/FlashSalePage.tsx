import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function FlashSalePage() {
  const queryClient = useQueryClient();
  const [showSlotForm, setShowSlotForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data: activeSlots, isLoading } = useQuery({
    queryKey: ['admin-flash-sale-slots'],
    queryFn: () => apiClient.get('/flash-sale/active').then(r => r.data.data),
  });

  const createSlot = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/flash-sale-slots', data),
    onSuccess: () => {
      toast.success('Khung giờ Flash Sale đã được tạo');
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-slots'] });
      setShowSlotForm(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo khung giờ'),
  });

  const approveItem = useMutation({
    mutationFn: (itemId: string) => apiClient.patch(`/admin/flash-sale-items/${itemId}/approve`),
    onSuccess: () => {
      toast.success('Đã duyệt sản phẩm Flash Sale');
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-slots'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Flash Sale</h1>
        <button onClick={() => setShowSlotForm(!showSlotForm)} className="btn-primary text-sm px-4 py-2">
          + Tạo khung giờ
        </button>
      </div>

      {showSlotForm && (
        <div className="card p-4 mb-6">
          <h2 className="font-semibold mb-4">Tạo khung giờ Flash Sale</h2>
          <form onSubmit={handleSubmit((data) => createSlot.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Thời gian bắt đầu *</label>
                <input {...register('startAt', { required: true })} type="datetime-local" className="input mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Thời gian kết thúc *</label>
                <input {...register('endAt', { required: true })} type="datetime-local" className="input mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ID Chiến dịch (tùy chọn)</label>
              <input {...register('campaignId')} className="input mt-1" placeholder="Campaign ID" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createSlot.isPending} className="btn-primary disabled:opacity-50">
                {createSlot.isPending ? 'Đang tạo...' : 'Tạo khung giờ'}
              </button>
              <button type="button" onClick={() => { setShowSlotForm(false); reset(); }} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Đang tải...</div>
      ) : !activeSlots?.length ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-lg mb-2">Không có Flash Sale nào đang diễn ra</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSlots.map((slot: any) => (
            <div key={slot.id} className="card overflow-hidden">
              <div className="p-4 border-b bg-red-50 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-red-700">⚡ Flash Sale</h2>
                  <p className="text-sm text-gray-600">
                    {new Date(slot.startAt).toLocaleString('vi-VN')} - {new Date(slot.endAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              {slot.items?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-500">Sản phẩm</th>
                      <th className="text-right px-4 py-3 text-gray-500">Giá Flash</th>
                      <th className="text-right px-4 py-3 text-gray-500">Quota</th>
                      <th className="text-right px-4 py-3 text-gray-500">Đã bán</th>
                      <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                      <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slot.items.map((item: any) => (
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{item.product?.name || 'Sản phẩm'}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium">{Number(item.flashPrice).toLocaleString('vi-VN')}₫</td>
                        <td className="px-4 py-3 text-right">{item.quota}</td>
                        <td className="px-4 py-3 text-right">{item.soldCount}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.status === 'PENDING' && (
                            <button
                              onClick={() => approveItem.mutate(item.id)}
                              className="text-green-600 text-xs hover:underline"
                            >
                              Duyệt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  Chưa có sản phẩm đăng ký
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
