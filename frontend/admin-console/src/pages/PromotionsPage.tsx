import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: 'Phần trăm (%)',
  FIXED_AMOUNT: 'Số tiền cố định (₫)',
};

const emptyForm = {
  name: '', code: '', discountType: 'PERCENTAGE', discountValue: '',
  minOrderAmount: '', maxDiscount: '', usageLimit: '', startDate: '', endDate: '', scope: 'PLATFORM',
};

function getPromoStatus(promo: any): { label: string; color: string } {
  const now = Date.now();
  const start = new Date(promo.startAt || promo.startDate).getTime();
  const end = new Date(promo.endAt || promo.endDate).getTime();
  if (!promo.isActive) return { label: 'Tắt', color: 'bg-gray-100 text-gray-500' };
  if (now < start) return { label: 'Chưa bắt đầu', color: 'bg-blue-100 text-blue-600' };
  if (now > end) return { label: 'Đã hết hạn', color: 'bg-red-100 text-red-600' };
  return { label: 'Đang hoạt động', color: 'bg-green-100 text-green-700' };
}

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState<any | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: () => apiClient.get('/admin/promotions').then(r => r.data),
  });

  const rawRows: any[] = data?.data?.data || data?.data || [];

  const rows = rawRows.filter(p => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) && !p.code?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && p.discountType !== typeFilter) return false;
    if (statusFilter) {
      const status = getPromoStatus(p);
      if (statusFilter === 'active' && status.label !== 'Đang hoạt động') return false;
      if (statusFilter === 'inactive' && status.label !== 'Tắt') return false;
      if (statusFilter === 'expired' && status.label !== 'Đã hết hạn') return false;
      if (statusFilter === 'upcoming' && status.label !== 'Chưa bắt đầu') return false;
    }
    return true;
  });

  const openCreate = () => { setForm({ ...emptyForm }); setEditPromo(null); setShowModal(true); };
  const openEdit = (p: any) => {
    setEditPromo(p);
    setForm({
      name: p.name || '',
      code: p.code || '',
      discountType: p.discountType || 'PERCENTAGE',
      discountValue: String(p.discountValue || ''),
      minOrderAmount: String(p.minOrderAmount || ''),
      maxDiscount: String(p.maxDiscount || ''),
      usageLimit: String(p.usageLimit || ''),
      startDate: p.startAt ? p.startAt.slice(0, 16) : '',
      endDate: p.endAt ? p.endAt.slice(0, 16) : '',
      scope: p.type || 'PLATFORM',
    });
    setShowModal(true);
  };

  const create = useMutation({
    mutationFn: (payload: any) => apiClient.post('/admin/promotions', payload),
    onSuccess: () => { toast.success('Đã tạo khuyến mãi'); queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }); setShowModal(false); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...payload }: any) => apiClient.patch(`/admin/promotions/${id}`, payload),
    onSuccess: () => { toast.success('Đã cập nhật'); queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }); setShowModal(false); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const toggle = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/promotions/${id}/toggle`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const deletePromo = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/promotions/${id}`),
    onSuccess: () => { toast.success('Đã xóa'); queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const bulkToggle = (activate: boolean) => {
    Promise.all(selected.map(id => {
      const p = rows.find((r: any) => r.id === id);
      if (!p) return Promise.resolve();
      if ((activate && !p.isActive) || (!activate && p.isActive)) return toggle.mutateAsync(id);
      return Promise.resolve();
    })).then(() => { toast.success(`Đã ${activate ? 'kích hoạt' : 'tắt'} ${selected.length} khuyến mãi`); setSelected([]); });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      code: form.code || undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      startDate: form.startDate,
      endDate: form.endDate,
    };
    if (editPromo) update.mutate({ id: editPromo.id, ...payload });
    else create.mutate(payload);
  };

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === rows.length ? [] : rows.map((r: any) => r.id));

  return (
    <div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-lg">{editPromo ? 'Sửa khuyến mãi' : 'Tạo khuyến mãi'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tên khuyến mãi *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input w-full" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mã coupon</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input w-full" placeholder="SUMMER20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Loại giảm giá</label>
                  <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className="input w-full">
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền (₫)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Giá trị giảm *</label>
                  <input value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} type="number" min="0" className="input w-full" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Đơn tối thiểu (₫)</label>
                  <input value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} type="number" min="0" className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Giảm tối đa (₫)</label>
                  <input value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} type="number" min="0" className="input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Giới hạn sử dụng</label>
                  <input value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} type="number" min="0" className="input w-full" placeholder="Không giới hạn" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phạm vi</label>
                  <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} className="input w-full">
                    <option value="PLATFORM">Toàn sàn</option>
                    <option value="SELLER">Seller tự tạo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bắt đầu *</label>
                  <input value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} type="datetime-local" className="input w-full" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Kết thúc *</label>
                  <input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} type="datetime-local" className="input w-full" required />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={create.isPending || update.isPending} className="btn-primary flex-1 disabled:opacity-50">
                  {editPromo ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Khuyến mãi</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo khuyến mãi
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input text-sm flex-1 min-w-48"
          placeholder="Tìm tên hoặc mã coupon..."
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input text-sm">
          <option value="">Tất cả loại</option>
          <option value="PERCENTAGE">Phần trăm</option>
          <option value="FIXED_AMOUNT">Số tiền</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="upcoming">Chưa bắt đầu</option>
          <option value="expired">Đã hết hạn</option>
          <option value="inactive">Đã tắt</option>
        </select>
        <button onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); }} className="text-sm text-gray-500 hover:text-gray-700">
          Xóa lọc
        </button>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4">
          <span className="text-sm text-blue-700">Đã chọn {selected.length}</span>
          <button onClick={() => bulkToggle(true)} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200">
            Kích hoạt
          </button>
          <button onClick={() => bulkToggle(false)} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200">
            Tắt
          </button>
          <button onClick={() => setSelected([])} className="text-xs text-gray-400 hover:text-gray-600 ml-auto">
            Bỏ chọn
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có khuyến mãi nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={toggleAll} />
                </th>
                <th className="text-left px-4 py-3 text-gray-500">Tên</th>
                <th className="text-left px-4 py-3 text-gray-500">Mã</th>
                <th className="text-left px-4 py-3 text-gray-500">Giảm giá</th>
                <th className="text-right px-4 py-3 text-gray-500">Đã dùng</th>
                <th className="text-left px-4 py-3 text-gray-500">Thời gian</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((promo: any) => {
                const status = getPromoStatus(promo);
                return (
                  <tr key={promo.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={selected.includes(promo.id)} onChange={() => toggleSelect(promo.id)} />
                    </td>
                    <td className="px-4 py-3 font-medium">{promo.name}</td>
                    <td className="px-4 py-3">
                      {promo.code && <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{promo.code}</code>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">
                        {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : `${Number(promo.discountValue).toLocaleString('vi-VN')}₫`}
                      </span>
                      {promo.minOrderAmount && <span className="text-xs text-gray-400 ml-1">min {Number(promo.minOrderAmount).toLocaleString('vi-VN')}₫</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {promo._count?.redemptions || 0}{promo.usageLimit ? `/${promo.usageLimit}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      <div>{new Date(promo.startAt || promo.startDate).toLocaleDateString('vi-VN')}</div>
                      <div>→ {new Date(promo.endAt || promo.endDate).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(promo)} className="text-blue-600 hover:text-blue-700 p-1" title="Sửa">
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => toggle.mutate(promo.id)}
                          className={`p-1 ${promo.isActive ? 'text-green-500' : 'text-gray-400'}`}
                          title={promo.isActive ? 'Tắt' : 'Bật'}
                        >
                          {promo.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                          onClick={() => { if (confirm('Xóa khuyến mãi này?')) deletePromo.mutate(promo.id); }}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
