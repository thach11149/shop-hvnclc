import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function FlashSaleAdminPage() {
  const queryClient = useQueryClient();
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [slotForm, setSlotForm] = useState({ name: '', startTime: '', endTime: '' });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['admin-flash-sale-slots'],
    queryFn: () => apiClient.get('/admin/flash-sale-slots').then(r => r.data.data),
  });

  const { data: pendingItems } = useQuery({
    queryKey: ['admin-flash-sale-items-pending'],
    queryFn: () => apiClient.get('/admin/flash-sale-items?status=PENDING').then(r => r.data.data),
  });

  const createSlotMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/flash-sale-slots', data),
    onSuccess: () => {
      toast.success('Đã tạo khung giờ flash sale');
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-slots'] });
      setShowCreateSlot(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo'),
  });

  const approveItemMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      apiClient.patch(`/admin/flash-sale-items/${id}/${approve ? 'approve' : 'reject'}`),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-items-pending'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Quản lý Flash Sale</h1>
        <button onClick={() => setShowCreateSlot(true)} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm">
          + Tạo khung giờ
        </button>
      </div>

      {/* Pending Approvals */}
      {pendingItems?.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-orange-700 mb-3">⏳ Chờ duyệt ({pendingItems.length})</h2>
          <div className="space-y-2">
            {pendingItems.slice(0, 5).map((item: any) => (
              <div key={item.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.sku?.name || item.skuId}</p>
                  <p className="text-xs text-gray-500">
                    Giá: {Number(item.salePrice).toLocaleString('vi-VN')}₫ • SL: {item.quantity}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveItemMutation.mutate({ id: item.id, approve: true })}
                    className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                    Duyệt
                  </button>
                  <button onClick={() => approveItemMutation.mutate({ id: item.id, approve: false })}
                    className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flash Sale Slots */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Khung giờ Flash Sale</h2>
        {slotsLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !slots?.length ? (
          <p className="text-center text-gray-400 py-6">Chưa có khung giờ</p>
        ) : (
          <div className="space-y-3">
            {slots.map((slot: any) => (
              <div
                key={slot.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedSlot === slot.id ? 'border-orange-400 bg-orange-50' : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedSlot(selectedSlot === slot.id ? null : slot.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{slot.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(slot.startTime).toLocaleString('vi-VN')} - {new Date(slot.endTime).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    slot.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    slot.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{slot.status}</span>
                </div>
                {selectedSlot === slot.id && slot.items?.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">Sản phẩm ({slot.items.length})</p>
                    <div className="space-y-1">
                      {slot.items.slice(0, 5).map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span>{item.sku?.name}</span>
                          <span className="text-orange-600">{Number(item.salePrice).toLocaleString('vi-VN')}₫</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">Tạo khung giờ Flash Sale</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Tên khung giờ *</label>
                <input type="text" className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="VD: Flash Sale 12h"
                  value={slotForm.name} onChange={e => setSlotForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm mb-1">Thời gian bắt đầu *</label>
                <input type="datetime-local" className="w-full border rounded px-3 py-2 text-sm"
                  value={slotForm.startTime} onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm mb-1">Thời gian kết thúc *</label>
                <input type="datetime-local" className="w-full border rounded px-3 py-2 text-sm"
                  value={slotForm.endTime} onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCreateSlot(false)} className="flex-1 border py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => createSlotMutation.mutate(slotForm)}
                disabled={!slotForm.name || !slotForm.startTime || !slotForm.endTime || createSlotMutation.isPending}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {createSlotMutation.isPending ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
