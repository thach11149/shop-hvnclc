import { useQuery } from '@tanstack/react-query';
import { Users, Store, ShoppingBag, DollarSign } from 'lucide-react';
import apiClient from '../api/client';

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiClient.get('/admin/dashboard').then(r => r.data.data),
  });

  const stats = [
    { title: 'Tổng người dùng', value: data?.totalUsers || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { title: 'Người bán', value: data?.totalSellers || 0, icon: Store, color: 'bg-green-100 text-green-600' },
    { title: 'Đơn hàng hôm nay', value: data?.todayOrders || 0, icon: ShoppingBag, color: 'bg-orange-100 text-orange-600' },
    { title: 'Doanh thu tháng', value: Number(data?.monthRevenue || 0).toLocaleString('vi-VN') + '₫', icon: DollarSign, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="font-bold text-gray-700 mb-3">Người bán chờ duyệt</h2>
          {data?.pendingSellers?.length > 0 ? (
            <div className="space-y-2">
              {data.pendingSellers.map((seller: any) => (
                <div key={seller.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="text-sm font-medium">{seller.shop?.name}</p>
                    <p className="text-xs text-gray-400">{seller.user?.email}</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Chờ duyệt</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Không có người bán chờ duyệt</p>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-bold text-gray-700 mb-3">Sản phẩm chờ duyệt</h2>
          {data?.pendingProducts?.length > 0 ? (
            <div className="space-y-2">
              {data.pendingProducts.map((product: any) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.shop?.name}</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Chờ duyệt</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Không có sản phẩm chờ duyệt</p>
          )}
        </div>
      </div>
    </div>
  );
}
