import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import apiClient from '../api/client';

export default function OperationsReportPage() {
  const [period, setPeriod] = useState('30d');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['ops-report', period],
    queryFn: () => apiClient.get(`/admin/analytics/summary?period=${period}`).then(r => r.data.data),
  });

  const { data: orderStats } = useQuery({
    queryKey: ['order-stats', period],
    queryFn: () => apiClient.get(`/admin/analytics/orders?period=${period}`).then(r => r.data.data),
  });

  const { data: disputeStats } = useQuery({
    queryKey: ['dispute-stats'],
    queryFn: () => apiClient.get('/admin/fraud/cases/summary').then(r => r.data.data),
  });

  const metricCards = [
    { label: 'Tổng đơn hàng', value: stats?.totalOrders || 0, color: 'text-blue-600' },
    { label: 'Doanh thu platform', value: `${Number(stats?.totalRevenue || 0).toLocaleString('vi-VN')}₫`, color: 'text-green-600' },
    { label: 'Người dùng mới', value: stats?.newUsers || 0, color: 'text-purple-600' },
    { label: 'Shop mới đăng ký', value: stats?.newSellers || 0, color: 'text-orange-600' },
    { label: 'Đơn hoàn thành', value: stats?.completedOrders || 0, color: 'text-teal-600' },
    { label: 'Đơn bị hủy', value: stats?.cancelledOrders || 0, color: 'text-red-600' },
    { label: 'Tranh chấp mở', value: disputeStats?.open || 0, color: 'text-yellow-600' },
    { label: 'Tỷ lệ hoàn thành', value: stats?.totalOrders ? `${Math.round((stats.completedOrders / stats.totalOrders) * 100)}%` : '0%', color: 'text-indigo-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo vận hành</h1>
        <div className="flex gap-2">
          {[
            { key: '7d', label: '7 ngày' },
            { key: '30d', label: '30 ngày' },
            { key: '90d', label: '3 tháng' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                period === p.key ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {metricCards.map(card => (
            <div key={card.label} className="card p-4">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-4">
          <h2 className="font-semibold mb-4">Phân tích đơn hàng theo trạng thái</h2>
          {orderStats?.byStatus?.length > 0 ? (
            <div className="space-y-3">
              {orderStats.byStatus.map((item: any) => {
                const total = orderStats.byStatus.reduce((sum: number, s: any) => sum + s._count, 0);
                const pct = total > 0 ? Math.round((item._count / total) * 100) : 0;
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.status}</span>
                      <span className="font-medium">{item._count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">Không có dữ liệu</div>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-4">Tóm tắt tài chính nền tảng</h2>
          <div className="space-y-4">
            {[
              { label: 'Tổng GMV (Gross Merchandise Value)', value: stats?.totalGmv, prefix: '₫' },
              { label: 'Doanh thu platform (phí hoa hồng)', value: stats?.totalRevenue, prefix: '₫' },
              { label: 'Tổng đã rút (seller)', value: stats?.totalWithdrawals, prefix: '₫' },
              { label: 'Đang giữ (chờ thanh toán)', value: stats?.pendingPayouts, prefix: '₫' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="font-semibold">
                  {item.value !== undefined ? `${Number(item.value).toLocaleString('vi-VN')}${item.prefix}` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operations Health */}
      <div className="card p-4">
        <h2 className="font-semibold mb-4">Chỉ số sức khỏe nền tảng</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Tỷ lệ tranh chấp',
              value: stats?.totalOrders ? `${((disputeStats?.open || 0) / stats.totalOrders * 100).toFixed(2)}%` : '0%',
              status: 'good',
              desc: 'Dưới 1% là tốt',
            },
            {
              label: 'Tỷ lệ đổi trả',
              value: stats?.totalOrders ? `${((stats?.returnRequests || 0) / stats.totalOrders * 100).toFixed(2)}%` : '0%',
              status: 'good',
              desc: 'Dưới 3% là tốt',
            },
            {
              label: 'Tỷ lệ giao hàng thành công',
              value: stats?.shippingSuccessRate ? `${stats.shippingSuccessRate}%` : 'N/A',
              status: 'good',
              desc: 'Trên 95% là tốt',
            },
            {
              label: 'Thời gian xử lý đơn TB',
              value: stats?.avgProcessingHours ? `${stats.avgProcessingHours}h` : 'N/A',
              status: 'good',
              desc: 'Dưới 24h là tốt',
            },
          ].map(metric => (
            <div key={metric.label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">{metric.label}</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{metric.value}</p>
              <p className="text-xs text-gray-400 mt-1">{metric.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
