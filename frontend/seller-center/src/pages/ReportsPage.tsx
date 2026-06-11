import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import apiClient from '../api/client';

export default function ReportsPage() {
  const [range, setRange] = useState('30');

  const { data: report } = useQuery({
    queryKey: ['seller-report', range],
    queryFn: () => apiClient.get(`/seller/finance/report?days=${range}`).then(r => r.data.data),
  });

  const summary = report?.summary;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo doanh số</h1>
        <select value={range} onChange={e => setRange(e.target.value)} className="input max-w-[150px]">
          <option value="7">7 ngày qua</option>
          <option value="30">30 ngày qua</option>
          <option value="90">90 ngày qua</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Doanh thu</p>
          <p className="text-xl font-bold text-green-600">{Number(summary?.revenue || 0).toLocaleString('vi-VN')}₫</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Đơn hàng</p>
          <p className="text-xl font-bold text-blue-600">{summary?.ordersCount || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Phí nền tảng</p>
          <p className="text-xl font-bold text-red-500">{Number(summary?.platformFee || 0).toLocaleString('vi-VN')}₫</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Thực nhận</p>
          <p className="text-xl font-bold text-gray-800">{Number(summary?.netRevenue || 0).toLocaleString('vi-VN')}₫</p>
        </div>
      </div>

      {report?.daily?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold">Doanh thu theo ngày</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Ngày</th>
                <th className="text-right px-4 py-3 text-gray-500">Đơn hàng</th>
                <th className="text-right px-4 py-3 text-gray-500">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {report.daily.map((day: any) => (
                <tr key={day.date} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{day.date}</td>
                  <td className="px-4 py-3 text-right">{day.ordersCount}</td>
                  <td className="px-4 py-3 text-right font-medium">{Number(day.revenue).toLocaleString('vi-VN')}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
