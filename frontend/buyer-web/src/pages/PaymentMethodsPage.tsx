import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Smartphone, Banknote, Plus, CheckCircle, Star, Trash2, Link2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const WALLET_PROVIDERS = [
  { id: 'momo', name: 'Ví MoMo', icon: '📱', color: 'bg-pink-500', desc: 'Thanh toán qua MoMo' },
  { id: 'zalopay', name: 'ZaloPay', icon: '💰', color: 'bg-blue-500', desc: 'Thanh toán qua ZaloPay' },
  { id: 'vnpay', name: 'VNPay QR', icon: '💳', color: 'bg-blue-700', desc: 'Quét mã QR VNPay' },
];

const BANK_LIST = [
  'Vietcombank', 'BIDV', 'Vietinbank', 'Agribank', 'Techcombank',
  'MB Bank', 'ACB', 'VPBank', 'TPBank', 'Sacombank', 'HDBank', 'OCB',
];

function AddCardModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ bankName: BANK_LIST[0], accountNumber: '', accountName: '', isDefault: false });
  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/account/bank-accounts', data),
    onSuccess: () => { toast.success('Đã thêm tài khoản ngân hàng'); onAdded(); onClose(); },
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
            <label className="block text-sm font-medium mb-1">Ngân hàng</label>
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
              placeholder="VD: 1234567890"
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
              className="text-red-500"
            />
            <span className="text-sm">Đặt làm tài khoản mặc định</span>
          </label>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Hủy</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!form.accountNumber || !form.accountName || mutation.isPending}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang lưu...' : 'Thêm tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentMethodsPage() {
  const qc = useQueryClient();
  const [showAddCard, setShowAddCard] = useState(false);
  const [defaultMethod, setDefaultMethod] = useState<string>('cod');

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => apiClient.get('/account/bank-accounts').then((r) => r.data.data),
  });

  const { data: linkedWallets } = useQuery({
    queryKey: ['linked-wallets'],
    queryFn: () => apiClient.get('/account/linked-wallets').then((r) => r.data.data),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/account/bank-accounts/${id}/default`),
    onSuccess: () => {
      toast.success('Đã đặt tài khoản mặc định');
      qc.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/account/bank-accounts/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa tài khoản');
      qc.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  const linkWalletMutation = useMutation({
    mutationFn: (provider: string) => apiClient.post('/account/linked-wallets', { provider }),
    onSuccess: () => {
      toast.success('Đã liên kết ví điện tử');
      qc.invalidateQueries({ queryKey: ['linked-wallets'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể liên kết ví'),
  });

  const unlinkWalletMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/account/linked-wallets/${id}`),
    onSuccess: () => {
      toast.success('Đã hủy liên kết');
      qc.invalidateQueries({ queryKey: ['linked-wallets'] });
    },
  });

  const accounts: any[] = bankAccounts?.items || bankAccounts || [];
  const wallets: any[] = linkedWallets?.items || linkedWallets || [];

  const STATIC_METHODS = [
    { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt khi nhận hàng', icon: <Banknote size={22} className="text-green-600" /> },
    { id: 'vnpay', name: 'VNPay', desc: 'Thẻ ATM, Visa, MasterCard qua cổng VNPay', icon: <CreditCard size={22} className="text-blue-600" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="text-red-500" size={24} />
        <h1 className="text-xl font-bold">Phương thức thanh toán</h1>
      </div>

      {/* Default methods */}
      <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-700">Phương thức cơ bản</p>
        </div>
        <div className="divide-y divide-gray-100">
          {STATIC_METHODS.map((method) => (
            <div
              key={method.id}
              onClick={() => setDefaultMethod(method.id)}
              className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                defaultMethod === method.id ? 'bg-red-50' : ''
              }`}
            >
              <div className="flex-shrink-0">{method.icon}</div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{method.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
              </div>
              {defaultMethod === method.id && <CheckCircle size={18} className="text-red-500 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Linked wallets */}
      <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-700">Ví điện tử đã liên kết</p>
        </div>
        <div className="divide-y divide-gray-100">
          {WALLET_PROVIDERS.map((provider) => {
            const linked = wallets.find((w) => w.provider === provider.id);
            return (
              <div key={provider.id} className="flex items-center gap-4 px-5 py-4">
                <div className={`w-10 h-10 rounded-xl ${provider.color} flex items-center justify-center text-xl flex-shrink-0`}>
                  {provider.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{provider.name}</p>
                  {linked ? (
                    <p className="text-xs text-green-600 mt-0.5">✓ Đã liên kết — {linked.phone || linked.identifier}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-0.5">{provider.desc}</p>
                  )}
                </div>
                {linked ? (
                  <button
                    onClick={() => unlinkWalletMutation.mutate(linked.id)}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1"
                  >
                    <X size={12} /> Hủy liên kết
                  </button>
                ) : (
                  <button
                    onClick={() => linkWalletMutation.mutate(provider.id)}
                    disabled={linkWalletMutation.isPending}
                    className="flex items-center gap-1.5 text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    <Link2 size={12} /> Liên kết
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bank accounts */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-700">Tài khoản ngân hàng</p>
          <button
            onClick={() => setShowAddCard(true)}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
          >
            <Plus size={14} /> Thêm
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CreditCard size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Chưa có tài khoản ngân hàng nào</p>
            <button
              onClick={() => setShowAddCard(true)}
              className="mt-3 text-sm text-red-500 hover:underline"
            >
              + Thêm tài khoản
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {accounts.map((acc: any) => (
              <div key={acc.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{acc.bankName}</p>
                    {acc.isDefault && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Mặc định</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {acc.accountNumber} — {acc.accountName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!acc.isDefault && (
                    <button
                      onClick={() => setDefaultMutation.mutate(acc.id)}
                      className="p-1.5 text-gray-400 hover:text-yellow-500 rounded-lg"
                      title="Đặt làm mặc định"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => window.confirm('Xóa tài khoản này?') && deleteAccountMutation.mutate(acc.id)}
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

      <div className="mt-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs text-blue-700">
          🔒 Thông tin thanh toán được bảo mật theo tiêu chuẩn PCI DSS. Chúng tôi không lưu trữ thông tin thẻ đầy đủ.
        </p>
      </div>

      {showAddCard && (
        <AddCardModal
          onClose={() => setShowAddCard(false)}
          onAdded={() => qc.invalidateQueries({ queryKey: ['bank-accounts'] })}
        />
      )}
    </div>
  );
}
