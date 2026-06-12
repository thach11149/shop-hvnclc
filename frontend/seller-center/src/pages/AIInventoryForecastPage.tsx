import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

interface ForecastItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  forecast7d: number;
  forecast30d: number;
  daysUntilStockout: number;
  suggestedReorder: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

const TREND_ICONS: Record<string, string> = { UP: '↑', DOWN: '↓', STABLE: '→' };
const TREND_COLORS: Record<string, string> = { UP: 'text-green-600', DOWN: 'text-red-600', STABLE: 'text-gray-500' };

export default function AIInventoryForecastPage() {
  const { data, isLoading } = useQuery<{ data: ForecastItem[] }>({
    queryKey: ['seller-ai-inventory-forecast'],
    queryFn: () => apiClient.get('/seller/ai/inventory-forecast').then(r => r.data),
  });

  const items = data?.data ?? [];
  const criticalItems = items.filter(i => i.daysUntilStockout <= 7);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">AI Dự báo hết hàng</h1>
      <p className="text-gray-500 text-sm mb-6">AI dự báo nhu cầu và đề xuất số lượng cần nhập để không bị cháy hàng.</p>

      {criticalItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-red-700 mb-2">⚠️ {criticalItems.length} sản phẩm có nguy cơ hết hàng trong 7 ngày</h2>
          <div className="flex flex-wrap gap-2">
            {criticalItems.map(item => (
              <span key={item.productId} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                {item.productName} — còn {item.daysUntilStockout} ngày
              </span>
            ))}
          </div>
        </div>
      )}

      {isLoading ? <p>Đang tải...</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Sản phẩm', 'SKU', 'Tồn hiện tại', 'Dự báo 7 ngày', 'Dự báo 30 ngày', 'Hết hàng sau', 'Xu hướng', 'Cần nhập thêm'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr
                  key={item.productId}
                  className={`hover:bg-gray-50 ${item.daysUntilStockout <= 3 ? 'bg-red-50' : item.daysUntilStockout <= 7 ? 'bg-orange-50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{item.productName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                  <td className={`px-4 py-3 font-bold ${item.currentStock <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.currentStock?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{item.forecast7d?.toLocaleString()}</td>
                  <td className="px-4 py-3">{item.forecast30d?.toLocaleString()}</td>
                  <td className={`px-4 py-3 font-medium ${item.daysUntilStockout <= 7 ? 'text-red-600' : 'text-gray-600'}`}>
                    {item.daysUntilStockout} ngày
                  </td>
                  <td className={`px-4 py-3 font-bold text-lg ${TREND_COLORS[item.trend]}`}>
                    {TREND_ICONS[item.trend]}
                  </td>
                  <td className="px-4 py-3">
                    {item.suggestedReorder > 0 && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                        +{item.suggestedReorder?.toLocaleString()}
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
