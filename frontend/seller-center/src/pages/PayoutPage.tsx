import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle, Download, Plus, Trash2, Star, X, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Chờ xử lý',   color: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: 'Đang xử lý',  color: 'bg-blue-100 text-blue-700' },
  COMPLETED:  { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700' },
  FAILED:     { label: 'Thất bại',    color: 'bg-red-100 text-red-700' },
};

const BANK_LIST = [
  'Vietcombank', 'BIDV', 'Vietinbank', 'Agribank', 'Techcombank',
  'MB Bank', 'ACB', 'VPBank', 'TPBank', 'Sacombank',
];

function RequestPayoutModal({
  wallet,
  onClose,
}: {
  wallet: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [note, setNote] = useState('');

  const bankAccounts: any[] = wallet?.bankAccounts || [];
  const available = Number(wallet?.availableBalance || 0);

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/seller/payouts', data),
    onSuccess: () => {
      toast.success('Yêu cầu rút tiền đã được gửi');
      qc.invalidateQueries({ queryKey: ['seller-payouts', 'seller-wallet'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi gửi yêu cầu'),
  });

  const handleSubmit = () => {
    const amt = Number(amount);
    if (amt < 100000) { toast.error('Số tiền tối thiểu 100,000đ'); return; }
    if (amt > available) { toast.error('Số tiền vượt quá số dư khả dụng'); return; }
    if (!bankAccountId) { toast.error('Chọn tài khoản ngân hàng nhận tiền'); return; }
    mutation.mutate({ amount: amt, bankAccountId, note });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg">Yêu cầu rút tiền</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-green-50 rounded-xl p-3 border border-green-200">
            <p className="text-xs text-green-700">Số dư khả dụng</p>
            <p className="text-2xl font-bold text-green-600">{available.toLocaleString('vi-VN')}đ</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Số tiền muốn rút (tối thiểu 100,000đ) *</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500000"
                min="100000"
                max={available}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">đ</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[500000, 1000000, 2000000, 5000000].filter((v) => v <= available).map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  {(v / 1000).toFixed(0)}K
                </button>
              ))}
              <button
                onClick={() => setAmount(String(available))}
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                Tất cả
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tài khoản nhận tiền *</label>
            {bankAccounts.length === 0 ? (
              <p className="text-sm text-red-500">Chưa có tài khoản ngân hàng. Vui lòng thêm trước khi rút tiền.</p>
            ) : (
              <div className="space-y-2">
                {bankAccounts.map((acc: any) => (
                  <label
                    key={acc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      bankAccountId === acc.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={bankAccountId === acc.id}
                      onChange={() => setBankAccountId(acc.id)}
                      className="accent-primary-500"
                    />
                    <div>
                      <p className="text-sm font-medium">{acc.bankName}</p>
                      <p className="text-xs text-gray-500">{acc.accountNumber} — {acc.accountName}</p>
                    </div>
                    {acc.isDefault && (
                      <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Mặc định</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú (tùy chọn)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho yêu cầu rút tiền"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="bg-yellow-50 rounded-lg p-3 text-xs text-yellow-700">
            ⏱ Thời gian xử lý: 1-3 ngày làm việc. Tiền sẽ được chuyển vào tài khoản ngân hàng bạn đã chọn.
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Hủy</button>
          <button
            onClick={handleSubmit}
            disabled={!amount || !bankAccountId || mutation.isPending}
            className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddBankModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ bankName: BANK_LIST[0], accountNumber: '', accountName: '', isDefault: false });

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/seller/bank-accounts', data),
    onSuccess: () => {
      toast.success('Đã thêm tài khoản ngân hàng');
      qc.invalidateQueries({ queryKey: ['seller-wallet'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi thêm tài khoản'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg">Thêm tài khoản ngân hàng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ngân hàng *</label>
            <select
              value={form.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {BANK_LIST.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Số tài khoản *</label>
            <input
              type="text"
              value={form.accountNumber}
              onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tên chủ tài khoản *</label>
            <input
              type="text"
              value={form.accountName}
              onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value.toUpperCase() }))}
              placeholder="NGUYEN VAN A"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="accent-primary-500"
            />
            <span className="text-sm">Đặt làm mặc định</span>
          </label>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Hủy</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!form.accountNumber || !form.accountName || mutation.isPending}
            className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang thêm...' : 'Thêm tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayoutPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'summary' | 'history' | 'banks'>('summary');
  const [showRequest, setShowRequest] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ['seller-wallet'],
    queryFn: () => apiClient.get('/seller/wallet').then((r) => r.data.data),
  });

  const { data: payouts } = useQuery({
    queryKey: ['seller-payouts'],
    queryFn: () => apiClient.get('/seller/payouts', { params: { limit: 50 } }).then((r) => r.data.data),
  });

  const setDefaultBankMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/seller/bank-accounts/${id}/default`),
    onSuccess: () => {
      toast.success('Đã đặt tài khoản mặc định');
      qc.invalidateQueries({ queryKey: ['seller-wallet'] });
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/seller/bank-accounts/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa tài khoản');
      qc.invalidateQueries({ queryKey: ['seller-wallet'] });
    },
  });

  const bankAccounts: any[] = wallet?.bankAccounts || [];
  const payoutItems: any[] = payouts?.items || [];

  const KPI_CARDS = [
    { label: 'Số dư khả dụng', value: wallet?.availableBalance || 0, icon: <DollarSign size={20} className="text-green-500" />, color: 'text-green-600', suffix: 'đ' },
    { label: 'Đang chờ giải ngân', value: wallet?.pendingBalance || 0, icon: <Clock size={20} className="text-yellow-500" />, color: 'text-yellow-600', suffix: 'đ' },
    { label: 'Tổng đã rút', value: wallet?.totalWithdrawn || 0, icon: <TrendingUp size={20} className="text-blue-500" />, color: 'text-blue-600', suffix: 'đ' },
    { label: 'Doanh thu tháng này', value: wallet?.monthRevenue || 0, icon: <CheckCircle size={20} className="text-purple-500" />, color: 'text-purple-600', suffix: 'đ' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thanh toán & Rút tiền</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý số dư và yêu cầu thanh toán</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open('/api/v1/seller/export/finance', '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download size={15} /> Xuất báo cáo
          </button>
          <button
            onClick={() => setShowRequest(true)}
            disabled={!wallet?.availableBalance || wallet.availableBalance < 100000}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            <DollarSign size={15} /> Rút tiền
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{s.label}</span>
              {s.icon}
            </div>
            <p className={`text-xl font-bold ${s.color}`}>
              {Number(s.value).toLocaleString('vi-VN')}{s.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          {([
            { key: 'summary', label: 'Đơn đã hoàn thành' },
            { key: 'history', label: 'Lịch sử rút tiền' },
            { key: 'banks', label: 'Tài khoản ngân hàng' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t.key ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'summary' && (
            <div>
              <h3 className="font-medium mb-3 text-gray-700">Đơn hàng hoàn thành gần đây</h3>
              {!wallet?.recentOrders?.length ? (
                <p className="text-sm text-gray-400 text-center py-8">Chưa có đơn hàng hoàn thành nào</p>
              ) : (
                <div className="space-y-2">
                  {wallet.recentOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">#{o.code}</p>
                        <p className="text-xs text-gray-400">{new Date(o.completedAt || o.updatedAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">+{Number(o.sellerAmount || o.totalAmount).toLocaleString('vi-VN')}đ</p>
                        <p className="text-xs text-gray-400">Sau phí {o.commission || '10'}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div>
              {payoutItems.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">Chưa có lịch sử rút tiền</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payoutItems.map((p: any) => {
                    const si = STATUS_META[p.status] || STATUS_META.PENDING;
                    return (
                      <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{Number(p.amount).toLocaleString('vi-VN')}đ</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(p.createdAt).toLocaleDateString('vi-VN')} — {p.bankName} ****{(p.accountNumber || '').slice(-4)}
                          </p>
                          {p.note && <p className="text-xs text-gray-400">{p.note}</p>}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${si.color}`}>{si.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'banks' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium text-gray-700">Tài khoản ngân hàng đã lưu</p>
                <button
                  onClick={() => setShowAddBank(true)}
                  className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700"
                >
                  <Plus size={14} /> Thêm tài khoản
                </button>
              </div>

              {bankAccounts.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400 mb-3">Chưa có tài khoản ngân hàng</p>
                  <button onClick={() => setShowAddBank(true)} className="text-sm text-primary-500 hover:underline">
                    + Thêm tài khoản
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bankAccounts.map((acc: any) => (
                    <div key={acc.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Building2 size={18} className="text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{acc.bankName}</p>
                          {acc.isDefault && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Mặc định</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{acc.accountNumber} — {acc.accountName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!acc.isDefault && (
                          <button
                            onClick={() => setDefaultBankMutation.mutate(acc.id)}
                            className="p-1.5 text-gray-400 hover:text-yellow-500 rounded-lg"
                            title="Đặt làm mặc định"
                          >
                            <Star size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => window.confirm('Xóa tài khoản này?') && deleteBankMutation.mutate(acc.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showRequest && <RequestPayoutModal wallet={wallet} onClose={() => setShowRequest(false)} />}
      {showAddBank && <AddBankModal onClose={() => setShowAddBank(false)} />}
    </div>
  );
}
