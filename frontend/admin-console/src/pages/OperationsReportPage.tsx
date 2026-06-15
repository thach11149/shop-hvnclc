import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Download, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';

function SLAGauge({ value, target, label }: { value: number; target: number; label: string }) {
  const pct = Math.min(100, value);
  const isGood = value >= target;
  const color = isGood ? '#16a34a' : value >= target * 0.9 ? '#d97706' : '#dc2626';

  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          className="transition-all duration-500"
        />
        <text x="48" y="52" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
          {value.toFixed(0)}%
        </text>
      </svg>
      <p className="text-xs text-gray-500 text-center mt-1">{label}</p>
      <p className="text-xs font-medium" style={{ color }}>
        {isGood ? '✓ Đạt SLA' : `Mục tiêu: ${target}%`}
      </p>
    </div>
  );
}

function FulfillmentChart({ data }: { data: Array<{ label: string; value: number; total: number }> }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = d.total > 0 ? Math.round((d.value / d.total) * 100) : 0;
        const width = Math.round((d.value / maxVal) * 100);
        return (
          <div key={d.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700 font-medium">{d.label}</span>
              <span className="text-gray-500 text-xs">{d.value.toLocaleString()} ({pct}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${width}%`,
                  background: d.label === 'Đã hủy' || d.label === 'Tranh chấp'
                    ? '#ef4444'
                    : d.label === 'Hoàn thành'
                    ? '#16a34a'
                    : '#3b82f6',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendBadge({ change }: { change?: number }) {
  if (change === undefined) return null;
  if (change > 0) return <span className="text-xs text-green-600 flex items-center gap-0.5"><TrendingUp size={10} />+{change.toFixed(1)}%</span>;
  if (change < 0) return <span className="text-xs text-red-500 flex items-center gap-0.5"><TrendingDown size={10} />{change.toFixed(1)}%</span>;
  return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus size={10} />0%</span>;
}

export default function OperationsReportPage() {
  const [period, setPeriod] = useState('30d');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['ops-report', period],
    queryFn: () => apiClient.get(`/admin/analytics/summary?period=${period}`).then((r) => r.data.data),
  });

  const { data: orderStats } = useQuery({
    queryKey: ['order-stats', period],
    queryFn: () => apiClient.get(`/admin/analytics/orders?period=${period}`).then((r) => r.data.data),
  });

  const { data: disputeStats } = useQuery({
    queryKey: ['dispute-stats', period],
    queryFn: () => apiClient.get('/admin/fraud/cases/summary').then((r) => r.data.data),
  });

  const { data: slaData } = useQuery({
    queryKey: ['sla-metrics', period],
    queryFn: () => apiClient.get(`/admin/analytics/sla?period=${period}`).then((r) => r.data.data),
  });

  const totalOrders = stats?.totalOrders || 0;
  const completedOrders = stats?.completedOrders || 0;
  const cancelledOrders = stats?.cancelledOrders || 0;
  const returnCount = stats?.returnRequests || 0;
  const disputeOpen = disputeStats?.open || 0;

  const fulfillmentData = [
    { label: 'Hoàn thành', value: completedOrders, total: totalOrders },
    { label: 'Đang xử lý', value: (orderStats?.byStatus || []).filter((s: any) => ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED'].includes(s.status)).reduce((sum: number, s: any) => sum + s._count, 0), total: totalOrders },
    { label: 'Đã hủy', value: cancelledOrders, total: totalOrders },
    { label: 'Hoàn trả', value: returnCount, total: totalOrders },
    { label: 'Tranh chấp', value: disputeOpen, total: totalOrders },
  ];

  const slaMetrics = [
    { key: 'deliverySuccess', label: 'Giao hàng thành công', target: 95, value: slaData?.deliverySuccessRate || stats?.shippingSuccessRate || 0 },
    { key: 'processingTime', label: 'Xử lý đúng hạn (<24h)', target: 90, value: slaData?.onTimeProcessingRate || 0 },
    { key: 'disputeResolution', label: 'Giải quyết tranh chấp (<3 ngày)', target: 85, value: slaData?.disputeResolutionRate || 0 },
    { key: 'sellerResponse', label: 'Seller phản hồi (<1h)', target: 80, value: slaData?.sellerResponseRate || 0 },
  ];

  const kpiCards = [
    { label: 'Tổng đơn hàng', value: totalOrders, change: stats?.ordersChange, format: 'number' },
    { label: 'Doanh thu platform', value: stats?.totalRevenue || 0, change: stats?.revenueChange, format: 'vnd' },
    { label: 'Người dùng mới', value: stats?.newUsers || 0, change: stats?.usersChange, format: 'number' },
    { label: 'Shop mới', value: stats?.newSellers || 0, change: stats?.sellersChange, format: 'number' },
    { label: 'Tỷ lệ hoàn thành', value: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0, change: stats?.completionRateChange, format: 'percent' },
    { label: 'Tỷ lệ hủy đơn', value: totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0, change: stats?.cancellationRateChange, format: 'percent', invertTrend: true },
    { label: 'Tranh chấp mở', value: disputeOpen, change: stats?.disputeChange, format: 'number', invertTrend: true },
    { label: 'Tỷ lệ hoàn trả', value: totalOrders > 0 ? ((returnCount / totalOrders) * 100).toFixed(2) : '0', format: 'percent2', invertTrend: true },
  ];

  const formatVal = (v: any, fmt: string) => {
    if (fmt === 'vnd') return `${Number(v).toLocaleString('vi-VN')}₫`;
    if (fmt === 'percent') return `${v}%`;
    if (fmt === 'percent2') return `${v}%`;
    return Number(v).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo vận hành</h1>
          <p className="text-gray-500 text-sm mt-1">Chỉ số hiệu suất và SLA nền tảng</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { key: '7d', label: '7 ngày' },
              { key: '30d', label: '30 ngày' },
              { key: '90d', label: '3 tháng' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p.key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.open(`/api/v1/admin/export/operations?period=${period}`, '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download size={14} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">{formatVal(card.value, card.format)}</p>
              <TrendBadge change={card.change} />
            </div>
          ))}
        </div>
      )}

      {/* SLA Gauges */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
          <AlertCircle size={18} className="text-blue-500" />
          Chỉ số SLA (Service Level Agreement)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {slaMetrics.map((m) => (
            <SLAGauge key={m.key} value={m.value} target={m.target} label={m.label} />
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">
            SLA được đo dựa trên dữ liệu {period === '7d' ? '7 ngày' : period === '30d' ? '30 ngày' : '3 tháng'} gần nhất.
            Màu xanh = đạt mục tiêu, vàng = cảnh báo (≥90% mục tiêu), đỏ = không đạt.
          </p>
        </div>
      </div>

      {/* Fulfillment breakdown + Financial summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            Phân tích đơn hàng
          </h2>
          <FulfillmentChart data={fulfillmentData} />

          {/* Order status detail */}
          {orderStats?.byStatus?.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chi tiết theo trạng thái</p>
              {orderStats.byStatus.map((item: any) => {
                const pct = totalOrders > 0 ? Math.round((item._count / totalOrders) * 100) : 0;
                return (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 text-xs">{item.status}</span>
                    <span className="font-medium text-xs">{item._count.toLocaleString()} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-800 mb-4">Tóm tắt tài chính nền tảng</h2>
          <div className="space-y-3">
            {[
              { label: 'Tổng GMV', value: stats?.totalGmv, prefix: '₫', color: 'text-blue-600' },
              { label: 'Doanh thu platform', value: stats?.totalRevenue, prefix: '₫', color: 'text-green-600' },
              { label: 'Tổng đã rút (seller)', value: stats?.totalWithdrawals, prefix: '₫', color: 'text-purple-600' },
              { label: 'Đang giữ (chờ TT)', value: stats?.pendingPayouts, prefix: '₫', color: 'text-yellow-600' },
              { label: 'Doanh thu từ ads', value: stats?.adsRevenue, prefix: '₫', color: 'text-orange-600' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className={`font-bold text-sm ${item.color}`}>
                  {item.value !== undefined ? `${Number(item.value).toLocaleString('vi-VN')}${item.prefix}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operations Health */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-800 mb-4">Chỉ số sức khỏe nền tảng</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Tỷ lệ tranh chấp',
              value: totalOrders > 0 ? `${((disputeOpen / totalOrders) * 100).toFixed(2)}%` : '0%',
              target: '< 1%',
              good: totalOrders === 0 || disputeOpen / totalOrders < 0.01,
            },
            {
              label: 'Tỷ lệ đổi trả',
              value: totalOrders > 0 ? `${((returnCount / totalOrders) * 100).toFixed(2)}%` : '0%',
              target: '< 3%',
              good: totalOrders === 0 || returnCount / totalOrders < 0.03,
            },
            {
              label: 'Giao hàng thành công',
              value: stats?.shippingSuccessRate ? `${stats.shippingSuccessRate}%` : 'N/A',
              target: '> 95%',
              good: (stats?.shippingSuccessRate || 0) >= 95,
            },
            {
              label: 'Thời gian xử lý TB',
              value: stats?.avgProcessingHours ? `${stats.avgProcessingHours}h` : 'N/A',
              target: '< 24h',
              good: !stats?.avgProcessingHours || stats.avgProcessingHours < 24,
            },
          ].map((metric) => (
            <div key={metric.label} className={`rounded-xl p-4 border ${metric.good ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className="text-xs text-gray-500">{metric.label}</p>
              <p className={`text-2xl font-bold mt-1 ${metric.good ? 'text-green-700' : 'text-red-600'}`}>{metric.value}</p>
              <p className={`text-xs mt-1 ${metric.good ? 'text-green-600' : 'text-red-500'}`}>
                {metric.good ? '✓ Đạt mục tiêu' : `✗ Mục tiêu: ${metric.target}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
