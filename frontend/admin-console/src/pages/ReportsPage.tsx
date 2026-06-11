import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';
import apiClient from '../api/client';

export default function ReportsPage() {
  const [range, setRange] = useState('30');

  const { data } = useQuery({
    queryKey: ['admin-finance', range],
    queryFn: () => apiClient.get(`/admin/finance/summary?days=${range}`).then(r => r.data.data),
  });

  const stats = [
    { title: 'Tổng doanh thu', value: Number(data?.totalRevenue || 0).toLocaleString('vi-VN') + '₫', icon: DollarSign, color: 'bg-green-100 text-green-600' },
    { title: 'Phí nền tảng', value: Number(data?.totalPlatformFee || 0).toLocaleString('vi-VN') + '₫', icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
    { title: 'Tổng đơn hàng', value: data?.totalOrders || 0, icon: ShoppingBag, color: 'bg-orange-100 text-orange-600' },
    { title: 'Người dùng mới', value: data?.newUsers || 0, icon: Users, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo tổng quan</h1>
        <select value={range} onChange={e => setRange(e.target.value)} className="input max-w-[150px]">
          <option value="7">7 ngày qua</option>
          <option value="30">30 ngày qua</option>
          <option value="90">90 ngày qua</option>
        </select>
      </div>

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

      {data?.topSellers?.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-700">Top người bán</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">#</th>
                <th className="text-left px-4 py-3 text-gray-500">Shop</th>
                <th className="text-right px-4 py-3 text-gray-500">Đơn hàng</th>
                <th className="text-right px-4 py-3 text-gray-500">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {data.topSellers.map((seller: any, i: number) => (
                <tr key={seller.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{seller.shop?.name}</td>
                  <td className="px-4 py-3 text-right">{seller.ordersCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">{Number(seller.revenue).toLocaleString('vi-VN')}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.topProducts?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-700">Top sản phẩm bán chạy</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">#</th>
                <th className="text-left px-4 py-3 text-gray-500">Sản phẩm</th>
                <th className="text-right px-4 py-3 text-gray-500">Đã bán</th>
                <th className="text-right px-4 py-3 text-gray-500">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((product: any, i: number) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-right">{product.soldCount}</td>
                  <td className="px-4 py-3 text-right font-medium">{Number(product.revenue).toLocaleString('vi-VN')}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
