import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Bell, CheckCheck, Trash2, Package, Tag, MessageSquare, AlertCircle, ShoppingBag, Settings } from 'lucide-react';
import apiClient from '../api/client';

const TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  ORDER: { icon: <Package size={16} />, label: 'Đơn hàng', color: 'text-blue-500 bg-blue-50' },
  PROMOTION: { icon: <Tag size={16} />, label: 'Khuyến mãi', color: 'text-purple-500 bg-purple-50' },
  CHAT: { icon: <MessageSquare size={16} />, label: 'Tin nhắn', color: 'text-green-500 bg-green-50' },
  DISPUTE: { icon: <AlertCircle size={16} />, label: 'Tranh chấp', color: 'text-red-500 bg-red-50' },
  SHOPPING: { icon: <ShoppingBag size={16} />, label: 'Mua sắm', color: 'text-orange-500 bg-orange-50' },
  SYSTEM: { icon: <Settings size={16} />, label: 'Hệ thống', color: 'text-gray-500 bg-gray-100' },
};

function groupByDate(items: any[]) {
  const groups: Record<string, any[]> = {};
  items.forEach((n) => {
    const date = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) key = 'Hôm nay';
    else if (date.toDateString() === yesterday.toDateString()) key = 'Hôm qua';
    else key = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', readFilter, typeFilter],
    queryFn: () =>
      apiClient
        .get('/notifications', {
          params: {
            unread: readFilter === 'UNREAD' ? true : undefined,
            type: typeFilter !== 'ALL' ? typeFilter : undefined,
            limit: 60,
          },
        })
        .then((r) => r.data.data),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items: any[] = data?.items || [];
  const unreadCount = items.filter((n) => !n.isRead).length;
  const grouped = groupByDate(items);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="text-red-500" size={24} />
          <h1 className="text-xl font-bold">Thông báo</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending || unreadCount === 0}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-40"
        >
          <CheckCheck size={16} />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* Read/Unread tabs */}
      <div className="flex gap-2 mb-4">
        {(['ALL', 'UNREAD'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setReadFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              readFilter === f ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'ALL' ? 'Tất cả' : 'Chưa đọc'}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            typeFilter === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tất cả loại
        </button>
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              typeFilter === type ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {meta.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Không có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, notifs]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">{date}</p>
              <div className="space-y-2">
                {notifs.map((n: any) => {
                  const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                        n.isRead
                          ? 'bg-white border-gray-100 hover:border-gray-200'
                          : 'bg-blue-50 border-blue-100 hover:border-blue-200'
                      }`}
                    >
                      <div className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${meta.color}`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                          {n.content || n.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400">
                            {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                        {n.link && (
                          <a
                            href={n.link}
                            className="text-xs text-blue-600 hover:underline mt-1 block"
                          >
                            Xem chi tiết →
                          </a>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {!n.isRead && (
                          <button
                            onClick={() => markOneMutation.mutate(n.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Đánh dấu đã đọc"
                          >
                            <CheckCheck size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(n.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
