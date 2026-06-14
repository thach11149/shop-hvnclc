import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Package, ShoppingBag, Store, BarChart2, DollarSign,
  MessageSquare, LogOut, Zap, RotateCcw, Users, Warehouse, Megaphone,
  Link2, AlertTriangle, Bot, TrendingUp, BarChart, Tag, Truck,
  Star, HelpCircle, Bell, ClipboardList, AlertOctagon, CreditCard,
  Video, Activity
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import apiClient from '../../api/client';
import clsx from 'clsx';

const menuGroups = [
  {
    label: 'Quản lý',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/shop', icon: Store, label: 'Shop' },
      { path: '/staffs', icon: Users, label: 'Nhân viên' },
    ],
  },
  {
    label: 'Sản phẩm',
    items: [
      { path: '/products', icon: Package, label: 'Danh sách SP' },
      { path: '/reviews', icon: Star, label: 'Đánh giá' },
      { path: '/qna', icon: HelpCircle, label: 'Hỏi & Đáp' },
    ],
  },
  {
    label: 'Đơn hàng & Vận hành',
    items: [
      { path: '/orders', icon: ShoppingBag, label: 'Đơn hàng' },
      { path: '/orders/fulfillment', icon: ClipboardList, label: 'Xử lý đơn' },
      { path: '/warehouse', icon: Warehouse, label: 'Kho hàng' },
      { path: '/warehouse/alerts', icon: AlertOctagon, label: 'Cảnh báo tồn kho' },
      { path: '/return-requests', icon: RotateCcw, label: 'Đổi trả' },
      { path: '/disputes', icon: AlertTriangle, label: 'Tranh chấp' },
    ],
  },
  {
    label: 'Bán hàng & Marketing',
    items: [
      { path: '/campaigns', icon: Zap, label: 'Campaign' },
      { path: '/flash-sale', icon: Zap, label: 'Flash Sale' },
      { path: '/combo-deals', icon: Tag, label: 'Combo Deals' },
      { path: '/freeship-rules', icon: Truck, label: 'Freeship Rules' },
      { path: '/live', icon: Video, label: 'Live Stream' },
    ],
  },
  {
    label: 'Tài chính',
    items: [
      { path: '/finance', icon: DollarSign, label: 'Tài chính' },
      { path: '/finance/payouts', icon: CreditCard, label: 'Thanh toán hoa hồng' },
    ],
  },
  {
    label: 'Quảng cáo',
    items: [
      { path: '/ads', icon: Megaphone, label: 'Quảng cáo' },
      { path: '/ads/reports', icon: BarChart2, label: 'Báo cáo QC' },
      { path: '/affiliate', icon: Link2, label: 'Affiliate' },
    ],
  },
  {
    label: 'Thống kê & Báo cáo',
    items: [
      { path: '/analytics', icon: Activity, label: 'Analytics nâng cao' },
      { path: '/reports', icon: BarChart2, label: 'Báo cáo' },
    ],
  },
  {
    label: 'Công cụ AI',
    items: [
      { path: '/ai/listing', icon: Bot, label: 'Tạo listing AI' },
      { path: '/ai/price', icon: TrendingUp, label: 'Gợi ý giá AI' },
      { path: '/ai/inventory-forecast', icon: BarChart, label: 'Dự báo tồn kho' },
      { path: '/ai/ad-optimization', icon: Megaphone, label: 'Tối ưu QC AI' },
    ],
  },
  {
    label: 'Khác',
    items: [
      { path: '/chat', icon: MessageSquare, label: 'Chat' },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuthStore();

  const { data: notifData } = useQuery({
    queryKey: ['seller-notifications-unread'],
    queryFn: () => apiClient.get('/seller/notifications?unread=true&limit=1').then(r => r.data.data?.total || 0),
    refetchInterval: 30000,
  });
  const unreadCount = notifData || 0;

  return (
    <aside className="w-56 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="text-white font-bold text-lg">🏪 Seller Center</div>
        <div className="text-gray-400 text-xs mt-1 truncate">{user?.email}</div>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {/* Notifications link with badge */}
        <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Thông báo
        </div>
        <Link
          to="/notifications"
          className={clsx(
            'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
            location.pathname === '/notifications'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          )}
        >
          <Bell size={15} />
          <span className="flex-1">Thông báo</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {menuGroups.map(group => (
          <div key={group.label} className="mb-1">
            <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {group.label}
            </div>
            {group.items.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                  location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon size={15} />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full">
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
