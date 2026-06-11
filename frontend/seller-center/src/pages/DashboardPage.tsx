import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, DollarSign, Package, Star } from 'lucide-react';
import apiClient from '../api/client';

export default function DashboardPage() {
  const { data: finance } = useQuery({
    queryKey: ['seller-finance-summary'],
    queryFn: () => apiClient.get('/seller/finance/summary').then(r => r.data.data),
  });

  const { data: orders } = useQuery({
    queryKey: ['seller-orders', 'pending'],
    queryFn: () => apiClient.get('/seller/orders?status=AWAITING_SELLER_CONFIRM&limit=5').then(r => r.data.data),
  });

  const stats = [
    { title: 'Số dư ví', value: Number(finance?.wallet?.balance || 0).toLocaleString('vi-VN') + '₫', icon: DollarSign, color: 'bg-green-100 text-green-600' },
    { title: 'Doanh thu 30 ngày', value: Number(finance?.last30Days?.revenue || 0).toLocaleString('vi-VN') + '₫', icon: DollarSign, color: 'bg-blue-100 text-blue-600' },
    { title: 'Đơn hàng 30 ngày', value: finance?.last30Days?.ordersCount || 0, icon: ShoppingBag, color: 'bg-orange-100 text-orange-600' },
    { title: 'Chờ xử lý', value: orders?.total || 0, icon: Package, color: 'bg-yellow-100 text-yellow-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.title}</p>
                <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Orders */}
      <div className="card p-4">
        <h2 className="font-bold text-gray-800 mb-4">Đơn hàng chờ xác nhận</h2>
        {orders?.data?.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-2">Mã đơn</th>
                <th className="text-left py-2">Khách hàng</th>
                <th className="text-right py-2">Tổng tiền</th>
                <th className="text-left py-2 pl-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.data.map((order: any) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-mono text-xs">{order.orderNumber}</td>
                  <td className="py-2">{order.user?.email}</td>
                  <td className="py-2 text-right font-medium">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</td>
                  <td className="py-2 pl-4">
                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Chờ xác nhận</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">Không có đơn hàng chờ xử lý</p>
        )}
      </div>
    </div>
  );
}
