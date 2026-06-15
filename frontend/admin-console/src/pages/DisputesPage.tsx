import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  SELLER_RESPONDED: 'bg-orange-100 text-orange-700',
  ADMIN_REVIEWING: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  RESOLVED_BUYER: 'bg-green-100 text-green-700',
  RESOLVED_SELLER: 'bg-teal-100 text-teal-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  ESCALATED: 'bg-purple-100 text-purple-700',
  PENDING_EVIDENCE: 'bg-yellow-100 text-yellow-800',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Đang mở',
  UNDER_REVIEW: 'Đang xem xét',
  SELLER_RESPONDED: 'Người bán phản hồi',
  ADMIN_REVIEWING: 'Admin đang xử lý',
  RESOLVED: 'Đã giải quyết',
  RESOLVED_BUYER: 'Giải quyết: Người mua',
  RESOLVED_SELLER: 'Giải quyết: Người bán',
  CLOSED: 'Đã đóng',
  ESCALATED: 'Đã leo thang',
  PENDING_EVIDENCE: 'Chờ bằng chứng',
};

const SENDER_LABELS: Record<string, string> = { BUYER: 'Người mua', SELLER: 'Người bán', ADMIN: 'Admin' };
const SENDER_COLORS: Record<string, string> = {
  BUYER: 'bg-blue-100 text-blue-800',
  SELLER: 'bg-orange-100 text-orange-800',
  ADMIN: 'bg-purple-100 text-purple-800',
};

