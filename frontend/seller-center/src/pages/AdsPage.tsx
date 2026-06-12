import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

interface AdCampaign {
  id: string;
  name: string;
  type: 'SPONSORED_PRODUCT' | 'SPONSORED_KEYWORD' | 'DISPLAY';
  status: string;
  dailyBudget: number;
  spent: number;
  impressions: number;
  clicks: number;
  orders: number;
  startDate: string;
  endDate: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  SPONSORED_PRODUCT: 'Sản phẩm nổi bật',
  SPONSORED_KEYWORD: 'Từ khóa',
  DISPLAY: 'Hiển thị',
};

export default function AdsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'SPONSORED_PRODUCT', dailyBudget: 100000, startDate: '' });

  const { data, isLoading } = useQuery<{ data: AdCampaign[] }>({
    queryKey: ['seller-ads'],
    queryFn: () => apiClient.get('/seller/ads/campaigns').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => apiClient.post('/seller/ads/campaigns', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller-ads'] }); setShowCreate(false); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'pause' | 'resume' }) =>
      apiClient.post(`/seller/ads/campaigns/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-ads'] }),
  });

  const campaigns = data?.data ?? [];

  const totalSpent = campaigns.reduce((s, c) => s + (c.spent || 0), 0);
  const totalOrders = campaigns.reduce((s, c) => s + (c.orders || 0), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quảng cáo</h1>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          + Tạo chiến dịch
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Đã chi</p>
          <p className="text-xl font-bold mt-1">{totalSpent?.toLocaleString('vi-VN')}đ</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Đơn từ QC</p>
          <p className="text-xl font-bold mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Chiến dịch</p>
          <p className="text-xl font-bold mt-1">{campaigns.length}</p>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Tạo chiến dịch quảng cáo</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chiến dịch</label>
                <input className="w-full border rounded px-3 py-2 text-sm" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                <select className="w-full border rounded px-3 py-2 text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngân sách/ngày (đ)</label>
                <input type="number" min={50000} step={10000} className="w-full border rounded px-3 py-2 text-sm" value={form.dailyBudget} onChange={e => setForm(p => ({ ...p, dailyBudget: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <input type="date" className="w-full border rounded px-3 py-2 text-sm" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded text-sm">Hủy</button>
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <p>Đang tải...</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Chiến dịch', 'Loại', 'Ngân sách/ngày', 'Đã chi', 'Impressions', 'Clicks', 'Đơn', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{TYPE_LABELS[c.type]}</td>
                  <td className="px-4 py-3">{c.dailyBudget?.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3 text-orange-600">{c.spent?.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3">{c.impressions?.toLocaleString()}</td>
                  <td className="px-4 py-3">{c.clicks?.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{c.orders}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      c.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {c.status === 'ACTIVE' && <button onClick={() => toggleMutation.mutate({ id: c.id, action: 'pause' })} className="text-yellow-600 hover:underline text-xs">Tạm dừng</button>}
                    {c.status === 'PAUSED' && <button onClick={() => toggleMutation.mutate({ id: c.id, action: 'resume' })} className="text-green-600 hover:underline text-xs">Tiếp tục</button>}
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
