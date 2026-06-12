import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function FreeshippingPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    minOrderAmount: '',
    maxShippingDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ['freeship-rules'],
    queryFn: () => apiClient.get('/seller/freeship-rules').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/seller/freeship-rules', data),
    onSuccess: () => {
      toast.success('Đã tạo quy tắc miễn phí ship');
      queryClient.invalidateQueries({ queryKey: ['freeship-rules'] });
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo quy tắc'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/seller/freeship-rules/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freeship-rules'] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Miễn phí vận chuyển</h1>
        <button onClick={() => setShowForm(true)} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm">
          + Tạo quy tắc
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-700">
        💡 Miễn phí ship giúp tăng tỷ lệ chuyển đổi. Bạn có thể tạo quy tắc miễn phí ship cho đơn hàng từ một mức nhất định.
      </div>

      <div className="bg-white rounded-xl border p-4">
        {isLoading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !rules?.length ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">🚚</p>
            <p>Chưa có quy tắc miễn ship nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule: any) => (
              <div key={rule.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Đơn từ {Number(rule.minOrderAmount).toLocaleString('vi-VN')}₫
                      {rule.maxShippingDiscount > 0 && ` • Giảm tối đa ${Number(rule.maxShippingDiscount).toLocaleString('vi-VN')}₫`}
                    </p>
                    {(rule.startDate || rule.endDate) && (
                      <p className="text-xs text-gray-400">
                        {rule.startDate && new Date(rule.startDate).toLocaleDateString('vi-VN')}
                        {' - '}
                        {rule.endDate && new Date(rule.endDate).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-gray-500">{rule.isActive ? 'Bật' : 'Tắt'}</span>
                    <div
                      className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${
                        rule.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                        rule.isActive ? 'left-5' : 'left-0.5'
                      }`} />
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">Tạo quy tắc miễn phí ship</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Tên quy tắc *</label>
                <input type="text" className="w-full border rounded px-3 py-2 text-sm"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm mb-1">Đẫn hàng tối thiểu (VND) *</label>
                <input type="number" className="w-full border rounded px-3 py-2 text-sm"
                  value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm mb-1">Giảm phiên tối đa (VND, 0 = miễn toàn bộ)</label>
                <input type="number" className="w-full border rounded px-3 py-2 text-sm"
                  value={form.maxShippingDiscount} onChange={e => setForm(f => ({ ...f, maxShippingDiscount: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Ngày bắt đầu</label>
                  <input type="date" className="w-full border rounded px-3 py-2 text-sm"
                    value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Ngày kết thúc</label>
                  <input type="date" className="w-full border rounded px-3 py-2 text-sm"
                    value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => createMutation.mutate({ ...form, minOrderAmount: Number(form.minOrderAmount), maxShippingDiscount: Number(form.maxShippingDiscount || 0) })}
                disabled={!form.name || !form.minOrderAmount || createMutation.isPending}
                className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo quy tắc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
