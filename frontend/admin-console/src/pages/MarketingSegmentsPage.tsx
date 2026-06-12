import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

interface Segment {
  id: string;
  name: string;
  description: string;
  conditions: Record<string, any>[];
  userCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function MarketingSegmentsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const { data, isLoading } = useQuery<{ data: Segment[] }>({
    queryKey: ['admin-segments'],
    queryFn: () => apiClient.get('/admin/marketing/segments').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => apiClient.post('/admin/marketing/segments', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-segments'] }); setShowForm(false); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/marketing/segments/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-segments'] }),
  });

  const recalcMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/marketing/segments/${id}/recalculate`),
  });

  const segments = data?.data ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Nhóm khách hàng (Segments)</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          + Tạo segment
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Tạo Segment mới</h2>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <p className="text-xs text-gray-500 mb-4">Cài điều kiện segment có thể thiết lập sau khi tạo.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm">Hủy</button>
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <p>Đang tải...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map(seg => (
            <div key={seg.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{seg.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  seg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {seg.isActive ? 'Hoạt động' : 'Tắt'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{seg.description}</p>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400">Số người dùng</p>
                  <p className="text-xl font-bold text-blue-600">{seg.userCount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Điều kiện</p>
                  <p className="text-xl font-bold">{seg.conditions?.length ?? 0}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleMutation.mutate(seg.id)} className="flex-1 text-sm border rounded px-3 py-1.5 hover:bg-gray-50">
                  {seg.isActive ? 'Tắt' : 'Bật'}
                </button>
                <button onClick={() => recalcMutation.mutate(seg.id)} className="flex-1 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded px-3 py-1.5 hover:bg-blue-100">
                  Tính lại
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
