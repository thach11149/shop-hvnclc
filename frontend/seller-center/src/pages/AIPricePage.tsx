import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';

interface PriceSuggestion {
  productId: string;
  productName: string;
  currentPrice: number;
  suggestedMin: number;
  suggestedMax: number;
  optimal: number;
  competitorAvg: number;
  demandScore: number;
  confidence: number;
  reasoning: string;
}

export default function AIPricePage() {
  const [selectedProduct, setSelectedProduct] = useState('');

  const { data: productsData } = useQuery<{ data: { id: string; name: string; price: number }[] }>({
    queryKey: ['seller-products-list'],
    queryFn: () => apiClient.get('/seller/products?limit=50').then(r => r.data),
  });

  const suggestionMutation = useMutation({
    mutationFn: (productId: string) =>
      apiClient.post(`/seller/ai/price-suggestion/${productId}`).then(r => r.data.data),
  });

  const { data: bulkData, isLoading: bulkLoading } = useQuery<{ data: PriceSuggestion[] }>({
    queryKey: ['seller-ai-price-bulk'],
    queryFn: () => apiClient.get('/seller/ai/price-suggestion/bulk').then(r => r.data),
  });

  const products = productsData?.data ?? [];
  const bulkSuggestions = bulkData?.data ?? [];

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">AI Gợi ý giá</h1>
      <p className="text-gray-500 text-sm mb-6">AI phân tích giá cạnh tranh, nhu cầu thị trường để đề xuất giá tối ưu.</p>

      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <h2 className="font-semibold mb-3">Kiểm tra từng sản phẩm</h2>
        <div className="flex gap-3">
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            className="flex-1 border rounded px-3 py-2 text-sm"
          >
            <option value="">Chọn sản phẩm...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button
            onClick={() => selectedProduct && suggestionMutation.mutate(selectedProduct)}
            disabled={!selectedProduct || suggestionMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {suggestionMutation.isPending ? 'Đang phân tích...' : 'Phân tích'}
          </button>
        </div>

        {suggestionMutation.data && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {[
                { label: 'Giá hiện tại', value: suggestionMutation.data.currentPrice, color: 'text-gray-700' },
                { label: 'Giá tối ưu', value: suggestionMutation.data.optimal, color: 'text-green-600' },
                { label: 'Giá TB cạnh tranh', value: suggestionMutation.data.competitorAvg, color: 'text-orange-500' },
                { label: 'Độ tin cậy', value: null, color: 'text-blue-600', text: `${(suggestionMutation.data.confidence * 100).toFixed(0)}%` },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`font-bold ${s.color}`}>
                    {s.text ?? `${s.value?.toLocaleString('vi-VN')}đ`}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-700">{suggestionMutation.data.reasoning}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">Gợi ý cho toàn bộ sản phẩm</h2>
        </div>
        {bulkLoading ? <p className="p-4">Đang tải...</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Sản phẩm', 'Giá hiện tại', 'Gợi ý min', 'Gợi ý max', 'Tối ưu', 'Nhu cầu', 'Độ tin cậy'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {bulkSuggestions.map(s => (
                <tr key={s.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium max-w-[180px] truncate">{s.productName}</td>
                  <td className="px-4 py-3">{s.currentPrice?.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3 text-gray-500">{s.suggestedMin?.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3 text-gray-500">{s.suggestedMax?.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3 text-green-600 font-bold">{s.optimal?.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${s.demandScore}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{(s.confidence * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
