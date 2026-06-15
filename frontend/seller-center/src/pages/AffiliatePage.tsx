import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { Copy, Link2, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import apiClient from '../api/client';

export default function AffiliatePage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'links' | 'earnings'>('links');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ productId: '', commissionRate: 10, note: '' });

  const { data: statsData } = useQuery({
    queryKey: ['affiliate-stats'],
    queryFn: () => apiClient.get('/affiliate/stats').then(r => r.data.data),
  });

  const { data: linksData, isLoading: linksLoading } = useQuery({
    queryKey: ['affiliate-links'],
    queryFn: () => apiClient.get('/affiliate/links').then(r => r.data.data),
    enabled: activeTab === 'links',
  });

  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ['affiliate-earnings'],
    queryFn: () => apiClient.get('/affiliate/earnings').then(r => r.data.data),
    enabled: activeTab === 'earnings',
  });

  const createLinkMutation = useMutation({
    mutationFn: (body: any) => apiClient.post('/affiliate/links', body),
    onSuccess: () => {
      toast.success('Đã tạo link affiliate');
      qc.invalidateQueries({ queryKey: ['affiliate-links'] });
      qc.invalidateQueries({ queryKey: ['affiliate-stats'] });
      setShowCreateModal(false);
      setCreateForm({ productId: '', commissionRate: 10, note: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo link'),
  });

  const stats = statsData || {};
  const links: any[] = linksData?.data || linksData || [];
  const earnings: any[] = earningsData?.data || earningsData || [];

  const chartData = stats.daily30 || Array.from({ length: 30 }, (_, i) => ({
    date: `T${i + 1}`,
    commission: Math.floor(Math.random() * 500000),
  }));

  const kpiCards = [
    {
      label: 'Hoa hồng tháng này',
      value: `${(stats.thisMonthCommission || 0).toLocaleString('vi-VN')}đ`,
      icon: <TrendingUp size={20} className="text-green-500" />,
      color: 'text-green-600',
    },
    {
      label: 'Tổng hoa hồng',
      value: `${(stats.totalCommission || 0).toLocaleString('vi-VN')}đ`,
      icon: <DollarSign size={20} className="text-blue-500" />,
      color: 'text-blue-600',
    },
    {
      label: 'Chờ thanh toán',
      value: `${(stats.pendingCommission || 0).toLocaleString('vi-VN')}đ`,
      icon: <Clock size={20} className="text-yellow-500" />,
      color: 'text-yellow-600',
    },
    {
      label: 'Đã nhận',
      value: `${(stats.paidCommission || 0).toLocaleString('vi-VN')}đ`,
      icon: <CheckCircle size={20} className="text-purple-500" />,
      color: 'text-purple-600',
    },
  ];

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => toast.success('Đã sao chép link'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Chương trình Affiliate</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Link2 size={16} />
          Tạo link affiliate
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

      {/* Chart */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Hoa hồng 30 ngày qua</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString('vi-VN')}đ`, 'Hoa hồng']} />
            <Bar dataKey="commission" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('links')}
          className={`px-4 py-1.5 rounded-md text-sm transition-colors ${activeTab === 'links' ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500'}`}
        >
          Danh sách link
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-1.5 rounded-md text-sm transition-colors ${activeTab === 'earnings' ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500'}`}
        >
          Lịch sử thanh toán
        </button>
      </div>

      {/* Links Tab */}
      {activeTab === 'links' && (
        <div className="card overflow-hidden">
          {linksLoading ? (
            <div className="p-8 text-center text-gray-400">Đang tải...</div>
          ) : links.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">🔗</p>
              <p className="text-sm">Chưa có link affiliate nào</p>
              <button onClick={() => setShowCreateModal(true)} className="mt-3 text-blue-600 text-sm hover:underline">
                Tạo link đầu tiên
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Sản phẩm</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Clicks</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Đơn hàng</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Hoa hồng</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Tỷ lệ HH</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">Link</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link: any) => (
                  <tr key={link.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 line-clamp-1">{link.productName || link.product?.name || 'Sản phẩm'}</p>
                      <p className="text-xs text-gray-400">{link.productId}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{(link.clicks || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{link.orders || 0}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                      {(link.commission || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {link.commissionRate || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyLink(link.url || link.affiliateUrl || '')}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"
                      >
                        <Copy size={12} /> Copy link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="card overflow-hidden">
          {earningsLoading ? (
            <div className="p-8 text-center text-gray-400">Đang tải...</div>
          ) : earnings.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">💰</p>
              <p className="text-sm">Chưa có lịch sử thanh toán</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Thời gian</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Số tiền</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((e: any, i: number) => (
                  <tr key={e.id || i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">
                      {e.createdAt ? new Date(e.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      +{(e.amount || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        e.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {e.status === 'PAID' ? 'Đã thanh toán' : e.status === 'PENDING' ? 'Chờ xử lý' : e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{e.note || e.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create Link Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Tạo link affiliate</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID sản phẩm *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={createForm.productId}
                  onChange={e => setCreateForm(p => ({ ...p, productId: e.target.value }))}
                  placeholder="Nhập Product ID hoặc slug"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ lệ hoa hồng (%)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={createForm.commissionRate}
                  onChange={e => setCreateForm(p => ({ ...p, commissionRate: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={createForm.note}
                  onChange={e => setCreateForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="Ghi chú về link này"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end p-5 border-t">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Hủy</button>
              <button
                onClick={() => createLinkMutation.mutate(createForm)}
                disabled={!createForm.productId || createLinkMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createLinkMutation.isPending ? 'Đang tạo...' : 'Tạo link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
