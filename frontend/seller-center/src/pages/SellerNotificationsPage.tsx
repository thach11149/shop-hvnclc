import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Bell, CheckCheck, Trash2, Package, DollarSign, MessageSquare, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';

const TYPE_ICON: Record<string, React.ReactNode> = {
  ORDER: <Package size={16} className="text-blue-500" />,
  PAYMENT: <DollarSign size={16} className="text-green-500" />,
  CHAT: <MessageSquare size={16} className="text-orange-500" />,
  DISPUTE: <AlertCircle size={16} className="text-red-500" />,
  SYSTEM: <Bell size={16} className="text-gray-500" />,
};

export default function SellerNotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['seller-notifications', filter],
    queryFn: () =>
      apiClient.get('/notifications', { params: { unread: filter === 'UNREAD', limit: 50 } }).then((r) => r.data.data),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-notifications'] }),
  });

  const items = data?.items || [];
  const unreadCount = items.filter((n: any) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="text-orange-500" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
          )}
        </div>
        <button
          onClick={() => markAllMutation.mutate()}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
        >
          <CheckCheck size={16} />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="flex gap-2">
        {(['ALL', 'UNREAD'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'ALL' ? 'Tất cả' : 'Chưa đọc'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Không có thông báo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n: any) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                n.isRead ? 'bg-white border-gray-100' : 'bg-orange-50 border-orange-100'
              }`}
            >
              <div className="mt-0.5">{TYPE_ICON[n.type] || TYPE_ICON.SYSTEM}</div>
              <div className="flex-1">
                <p className={`text-sm ${n.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>{n.content}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <div className="flex gap-1">
                {!n.isRead && (
                  <button onClick={() => markOneMutation.mutate(n.id)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                    <CheckCheck size={14} />
                  </button>
                )}
                <button onClick={() => deleteMutation.mutate(n.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
