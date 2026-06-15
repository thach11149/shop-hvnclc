import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sparkles, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import apiClient from '../api/client';

interface PriceSuggestion {
  productId?: string;
  productName?: string;
  currentPrice?: number;
  suggestedMin: number;
  suggestedMax: number;
  optimal: number;
  competitorAvg: number;
  demandScore: number;
  confidence: number;
  reasoning: string;
}

export default function AIPricePage() {
  const [form, setForm] = useState({ name: '', category: '', costPrice: '', currentPrice: '' });

  const { data: productsData } = useQuery({
    queryKey: ['seller-products-list'],
    queryFn: () => apiClient.get('/seller/products?limit=50').then(r => r.data.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then(r => r.data.data),
  });

  const { data: bulkData, isLoading: bulkLoading } = useQuery<{ data: PriceSuggestion[] }>({
    queryKey: ['seller-ai-price-bulk'],
    queryFn: () => apiClient.get('/seller/ai/price-suggestion/bulk').then(r => r.data),
  });

  const suggestionMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiClient.post('/ai/price-suggestion', {
        productName: data.name,
        category: data.category,
        costPrice: Number(data.costPrice),
        currentPrice: data.currentPrice ? Number(data.currentPrice) : undefined,
      }).then(r => r.data.data),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể phân tích giá'),
  });

  const products: any[] = productsData?.data || productsData || [];
  const categories: any[] = categoriesData?.data || categoriesData || [];
  const bulkSuggestions: PriceSuggestion[] = bulkData?.data ?? [];
  const result = suggestionMutation.data as PriceSuggestion | undefined;

  const handleAnalyze = () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên sản phẩm'); return; }
    if (!form.costPrice) { toast.error('Vui lòng nhập giá vốn'); return; }
    suggestionMutation.mutate(form);
  };

  const priceDiff = result ? result.optimal - (Number(form.currentPrice) || result.currentPrice || 0) : 0;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">AI Gợi ý giá</h1>
        <p className="text-gray-500 text-sm">AI phân tích giá cạnh tranh và nhu cầu thị trường để đề xuất giá tối ưu.</p>
      </div>

      {/* Input Form */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <Sparkles size={18} className="text-blue-500" />
          Phân tích giá theo yêu cầu
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
            <input
              className="input w-full"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="VD: Áo thun nam basic cotton"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
            <select
              className="input w-full"
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá vốn (đ) *</label>
            <input
              type="number"
              className="input w-full"
              value={form.costPrice}
              onChange={e => setForm(p => ({ ...p, costPrice: e.target.value }))}
              placeholder="VD: 80000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán hiện tại (đ)</label>
            <input
              type="number"
              className="input w-full"
              value={form.currentPrice}
              onChange={e => setForm(p => ({ ...p, currentPrice: e.target.value }))}
              placeholder="Để trống nếu sản phẩm mới"
            />
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={suggestionMutation.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {suggestionMutation.isPending ? 'Đang phân tích...' : 'Phân tích giá với AI'}
        </button>

        {/* Result */}
        {result && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" />
              Kết quả phân tích AI
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Giá đề xuất (tối ưu)', value: result.optimal, color: 'text-green-600', highlight: true },
                { label: 'Khoảng thấp nhất', value: result.suggestedMin, color: 'text-gray-700', highlight: false },
                { label: 'Khoảng cao nhất', value: result.suggestedMax, color: 'text-gray-700', highlight: false },
                { label: 'Giá TB cạnh tranh', value: result.competitorAvg, color: 'text-orange-600', highlight: false },
              ].map(s => (
                <div key={s.label} className={`rounded-lg p-3 ${s.highlight ? 'bg-green-100 border border-green-200' : 'bg-white border border-gray-200'}`}>
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={`font-bold text-base ${s.color}`}>{s.value?.toLocaleString('vi-VN')}đ</p>
                </div>
              ))}
            </div>

            {form.currentPrice && priceDiff !== 0 && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                priceDiff > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {priceDiff > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>
                  {priceDiff > 0 ? 'Nên tăng giá' : 'Nên giảm giá'} {Math.abs(priceDiff).toLocaleString('vi-VN')}đ
                  ({priceDiff > 0 ? '+' : ''}{((priceDiff / Number(form.currentPrice)) * 100).toFixed(1)}%)
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Nhu cầu thị trường</span>
                  <span>{result.demandScore}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${result.demandScore}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Độ tin cậy</p>
                <p className="font-bold text-blue-600">{(result.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>

            {result.reasoning && (
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Lý do đề xuất</p>
                <p className="text-sm text-gray-700">{result.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Suggestions */}
      {bulkSuggestions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-700">Gợi ý cho toàn bộ sản phẩm</h2>
          </div>
          {bulkLoading ? (
            <div className="p-8 text-center text-gray-400">Đang phân tích...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Sản phẩm', 'Giá hiện tại', 'Giá đề xuất', 'Khoảng cạnh tranh', 'Nhu cầu', 'Độ tin cậy'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {bulkSuggestions.map((s, i) => {
                  const diff = s.optimal - (s.currentPrice || 0);
                  return (
                    <tr key={s.productId || i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px]">
                        <p className="truncate">{s.productName || s.productId}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {s.currentPrice ? `${s.currentPrice.toLocaleString('vi-VN')}đ` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-green-600">{s.optimal?.toLocaleString('vi-VN')}đ</span>
                          {s.currentPrice && diff !== 0 && (
                            <span className={`text-xs ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {s.suggestedMin?.toLocaleString('vi-VN')}đ <ArrowRight size={10} className="inline" /> {s.suggestedMax?.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${s.demandScore}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{s.demandScore}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          s.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                          s.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {(s.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
