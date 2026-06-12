import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, Package, ShoppingBag,
  Tag, Image, DollarSign, BarChart2, RotateCcw, LogOut, Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import clsx from 'clsx';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Người dùng' },
  { path: '/sellers', icon: Store, label: 'Người bán' },
  { path: '/products', icon: Package, label: 'Sản phẩm' },
  { path: '/orders', icon: ShoppingBag, label: 'Đơn hàng' },
  { path: '/categories', icon: Tag, label: 'Danh mục' },
  { path: '/promotions', icon: DollarSign, label: 'Khuyến mãi' },
  { path: '/banners', icon: Image, label: 'Banner' },
  { path: '/withdrawals', icon: DollarSign, label: 'Rút tiền' },
  { path: '/returns', icon: RotateCcw, label: 'Đổi trả' },
  { path: '/reports', icon: BarChart2, label: 'Báo cáo' },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuthStore();

  return (
    <aside className="w-60 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <Shield size={20} className="text-blue-400" />
          Admin Console
        </div>
        <div className="text-gray-400 text-xs mt-1 truncate">{user?.email}</div>
        <div className="text-gray-500 text-xs">{user?.role}</div>
      </div>

      <nav className="flex-1 py-2">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
              location.pathname.startsWith(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <item.icon size={16} />
            {item.label}
          </Link>
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
