import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

interface ForecastItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  forecastDemand7d: number;
  forecastDemand30d: number;
  reorderPoint: number;
  suggestedOrder: number;
  confidence: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

const TREND_ICONS: Record<string, string> = {
  UP: '↑',
  DOWN: '↓',
  STABLE: '→',
};

const TREND_COLORS: Record<string, string> = {
  UP: 'text-green-600',
  DOWN: 'text-red-600',
  STABLE: 'text-gray-500',
};

export default function DemandForecastPage() {
  const [category, setCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const { data: catData } = useQuery<{ data: { id: string; name: string }[] }>({
    queryKey: ['categories-list'],
    queryFn: () => apiClient.get('/categories?flat=true').then(r => r.data),
  });

  const { data, isLoading } = useQuery<{ data: ForecastItem[] }>({
    queryKey: ['admin-demand-forecast', category, showLowStock],
    queryFn: () => apiClient.get(`/admin/ai/demand-forecast?categoryId=${category}&lowStock=${showLowStock}`).then(r => r.data),
  });

  const items = data?.data ?? [];
  const categories = catData?.data ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dự báo nhu cầu (AI)</h1>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showLowStock}
            onChange={e => setShowLowStock(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Chỉ hiển thị hàng sắp hết</span>
        </label>
      </div>

      {isLoading ? <p>Đang tải dự báo...</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Sản phẩm', 'SKU', 'Tồn hiện tại', 'Dự báo 7 ngày', 'Dự báo 30 ngày', 'Điểm đặt hàng', 'Xu hướng', 'Độ tin cậy', 'Gợi ý nhập'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.productId} className={`hover:bg-gray-50 ${item.currentStock <= item.reorderPoint ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{item.productName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                  <td className={`px-4 py-3 font-bold ${item.currentStock <= item.reorderPoint ? 'text-red-600' : 'text-green-600'}`}>
                    {item.currentStock?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{item.forecastDemand7d?.toLocaleString()}</td>
                  <td className="px-4 py-3">{item.forecastDemand30d?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-orange-600">{item.reorderPoint?.toLocaleString()}</td>
                  <td className={`px-4 py-3 font-bold text-lg ${TREND_COLORS[item.trend]}`}>
                    {TREND_ICONS[item.trend]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${item.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs">{(item.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.suggestedOrder > 0 && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                        +{item.suggestedOrder?.toLocaleString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
