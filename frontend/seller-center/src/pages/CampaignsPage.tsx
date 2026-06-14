import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, ToggleLeft, ToggleRight, Trash2, Edit2 } from 'lucide-react';
import apiClient from '../api/client';

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang chạy' },
  { key: 'DRAFT', label: 'Sắp tới' },
  { key: 'PAUSED', label: 'Tạm dừng' },
  { key: 'ENDED', label: 'Đã hết' },
];

const CAMPAIGN_TYPES = [
  { value: 'VOUCHER', label: 'Voucher giảm giá' },
  { value: 'FLASH_SALE', label: 'Flash Sale' },
  { value: 'BUNDLE', label: 'Mua combo' },
  { value: 'FREESHIP', label: 'Miễn phí vận chuyển' },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-blue-100 text-blue-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  ENDED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang chạy',
  DRAFT: 'Sắp tới',
  PAUSED: 'Tạm dừng',
  ENDED: 'Đã hết',
  CANCELLED: 'Đã hủy',
};

const emptyForm = {
  name: '',
  type: 'VOUCHER',
  startAt: '',
  endAt: '',
  discountValue: '',
  voucherCode: '',
  minOrderAmount: '',
  description: '',
};

export default function CampaignsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-campaigns'],
    queryFn: () => apiClient.get('/seller/campaigns').then(r => r.data.data),
  });

  const campaigns: any[] = data?.data || data || [];
  const filtered = activeTab === 'all' ? campaigns : campaigns.filter((c: any) => c.status === activeTab);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c: any) => {
    setEditTarget(c);
    setForm({
      name: c.name || '',
      type: c.type || 'VOUCHER',
      startAt: c.startAt ? c.startAt.slice(0, 16) : '',
      endAt: c.endAt ? c.endAt.slice(0, 16) : '',
      discountValue: c.metadata?.discountValue || '',
      voucherCode: c.metadata?.voucherCode || '',
      minOrderAmount: c.metadata?.minOrderAmount || '',
      description: c.description || '',
    });
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      editTarget
        ? apiClient.patch(`/seller/campaigns/${editTarget.id}/update`, payload)
        : apiClient.post('/seller/campaigns/create', payload),
    onSuccess: () => {
      toast.success(editTarget ? 'Đã cập nhật chiến dịch' : 'Đã tạo chiến dịch');
      qc.invalidateQueries({ queryKey: ['seller-campaigns'] });
      setShowModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/seller/campaigns/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-campaigns'] }),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/seller/campaigns/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa chiến dịch');
      qc.invalidateQueries({ queryKey: ['seller-campaigns'] });
      setConfirmDelete(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const handleSave = () => {
    if (!form.name.trim() || !form.startAt || !form.endAt) {
      toast.error('Vui lòng điền đủ thông tin bắt buộc');
      return;
    }
    saveMutation.mutate({
      name: form.name,
      type: form.type,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      description: form.description,
      metadata: { discountValue: form.discountValue, voucherCode: form.voucherCode, minOrderAmount: form.minOrderAmount },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Chiến dịch</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo chiến dịch
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1 text-xs text-gray-400">
                ({campaigns.filter((c: any) => c.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-base mb-1">Chưa có chiến dịch nào</p>
            <p className="text-sm">Tạo chiến dịch để tăng doanh số</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tên chiến dịch</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Loại</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Thời gian</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{c.name}</p>
                    {c.metadata?.voucherCode && (
                      <p className="text-xs text-gray-400 mt-0.5">Mã: {c.metadata.voucherCode}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {CAMPAIGN_TYPES.find(t => t.value === c.type)?.label || c.type}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <p>{c.startAt ? new Date(c.startAt).toLocaleDateString('vi-VN') : '—'}</p>
                    <p className="text-gray-400">→ {c.endAt ? new Date(c.endAt).toLocaleDateString('vi-VN') : '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(c.id)}
                        disabled={toggleMutation.isPending}
                        className={`p-1 ${c.status === 'ACTIVE' ? 'text-green-500 hover:text-yellow-500' : 'text-gray-400 hover:text-green-500'}`}
                        title={c.status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt'}
                      >
                        {c.status === 'ACTIVE' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(c.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editTarget ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch mới'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chiến dịch *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nhập tên chiến dịch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại chiến dịch *</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                >
                  {CAMPAIGN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.startAt}
                    onChange={e => setForm(p => ({ ...p, startAt: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.endAt}
                    onChange={e => setForm(p => ({ ...p, endAt: e.target.value }))}
                  />
                </div>
              </div>
              {form.type === 'VOUCHER' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={form.voucherCode}
                      onChange={e => setForm(p => ({ ...p, voucherCode: e.target.value.toUpperCase() }))}
                      placeholder="VD: SALE50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm</label>
                    <input
                      type="number"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={form.discountValue}
                      onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                      placeholder="VD: 50000 (đ) hoặc 10 (%)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (đ)</label>
                    <input
                      type="number"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={form.minOrderAmount}
                      onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                      placeholder="VD: 200000"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (tùy chọn)</label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả chiến dịch..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end p-5 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Đang lưu...' : editTarget ? 'Cập nhật' : 'Tạo chiến dịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-gray-800 mb-2">Xóa chiến dịch?</h3>
            <p className="text-sm text-gray-500 mb-4">Thao tác này không thể hoàn tác.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
