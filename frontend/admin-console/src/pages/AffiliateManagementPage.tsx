import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, TrendingUp, DollarSign, Users, Search, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

type TabType = 'overview' | 'publishers' | 'commissions' | 'payouts';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

export default function AffiliateManagementPage() {
  const [tab, setTab] = useState<TabType>('overview');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Link2 size={22} className="text-primary-600" /> Quản lý Affiliate
      </h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {([
          { key: 'overview', label: 'Tổng quan' },
          { key: 'publishers', label: 'Publishers' },
          { key: 'commissions', label: 'Hoa hồng' },
          { key: 'payouts', label: 'Thanh toán' },
        ] as { key: TabType; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              tab === t.key ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'publishers' && <PublishersTab />}
      {tab === 'commissions' && <CommissionsTab />}
      {tab === 'payouts' && <PayoutsTab />}
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-affiliate-overview'],
    queryFn: () => apiClient.get('/admin/affiliate/overview').then(r => r.data.data || r.data),
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  const stats = data || {};

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng Publishers', value: stats.totalPublishers || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Tổng clicks', value: stats.totalClicks || 0, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'Tổng hoa hồng', value: `${Number(stats.totalCommission || 0).toLocaleString('vi-VN')}₫`, icon: DollarSign, color: 'text-primary-600 bg-primary-50', isText: true },
          { label: 'Chờ thanh toán', value: `${Number(stats.pendingPayout || 0).toLocaleString('vi-VN')}₫`, icon: DollarSign, color: 'text-orange-600 bg-orange-50', isText: true },
        ].map(({ label, value, icon: Icon, color, isText }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-800">{isText ? value : Number(value).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Hiệu suất chuyển đổi</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Tỷ lệ click → đơn hàng', value: `${(stats.clickToOrderRate || 0).toFixed(2)}%` },
              { label: 'Đơn hàng từ affiliate', value: (stats.affiliateOrders || 0).toLocaleString() },
              { label: 'GMV từ affiliate', value: `${Number(stats.affiliateGmv || 0).toLocaleString('vi-VN')}₫` },
              { label: 'Tỷ lệ affiliate / tổng GMV', value: `${(stats.affiliateGmvShare || 0).toFixed(1)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1.5 border-b last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Top Publishers</h3>
          {!stats.topPublishers?.length ? (
            <p className="text-gray-400 text-center py-6 text-sm">Không có dữ liệu</p>
          ) : (
            <div className="space-y-2">
              {stats.topPublishers.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.totalClicks?.toLocaleString()} clicks</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    {Number(p.totalEarned).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PublishersTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-affiliate-publishers', search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      return apiClient.get(`/admin/affiliate/publishers?${params}`).then(r => r.data.data || r.data);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/affiliate/publishers/${id}/approve`),
    onSuccess: () => { toast.success('Đã duyệt publisher'); qc.invalidateQueries({ queryKey: ['admin-affiliate-publishers'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/affiliate/publishers/${id}/suspend`),
    onSuccess: () => { toast.success('Đã tạm dừng'); qc.invalidateQueries({ queryKey: ['admin-affiliate-publishers'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const publishers: any[] = Array.isArray(data) ? data : (data?.data || []);

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm publisher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['all', 'ACTIVE', 'PENDING', 'SUSPENDED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${statusFilter === s ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}>
              {s === 'all' ? 'Tất cả' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !publishers.length ? (
          <div className="p-8 text-center text-gray-400">Không có publisher</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Publisher', 'Email', 'Clicks', 'Đơn hàng', 'Đã kiếm', 'Chờ TT', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {publishers.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.email}</td>
                  <td className="px-4 py-3">{p.totalClicks?.toLocaleString()}</td>
                  <td className="px-4 py-3">{p.totalOrders}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{Number(p.totalEarned || 0).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3 text-orange-600">{Number(p.pendingPayout || 0).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {p.status === 'PENDING' && (
                        <button onClick={() => approveMutation.mutate(p.id)}
                          className="text-xs text-green-600 hover:underline">Duyệt</button>
                      )}
                      {p.status === 'ACTIVE' && (
                        <button onClick={() => suspendMutation.mutate(p.id)}
                          className="text-xs text-orange-500 hover:underline">Tạm dừng</button>
                      )}
                    </div>
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

function CommissionsTab() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-affiliate-commissions', statusFilter],
    queryFn: () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      return apiClient.get(`/admin/affiliate/commissions${params}`).then(r => r.data.data || r.data);
    },
  });

  const items: any[] = Array.isArray(data) ? data : (data?.data || []);
  const totalCommission = items.reduce((s, c) => s + Number(c.commission || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['all', 'PENDING', 'CONFIRMED', 'PAID'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${statusFilter === s ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}>
              {s === 'all' ? 'Tất cả' : s}
            </button>
          ))}
        </div>
        {items.length > 0 && (
          <p className="text-sm text-gray-500">
            Tổng: <span className="font-bold text-green-600">{totalCommission.toLocaleString('vi-VN')}₫</span>
          </p>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !items.length ? (
          <div className="p-8 text-center text-gray-400">Không có giao dịch hoa hồng</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Publisher', 'Đơn hàng', 'Giá trị đơn', 'Tỉ lệ', 'Hoa hồng', 'Trạng thái', 'Ngày'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((c: any, i: number) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.publisherName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.orderId?.slice(0, 8)}</td>
                  <td className="px-4 py-3">{Number(c.orderValue || 0).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3">{c.rate}%</td>
                  <td className="px-4 py-3 text-green-600 font-bold">{Number(c.commission || 0).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      c.status === 'PAID' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PayoutsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [processModal, setProcessModal] = useState<any>(null);
  const [txId, setTxId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-affiliate-payouts', statusFilter],
    queryFn: () => apiClient.get(`/admin/affiliate/payouts?status=${statusFilter}`).then(r => r.data.data || r.data),
  });

  const processMutation = useMutation({
    mutationFn: ({ id, transactionId }: { id: string; transactionId: string }) =>
      apiClient.post(`/admin/affiliate/payouts/${id}/process`, { transactionId }),
    onSuccess: () => {
      toast.success('Đã xử lý thanh toán');
      qc.invalidateQueries({ queryKey: ['admin-affiliate-payouts'] });
      setProcessModal(null);
      setTxId('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi xử lý'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/affiliate/payouts/${id}/reject`),
    onSuccess: () => { toast.success('Đã từ chối'); qc.invalidateQueries({ queryKey: ['admin-affiliate-payouts'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const payouts: any[] = Array.isArray(data) ? data : (data?.data || []);
  const totalPending = payouts.reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['PENDING', 'PROCESSED', 'REJECTED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${statusFilter === s ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}>
              {s === 'PENDING' ? 'Chờ xử lý' : s === 'PROCESSED' ? 'Đã xử lý' : 'Từ chối'}
            </button>
          ))}
        </div>
        {statusFilter === 'PENDING' && payouts.length > 0 && (
          <div className="text-sm text-gray-500">
            Tổng chờ: <span className="font-bold text-orange-600">{totalPending.toLocaleString('vi-VN')}₫</span>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !payouts.length ? (
          <div className="p-8 text-center text-gray-400">Không có yêu cầu thanh toán</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Publisher', 'Số tiền', 'Phương thức', 'Thông tin TK', 'Ngày YC', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.publisherName}</td>
                  <td className="px-4 py-3 text-green-600 font-bold">{Number(p.amount || 0).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3">{p.method || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.accountInfo || '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    {statusFilter === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setProcessModal(p); setTxId(''); }}
                          className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          <CheckCircle size={11} /> Xử lý
                        </button>
                        <button
                          onClick={() => { if (window.confirm('Từ chối thanh toán?')) rejectMutation.mutate(p.id); }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                    {p.transactionId && (
                      <span className="text-xs font-mono text-gray-500">{p.transactionId}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Process Modal */}
      {processModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-lg mb-2">Xác nhận thanh toán</h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <p><span className="text-gray-500">Publisher:</span> <strong>{processModal.publisherName}</strong></p>
              <p><span className="text-gray-500">Số tiền:</span> <strong className="text-green-600">{Number(processModal.amount).toLocaleString('vi-VN')}₫</strong></p>
              <p><span className="text-gray-500">TK nhận:</span> {processModal.accountInfo}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã giao dịch *</label>
              <input
                type="text"
                value={txId}
                onChange={e => setTxId(e.target.value)}
                placeholder="TX-123456..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setProcessModal(null)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => processMutation.mutate({ id: processModal.id, transactionId: txId })}
                disabled={!txId.trim() || processMutation.isPending}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {processMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đã TT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
