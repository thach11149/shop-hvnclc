import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý', PROCESSING: 'Đang xử lý', COMPLETED: 'Đã duyệt', REJECTED: 'Đã từ chối',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function WithdrawalsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [approveModal, setApproveModal] = useState<any | null>(null);
  const [txId, setTxId] = useState('');
  const [rejectModal, setRejectModal] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: allData } = useQuery({
    queryKey: ['admin-withdrawals-pending'],
    queryFn: () => apiClient.get('/admin/withdrawals?status=PENDING').then(r => r.data),
  });

  const pendingTotal = (allData?.data?.data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
  const pendingCount = allData?.data?.data?.length || 0;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', statusFilter, dateFrom, dateTo, minAmount, maxAmount],
    queryFn: async () => {
      const params = new URLSearchParams({ status: statusFilter });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);
      return apiClient.get(`/admin/withdrawals?${params}`).then(r => r.data);
    },
  });

  const rows: any[] = data?.data?.data || [];

  const processOne = useMutation({
    mutationFn: ({ id, action, transactionRef }: any) =>
      apiClient.patch(`/admin/withdrawals/${id}/process`, { action, transactionRef }),
    onSuccess: () => {
      toast.success('Đã xử lý yêu cầu');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals-pending'] });
      setApproveModal(null);
      setRejectModal(null);
      setTxId('');
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const bulkApprove = useMutation({
    mutationFn: () => apiClient.patch('/admin/withdrawals/bulk-approve', { ids: selected }),
    onSuccess: () => {
      toast.success(`Đã duyệt ${selected.length} yêu cầu`);
      setSelected([]);
      setBulkConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals-pending'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () =>
    setSelected(selected.length === rows.length ? [] : rows.map((r: any) => r.id));

  const tabs = [
    { key: 'PENDING', label: 'Chờ xử lý' },
    { key: 'COMPLETED', label: 'Đã duyệt' },
    { key: 'REJECTED', label: 'Đã từ chối' },
  ];

  return (
    <div>
      {/* Approve modal */}
      {approveModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold mb-1">Xác nhận duyệt rút tiền</h3>
            <p className="text-sm text-gray-500 mb-4">
              Shop: <strong>{approveModal.wallet?.shop?.name || '-'}</strong> | Số tiền: <strong className="text-green-600">{Number(approveModal.amount).toLocaleString('vi-VN')}₫</strong>
            </p>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Mã giao dịch *</label>
              <input
                value={txId}
                onChange={e => setTxId(e.target.value)}
                className="input w-full"
                placeholder="Nhập transaction ID..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => processOne.mutate({ id: approveModal.id, action: 'APPROVE', transactionRef: txId })}
                disabled={!txId.trim() || processOne.isPending}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Xác nhận duyệt
              </button>
              <button onClick={() => { setApproveModal(null); setTxId(''); }} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold mb-3">Từ chối yêu cầu rút tiền</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="input w-full h-24 resize-none"
              placeholder="Nhập lý do từ chối..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => processOne.mutate({ id: rejectModal.id, action: 'REJECT', transactionRef: '' })}
                disabled={processOne.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-lg flex-1 disabled:opacity-50 hover:bg-red-700"
              >
                Từ chối
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk confirm */}
      {bulkConfirm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="text-yellow-500" size={24} />
              <h3 className="font-semibold">Duyệt hàng loạt</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Bạn sẽ duyệt <strong>{selected.length}</strong> yêu cầu rút tiền. Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => bulkApprove.mutate()}
                disabled={bulkApprove.isPending}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {bulkApprove.isPending ? 'Đang xử lý...' : 'Xác nhận duyệt'}
              </button>
              <button onClick={() => setBulkConfirm(false)} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Yêu cầu rút tiền</h1>

      {/* KPI Card */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5 border-l-4 border-yellow-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Đang chờ duyệt</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{pendingCount} yêu cầu</p>
          <p className="text-sm text-yellow-600 mt-0.5">{pendingTotal.toLocaleString('vi-VN')}₫</p>
        </div>
        <div className="card p-5 border-l-4 border-blue-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Kết quả lọc hiện tại</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{rows.length} yêu cầu</p>
          <p className="text-sm text-blue-600 mt-0.5">{STATUS_LABELS[statusFilter] || 'Tất cả'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setSelected([]); }}
            className={`px-3 py-1.5 rounded-md text-sm ${statusFilter === tab.key ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Từ ngày:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Đến ngày:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input text-sm" />
        </div>
        <input value={minAmount} onChange={e => setMinAmount(e.target.value)} type="number" className="input text-sm w-36" placeholder="Tối thiểu (₫)" />
        <input value={maxAmount} onChange={e => setMaxAmount(e.target.value)} type="number" className="input text-sm w-36" placeholder="Tối đa (₫)" />
        <button onClick={() => { setDateFrom(''); setDateTo(''); setMinAmount(''); setMaxAmount(''); }} className="text-sm text-gray-500 hover:text-gray-700">
          Xóa lọc
        </button>
        {selected.length > 0 && statusFilter === 'PENDING' && (
          <button onClick={() => setBulkConfirm(true)} className="btn-primary text-sm ml-auto">
            Duyệt {selected.length} yêu cầu
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có yêu cầu nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {statusFilter === 'PENDING' && (
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={toggleAll} />
                  </th>
                )}
                <th className="text-left px-4 py-3 text-gray-500">Seller / Shop</th>
                <th className="text-right px-4 py-3 text-gray-500">Số tiền</th>
                <th className="text-left px-4 py-3 text-gray-500">Phương thức</th>
                <th className="text-left px-4 py-3 text-gray-500">Tài khoản ngân hàng</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày yêu cầu</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((req: any) => (
                <tr key={req.id} className="border-t hover:bg-gray-50">
                  {statusFilter === 'PENDING' && (
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={selected.includes(req.id)} onChange={() => toggleSelect(req.id)} />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium">{req.wallet?.shop?.name || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {Number(req.amount).toLocaleString('vi-VN')}₫
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{req.method || 'Chuyển khoản'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {req.bankAccount
                      ? <span>{req.bankAccount.bankName}<br />{req.bankAccount.accountNumber}<br /><span className="text-gray-400">{req.bankAccount.accountName}</span></span>
                      : req.note || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[req.status] || req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    {req.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setApproveModal(req)}
                          className="text-green-600 hover:text-green-700 p-1"
                          title="Duyệt"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => setRejectModal(req)}
                          className="text-red-500 hover:text-red-600 p-1"
                          title="Từ chối"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                    {req.status === 'COMPLETED' && req.note && (
                      <span className="text-xs text-gray-400">{req.note}</span>
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
