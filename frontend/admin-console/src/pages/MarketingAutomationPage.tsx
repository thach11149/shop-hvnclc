import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

interface AutomationFlow {
  id: string;
  name: string;
  trigger: string;
  segmentName: string;
  actions: { type: string; channel: string }[];
  isActive: boolean;
  totalSent: number;
  openRate: number;
  conversionRate: number;
  createdAt: string;
}

export default function MarketingAutomationPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: 'USER_REGISTERED', segmentId: '', channel: 'EMAIL' });

  const { data: segData } = useQuery<{ data: { id: string; name: string }[] }>({
    queryKey: ['admin-segments-list'],
    queryFn: () => apiClient.get('/admin/marketing/segments?active=true').then(r => r.data),
  });

  const { data, isLoading } = useQuery<{ data: AutomationFlow[] }>({
    queryKey: ['admin-marketing-flows'],
    queryFn: () => apiClient.get('/admin/marketing/flows').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => apiClient.post('/admin/marketing/flows', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-marketing-flows'] }); setShowForm(false); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/marketing/flows/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-marketing-flows'] }),
  });

  const flows = data?.data ?? [];
  const segments = segData?.data ?? [];

  const TRIGGERS = [
    { value: 'USER_REGISTERED', label: 'Đăng ký mới' },
    { value: 'CART_ABANDONED', label: 'Bỏ giỏ hàng' },
    { value: 'ORDER_COMPLETED', label: 'Đơn hoàn thành' },
    { value: 'USER_INACTIVE_7D', label: 'Không hoạt động 7 ngày' },
    { value: 'BIRTHDAY', label: 'Sinh nhật' },
    { value: 'POINTS_MILESTONE', label: 'Đạt mốc điểm' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tự động hóa Marketing</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          + Tạo luồng
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Tạo luồng automation</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên luồng</label>
                <input className="w-full border rounded px-3 py-2 text-sm" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sự kiện kích hoạt</label>
                <select className="w-full border rounded px-3 py-2 text-sm" value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value }))}>
                  {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segment đối tượng</label>
                <select className="w-full border rounded px-3 py-2 text-sm" value={form.segmentId} onChange={e => setForm(p => ({ ...p, segmentId: e.target.value }))}>
                  <option value="">Tất cả người dùng</option>
                  {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kênh gửi</label>
                <select className="w-full border rounded px-3 py-2 text-sm" value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}>
                  {['EMAIL', 'PUSH', 'SMS', 'IN_APP'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm">Hủy</button>
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <p>Đang tải...</p> : (
        <div className="space-y-4">
          {flows.map(flow => (
            <div key={flow.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{flow.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                      <span>Trigger: <span className="font-medium text-gray-700">{flow.trigger}</span></span>
                      {flow.segmentName && <><span>•</span><span>Segment: <span className="font-medium text-gray-700">{flow.segmentName}</span></span></>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Đã gửi</p>
                    <p className="font-bold">{flow.totalSent?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Tỷ lệ mở</p>
                    <p className="font-bold text-blue-600">{(flow.openRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Chuyển đổi</p>
                    <p className="font-bold text-green-600">{(flow.conversionRate * 100).toFixed(1)}%</p>
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate(flow.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                      flow.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {flow.isActive ? 'Hoạt động' : 'Tắt'}
                  </button>
                </div>
              </div>
              {flow.actions?.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {flow.actions.map((a, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                      {a.type} via {a.channel}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
