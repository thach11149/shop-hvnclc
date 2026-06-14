import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Video, Play, Square, Clock, Users, Plus, Radio } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  SCHEDULED: { label: 'Đã lên lịch', color: 'text-blue-700 bg-blue-50', dot: 'bg-blue-500' },
  LIVE: { label: 'Đang phát', color: 'text-red-700 bg-red-50', dot: 'bg-red-500 animate-pulse' },
  ENDED: { label: 'Đã kết thúc', color: 'text-gray-700 bg-gray-50', dot: 'bg-gray-400' },
};

export default function LiveStreamPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', scheduledAt: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['seller-live-streams'],
    queryFn: () => apiClient.get('/seller/live', { params: { limit: 20 } }).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/seller/live', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-live-streams'] });
      setShowCreate(false);
      setForm({ title: '', description: '', scheduledAt: '' });
      toast.success('Đã tạo buổi live stream');
    },
    onError: () => toast.error('Không thể tạo live stream'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'LIVE' | 'ENDED' }) =>
      apiClient.patch(`/seller/live/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-live-streams'] });
      toast.success('Đã cập nhật trạng thái');
    },
  });

  const streams = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Stream</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý các buổi phát trực tiếp</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Plus size={18} />
          Tạo buổi live
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Radio size={18} className="text-red-500" />
            Tạo buổi live stream mới
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề buổi live *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ví dụ: Flash Sale cuối tuần - Giảm đến 50%"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Mô tả về buổi live..."
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian phát</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.title || createMutation.isPending}
                className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                Tạo ngay
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : streams.length === 0 ? (
        <div className="text-center py-16">
          <Video size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Chưa có buổi live nào</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-red-500 hover:underline">
            Tạo buổi live đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {streams.map((stream: any) => {
            const sc = STATUS_CONFIG[stream.status] || STATUS_CONFIG.SCHEDULED;
            return (
              <div key={stream.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Video size={24} className="text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{stream.title}</h3>
                      {stream.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">{stream.description}</p>
                      )}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${sc.color}`}>
                    <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  {stream.scheduledAt && (
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(stream.scheduledAt).toLocaleString('vi-VN')}
                    </span>
                  )}
                  {stream.status === 'LIVE' && (
                    <span className="flex items-center gap-1 text-red-600 font-medium">
                      <Users size={14} />
                      {stream.viewerCount} người xem
                    </span>
                  )}
                </div>

                {stream.streamKey && stream.status !== 'ENDED' && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Stream Key (dùng cho OBS/Streamlabs):</p>
                    <code className="text-xs text-gray-800 font-mono break-all">{stream.streamKey}</code>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {stream.status === 'SCHEDULED' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: stream.id, status: 'LIVE' })}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                    >
                      <Play size={14} />
                      Bắt đầu live
                    </button>
                  )}
                  {stream.status === 'LIVE' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: stream.id, status: 'ENDED' })}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800"
                    >
                      <Square size={14} />
                      Kết thúc
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
