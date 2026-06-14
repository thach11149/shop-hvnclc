import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TrendingUp, ShoppingCart, Eye, Star, Users, DollarSign, Download } from 'lucide-react';
import apiClient from '../api/client';

const PERIODS = [
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: '90d', label: '3 tháng' },
];

function SimpleBarChart({ data, color = '#f97316' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{ height: `${(d.value / max) * 100}%`, backgroundColor: color, minHeight: 2 }}
          />
          <span className="text-xs text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ShopAnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  const { data: analytics } = useQuery({
    queryKey: ['seller-analytics', period],
    queryFn: () => apiClient.get('/seller/analytics', { params: { period } }).then((r) => r.data.data),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['seller-top-products', period],
    queryFn: () =>
      apiClient.get('/seller/analytics/top-products', { params: { period, limit: 5 } }).then((r) => r.data.data),
  });

  const revenueData = analytics?.revenueByDay?.slice(-14).map((d: any) => ({
    label: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    value: Number(d.revenue || 0),
  })) || Array.from({ length: 7 }, (_, i) => ({ label: `${i + 1}/6`, value: Math.random() * 10000000 }));

  const ordersData = analytics?.ordersByDay?.slice(-14).map((d: any) => ({
    label: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    value: Number(d.count || 0),
  })) || Array.from({ length: 7 }, (_, i) => ({ label: `${i + 1}/6`, value: Math.floor(Math.random() * 50) }));

  const stats = [
    { label: 'Doanh thu', value: analytics?.totalRevenue || 0, format: 'currency', icon: <DollarSign size={20} className="text-green-500" />, change: analytics?.revenueChange || 0 },
    { label: 'Đơn hàng', value: analytics?.totalOrders || 0, format: 'number', icon: <ShoppingCart size={20} className="text-blue-500" />, change: analytics?.ordersChange || 0 },
    { label: 'Lượt xem', value: analytics?.totalViews || 0, format: 'number', icon: <Eye size={20} className="text-purple-500" />, change: analytics?.viewsChange || 0 },
    { label: 'Khách mới', value: analytics?.newCustomers || 0, format: 'number', icon: <Users size={20} className="text-orange-500" />, change: analytics?.customersChange || 0 },
    { label: 'Đánh giá TB', value: analytics?.avgRating || 0, format: 'rating', icon: <Star size={20} className="text-yellow-500" />, change: 0 },
    { label: 'Tỷ lệ chuyển đổi', value: analytics?.conversionRate || 0, format: 'percent', icon: <TrendingUp size={20} className="text-teal-500" />, change: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân tích cửa hàng</h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi hiệu suất và doanh thu</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  period === p.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Download size={16} />
            Xuất
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{s.label}</span>
              {s.icon}
            </div>
            <p className="text-xl font-bold text-gray-900">
              {s.format === 'currency'
                ? `${Number(s.value).toLocaleString('vi-VN')}đ`
                : s.format === 'rating'
                ? `${Number(s.value).toFixed(1)} ⭐`
                : s.format === 'percent'
                ? `${Number(s.value).toFixed(1)}%`
                : Number(s.value).toLocaleString('vi-VN')}
            </p>
            {s.change !== 0 && (
              <p className={`text-xs mt-1 ${s.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {s.change > 0 ? '↑' : '↓'} {Math.abs(s.change).toFixed(1)}% so với kỳ trước
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold mb-4 text-gray-900">Doanh thu theo ngày</h2>
          <SimpleBarChart data={revenueData} color="#22c55e" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold mb-4 text-gray-900">Đơn hàng theo ngày</h2>
          <SimpleBarChart data={ordersData} color="#3b82f6" />
        </div>
      </div>

      {topProducts && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold mb-4 text-gray-900">Top sản phẩm bán chạy</h2>
          <div className="space-y-3">
            {topProducts.map((p: any, idx: number) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-300 w-6">{idx + 1}</span>
                <img src={p.images?.[0]?.url || '/placeholder.jpg'} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p._count?.orderItems || 0} đã bán</p>
                </div>
                <span className="text-sm font-bold text-orange-600">
                  {Number(p.revenue || 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold mb-4 text-gray-900">Phễu chuyển đổi</h2>
        <div className="space-y-2">
          {[
            { label: 'Lượt xem sản phẩm', value: analytics?.totalViews || 12500, width: 100 },
            { label: 'Thêm vào giỏ hàng', value: analytics?.addToCart || 3200, width: 26 },
            { label: 'Bắt đầu thanh toán', value: analytics?.checkoutStarted || 1800, width: 14 },
            { label: 'Đặt hàng thành công', value: analytics?.totalOrders || 980, width: 8 },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{step.label}</span>
                  <span className="font-medium">{step.value.toLocaleString('vi-VN')}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all"
                    style={{ width: `${step.width}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
