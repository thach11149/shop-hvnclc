import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Calendar, ChevronDown, ChevronUp, CheckCircle, XCircle, RefreshCw, Image } from 'lucide-react';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  SELLER_APPROVED: 'Đã chấp nhận',
  SELLER_REJECTED: 'Đã từ chối',
  REFUND_PROCESSING: 'Đang hoàn tiền',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SELLER_APPROVED: 'bg-green-100 text-green-700',
  SELLER_REJECTED: 'bg-red-100 text-red-700',
  REFUND_PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUS_FILTER = [
  { key: 'all', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xử lý' },
  { key: 'SELLER_APPROVED', label: 'Đã chấp nhận' },
  { key: 'SELLER_REJECTED', label: 'Đã từ chối' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
];

export default function ReturnRequestsPage() {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; note: string } | null>(null);
  const [partialModal, setPartialModal] = useState<{ id: string; amount: string } | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-returns', activeStatus, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeStatus !== 'all') params.set('status', activeStatus);
      if (search) params.set('search', search);
      return apiClient.get(`/seller/return-requests?${params}`).then(r => r.data.data);
    },
  });

  const approve = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/seller/returns/${id}/approve`),
    onSuccess: () => {
      toast.success('Đã chấp nhận yêu cầu đổi trả');
      queryClient.invalidateQueries({ queryKey: ['seller-returns'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      apiClient.patch(`/seller/returns/${id}/reject`, { note }),
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu');
      setRejectModal(null);
      queryClient.invalidateQueries({ queryKey: ['seller-returns'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const partialRefund = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      apiClient.patch(`/seller/returns/${id}/partial-refund`, { amount }),
    onSuccess: () => {
      toast.success('Đã xử lý hoàn tiền một phần');
      setPartialModal(null);
      queryClient.invalidateQueries({ queryKey: ['seller-returns'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const returns: any[] = data?.data || data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Yêu cầu đổi trả</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm mã đơn..."
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-52"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">Tìm</button>
        </form>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_FILTER.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveStatus(s.key)}
              className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                activeStatus === s.key ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Returns List */}
      {isLoading ? (
        <div className="card p-8 text-center text-gray-400">Đang tải...</div>
      ) : returns.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">🔄</p>
          <p className="text-sm">Không có yêu cầu đổi trả nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((req: any) => {
            const isExpanded = expandedId === req.id;
            const images: string[] = req.images || req.evidence || [];
            return (
              <div key={req.id} className="card overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono font-medium text-gray-700">#{req.order?.orderNumber || req.orderId}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABELS[req.status] || req.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {req.buyer?.fullName || req.buyer?.email || 'Người mua'} • {req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {req.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => approve.mutate(req.id)}
                          disabled={approve.isPending}
                          className="flex items-center gap-1 text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50"
                        >
                          <CheckCircle size={13} /> Duyệt
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: req.id, note: '' })}
                          className="flex items-center gap-1 text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600"
                        >
                          <XCircle size={13} /> Từ chối
                        </button>
                        <button
                          onClick={() => setPartialModal({ id: req.id, amount: '' })}
                          className="flex items-center gap-1 text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600"
                        >
                          <RefreshCw size={13} /> Hoàn 1 phần
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t px-5 py-4 space-y-3 bg-gray-50">
                    {/* Reason */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Lý do đổi trả</p>
                      <p className="text-sm text-gray-700">{req.reason || '—'}</p>
                    </div>

                    {/* Evidence Images */}
                    {images.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <Image size={12} />
                          Ảnh bằng chứng ({images.length})
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {images.map((url: string, i: number) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Bằng chứng ${i + 1}`}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                              onClick={() => setLightbox(url)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    {req.timeline?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Lịch sử xử lý</p>
                        <div className="space-y-2">
                          {req.timeline.map((t: any, i: number) => (
                            <div key={i} className="flex gap-3 text-xs text-gray-500">
                              <span className="w-24 flex-shrink-0">{t.time ? new Date(t.time).toLocaleDateString('vi-VN') : '—'}</span>
                              <span>{t.note || t.action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejection note */}
                    {req.sellerNote && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Lý do từ chối</p>
                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{req.sellerNote}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-800">Từ chối yêu cầu đổi trả</h3>
              <p className="text-sm text-gray-500 mt-1">Vui lòng nhập lý do từ chối để thông báo cho người mua</p>
            </div>
            <div className="p-5">
              <textarea
                value={rejectModal.note}
                onChange={e => setRejectModal({ ...rejectModal, note: e.target.value })}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                placeholder="VD: Sản phẩm không còn trong tình trạng được bảo hành..."
              />
            </div>
            <div className="flex gap-2 justify-end p-5 border-t">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Hủy</button>
              <button
                onClick={() => reject.mutate({ id: rejectModal.id, note: rejectModal.note })}
                disabled={reject.isPending || !rejectModal.note.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {reject.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partial Refund Modal */}
      {partialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-800">Hoàn tiền một phần</h3>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền hoàn (đ)</label>
              <input
                type="number"
                value={partialModal.amount}
                onChange={e => setPartialModal({ ...partialModal, amount: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="VD: 50000"
              />
            </div>
            <div className="flex gap-2 justify-end p-5 border-t">
              <button onClick={() => setPartialModal(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Hủy</button>
              <button
                onClick={() => partialRefund.mutate({ id: partialModal.id, amount: Number(partialModal.amount) })}
                disabled={partialRefund.isPending || !partialModal.amount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {partialRefund.isPending ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-3xl max-h-[85vh] object-contain rounded-lg" />
          <button className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300">✕</button>
        </div>
      )}
    </div>
  );
}
