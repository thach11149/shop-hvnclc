import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Edit, Trash2, Download, RefreshCw, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const emptyForm = { name: '', description: '', criteria: '', estimatedReach: '' };

export default function MarketingSegmentsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editSeg, setEditSeg] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-segments'],
    queryFn: () => apiClient.get('/marketing/segments').then(r => r.data),
  });

  const segments: any[] = data?.data?.data || data?.data || [];

  const create = useMutation({
    mutationFn: (payload: any) => apiClient.post('/marketing/segments', payload),
    onSuccess: () => { toast.success('Đã tạo segment'); queryClient.invalidateQueries({ queryKey: ['admin-segments'] }); setShowModal(false); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...payload }: any) => apiClient.patch(`/marketing/segments/${id}`, payload),
    onSuccess: () => { toast.success('Đã cập nhật'); queryClient.invalidateQueries({ queryKey: ['admin-segments'] }); setShowModal(false); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const toggle = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/marketing/segments/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-segments'] }),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const deleteSeg = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/marketing/segments/${id}`),
    onSuccess: () => { toast.success('Đã xóa segment'); queryClient.invalidateQueries({ queryKey: ['admin-segments'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const exportUsers = async (segId: string, segName: string) => {
    try {
      const r = await apiClient.get(`/marketing/segments/${segId}/export`);
      const users: any[] = r.data.data || [];
      const csv = ['Email,Tên,Ngày tham gia', ...users.map((u: any) => `${u.email},${u.name || ''},${new Date(u.createdAt).toLocaleDateString('vi-VN')}`)].join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `segment-${segName}.csv`;
      a.click();
      toast.success('Đã xuất danh sách user');
    } catch {
      toast.error('Không thể xuất danh sách');
    }
  };

  const openCreate = () => { setForm({ ...emptyForm }); setEditSeg(null); setShowModal(true); };
  const openEdit = (s: any) => {
    setEditSeg(s);
    setForm({ name: s.name, description: s.description || '', criteria: s.criteria || JSON.stringify(s.conditions || {}), estimatedReach: String(s.estimatedReach || s.userCount || '') });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, description: form.description, criteria: form.criteria, estimatedReach: form.estimatedReach ? Number(form.estimatedReach) : undefined };
    if (editSeg) update.mutate({ id: editSeg.id, ...payload });
    else create.mutate(payload);
  };

  return (
    <div>
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-lg">{editSeg ? 'Sửa Segment' : 'Tạo Segment mới'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tên segment *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input w-full" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mô tả</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input w-full resize-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tiêu chí lọc (mô tả điều kiện)</label>
                <textarea value={form.criteria} onChange={e => setForm({ ...form, criteria: e.target.value })} rows={3} className="input w-full resize-none font-mono text-xs" placeholder="VD: orders >= 5 AND totalSpent >= 1000000" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ước tính số user</label>
                <input value={form.estimatedReach} onChange={e => setForm({ ...form, estimatedReach: e.target.value })} type="number" className="input w-full" placeholder="Để trống để tự tính" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={create.isPending || update.isPending} className="btn-primary flex-1 disabled:opacity-50">
                  {editSeg ? 'Lưu thay đổi' : 'Tạo segment'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nhóm khách hàng (Segments)</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo Segment
        </button>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-500">Đang tải...</div>
      ) : segments.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p>Chưa có segment nào</p>
          <button onClick={openCreate} className="mt-4 btn-primary text-sm">Tạo ngay</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {segments.map((seg: any) => (
            <div key={seg.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{seg.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{seg.description}</p>
                </div>
                <button
                  onClick={() => toggle.mutate(seg.id)}
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 cursor-pointer ${seg.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {seg.isActive ? 'Hoạt động' : 'Tắt'}
                </button>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400">Ước tính reach</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(seg.estimatedReach || seg.userCount || 0).toLocaleString()}
                  </p>
                </div>
                {seg.criteria && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Tiêu chí</p>
                    <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded max-w-24 truncate">{seg.criteria}</p>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-400 mb-3">
                Tạo: {new Date(seg.createdAt).toLocaleDateString('vi-VN')}
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(seg)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <Edit size={12} /> Sửa
                </button>
                <button onClick={() => exportUsers(seg.id, seg.name)} className="flex items-center gap-1 text-xs text-gray-500 hover:underline">
                  <Download size={12} /> Xuất user
                </button>
                <button onClick={() => { if (confirm('Xóa segment này?')) deleteSeg.mutate(seg.id); }} className="flex items-center gap-1 text-xs text-red-400 hover:underline ml-auto">
                  <Trash2 size={12} /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
