import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { DollarSign, Clock, TrendingUp, Download } from 'lucide-react';
import apiClient from '../api/client';

const TYPE_LABELS: Record<string, string> = {
  ORDER_SETTLED: 'Đơn hàng',
  WITHDRAWAL: 'Rút tiền',
  REFUND: 'Hoàn tiền',
  PLATFORM_FEE: 'Phí nền tảng',
  ADJUSTMENT: 'Điều chỉnh',
};

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'ORDER_SETTLED', label: 'Đơn hàng' },
  { value: 'WITHDRAWAL', label: 'Rút tiền' },
  { value: 'REFUND', label: 'Hoàn tiền' },
  { value: 'PLATFORM_FEE', label: 'Phí nền tảng' },
  { value: 'ADJUSTMENT', label: 'Điều chỉnh' },
];

export default function FinancePage() {
  const queryClient = useQueryClient();

  // Payout form state
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Ledger filter state
  const [filterType, setFilterType] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);

  // Finance summary
  const { data: summary } = useQuery({
    queryKey: ['seller-finance-summary'],
    queryFn: () => apiClient.get('/seller/finance/summary').then(r => r.data.data),
  });

  const wallet = summary?.wallet || {};

  // Ledger
  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ['seller-ledger', filterType, filterFrom, filterTo, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterFrom) params.set('from', filterFrom);
      if (filterTo) params.set('to', filterTo);
      params.set('page', String(page));
      return apiClient.get(`/seller/finance/ledger?${params.toString()}`).then(r => r.data.data);
    },
  });

  // Pending withdrawals
  const { data: pendingWithdrawals } = useQuery({
    queryKey: ['seller-withdrawals-pending'],
    queryFn: () => apiClient.get('/seller/withdrawals?status=PENDING').then(r => r.data.data),
  });

  // Quick stats (last 30 days)
  const { data: report30 } = useQuery({
    queryKey: ['seller-report-30'],
    queryFn: () => apiClient.get('/seller/finance/report?days=30').then(r => r.data.data),
  });

  // Withdrawal mutation
  const withdraw = useMutation({
    mutationFn: () =>
      apiClient.post('/seller/withdrawals', {
        amount: Number(amount),
        bankName,
        accountNumber,
        accountName,
      }),
    onSuccess: () => {
      toast.success('Yêu cầu rút tiền đã được gửi');
      setAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      queryClient.invalidateQueries({ queryKey: ['seller-finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['seller-withdrawals-pending'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi gửi yêu cầu'),
  });

  const canWithdraw =
    amount &&
    Number(amount) >= 100000 &&
    bankName.trim() &&
    accountNumber.trim() &&
    accountName.trim();

  const pagination = ledger?.pagination || {};
  const totalPages = pagination.totalPages || 1;

  const s30 = report30?.summary || {};

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tài chính</h1>

      {/* Balance overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Số dư khả dụng</p>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {Number(wallet.balance || 0).toLocaleString('vi-VN')}₫
          </p>
        </div>
        <div className="card p-5 border-l-4 border-yellow-400">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Đang xử lý</p>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-yellow-500">
            {Number(wallet.pendingBalance || 0).toLocaleString('vi-VN')}₫
          </p>
        </div>
        <div className="card p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Tổng đã nhận</p>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {Number(wallet.totalReceived || 0).toLocaleString('vi-VN')}₫
          </p>
        </div>
      </div>
      <div className="mb-6 px-1">
        <span className="text-sm text-gray-500">
          Tổng đã rút:{' '}
          <span className="font-semibold text-gray-700">
            {Number(wallet.totalWithdrawn || 0).toLocaleString('vi-VN')}₫
          </span>
        </span>
      </div>

      {/* Quick stats 30 days */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Doanh thu 30 ngày', value: `${Number(s30.revenue || 0).toLocaleString('vi-VN')}₫`, color: 'text-green-600' },
          { label: 'Số đơn 30 ngày', value: s30.ordersCount || 0, color: 'text-blue-600' },
          { label: 'Phí nền tảng', value: `${Number(s30.platformFee || 0).toLocaleString('vi-VN')}₫`, color: 'text-red-500' },
          { label: 'Thực nhận', value: `${Number(s30.netRevenue || 0).toLocaleString('vi-VN')}₫`, color: 'text-gray-800' },
        ].map(stat => (
          <div key={stat.label} className="card p-3">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Payout request form */}
      <div className="card p-5 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">Yêu cầu rút tiền</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Số tiền muốn rút <span className="text-gray-400 font-normal">(tối thiểu 100,000₫)</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="input max-w-xs"
              placeholder="Nhập số tiền"
              min="100000"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Tên ngân hàng</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="input"
                placeholder="VD: Vietcombank"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Số tài khoản</label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="input"
                placeholder="Số tài khoản"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Tên chủ tài khoản</label>
              <input
                type="text"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                className="input"
                placeholder="Tên chủ tài khoản"
              />
            </div>
          </div>
          <button
            onClick={() => withdraw.mutate()}
            disabled={!canWithdraw || withdraw.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {withdraw.isPending ? 'Đang xử lý...' : 'Yêu cầu rút tiền'}
          </button>
        </div>

        {/* Pending withdrawals */}
        {(pendingWithdrawals?.length ?? 0) > 0 && (
          <div className="mt-5 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Yêu cầu đang chờ xử lý ({pendingWithdrawals.length})
            </h3>
            <div className="space-y-2">
              {pendingWithdrawals.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between bg-yellow-50 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-600">
                    {w.bankName} – {w.accountNumber} ({w.accountName})
                  </span>
                  <span className="font-semibold text-yellow-700">
                    {Number(w.amount).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transaction filter */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Loại giao dịch</label>
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1); }}
              className="input text-sm"
            >
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Từ ngày</label>
            <input
              type="date"
              value={filterFrom}
              onChange={e => { setFilterFrom(e.target.value); setPage(1); }}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Đến ngày</label>
            <input
              type="date"
              value={filterTo}
              onChange={e => { setFilterTo(e.target.value); setPage(1); }}
              className="input text-sm"
            />
          </div>
          {(filterType || filterFrom || filterTo) && (
            <button
              onClick={() => { setFilterType(''); setFilterFrom(''); setFilterTo(''); setPage(1); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Transaction history table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Lịch sử giao dịch</h2>
          {ledger?.pagination?.total != null && (
            <span className="text-sm text-gray-400">{ledger.pagination.total} giao dịch</span>
          )}
        </div>
        {ledgerLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : (ledger?.data?.length ?? 0) > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Loại</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Ghi chú</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Số tiền</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Số dư sau</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {ledger.data.map((entry: any) => (
                  <tr key={entry.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          entry.amount > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {TYPE_LABELS[entry.type] || entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{entry.note || '—'}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        entry.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {entry.amount > 0 ? '+' : ''}
                      {Number(entry.amount).toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {Number(entry.balanceAfter).toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-sm text-gray-600 disabled:opacity-40 hover:text-gray-900"
                >
                  ← Trước
                </button>
                <span className="text-sm text-gray-500">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="text-sm text-gray-600 disabled:opacity-40 hover:text-gray-900"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-gray-400">Chưa có giao dịch nào</div>
        )}
      </div>
    </div>
  );
}
