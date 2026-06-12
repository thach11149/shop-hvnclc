import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

type TabType = 'campaigns' | 'keywords' | 'revenue';

interface AdCampaign {
  id: string;
  shopName: string;
  name: string;
  type: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  ENDED: 'bg-gray-100 text-gray-500',
  PENDING_REVIEW: 'bg-blue-100 text-blue-700',
};

export default function AdsManagementPage() {
  const [tab, setTab] = useState<TabType>('campaigns');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý Quảng cáo</h1>

      <div className="flex gap-1 mb-6 border-b">
        {(['campaigns', 'keywords', 'revenue'] as TabType[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'campaigns' ? 'Chiến dịch' : t === 'keywords' ? 'Từ khóa' : 'Doanh thu QC'}
          </button>
        ))}
      </div>

      {tab === 'campaigns' && <CampaignsTab statusColors={STATUS_COLORS} />}
      {tab === 'keywords' && <KeywordsTab />}
      {tab === 'revenue' && <RevenueTab />}
    </div>
  );
}

function CampaignsTab({ statusColors }: { statusColors: Record<string, string> }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ data: AdCampaign[] }>({
    queryKey: ['admin-ads-campaigns'],
    queryFn: () => apiClient.get('/admin/ads/campaigns').then(r => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      apiClient.post(`/admin/ads/campaigns/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-ads-campaigns'] }),
  });

  const campaigns = data?.data ?? [];

  return isLoading ? <p>Đang tải...</p> : (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Cửa hàng', 'Chiến dịch', 'Loại', 'Ngân sách', 'Đã chi', 'CTR', 'Trạng thái', 'Thao tác'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {campaigns.map(c => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-600">{c.shopName}</td>
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3 text-xs">{c.type}</td>
              <td className="px-4 py-3">{c.budget?.toLocaleString('vi-VN')}đ</td>
              <td className="px-4 py-3 text-orange-600">{c.spent?.toLocaleString('vi-VN')}đ</td>
              <td className="px-4 py-3">
                {c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00'}%
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {c.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {c.status === 'PENDING_REVIEW' && (
                  <div className="flex gap-2">
                    <button onClick={() => reviewMutation.mutate({ id: c.id, action: 'approve' })} className="text-green-600 hover:underline text-xs">Duyệt</button>
                    <button onClick={() => reviewMutation.mutate({ id: c.id, action: 'reject' })} className="text-red-600 hover:underline text-xs">Từ chối</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KeywordsTab() {
  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['admin-ads-keywords'],
    queryFn: () => apiClient.get('/admin/ads/keywords').then(r => r.data),
  });

  const keywords = data?.data ?? [];

  return isLoading ? <p>Đang tải...</p> : (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Từ khóa', 'Số chiến dịch', 'Giá thầu TB', 'Lượt hiển thị', 'Lượt click'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {keywords.map((kw, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{kw.keyword}</td>
              <td className="px-4 py-3">{kw.campaignCount}</td>
              <td className="px-4 py-3">{kw.avgBid?.toLocaleString('vi-VN')}đ</td>
              <td className="px-4 py-3">{kw.impressions?.toLocaleString()}</td>
              <td className="px-4 py-3">{kw.clicks?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RevenueTab() {
  const { data, isLoading } = useQuery<{ data: any }>({
    queryKey: ['admin-ads-revenue'],
    queryFn: () => apiClient.get('/admin/ads/revenue').then(r => r.data),
  });

  const stats = data?.data;

  return isLoading ? <p>Đang tải...</p> : (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[
        { label: 'Tổng doanh thu QC', value: stats?.totalRevenue?.toLocaleString('vi-VN') + 'đ' },
        { label: 'Tháng này', value: stats?.monthRevenue?.toLocaleString('vi-VN') + 'đ' },
        { label: 'Tổng impressions', value: stats?.totalImpressions?.toLocaleString() },
        { label: 'Tổng clicks', value: stats?.totalClicks?.toLocaleString() },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{s.label}</p>
          <p className="text-2xl font-bold mt-1">{s.value ?? '--'}</p>
        </div>
      ))}
    </div>
  );
}
