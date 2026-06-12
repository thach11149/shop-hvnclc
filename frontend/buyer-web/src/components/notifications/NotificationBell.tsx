import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: { entityId?: string; entityType?: string };
}

interface NotificationsResponse {
  data: Notification[];
  total: number;
}

function getNotificationLink(notif: Notification): string {
  const d = notif.data;
  if (!d) return '#';
  if (d.entityType === 'order') return `/orders/${d.entityId}`;
  if (d.entityType === 'product') return `/products/${d.entityId}`;
  return '#';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiClient.get('/notifications/unread-count').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: notifData } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', 'list'],
    queryFn: () => apiClient.get('/notifications?limit=10').then(r => r.data.data),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = countData?.count || 0;
  const notifications = notifData?.data || [];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Thông báo"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900">Thông báo</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                Không có thông báo
              </div>
            ) : (
              notifications.map(notif => (
                <Link
                  key={notif.id}
                  to={getNotificationLink(notif)}
                  onClick={() => {
                    if (!notif.isRead) markReadMutation.mutate(notif.id);
                    setOpen(false);
                  }}
                  className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-orange-50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.isRead && (
                      <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-orange-500" />
                    )}
                    <div className={!notif.isRead ? '' : 'ml-4'}>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {(notifData?.total || 0) > 10 && (
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <Link
                to="/account/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium"
              >
                Xem tất cả
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
