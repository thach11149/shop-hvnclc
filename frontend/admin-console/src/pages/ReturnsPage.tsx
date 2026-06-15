import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle, XCircle, DollarSign, Download, ChevronDown, ChevronUp, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  SELLER_APPROVED: 'Đã chấp nhận',
  SELLER_REJECTED: 'Đã từ chối',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SELLER_APPROVED: 'bg-blue-100 text-blue-700',
  SELLER_REJECTED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export default function ReturnsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-returns', statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return apiClient.get(`/admin/return-requests?${params}`).then(r => r.data.data);
    },
  });

  const rows: any[] = data?.data || data || [];

  const approve = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/return-requests/${id}/approve`),
    onSuccess: () => { toast.success('Đã duyệt yêu cầu đổi trả'); queryClient.invalidateQueries({ queryKey: ['admin-returns'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => apiClient.patch(`/admin/return-requests/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu');
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
      setRejectModal(null);
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const refund = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/return-requests/${id}/refund`),
    onSuccess: () => { toast.success('Đã xử lý hoàn tiền'); queryClient.invalidateQueries({ queryKey: ['admin-returns'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const bulkApprove = useMutation({
    mutationFn: () => apiClient.patch('/admin/return-requests/bulk-approve', { ids: selected }),
    onSuccess: () => { toast.success(`Đã duyệt ${selected.length} yêu cầu`); setSelected([]); queryClient.invalidateQueries({ queryKey: ['admin-returns'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(selected.length === rows.length ? [] : rows.map((r: any) => r.id));

  const exportCsv = () => {
    const headers = ['Mã đơn', 'Người mua', 'Lý do', 'Trạng thái', 'Ngày tạo'];
    const lines = rows.map((r: any) => [
      r.order?.orderNumber || '',
      r.user?.email || '',
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      STATUS_LABELS[r.status] || r.status,
      new Date(r.createdAt).toLocaleDateString('vi-VN'),
    ].join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'returns.csv';
    a.click();
  };

  return (
    <div>
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}><X size={28} /></button>
          <img src={lightbox} className="max-w-full max-h-full rounded-lg shadow-2xl" alt="evidence" />
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold mb-3">Từ chối yêu cầu</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="input w-full h-24 resize-none"
              placeholder="Nhập lý do từ chối..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => reject.mutate({ id: rejectModal.id, reason: rejectReason })}
                disabled={!rejectReason.trim() || reject.isPending}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đổi trả</h1>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <button
              onClick={() => bulkApprove.mutate()}
              disabled={bulkApprove.isPending}
              className="btn-primary text-sm"
            >
              Duyệt {selected.length} yêu cầu
            </button>
          )}
          <button onClick={exportCsv} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input text-sm">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Từ:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Đến:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input text-sm" />
        </div>
        <button onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo(''); }} className="text-sm text-gray-500 hover:text-gray-700">
          Xóa lọc
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có yêu cầu đổi trả</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={toggleAll} />
                </th>
                <th className="text-left px-4 py-3 text-gray-500">Mã đơn</th>
                <th className="text-left px-4 py-3 text-gray-500">Người mua</th>
                <th className="text-left px-4 py-3 text-gray-500">Lý do</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-right px-4 py-3 text-gray-500">Số tiền</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày tạo</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((req: any) => (
                <>
                  <tr
                    key={req.id}
                    className={`border-t hover:bg-gray-50 ${expandedId === req.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={selected.includes(req.id)} onChange={() => toggleSelect(req.id)} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{req.order?.orderNumber || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{req.user?.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{req.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                      {req.refundAmount ? `${Number(req.refundAmount).toLocaleString('vi-VN')}₫` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => approve.mutate(req.id)}
                              disabled={approve.isPending}
                              className="text-green-600 hover:text-green-700 p-1" title="Duyệt"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: req.id })}
                              className="text-red-500 hover:text-red-600 p-1" title="Từ chối"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {req.status === 'SELLER_APPROVED' && !req.refundRequest && (
                          <button
                            onClick={() => refund.mutate(req.id)}
                            disabled={refund.isPending}
                            className="text-blue-600 hover:text-blue-700 p-1 flex items-center gap-1 text-xs"
                          >
                            <DollarSign size={14} /> Hoàn tiền
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          {expandedId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === req.id && (
                    <tr key={`${req.id}-detail`} className="border-t bg-blue-50">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Evidence Images */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Bằng chứng</p>
                            {req.evidenceImages?.length > 0 ? (
                              <div className="flex gap-2 flex-wrap">
                                {req.evidenceImages.map((url: string, i: number) => (
                                  <img
                                    key={i}
                                    src={url}
                                    className="w-20 h-20 object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-blue-400"
                                    onClick={() => setLightbox(url)}
                                    alt={`evidence-${i}`}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">Không có ảnh bằng chứng</p>
                            )}
                          </div>
                          {/* Timeline */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Timeline xử lý</p>
                            <div className="space-y-2">
                              <div className="flex gap-2 items-start">
                                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium">Tạo yêu cầu</p>
                                  <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleString('vi-VN')}</p>
                                </div>
                              </div>
                              {req.status !== 'PENDING' && (
                                <div className="flex gap-2 items-start">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${req.status === 'COMPLETED' ? 'bg-green-400' : req.status === 'CANCELLED' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                                  <div>
                                    <p className="text-xs font-medium">{STATUS_LABELS[req.status]}</p>
                                    <p className="text-xs text-gray-400">{req.updatedAt ? new Date(req.updatedAt).toLocaleString('vi-VN') : '-'}</p>
                                  </div>
                                </div>
                              )}
                              {req.refundRequest && (
                                <div className="flex gap-2 items-start">
                                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium">Đã hoàn tiền</p>
                                    <p className="text-xs text-gray-400">{new Date(req.refundRequest.createdAt).toLocaleString('vi-VN')}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {req.description && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-500 mb-1">Mô tả chi tiết</p>
                            <p className="text-sm text-gray-600">{req.description}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
