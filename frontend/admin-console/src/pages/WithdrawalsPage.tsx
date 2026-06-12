import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function WithdrawalsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', activeTab],
    queryFn: () => apiClient.get(`/admin/withdrawals?status=${activeTab}`).then(r => r.data.data),
  });

  const process = useMutation({
    mutationFn: ({ id, action, transactionRef }: any) =>
      apiClient.patch(`/admin/withdrawals/${id}/process`, { action, transactionRef }),
    onSuccess: () => {
      toast.success('Đã xử lý yêu cầu');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      setProcessingId(null);
      setTransactionRef('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const tabs = [
    { key: 'PENDING', label: 'Chờ xử lý' },
    { key: 'APPROVED', label: 'Đã duyệt' },
    { key: 'REJECTED', label: 'Đã từ chối' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Yêu cầu rút tiền</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm ${activeTab === tab.key ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center text-gray-500">Không có yêu cầu nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Shop</th>
                <th className="text-right px-4 py-3 text-gray-500">Số tiền</th>
                <th className="text-left px-4 py-3 text-gray-500">Tài khoản NH</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày yêu cầu</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((req: any) => (
                <tr key={req.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{req.wallet?.seller?.shop?.name || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">{Number(req.amount).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {req.bankAccount ? `${req.bankAccount.bankName} - ${req.bankAccount.accountNumber}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    {req.status === 'PENDING' && (
                      processingId === req.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            value={transactionRef}
                            onChange={e => setTransactionRef(e.target.value)}
                            className="input text-xs w-32"
                            placeholder="Mã GD"
                          />
                          <button onClick={() => process.mutate({ id: req.id, action: 'APPROVE', transactionRef })} className="text-green-600 text-xs hover:underline">✓ Duyệt</button>
                          <button onClick={() => process.mutate({ id: req.id, action: 'REJECT', transactionRef: '' })} className="text-red-500 text-xs hover:underline">✗ Từ chối</button>
                          <button onClick={() => setProcessingId(null)} className="text-gray-400 text-xs">Hủy</button>
                        </div>
                      ) : (
                        <button onClick={() => setProcessingId(req.id)} className="text-blue-600 text-xs hover:underline">
                          Xử lý
                        </button>
                      )
                    )}
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
