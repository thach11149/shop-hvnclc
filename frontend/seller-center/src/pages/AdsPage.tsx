import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, ToggleLeft, ToggleRight, Edit2, TrendingUp, MousePointer, DollarSign, ShoppingCart } from 'lucide-react';
import apiClient from '../api/client';

const TYPE_LABELS: Record<string, string> = {
  SPONSORED_PRODUCT: 'Sản phẩm nổi bật',
  SPONSORED_KEYWORD: 'Từ khóa',
  DISPLAY: 'Hiển thị',
};

interface AdCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  dailyBudget: number;
  spent: number;
  impressions: number;
  clicks: number;
  orders: number;
  startDate: string;
  endDate: string | null;
}

export default function AdsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editBudget, setEditBudget] = useState<{ id: string; value: number } | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'SPONSORED_PRODUCT',
    dailyBudget: 100000,
    bid: 500,
    bidType: 'CPC',
    keywords: '',
    productId: '',
    startDate: '',
  });

  const { data: statsData } = useQuery({
    queryKey: ['seller-ads-kpi'],
    queryFn: () => apiClient.get('/seller/ads/stats?period=30d').then(r => r.data.data),
  });

  const { data, isLoading } = useQuery<{ data: AdCampaign[] }>({
    queryKey: ['seller-ads'],
    queryFn: () => apiClient.get('/seller/ads/campaigns').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => apiClient.post('/seller/ads/campaigns', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-ads'] });
      qc.invalidateQueries({ queryKey: ['seller-ads-kpi'] });
      setShowCreate(false);
      toast.success('Đã tạo chiến dịch quảng cáo');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/seller/ads/campaigns/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-ads'] }),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const budgetMutation = useMutation({
    mutationFn: ({ id, dailyBudget }: { id: string; dailyBudget: number }) =>
      apiClient.patch(`/seller/ads/campaigns/${id}/budget`, { dailyBudget }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-ads'] });
      setEditBudget(null);
      toast.success('Đã cập nhật ngân sách');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const campaigns = data?.data ?? [];
  const totalSpent = campaigns.reduce((s, c) => s + (c.spent || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  const kpiCards = [
    { label: 'Chi tiêu', value: `${totalSpent.toLocaleString('vi-VN')}đ`, icon: <DollarSign size={18} className="text-orange-500" />, color: 'text-orange-600' },
    { label: 'Impressions', value: totalImpressions.toLocaleString(), icon: <TrendingUp size={18} className="text-blue-500" />, color: 'text-blue-600' },
    { label: 'Clicks', value: totalClicks.toLocaleString(), icon: <MousePointer size={18} className="text-purple-500" />, color: 'text-purple-600' },
    { label: 'CTR', value: `${avgCTR}%`, icon: <ShoppingCart size={18} className="text-green-500" />, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Quảng cáo</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo chiến dịch
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{card.label}</p>
              {card.icon}
            </div>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Campaigns Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <p className="text-4xl mb-3">📢</p>
            <p className="text-sm mb-2">Chưa có chiến dịch quảng cáo nào</p>
            <button onClick={() => setShowCreate(true)} className="text-blue-600 text-sm hover:underline">Tạo ngay</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Chiến dịch', 'Loại', 'Ngân sách/ngày', 'Đã chi', 'Impressions', 'Clicks', 'CTR', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{TYPE_LABELS[c.type] || c.type}</td>
                  <td className="px-4 py-3">
                    {editBudget?.id === c.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="w-24 border border-blue-300 rounded px-1.5 py-0.5 text-xs"
                          value={editBudget.value}
                          onChange={e => setEditBudget(p => p ? { ...p, value: Number(e.target.value) } : null)}
                        />
                        <button
                          onClick={() => budgetMutation.mutate({ id: c.id, dailyBudget: editBudget.value })}
                          disabled={budgetMutation.isPending}
                          className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded"
                        >✓</button>
                        <button onClick={() => setEditBudget(null)} className="text-xs text-gray-400 px-1 py-0.5">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditBudget({ id: c.id, value: c.dailyBudget })}
                        className="flex items-center gap-1 text-gray-700 hover:text-blue-600 group"
                      >
                        {c.dailyBudget?.toLocaleString('vi-VN')}đ
                        <Edit2 size={11} className="opacity-0 group-hover:opacity-100 text-blue-400" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-orange-600">{(c.spent || 0).toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3 text-gray-600">{(c.impressions || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{(c.clicks || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.impressions > 0 ? `${((c.clicks / c.impressions) * 100).toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      c.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{c.status === 'ACTIVE' ? 'Đang chạy' : c.status === 'PAUSED' ? 'Tạm dừng' : c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMutation.mutate(c.id)}
                      disabled={toggleMutation.isPending}
                      className={`p-1 ${c.status === 'ACTIVE' ? 'text-green-500 hover:text-yellow-500' : 'text-gray-400 hover:text-green-500'}`}
                      title={c.status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt'}
                    >
                      {c.status === 'ACTIVE' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Tạo chiến dịch quảng cáo</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chiến dịch *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Quảng cáo áo hè 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại quảng cáo</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {form.type === 'SPONSORED_PRODUCT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID sản phẩm</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.productId}
                    onChange={e => setForm(p => ({ ...p, productId: e.target.value }))}
                    placeholder="Nhập Product ID"
                  />
                </div>
              )}
              {form.type === 'SPONSORED_KEYWORD' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ khóa (mỗi dòng một từ)</label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                    value={form.keywords}
                    onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))}
                    placeholder="áo thun nam&#10;quần jean&#10;giày thể thao"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức đấu giá</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.bidType}
                    onChange={e => setForm(p => ({ ...p, bidType: e.target.value }))}
                  >
                    <option value="CPC">CPC (mỗi click)</option>
                    <option value="CPM">CPM (mỗi 1000 views)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bid ({form.bidType}) (đ)</label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.bid}
                    onChange={e => setForm(p => ({ ...p, bid: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngân sách mỗi ngày (đ)</label>
                <input
                  type="number"
                  min={50000}
                  step={10000}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.dailyBudget}
                  onChange={e => setForm(p => ({ ...p, dailyBudget: Number(e.target.value) }))}
                />
                <p className="text-xs text-gray-400 mt-1">Tối thiểu 50.000đ/ngày</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.startDate}
                  onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end p-5 border-t">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Hủy</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo chiến dịch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
