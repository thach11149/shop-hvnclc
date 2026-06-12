import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function CombosPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', discountType: 'PERCENT', discountValue: '', minItems: '2', products: '' });

  const { data: combos, isLoading } = useQuery({
    queryKey: ['seller-combos'],
    queryFn: () => apiClient.get('/seller/combo-deals').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/seller/combo-deals', data),
    onSuccess: () => {
      toast.success('Đã tạo combo deal');
      queryClient.invalidateQueries({ queryKey: ['seller-combos'] });
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo combo'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/seller/combo-deals/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa combo');
      queryClient.invalidateQueries({ queryKey: ['seller-combos'] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Combo Deal</h1>
        <button onClick={() => setShowForm(true)} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm">
          + Tạo Combo
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4">
        {isLoading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : !combos?.length ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">📦</p>
            <p>Chưa có combo nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {combos.map((combo: any) => (
              <div key={combo.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{combo.name}</p>
                  <p className="text-xs text-gray-500">
                    Giảm {combo.discountValue}{combo.discountType === 'PERCENT' ? '%' : '₫'} khi mua {combo.minItems}+ sản phẩm
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${combo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {combo.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                  </span>
                  <button
                    onClick={() => window.confirm('Xóa combo này?') && deleteMutation.mutate(combo.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">Tạo Combo Deal</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Tên combo *</label>
                <input type="text" className="w-full border rounded px-3 py-2 text-sm"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Loại giảm</label>
                  <select className="w-full border rounded px-3 py-2 text-sm"
                    value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Mức giảm *</label>
                  <input type="number" className="w-full border rounded px-3 py-2 text-sm"
                    value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Số lượng tối thiểu</label>
                <input type="number" min="2" className="w-full border rounded px-3 py-2 text-sm"
                  value={form.minItems} onChange={e => setForm(f => ({ ...f, minItems: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => createMutation.mutate({ ...form, discountValue: Number(form.discountValue), minItems: Number(form.minItems) })}
                disabled={!form.name || !form.discountValue || createMutation.isPending}
                className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo combo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
