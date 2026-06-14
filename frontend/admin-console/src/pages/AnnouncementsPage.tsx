import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Megaphone, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  INFO: { label: 'Thông tin', icon: <Info size={14} />, color: 'bg-blue-100 text-blue-700' },
  WARNING: { label: 'Cảnh báo', icon: <AlertTriangle size={14} />, color: 'bg-yellow-100 text-yellow-700' },
  SUCCESS: { label: 'Thành công', icon: <CheckCircle size={14} />, color: 'bg-green-100 text-green-700' },
  PROMO: { label: 'Khuyến mãi', icon: <Megaphone size={14} />, color: 'bg-purple-100 text-purple-700' },
};

const TARGET_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  BUYER: 'Người mua',
  SELLER: 'Người bán',
  ADMIN: 'Admin',
};

export default function AnnouncementsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', content: '', type: 'INFO', target: 'ALL', expiresAt: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => apiClient.get('/admin/announcements', { params: { limit: 50 } }).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      editing
        ? apiClient.patch(`/admin/announcements/${editing.id}`, payload)
        : apiClient.post('/admin/announcements', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', content: '', type: 'INFO', target: 'ALL', expiresAt: '' });
      toast.success(editing ? 'Đã cập nhật thông báo' : 'Đã tạo thông báo');
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/announcements/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Đã xóa');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/admin/announcements/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-announcements'] }),
  });

  const openEdit = (ann: any) => {
    setEditing(ann);
    setForm({ title: ann.title, content: ann.content, type: ann.type, target: ann.target, expiresAt: ann.expiresAt?.slice(0, 10) || '' });
    setShowForm(true);
  };

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone size={24} className="text-orange-500" />
            Thông báo hệ thống
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý thông báo cho người dùng</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ title: '', content: '', type: 'INFO', target: 'ALL', expiresAt: '' }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Plus size={18} />
          Tạo thông báo
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold mb-4">{editing ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung *</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng</label>
              <select
                value={form.target}
                onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {Object.entries(TARGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hết hạn (tùy chọn)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title || !form.content || createMutation.isPending}
              className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {editing ? 'Cập nhật' : 'Tạo ngay'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
              Hủy
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((ann: any) => {
            const tc = TYPE_CONFIG[ann.type] || TYPE_CONFIG.INFO;
            return (
              <div key={ann.id} className={`bg-white rounded-xl border border-gray-200 p-5 ${!ann.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${tc.color}`}>
                        {tc.icon}
                        {tc.label}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{TARGET_LABELS[ann.target]}</span>
                      {ann.expiresAt && (
                        <span className="text-xs text-gray-400">Hết hạn: {new Date(ann.expiresAt).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900">{ann.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => toggleMutation.mutate({ id: ann.id, isActive: !ann.isActive })}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      title={ann.isActive ? 'Tắt' : 'Bật'}
                    >
                      {ann.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                    </button>
                    <button onClick={() => openEdit(ann)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(ann.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
