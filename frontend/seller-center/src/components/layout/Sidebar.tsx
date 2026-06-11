import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Store, BarChart2, DollarSign, MessageSquare, Tag, LogOut, Zap, RotateCcw, Users } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import clsx from 'clsx';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Sản phẩm' },
  { path: '/orders', icon: ShoppingBag, label: 'Đơn hàng' },
  { path: '/shop', icon: Store, label: 'Shop' },
  { path: '/campaigns', icon: Zap, label: 'Campaign' },
  { path: '/return-requests', icon: RotateCcw, label: 'Đổi trả' },
  { path: '/finance', icon: DollarSign, label: 'Tài chính' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/reports', icon: BarChart2, label: 'Báo cáo' },
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
