import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', discountType: 'PERCENTAGE', discountValue: '',
    minOrderAmount: '', maxDiscount: '', usageLimit: '', startDate: '', endDate: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: () => apiClient.get('/admin/promotions').then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (payload: any) => apiClient.post('/admin/promotions', payload),
    onSuccess: () => {
      toast.success('Đã tạo chương trình khuyến mãi');
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      ...form,
      discountValue: Number(form.discountValue),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Khuyến mãi</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo mã giảm giá
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">Tạo chương trình khuyến mãi</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tên *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input w-full" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã voucher</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input w-full" placeholder="SUMMER20" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loại giảm giá</label>
              <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className="input w-full">
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định (₫)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giá trị giảm *</label>
              <input value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} type="number" className="input w-full" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đơn tối thiểu (₫)</label>
              <input value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} type="number" className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giảm tối đa (₫)</label>
              <input value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} type="number" className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giới hạn dùng</label>
              <input value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} type="number" className="input w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2 col-span-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Từ ngày *</label>
                <input value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} type="datetime-local" className="input w-full" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Đến ngày *</label>
                <input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} type="datetime-local" className="input w-full" required />
              </div>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={create.isPending} className="btn-primary disabled:opacity-50">Tạo khuyến mãi</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Tên</th>
                <th className="text-left px-4 py-3 text-gray-500">Mã</th>
                <th className="text-left px-4 py-3 text-gray-500">Giảm giá</th>
                <th className="text-right px-4 py-3 text-gray-500">Đã dùng</th>
                <th className="text-left px-4 py-3 text-gray-500">Thời gian</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((promo: any) => (
                <tr key={promo.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{promo.name}</td>
                  <td className="px-4 py-3">
                    {promo.code && <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{promo.code}</code>}
                  </td>
                  <td className="px-4 py-3">
                    {promo.rules?.[0] ? (
                      promo.rules[0].discountType === 'PERCENTAGE'
                        ? `${promo.rules[0].discountValue}%`
                        : `${Number(promo.rules[0].discountValue).toLocaleString('vi-VN')}₫`
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">{promo._count?.redemptions || 0}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(promo.startDate).toLocaleDateString('vi-VN')} - {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {promo.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
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
