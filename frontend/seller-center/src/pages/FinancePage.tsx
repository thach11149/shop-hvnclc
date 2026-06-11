import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function FinancePage() {
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['seller-finance'],
    queryFn: () => apiClient.get('/seller/finance/summary').then(r => r.data.data),
  });

  const { data: ledger } = useQuery({
    queryKey: ['seller-ledger'],
    queryFn: () => apiClient.get('/seller/finance/ledger').then(r => r.data.data),
  });

  const withdraw = useMutation({
    mutationFn: () => apiClient.post('/seller/withdrawals', { amount: Number(withdrawAmount) }),
    onSuccess: () => { toast.success('Yêu cầu rút tiền đã được gửi'); setWithdrawAmount(''); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tài chính</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Số dư ví</p>
          <p className="text-2xl font-bold text-green-600">{Number(summary?.wallet?.balance || 0).toLocaleString('vi-VN')}₫</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Đang chờ</p>
          <p className="text-2xl font-bold text-yellow-600">{Number(summary?.wallet?.pendingBalance || 0).toLocaleString('vi-VN')}₫</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Tổng đã nhận</p>
          <p className="text-2xl font-bold text-blue-600">{Number(summary?.wallet?.totalReceived || 0).toLocaleString('vi-VN')}₫</p>
        </div>
      </div>

      {/* Withdraw */}
      <div className="card p-4 mb-6">
        <h2 className="font-bold mb-3">Rút tiền</h2>
        <div className="flex gap-3">
          <input
            type="number"
            value={withdrawAmount}
            onChange={e => setWithdrawAmount(e.target.value)}
            className="input max-w-xs"
            placeholder="Số tiền cần rút"
            min="10000"
          />
          <button
            onClick={() => withdraw.mutate()}
            disabled={!withdrawAmount || withdraw.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {withdraw.isPending ? 'Đang xử lý...' : 'Yêu cầu rút'}
          </button>
        </div>
      </div>

      {/* Ledger */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold">Lịch sử giao dịch</h2>
        </div>
        {ledger?.data?.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Loại</th>
                <th className="text-left px-4 py-3 text-gray-500">Ghi chú</th>
                <th className="text-right px-4 py-3 text-gray-500">Số tiền</th>
                <th className="text-right px-4 py-3 text-gray-500">Số dư sau</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {ledger.data.map((entry: any) => (
                <tr key={entry.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${entry.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{entry.note}</td>
                  <td className={`px-4 py-3 text-right font-medium ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.amount > 0 ? '+' : ''}{Number(entry.amount).toLocaleString('vi-VN')}₫
                  </td>
                  <td className="px-4 py-3 text-right">{Number(entry.balanceAfter).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(entry.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">Chưa có giao dịch nào</div>
        )}
      </div>
    </div>
  );
}
