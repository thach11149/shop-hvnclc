import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Play, Pause, CheckCircle, XCircle, BarChart2, DollarSign, MousePointer, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

type TabType = 'campaigns' | 'keywords' | 'revenue';
type StatusFilter = 'ALL' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'ENDED';

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE:         { label: 'Đang chạy',  color: 'bg-green-100 text-green-700' },
  PAUSED:         { label: 'Tạm dừng',  color: 'bg-yellow-100 text-yellow-700' },
  ENDED:          { label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-500' },
  PENDING_REVIEW: { label: 'Chờ duyệt', color: 'bg-blue-100 text-blue-700' },
  REJECTED:       { label: 'Từ chối',   color: 'bg-red-100 text-red-700' },
};

function CampaignsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ads-campaigns', statusFilter, search, page],
    queryFn: () =>
      apiClient
        .get('/admin/ads/campaigns', {
          params: {
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            search: search || undefined,
            page,
            limit: 20,
          },
        })
        .then((r) => r.data),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiClient.post(`/admin/ads/campaigns/${id}/${action}`),
    onSuccess: (_, { action }) => {
      const labels: Record<string, string> = { approve: 'Đã duyệt', reject: 'Đã từ chối', pause: 'Đã tạm dừng', resume: 'Đã tiếp tục' };
      toast.success(labels[action] || 'Thành công');
      qc.invalidateQueries({ queryKey: ['admin-ads-campaigns'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi thao tác'),
  });

  const campaigns: any[] = data?.data || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / 20);
  const pendingCount = campaigns.filter((c) => c.status === 'PENDING_REVIEW').length;

  const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING_REVIEW', label: `Chờ duyệt${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { key: 'ACTIVE', label: 'Đang chạy' },
    { key: 'PAUSED', label: 'Tạm dừng' },
    { key: 'ENDED', label: 'Đã kết thúc' },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setStatusFilter(t.key); setPage(1); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === t.key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm chiến dịch, shop..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart2 size={40} className="mx-auto mb-2 text-gray-300" />
          <p>Không có chiến dịch nào</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Shop', 'Chiến dịch', 'Loại', 'Ngân sách', 'Đã chi', 'CTR', 'Thời gian', 'Trạng thái', 'Thao tác'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((c: any) => {
                    const meta = STATUS_META[c.status] || STATUS_META.ENDED;
                    const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00';
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">{c.shopName || c.shop?.name}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-xs whitespace-nowrap">{c.name}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{c.type}</td>
                        <td className="px-4 py-3 text-xs font-medium">{Number(c.budget).toLocaleString('vi-VN')}đ</td>
                        <td className="px-4 py-3 text-xs text-orange-600 font-medium">{Number(c.spent || 0).toLocaleString('vi-VN')}đ</td>
                        <td className="px-4 py-3 text-xs">{ctr}%</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(c.startDate).toLocaleDateString('vi-VN')}
                          {c.endDate && ` — ${new Date(c.endDate).toLocaleDateString('vi-VN')}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${meta.color}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {c.status === 'PENDING_REVIEW' && (
                              <>
                                <button
                                  onClick={() => actionMutation.mutate({ id: c.id, action: 'approve' })}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded" title="Duyệt"
                                >
                                  <CheckCircle size={14} />
                                </button>
                                <button
                                  onClick={() => actionMutation.mutate({ id: c.id, action: 'reject' })}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded" title="Từ chối"
                                >
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                            {c.status === 'ACTIVE' && (
                              <button
                                onClick={() => actionMutation.mutate({ id: c.id, action: 'pause' })}
                                className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Tạm dừng"
                              >
                                <Pause size={14} />
                              </button>
                            )}
                            {c.status === 'PAUSED' && (
                              <button
                                onClick={() => actionMutation.mutate({ id: c.id, action: 'resume' })}
                                className="p-1 text-green-600 hover:bg-green-50 rounded" title="Tiếp tục"
                              >
                                <Play size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">← Trước</button>
              <span className="text-sm text-gray-500">Trang {page}/{totalPages} · {total} chiến dịch</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Sau →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KeywordsTab() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ads-keywords', search],
    queryFn: () => apiClient.get('/admin/ads/keywords', { params: { search: search || undefined } }).then((r) => r.data),
  });

  const keywords: any[] = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm từ khóa..."
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Từ khóa', 'Số chiến dịch', 'Giá thầu TB', 'Lượt hiển thị', 'Lượt click', 'CTR'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keywords.map((kw: any, i: number) => {
                const ctr = kw.impressions > 0 ? ((kw.clicks / kw.impressions) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{kw.keyword}</td>
                    <td className="px-4 py-3 text-gray-600">{kw.campaignCount}</td>
                    <td className="px-4 py-3">{Number(kw.avgBid || 0).toLocaleString('vi-VN')}đ</td>
                    <td className="px-4 py-3">{Number(kw.impressions || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{Number(kw.clicks || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">{ctr}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RevenueTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ads-revenue'],
    queryFn: () => apiClient.get('/admin/ads/revenue').then((r) => r.data),
  });

  const stats = data?.data;

  const kpis = [
    { label: 'Tổng doanh thu QC', value: stats?.totalRevenue, icon: <DollarSign size={20} className="text-green-500" />, color: 'text-green-600', suffix: 'đ' },
    { label: 'Tháng này', value: stats?.monthRevenue, icon: <DollarSign size={20} className="text-blue-500" />, color: 'text-blue-600', suffix: 'đ' },
    { label: 'Tổng hiển thị', value: stats?.totalImpressions, icon: <Eye size={20} className="text-purple-500" />, color: 'text-purple-600', suffix: '' },
    { label: 'Tổng lượt click', value: stats?.totalClicks, icon: <MousePointer size={20} className="text-orange-500" />, color: 'text-orange-600', suffix: '' },
    { label: 'CTR tổng', value: stats?.totalImpressions > 0 ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2) + '%' : '0%', icon: <BarChart2 size={20} className="text-teal-500" />, color: 'text-teal-600', isString: true },
    { label: 'Chi phí/click TB', value: stats?.avgCpc, icon: <DollarSign size={20} className="text-red-500" />, color: 'text-red-600', suffix: 'đ' },
  ];

  return isLoading ? (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  ) : (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {kpis.map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">{s.label}</p>
            {s.icon}
          </div>
          <p className={`text-2xl font-bold ${s.color}`}>
            {s.isString ? s.value : (s.value !== undefined ? `${Number(s.value).toLocaleString('vi-VN')}${s.suffix || ''}` : '—')}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function AdsManagementPage() {
  const [tab, setTab] = useState<TabType>('campaigns');

  const TABS = [
    { key: 'campaigns', label: 'Chiến dịch', icon: <BarChart2 size={14} /> },
    { key: 'keywords', label: 'Từ khóa', icon: <Search size={14} /> },
    { key: 'revenue', label: 'Doanh thu QC', icon: <DollarSign size={14} /> },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý quảng cáo</h1>
        <p className="text-gray-500 text-sm mt-1">Duyệt, quản lý và theo dõi hiệu quả quảng cáo của seller</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'campaigns' && <CampaignsTab />}
      {tab === 'keywords' && <KeywordsTab />}
      {tab === 'revenue' && <RevenueTab />}
    </div>
  );
}
