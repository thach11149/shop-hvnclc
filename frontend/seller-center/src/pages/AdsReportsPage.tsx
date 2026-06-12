import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

interface AdsStats {
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalOrders: number;
  roas: number;
  ctr: number;
  cpc: number;
  daily: { date: string; spent: number; clicks: number; orders: number }[];
}

export default function AdsReportsPage() {
  const [period, setPeriod] = useState('7d');

  const { data, isLoading } = useQuery<{ data: AdsStats }>({
    queryKey: ['seller-ads-stats', period],
    queryFn: () => apiClient.get(`/seller/ads/stats?period=${period}`).then(r => r.data),
  });

  const stats = data?.data;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Báo cáo Quảng cáo</h1>
        <div className="flex gap-1">
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === '7d' ? '7 ngày' : p === '30d' ? '30 ngày' : '90 ngày'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <p>Đang tải...</p> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'ROAS', value: `${stats?.roas?.toFixed(2)}x`, color: 'text-green-600' },
              { label: 'CTR', value: `${stats?.ctr?.toFixed(2)}%`, color: 'text-blue-600' },
              { label: 'CPC', value: `${stats?.cpc?.toLocaleString('vi-VN')}đ`, color: 'text-orange-600' },
              { label: 'Đơn từ QC', value: stats?.totalOrders?.toString(), color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow p-5 mb-6">
            <h2 className="font-semibold text-gray-700 mb-3">Chi phí theo ngày</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Ngày</th>
                    <th className="pb-2 text-right">Chi phí</th>
                    <th className="pb-2 text-right">Clicks</th>
                    <th className="pb-2 text-right">Đơn hàng</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats?.daily?.map((d, i) => (
                    <tr key={i}>
                      <td className="py-2">{d.date}</td>
                      <td className="py-2 text-right">{d.spent?.toLocaleString('vi-VN')}đ</td>
                      <td className="py-2 text-right">{d.clicks?.toLocaleString()}</td>
                      <td className="py-2 text-right">{d.orders}</td>
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
