import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { AlertTriangle, Package, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
  dailyForecast?: { date: string; demand: number; stock: number }[];
}

const TREND_ICONS: Record<string, JSX.Element> = {
  UP: <TrendingUp size={14} className="text-green-500" />,
  DOWN: <TrendingDown size={14} className="text-red-500" />,
  STABLE: <Minus size={14} className="text-gray-400" />,
};

export default function AIInventoryForecastPage() {
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  const { data: productsData } = useQuery({
    queryKey: ['seller-products-list'],
    queryFn: () => apiClient.get('/seller/products?limit=50').then(r => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['seller-ai-inventory-forecast', selectedProduct],
    queryFn: () => {
      const url = selectedProduct !== 'all'
        ? `/ai/inventory-forecast?productId=${selectedProduct}`
        : '/seller/ai/inventory-forecast';
      return apiClient.get(url).then(r => r.data.data || r.data);
    },
  });

  const products: any[] = productsData?.data || productsData || [];
  const items: ForecastItem[] = data?.data || (Array.isArray(data) ? data : [data].filter(Boolean)) as ForecastItem[];
  const criticalItems = items.filter(i => i.daysUntilStockout <= 7);
  const warningItems = items.filter(i => i.daysUntilStockout > 7 && i.daysUntilStockout <= 14);

  const selectedItem = selectedProduct !== 'all' ? items[0] : null;

  // Build chart data from daily forecast or generate mock data
  const chartData = selectedItem?.dailyForecast || Array.from({ length: 30 }, (_, i) => {
    const stock = Math.max(0, (selectedItem?.currentStock || 100) - i * ((selectedItem?.forecast30d || 50) / 30));
    return {
      date: `N${i + 1}`,
      stock: Math.round(stock),
      demand: Math.round((selectedItem?.forecast30d || 50) / 30 + (Math.random() - 0.5) * 5),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">AI Dự báo tồn kho</h1>
        <p className="text-gray-500 text-sm">AI phân tích xu hướng nhu cầu và đề xuất số lượng cần nhập để không bị cháy hàng.</p>
      </div>

      {/* Product Selector */}
      <div className="card p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn sản phẩm để xem dự báo</label>
        <select
          value={selectedProduct}
          onChange={e => setSelectedProduct(e.target.value)}
          className="input w-full md:w-80"
        >
          <option value="all">Tất cả sản phẩm</option>
          {products.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Alerts */}
      {criticalItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h2 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle size={18} />
            {criticalItems.length} sản phẩm có nguy cơ hết hàng trong 7 ngày
          </h2>
          <div className="flex flex-wrap gap-2">
            {criticalItems.map(item => (
              <button
                key={item.productId}
                onClick={() => setSelectedProduct(item.productId)}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
              >
                {item.productName} — còn {item.daysUntilStockout} ngày
              </button>
            ))}
          </div>
        </div>
      )}

      {warningItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h2 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
            <Package size={18} />
            {warningItems.length} sản phẩm cần theo dõi (hết hàng trong 7-14 ngày)
          </h2>
          <div className="flex flex-wrap gap-2">
            {warningItems.map(item => (
              <span key={item.productId} className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                {item.productName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chart for selected product */}
      {selectedItem && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-700">{selectedItem.productName}</h2>
              <p className="text-xs text-gray-500 mt-0.5">SKU: {selectedItem.sku} • Dự báo 30 ngày tới</p>
            </div>
            <div className="flex items-center gap-2">
              {TREND_ICONS[selectedItem.trend]}
              <span className={`text-sm font-medium ${
                selectedItem.trend === 'UP' ? 'text-green-600' :
                selectedItem.trend === 'DOWN' ? 'text-red-500' :
                'text-gray-500'
              }`}>
                {selectedItem.trend === 'UP' ? 'Tăng' : selectedItem.trend === 'DOWN' ? 'Giảm' : 'Ổn định'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Tồn kho hiện tại', value: selectedItem.currentStock, color: selectedItem.currentStock <= 10 ? 'text-red-600' : 'text-green-600', unit: 'sản phẩm' },
              { label: 'Dự kiến bán 7 ngày', value: selectedItem.forecast7d, color: 'text-blue-600', unit: 'sản phẩm' },
              { label: 'Dự kiến bán 30 ngày', value: selectedItem.forecast30d, color: 'text-purple-600', unit: 'sản phẩm' },
              { label: 'Hết hàng sau', value: selectedItem.daysUntilStockout, color: selectedItem.daysUntilStockout <= 7 ? 'text-red-600' : 'text-orange-500', unit: 'ngày' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value?.toLocaleString()} <span className="text-xs font-normal">{s.unit}</span></p>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: any, name: string) => [v, name === 'stock' ? 'Tồn kho dự kiến' : 'Nhu cầu']}
              />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Hết hàng', fill: '#ef4444', fontSize: 11 }} />
              <Area type="monotone" dataKey="stock" stroke="#3b82f6" fill="url(#stockGrad)" strokeWidth={2} name="stock" />
              <Area type="monotone" dataKey="demand" stroke="#f97316" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="demand" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-500 inline-block" /> Tồn kho dự kiến</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-orange-400 inline-block border-dashed" /> Nhu cầu dự báo</span>
          </div>

          {selectedItem.suggestedReorder > 0 && (
            <div className="mt-4 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />
              <p className="text-sm text-orange-700">
                AI đề xuất nhập thêm <strong>{selectedItem.suggestedReorder.toLocaleString()}</strong> sản phẩm để đảm bảo không cháy hàng trong 30 ngày tới.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-700">Tổng quan tồn kho</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang phân tích dữ liệu...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Chưa có dữ liệu dự báo</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Sản phẩm', 'SKU', 'Tồn hiện tại', 'Bán 7 ngày', 'Bán 30 ngày', 'Hết hàng sau', 'Xu hướng', 'Cần nhập'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr
                  key={item.productId}
                  onClick={() => setSelectedProduct(item.productId)}
                  className={`cursor-pointer transition-colors ${
                    item.daysUntilStockout <= 3 ? 'bg-red-50 hover:bg-red-100' :
                    item.daysUntilStockout <= 7 ? 'bg-orange-50 hover:bg-orange-100' :
                    'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px]">
                    <p className="truncate">{item.productName}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className={`px-4 py-3 font-bold ${item.currentStock <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.currentStock?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.forecast7d?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{item.forecast30d?.toLocaleString()}</td>
                  <td className={`px-4 py-3 font-medium ${
                    item.daysUntilStockout <= 3 ? 'text-red-600' :
                    item.daysUntilStockout <= 7 ? 'text-orange-500' :
                    'text-gray-600'
                  }`}>
                    {item.daysUntilStockout} ngày
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {TREND_ICONS[item.trend]}
                    </div>
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
        )}
      </div>
    </div>
  );
}
