import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, Package, ShoppingBag,
  Tag, Image, DollarSign, BarChart2, RotateCcw, LogOut, Shield,
  Warehouse, Megaphone, Link2, AlertTriangle, Bot, TrendingUp,
  Activity, Database, Mail, Zap, BarChart, Settings, CreditCard,
  FileText, Bell, Layers, ClipboardCheck, ScrollText
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import clsx from 'clsx';

const menuGroups = [
  {
    label: 'Tổng quan',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Quản lý sàn',
    items: [
      { path: '/users', icon: Users, label: 'Người dùng' },
      { path: '/sellers', icon: Store, label: 'Người bán' },
      { path: '/products', icon: Package, label: 'Sản phẩm' },
      { path: '/products/bulk', icon: ClipboardCheck, label: 'Duyệt hàng loạt' },
      { path: '/orders', icon: ShoppingBag, label: 'Đơn hàng' },
      { path: '/categories', icon: Tag, label: 'Danh mục' },
    ],
  },
  {
    label: 'Tài chính',
    items: [
      { path: '/promotions', icon: DollarSign, label: 'Khuyến mãi' },
      { path: '/withdrawals', icon: DollarSign, label: 'Rút tiền' },
      { path: '/returns', icon: RotateCcw, label: 'Đổi trả' },
    ],
  },
  {
    label: 'Nội dung & Vận hành',
    items: [
      { path: '/banners', icon: Image, label: 'Banner' },
      { path: '/campaigns', icon: Zap, label: 'Campaigns' },
      { path: '/flash-sale', icon: Zap, label: 'Flash Sale' },
      { path: '/shipping-carriers', icon: Activity, label: 'Vận chuyển' },
      { path: '/warehouses', icon: Warehouse, label: 'Kho hàng' },
      { path: '/announcements', icon: Bell, label: 'Thông báo hệ thống' },
    ],
  },
  {
    label: 'Quảng cáo & Tiếp thị',
    items: [
      { path: '/ads', icon: Megaphone, label: 'Quảng cáo' },
      { path: '/affiliate', icon: Link2, label: 'Affiliate' },
      { path: '/marketing/segments', icon: Users, label: 'Phân khúc KH' },
      { path: '/marketing/automation', icon: Mail, label: 'Automation' },
    ],
  },
  {
    label: 'An toàn & Chống gian lận',
    items: [
      { path: '/disputes', icon: AlertTriangle, label: 'Tranh chấp' },
      { path: '/fraud-cases', icon: Shield, label: 'Gian lận' },
      { path: '/ai/fraud-alerts', icon: Bot, label: 'AI Fraud Alerts' },
    ],
  },
  {
    label: 'AI & Dữ liệu',
    items: [
      { path: '/ai/demand-forecast', icon: TrendingUp, label: 'Dự báo nhu cầu' },
      { path: '/ai/model-monitoring', icon: Activity, label: 'Model Monitoring' },
      { path: '/data-quality', icon: Database, label: 'Chất lượng dữ liệu' },
      { path: '/bi-dashboard', icon: BarChart, label: 'BI Dashboard' },
    ],
  },
  {
    label: 'Báo cáo',
    items: [
      { path: '/reports', icon: BarChart2, label: 'Báo cáo chung' },
      { path: '/reports/operations', icon: BarChart2, label: 'Vận hành' },
    ],
  },
  {
    label: 'Quản trị hệ thống',
    items: [
      { path: '/audit-logs', icon: ScrollText, label: 'Audit Logs' },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { path: '/system/config', icon: Settings, label: 'Cấu hình' },
      { path: '/system/emails', icon: Mail, label: 'Email Templates' },
      { path: '/system/payment', icon: CreditCard, label: 'Cổng thanh toán' },
    ],
  },
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
