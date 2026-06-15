import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import apiClient from '../api/client';

interface AdsStats {
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalOrders: number;
  roas: number;
  ctr: number;
  cpc: number;
  daily: { date: string; spent: number; clicks: number; orders: number; impressions: number }[];
  topProducts: { productId: string; productName: string; spent: number; revenue: number; roas: number; clicks: number; orders: number }[];
}

export default function AdsReportsPage() {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery<{ data: AdsStats }>({
    queryKey: ['seller-ads-stats', period],
    queryFn: () => apiClient.get(`/seller/ads/stats?period=${period}`).then(r => r.data),
  });

  const { data: reportsData } = useQuery({
    queryKey: ['seller-ads-reports', period],
    queryFn: () => apiClient.get(`/seller/ads/reports?period=${period}`).then(r => r.data.data),
  });

  const stats = data?.data;
  const topProducts = reportsData?.topProducts || stats?.topProducts || [];
  const dailyData = stats?.daily || [];

  const kpiCards = [
    { label: 'ROAS', value: `${(stats?.roas || 0).toFixed(2)}x`, color: 'text-green-600', desc: 'Tỷ lệ hoàn vốn' },
    { label: 'CTR', value: `${(stats?.ctr || 0).toFixed(2)}%`, color: 'text-blue-600', desc: 'Tỷ lệ click' },
    { label: 'CPC', value: `${(stats?.cpc || 0).toLocaleString('vi-VN')}đ`, color: 'text-orange-600', desc: 'Chi phí/click' },
    { label: 'Đơn từ QC', value: (stats?.totalOrders || 0).toString(), color: 'text-purple-600', desc: 'Đơn hàng' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo Quảng cáo</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[['7d', '7 ngày'], ['30d', '30 ngày'], ['90d', '90 ngày']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === v ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-400">Đang tải...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpiCards.map(s => (
              <div key={s.label} className="card p-4">
                <p className="text-xs text-gray-400 mb-0.5">{s.desc}</p>
                <p className="text-sm text-gray-600 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Area Chart */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Chi tiêu theo ngày (đ)</h2>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(v: any, name: string) => [
                      name === 'spent' ? `${Number(v).toLocaleString('vi-VN')}đ` : v,
                      name === 'spent' ? 'Chi tiêu' : name === 'clicks' ? 'Clicks' : 'Đơn hàng',
                    ]}
                  />
                  <Area type="monotone" dataKey="spent" stroke="#f97316" fill="url(#spentGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                Chưa có dữ liệu
              </div>
            )}
          </div>

          {/* Top Products by ROAS */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-700">Top sản phẩm theo ROAS</h2>
              <p className="text-xs text-gray-400 mt-0.5">Doanh thu / Chi phí quảng cáo</p>
            </div>
            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">#</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Sản phẩm</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Chi phí</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Doanh thu</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">ROAS</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Clicks</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topProducts.map((p: any, i: number) => (
                    <tr key={p.productId || i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-400 text-xs font-medium">{i + 1}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800 line-clamp-1">{p.productName || p.name || 'Sản phẩm'}</p>
                      </td>
                      <td className="px-5 py-3 text-right text-orange-600">
                        {(p.spent || 0).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-5 py-3 text-right text-green-600 font-medium">
                        {(p.revenue || 0).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`font-bold text-sm ${
                          (p.roas || 0) >= 3 ? 'text-green-600' :
                          (p.roas || 0) >= 1 ? 'text-yellow-600' :
                          'text-red-500'
                        }`}>
                          {(p.roas || 0).toFixed(2)}x
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500">{p.clicks || 0}</td>
                      <td className="px-5 py-3 text-right text-gray-500">{p.orders || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Daily Table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-700">Chi tiết theo ngày</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Ngày</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Chi phí</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Impressions</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Clicks</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Đơn hàng</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dailyData.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-600">{d.date}</td>
                      <td className="px-5 py-3 text-right text-orange-600">{(d.spent || 0).toLocaleString('vi-VN')}đ</td>
                      <td className="px-5 py-3 text-right text-gray-500">{(d.impressions || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{(d.clicks || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-medium">{d.orders || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