export default function DisputesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState(false);
  const [resolveForm, setResolveForm] = useState({ resolution: 'buyer', refundAmount: '', note: '' });
  const [requestEvidenceMsg, setRequestEvidenceMsg] = useState('');
  const [showEvidenceInput, setShowEvidenceInput] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', statusFilter, searchOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchOrder) params.set('search', searchOrder);
      return apiClient.get(`/admin/disputes?${params}`).then(r => r.data);
    },
  });

  const rawRows: any[] = data?.data?.data || data?.data || [];
  const rows = rawRows.filter((d: any) => {
    if (dateFrom && new Date(d.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(d.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['dispute-detail', selectedDispute?.id],
    queryFn: () => apiClient.get(`/disputes/${selectedDispute.id}`).then(r => r.data.data),
    enabled: !!selectedDispute?.id,
  });

  const resolve = useMutation({
    mutationFn: (payload: any) => apiClient.patch(`/admin/disputes/${selectedDispute.id}/resolve`, payload),
    onSuccess: () => {
      toast.success('Đã giải quyết tranh chấp');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute-detail', selectedDispute?.id] });
      setResolveModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const escalate = useMutation({
    mutationFn: () => apiClient.patch(`/admin/disputes/${selectedDispute.id}/escalate`),
    onSuccess: () => {
      toast.success('Đã leo thang xử lý');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute-detail', selectedDispute?.id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const requestEvidence = useMutation({
    mutationFn: () => apiClient.patch(`/admin/disputes/${selectedDispute.id}/request-evidence`, { message: requestEvidenceMsg }),
    onSuccess: () => {
      toast.success('Đã yêu cầu thêm bằng chứng');
      queryClient.invalidateQueries({ queryKey: ['dispute-detail', selectedDispute?.id] });
      setShowEvidenceInput(false);
      setRequestEvidenceMsg('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const isResolved = (d: any) => d && ['RESOLVED', 'RESOLVED_BUYER', 'RESOLVED_SELLER', 'CLOSED'].includes(d.status);

  return (
    <div>
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-1" onClick={() => setLightbox(null)}>
            <X size={24} />
          </button>
          <img src={lightbox} className="max-w-full max-h-full rounded-xl shadow-2xl" alt="evidence" />
        </div>
      )}

      {resolveModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold mb-4">Giải quyết tranh chấp</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quyết định</label>
                <select value={resolveForm.resolution} onChange={e => setResolveForm({ ...resolveForm, resolution: e.target.value })} className="input w-full">
                  <option value="buyer">Ủng hộ người mua (hoàn tiền)</option>
                  <option value="seller">Ủng hộ người bán</option>
                  <option value="partial">Hoàn tiền một phần</option>
                </select>
              </div>
              {resolveForm.resolution === 'partial' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Số tiền hoàn (₫)</label>
                  <input value={resolveForm.refundAmount} onChange={e => setResolveForm({ ...resolveForm, refundAmount: e.target.value })} type="number" className="input w-full" />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ghi chú / Lý do *</label>
                <textarea value={resolveForm.note} onChange={e => setResolveForm({ ...resolveForm, note: e.target.value })} rows={3} className="input w-full resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => resolve.mutate({ resolution: resolveForm.resolution, refundAmount: resolveForm.refundAmount ? Number(resolveForm.refundAmount) : undefined, note: resolveForm.note })}
                disabled={!resolveForm.note || resolve.isPending}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Xác nhận
              </button>
              <button onClick={() => setResolveModal(false)} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Trung tâm tranh chấp</h1>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <input
          value={searchOrder}
          onChange={e => setSearchOrder(e.target.value)}
          className="input text-sm flex-1 min-w-48"
          placeholder="Tìm theo mã đơn hàng..."
        />
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
        <button onClick={() => { setStatusFilter(''); setSearchOrder(''); setDateFrom(''); setDateTo(''); }} className="text-sm text-gray-500 hover:text-gray-700">
          Xóa lọc
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* List */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Đang tải...</div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Không có tranh chấp nào</div>
            ) : (
              <div className="divide-y max-h-[calc(100vh-280px)] overflow-y-auto">
                {rows.map((dispute: any) => (
                  <button
                    key={dispute.id}
                    onClick={() => setSelectedDispute(dispute)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedDispute?.id === dispute.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-sm font-medium">#{dispute.order?.orderNumber || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{dispute.shop?.name || '-'}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${STATUS_COLORS[dispute.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[dispute.status] || dispute.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-1">{dispute.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(dispute.createdAt).toLocaleDateString('vi-VN')}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {!selectedDispute ? (
            <div className="card p-12 text-center text-gray-500">
              <p className="text-4xl mb-3">⚖️</p>
              <p>Chọn một tranh chấp để xem và xử lý</p>
            </div>
          ) : (
            <div className="card overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold">#{detail?.order?.orderNumber || selectedDispute.order?.orderNumber}</h2>
                    <p className="text-xs text-gray-500">{selectedDispute.shop?.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[detail?.status || selectedDispute.status] || ''}`}>
                    {STATUS_LABELS[detail?.status || selectedDispute.status] || selectedDispute.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Lý do: </span><span className="font-medium">{selectedDispute.reason}</span></div>
                  <div><span className="text-gray-400">Ngày mở: </span><span>{new Date(selectedDispute.createdAt).toLocaleDateString('vi-VN')}</span></div>
                  {detail?.order?.totalAmount && (
                    <div><span className="text-gray-400">Giá trị đơn: </span><span className="font-medium text-green-600">{Number(detail.order.totalAmount).toLocaleString('vi-VN')}₫</span></div>
                  )}
                </div>
              </div>

              {/* Evidence Gallery */}
              {detail?.evidences?.length > 0 && (
                <div className="p-4 border-b">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Bằng chứng ({detail.evidences.length})</p>
                  <div className="flex gap-2 flex-wrap">
                    {detail.evidences.map((ev: any) => (
                      <div key={ev.id} className="relative group cursor-pointer" onClick={() => setLightbox(ev.fileUrl || ev.url)}>
                        <img
                          src={ev.fileUrl || ev.url}
                          className="w-20 h-20 object-cover rounded-lg border-2 border-transparent group-hover:border-blue-400"
                          alt="evidence"
                        />
                        <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center">
                          <ZoomIn size={18} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline / Messages */}
              <div className="p-4 border-b">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Lịch sử tin nhắn</p>
                {detailLoading ? (
                  <p className="text-sm text-gray-400">Đang tải...</p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {detail?.messages?.map((msg: any) => (
                      <div key={msg.id} className="flex gap-2 items-start">
                        <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 font-medium ${SENDER_COLORS[msg.sender] || 'bg-gray-100 text-gray-600'}`}>
                          {SENDER_LABELS[msg.sender] || msg.sender}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">{msg.content}</p>
                          <p className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    ))}
                    {(!detail?.messages || detail.messages.length === 0) && (
                      <p className="text-sm text-gray-400">Không có tin nhắn</p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              {!isResolved(detail || selectedDispute) && (
                <div className="p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hành động</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setResolveForm({ resolution: 'buyer', refundAmount: '', note: '' }); setResolveModal(true); }}
                      className="btn-primary text-sm"
                    >
                      Giải quyết tranh chấp
                    </button>
                    <button
                      onClick={() => escalate.mutate()}
                      disabled={escalate.isPending}
                      className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm hover:bg-purple-200"
                    >
                      Leo thang xử lý
                    </button>
                    <button
                      onClick={() => setShowEvidenceInput(!showEvidenceInput)}
                      className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg text-sm hover:bg-yellow-200"
                    >
                      Yêu cầu bằng chứng
                    </button>
                  </div>
                  {showEvidenceInput && (
                    <div className="flex gap-2">
                      <input
                        value={requestEvidenceMsg}
                        onChange={e => setRequestEvidenceMsg(e.target.value)}
                        className="input flex-1 text-sm"
                        placeholder="Nội dung yêu cầu bằng chứng..."
                      />
                      <button
                        onClick={() => requestEvidence.mutate()}
                        disabled={requestEvidence.isPending}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        Gửi
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isResolved(detail || selectedDispute) && detail?.resolution && (
                <div className="p-4 bg-green-50 border-t">
                  <p className="text-sm font-semibold text-green-700">Kết quả</p>
                  <p className="text-sm text-green-600 mt-1">{detail.resolution}</p>
                  {detail.resolvedAt && <p className="text-xs text-gray-400 mt-1">{new Date(detail.resolvedAt).toLocaleString('vi-VN')}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
