import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ShoppingBag, DollarSign, Package, TrendingUp, Bell, ArrowUp, ArrowDown } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { useAuthStore } from '../store/auth.store';

const STATUS_COLORS: Record<string, string> = {
  AWAITING_SELLER_CONFIRM: 'bg-yellow-100 text-yellow-700',
  SELLER_CONFIRMED: 'bg-blue-100 text-blue-700',
  PACKED: 'bg-indigo-100 text-indigo-700',
  HANDED_TO_CARRIER: 'bg-purple-100 text-purple-700',
  SHIPPING: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  AWAITING_SELLER_CONFIRM: 'Chờ xác nhận',
  SELLER_CONFIRMED: 'Đã xác nhận',
  PACKED: 'Đã đóng gói',
  HANDED_TO_CARRIER: 'Giao vận chuyển',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

function formatRevenue(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString('vi-VN');
}

export default function DashboardPage() {
  const { token } = useAuthStore();
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [realtimeOrders, setRealtimeOrders] = useState<any[]>([]);

  const { data: financeData } = useQuery({
    queryKey: ['seller-finance-summary'],
    queryFn: () => apiClient.get('/seller/finance/summary').then(r => r.data.data),
  });

  const { data: revenueToday, refetch: refetchToday } = useQuery({
    queryKey: ['seller-analytics-revenue', 'today'],
    queryFn: () => apiClient.get('/seller/analytics/revenue?period=today').then(r => r.data.data),
  });

  const { data: revenueWeek } = useQuery({
    queryKey: ['seller-analytics-revenue', 'week'],
    queryFn: () => apiClient.get('/seller/analytics/revenue?period=week').then(r => r.data.data),
  });

  const { data: revenueMonth } = useQuery({
    queryKey: ['seller-analytics-revenue', 'month'],
    queryFn: () => apiClient.get('/seller/analytics/revenue?period=month').then(r => r.data.data),
  });

  const { data: ordersByStatus } = useQuery({
    queryKey: ['seller-analytics-orders'],
    queryFn: () => apiClient.get('/seller/analytics/orders').then(r => r.data.data || []),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['seller-analytics-top-products'],
    queryFn: () => apiClient.get('/seller/analytics/top-products').then(r => r.data.data || []),
  });

  const { data: chartData } = useQuery({
    queryKey: ['seller-analytics-chart'],
    queryFn: () => apiClient.get('/seller/analytics/revenue-chart').then(r => r.data.data || []),
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ['seller-orders', 'AWAITING_SELLER_CONFIRM'],
    queryFn: () => apiClient.get('/seller/orders?status=AWAITING_SELLER_CONFIRM&limit=5').then(r => r.data.data),
  });

  // Real-time Socket.io connection for new orders
  useEffect(() => {
    if (!token) return;
    let socket: any;
    (async () => {
      try {
        const { io } = await import('socket.io-client' as any);
        const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
        socket = io(API_URL, { auth: { token }, transports: ['websocket'] });
        socket.on('new-order', (order: any) => {
          setRealtimeOrders(prev => [order, ...prev].slice(0, 5));
          setNewOrderCount(c => c + 1);
          toast.success(`Đơn hàng mới: ${order.orderNumber || '#'}`, { icon: '🛒' });
          refetchToday();
        });
      } catch {
        // socket.io-client not installed, skip
      }
    })();
    return () => { if (socket) socket.disconnect(); };
  }, [token]);

  const pendingCount = ordersByStatus?.find((s: any) => s.status === 'AWAITING_SELLER_CONFIRM')?.count || 0;
  const processingCount = (ordersByStatus || [])
    .filter((s: any) => ['SELLER_CONFIRMED', 'PACKED', 'HANDED_TO_CARRIER', 'SHIPPING'].includes(s.status))
    .reduce((sum: number, s: any) => sum + (s.count || 0), 0);

  const stats = [
    {
      title: 'Doanh thu hôm nay',
      value: revenueToday ? formatRevenue(revenueToday.revenue) + '₫' : '...',
      sub: `${revenueToday?.ordersCount || 0} đơn`,
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Doanh thu tuần',
      value: revenueWeek ? formatRevenue(revenueWeek.revenue) + '₫' : '...',
      sub: `${revenueWeek?.ordersCount || 0} đơn`,
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Doanh thu tháng',
      value: revenueMonth ? formatRevenue(revenueMonth.revenue) + '₫' : '...',
      sub: `${revenueMonth?.ordersCount || 0} đơn`,
      icon: BarChartIcon,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Chờ xử lý',
      value: pendingCount + newOrderCount,
      sub: `${processingCount} đang xử lý`,
      icon: Package,
      color: 'bg-orange-100 text-orange-600',
      badge: newOrderCount > 0,
    },
    {
      title: 'Số dư ví',
      value: Number(financeData?.wallet?.balance || 0).toLocaleString('vi-VN') + '₫',
      sub: 'Có thể rút',
      icon: DollarSign,
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  const chartFormatted = (chartData || []).map((d: any) => ({
    ...d,
    dateLabel: d.date?.slice(5), // MM-DD
    currentM: Math.round(d.current / 1000),
    previousM: Math.round(d.previous / 1000),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        {newOrderCount > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-lg border border-orange-200">
            <Bell size={16} className="animate-bounce" />
            <span className="text-sm font-medium">{newOrderCount} đơn hàng mới!</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.title} className="card p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{stat.title}</p>
                <p className="text-lg font-bold text-gray-800 leading-tight">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-bold text-gray-800 mb-4">Doanh thu 30 ngày (nghìn ₫)</h2>
          {chartFormatted.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartFormatted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    `${Number(value).toLocaleString()}K₫`,
                    name === 'currentM' ? '30 ngày này' : '30 ngày trước',
                  ]}
                  labelFormatter={l => `Ngày ${l}`}
                />
                <Legend formatter={v => v === 'currentM' ? '30 ngày này' : '30 ngày trước'} />
                <Line type="monotone" dataKey="currentM" stroke="#2563eb" strokeWidth={2} dot={false} name="currentM" />
                <Line type="monotone" dataKey="previousM" stroke="#9ca3af" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="previousM" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Orders by status */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4">Đơn theo trạng thái</h2>
          <div className="space-y-2">
            {(ordersByStatus || []).filter((s: any) => s.count > 0).map((s: any) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[s.status] || s.status}
                </span>
                <span className="font-bold text-gray-700 text-sm">{s.count}</span>
              </div>
            ))}
            {(!ordersByStatus || ordersByStatus.every((s: any) => s.count === 0)) && (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có đơn hàng</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4">Top 5 sản phẩm bán chạy</h2>
          <div className="space-y-3">
            {(topProducts || []).slice(0, 5).map((item: any, idx: number) => (
              <div key={item.productId} className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {idx + 1}
                </span>
                {item.product?.images?.[0]?.url && (
                  <img src={item.product.images[0].url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{item.product?.name || 'Sản phẩm'}</p>
                  <p className="text-xs text-gray-400">{item._sum?.quantity || 0} bán</p>
                </div>
                <span className="text-sm font-bold text-primary-600">
                  {formatRevenue(Number(item._sum?.subtotal || 0))}₫
                </span>
              </div>
            ))}
            {!topProducts?.length && (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        {/* Recent pending orders */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4">
            Đơn chờ xác nhận
            {realtimeOrders.length > 0 && (
              <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                {realtimeOrders.length} mới
              </span>
            )}
          </h2>
          {(realtimeOrders.length > 0 ? realtimeOrders : pendingOrders?.data || []).length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 text-xs">
                  <th className="text-left py-1.5">Mã đơn</th>
                  <th className="text-left py-1.5">Khách</th>
                  <th className="text-right py-1.5">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {(realtimeOrders.length > 0 ? realtimeOrders : pendingOrders?.data || []).map((order: any) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-mono text-xs text-gray-600">{order.orderNumber}</td>
                    <td className="py-2 text-gray-500 text-xs truncate max-w-[100px]">{order.user?.email}</td>
                    <td className="py-2 text-right font-medium">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">Không có đơn chờ xử lý</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline icon to avoid additional import
function BarChartIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
