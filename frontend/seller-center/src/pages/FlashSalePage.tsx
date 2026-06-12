import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function FlashSalePage() {
  const queryClient = useQueryClient();
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({ skuId: '', flashSaleSlotId: '', salePrice: '', quantity: '' });

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['flash-sale-slots'],
    queryFn: () => apiClient.get('/flash-sale-slots').then(r => r.data.data),
  });

  const { data: myItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['my-flash-sale-items'],
    queryFn: () => apiClient.get('/seller/flash-sale-items').then(r => r.data.data),
  });

  const { data: skus } = useQuery({
    queryKey: ['seller-skus'],
    queryFn: () => apiClient.get('/seller/products?limit=100').then(r =>
      r.data.data?.data?.flatMap((p: any) => p.skus?.map((s: any) => ({ ...s, productName: p.name })) || [])
    ),
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/seller/flash-sale-items', data),
    onSuccess: () => {
      toast.success('Đã đăng ký flash sale, chờ admin duyệt');
      queryClient.invalidateQueries({ queryKey: ['my-flash-sale-items'] });
      setShowRegister(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi đăng ký'),
  });

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    ACTIVE: 'Đang diễn ra',
    ENDED: 'Đã kết thúc',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Flash Sale</h1>
        <button onClick={() => setShowRegister(true)} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600">
          + Đăng ký Flash Sale
        </button>
      </div>

      {/* Flash Sale Slots */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">⏰ Khung giờ Flash Sale sắp tới</h2>
        {slotsLoading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !slots?.length ? (
          <p className="text-gray-400 text-center py-4">Không có khung giờ nào</p>
        ) : (
          <div className="space-y-2">
            {slots.map((slot: any) => (
              <div key={slot.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="font-medium text-sm">{slot.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(slot.startTime).toLocaleString('vi-VN')} - {new Date(slot.endTime).toLocaleString('vi-VN')}
                  </p>
                </div>
                <button
                  onClick={() => { setForm(f => ({ ...f, flashSaleSlotId: slot.id })); setShowRegister(true); }}
                  className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded hover:bg-orange-200"
                >
                  Đăng ký
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Registered Items */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Sản phẩm đã đăng ký</h2>
        {itemsLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !myItems?.length ? (
          <p className="text-gray-400 text-center py-6">Chưa có sản phẩm đăng ký</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 text-left">Sản phẩm</th>
                <th className="pb-2 text-right">Giá flash</th>
                <th className="pb-2 text-center">Số lượng</th>
                <th className="pb-2 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {myItems.map((item: any) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">
                    <p className="font-medium">{item.sku?.name || item.skuId}</p>
                    <p className="text-xs text-gray-400">{item.flashSaleSlot?.name}</p>
                  </td>
                  <td className="py-2 text-right text-orange-600 font-bold">{Number(item.salePrice).toLocaleString('vi-VN')}₫</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">Đăng ký Flash Sale</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Chọn SKU *</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.skuId}
                  onChange={e => setForm(f => ({ ...f, skuId: e.target.value }))}
                >
                  <option value="">Chọn sản phẩm...</option>
                  {skus?.map((sku: any) => (
                    <option key={sku.id} value={sku.id}>{sku.productName} - {sku.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Giá flash sale *</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Số lượng *</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRegister(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => registerMutation.mutate(form)}
                disabled={!form.skuId || !form.salePrice || !form.quantity || registerMutation.isPending}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {registerMutation.isPending ? 'Đang gửi...' : 'Đăng ký'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
