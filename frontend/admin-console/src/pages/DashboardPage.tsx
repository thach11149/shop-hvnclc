import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Users, Store, ShoppingBag, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

function MiniAreaChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (!data?.length) {
    return (
      <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
        Chưa có dữ liệu
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.revenue), 1);
  const W = 600, H = 160;
  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: H - (d.revenue / max) * H * 0.9,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;

  const firstDate = data[0]?.date ? new Date(data[0].date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';
  const midDate = data[Math.floor(data.length / 2)]?.date ? new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';
  const lastDate = data[data.length - 1]?.date ? new Date(data[data.length - 1].date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#grad)" />
        <path d={line} fill="none" stroke="#f97316" strokeWidth="2" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f97316" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
        <span>{firstDate}</span>
        <span>{midDate}</span>
        <span>{lastDate}</span>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  SHIPPING: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-teal-100 text-teal-700',
  PACKED: 'bg-purple-100 text-purple-700',
  AWAITING_SELLER_CONFIRM: 'bg-yellow-100 text-yellow-700',
  SELLER_CONFIRMED: 'bg-orange-100 text-orange-700',
  HANDED_TO_CARRIER: 'bg-indigo-100 text-indigo-700',
};
const STATUS_LABELS: Record<string, string> = {
  AWAITING_SELLER_CONFIRM: 'Chờ xác nhận',
  SELLER_CONFIRMED: 'Đã xác nhận',
  PACKED: 'Đã đóng gói',
  HANDED_TO_CARRIER: 'Đã giao vận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiClient.get('/admin/dashboard').then(r => r.data.data),
  });

  const { data: chartData } = useQuery({
    queryKey: ['admin-revenue-chart'],
    queryFn: () =>
      apiClient.get('/admin/analytics/revenue-chart?days=30')
        .then(r => r.data.data)
        .catch(() => null),
    retry: false,
  });

  const revenueData: { date: string; revenue: number }[] =
    chartData?.data || data?.revenueChart || [];

  const kpiCards = [
    { title: 'Tổng người dùng', value: data?.totalUsers ?? 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { title: 'Người bán', value: data?.totalSellers ?? 0, icon: Store, color: 'bg-green-100 text-green-600' },
    { title: 'Đơn hàng hôm nay', value: data?.todayOrders ?? 0, icon: ShoppingBag, color: 'bg-orange-100 text-orange-600' },
    {
      title: 'Doanh thu tháng',
      value: Number(data?.monthRevenue ?? 0).toLocaleString('vi-VN') + '₫',
      icon: DollarSign,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Người bán chờ duyệt',
      value: data?.pendingSellers?.length ?? data?.pendingSellersCount ?? 0,
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Sản phẩm chờ duyệt',
      value: data?.pendingProducts?.length ?? data?.pendingProductsCount ?? 0,
      icon: TrendingUp,
      color: 'bg-red-100 text-red-600',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <span className="text-sm text-gray-400">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {kpiCards.map(card => (
          <div key={card.title} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${card.color}`}>
                <card.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{card.title}</p>
                <p className="text-xl font-bold text-gray-800 truncate">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-5 mb-6">
        <h2 className="font-bold text-gray-700 mb-4">Doanh thu 30 ngày qua</h2>
        <MiniAreaChart data={revenueData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Orders */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">Đơn hàng gần đây</h2>
            <Link to="/orders" className="text-xs text-orange-500 hover:underline">Xem tất cả</Link>
          </div>
          {data?.recentOrders?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b">
                    <th className="text-left pb-2">Mã đơn</th>
                    <th className="text-left pb-2">Khách</th>
                    <th className="text-left pb-2">Shop</th>
                    <th className="text-right pb-2">Tiền</th>
                    <th className="text-left pb-2">Trạng thái</th>
                    <th className="text-left pb-2">Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recentOrders as any[]).slice(0, 5).map((order: any) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 font-mono">{order.orderNumber}</td>
                      <td className="py-2 text-gray-500 max-w-[80px] truncate">{order.user?.email || order.buyerEmail}</td>
                      <td className="py-2 text-gray-500 max-w-[80px] truncate">{order.shop?.name || order.shopName}</td>
                      <td className="py-2 text-right font-medium">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Chưa có đơn hàng</p>
          )}
        </div>

        {/* Recent Users */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">Người dùng mới</h2>
            <Link to="/users" className="text-xs text-orange-500 hover:underline">Xem tất cả</Link>
          </div>
          {data?.recentUsers?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b">
                    <th className="text-left pb-2">Email</th>
                    <th className="text-left pb-2">Vai trò</th>
                    <th className="text-left pb-2">Trạng thái</th>
                    <th className="text-left pb-2">Ngày đăng ký</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recentUsers as any[]).slice(0, 5).map((user: any) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 max-w-[120px] truncate">{user.email}</td>
                      <td className="py-2">
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">
                          {user.role === 'BUYER' ? 'Người mua' : user.role === 'SELLER_OWNER' ? 'Người bán' : user.role}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Chưa có người dùng mới</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-4">
        <h2 className="font-bold text-gray-700 mb-3">Truy cập nhanh</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/sellers" className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors">
            <Store size={16} /> Người bán
          </Link>
          <Link to="/orders" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
            <ShoppingBag size={16} /> Đơn hàng
          </Link>
          <Link to="/products" className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors">
            <TrendingUp size={16} /> Sản phẩm
          </Link>
          <Link to="/users" className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
            <Users size={16} /> Người dùng
          </Link>
        </div>
      </div>
    </div>
  );
}
