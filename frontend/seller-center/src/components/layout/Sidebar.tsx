import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Store, BarChart2, DollarSign, MessageSquare, LogOut, Zap, RotateCcw, Users, Warehouse, Megaphone, Link2, AlertTriangle, Bot, TrendingUp, BarChart, Tag, Truck } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import clsx from 'clsx';

const menuGroups = [
  {
    label: 'Quản lý',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/products', icon: Package, label: 'Sản phẩm' },
      { path: '/orders', icon: ShoppingBag, label: 'Đơn hàng' },
      { path: '/shop', icon: Store, label: 'Shop' },
      { path: '/staffs', icon: Users, label: 'Nhân viên' },
    ],
  },
  {
    label: 'Bán hàng',
    items: [
      { path: '/campaigns', icon: Zap, label: 'Campaign' },
      { path: '/flash-sale', icon: Zap, label: 'Flash Sale' },
      { path: '/combo-deals', icon: Tag, label: 'Combo Deals' },
      { path: '/freeship-rules', icon: Truck, label: 'Freeship Rules' },
      { path: '/ads', icon: Megaphone, label: 'Quảng cáo' },
      { path: '/affiliate', icon: Link2, label: 'Affiliate' },
    ],
  },
  {
    label: 'Vận hành',
    items: [
      { path: '/warehouse', icon: Warehouse, label: 'Kho hàng' },
      { path: '/return-requests', icon: RotateCcw, label: 'Đổi trả' },
      { path: '/disputes', icon: AlertTriangle, label: 'Tranh chấp' },
      { path: '/finance', icon: DollarSign, label: 'Tài chính' },
      { path: '/chat', icon: MessageSquare, label: 'Chat' },
      { path: '/reports', icon: BarChart2, label: 'Báo cáo' },
      { path: '/ads/reports', icon: BarChart2, label: 'Báo cáo QC' },
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
];

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuthStore();

  return (
    <aside className="w-56 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="text-white font-bold text-lg">🏪 Seller Center</div>
        <div className="text-gray-400 text-xs mt-1 truncate">{user?.email}</div>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
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
