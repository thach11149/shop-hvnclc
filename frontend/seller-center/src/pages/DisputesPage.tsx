import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Image, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface Dispute {
  id: string;
  orderId: string;
  orderNumber?: string;
  buyerName: string;
  reason: string;
  evidence: string[] | string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'ESCALATED' | 'CLOSED';
  sellerResponse: string | null;
  counterEvidence?: string[];
  messages?: { role: string; content: string; createdAt: string }[];
  resolution: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN:            { label: 'Mới mở', color: 'bg-yellow-100 text-yellow-700' },
  UNDER_REVIEW:    { label: 'Đang xem xét', color: 'bg-blue-100 text-blue-700' },
  RESOLVED_BUYER:  { label: 'Giải quyết cho người mua', color: 'bg-red-100 text-red-700' },
  RESOLVED_SELLER: { label: 'Giải quyết cho bạn', color: 'bg-green-100 text-green-700' },
  ESCALATED:       { label: 'Leo thang', color: 'bg-purple-100 text-purple-700' },
  CLOSED:          { label: 'Đóng', color: 'bg-gray-100 text-gray-500' },
};

export default function DisputesPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [counterImages, setCounterImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<{ data: Dispute[] }>({
    queryKey: ['seller-disputes', statusFilter],
    queryFn: () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      return apiClient.get(`/seller/disputes${params}`).then(r => r.data);
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, response, evidence }: { id: string; response: string; evidence: string[] }) =>
      apiClient.post(`/seller/disputes/${id}/respond`, { response, counterEvidence: evidence }),
    onSuccess: () => {
      toast.success('Đã gửi phản hồi tranh chấp');
      qc.invalidateQueries({ queryKey: ['seller-disputes'] });
      setSelected(null);
      setCounterImages([]);
      setResponse('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi gửi phản hồi'),
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url || res.data.data?.url;
      if (url) setCounterImages(prev => [...prev, url]);
    } catch {
      toast.error('Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const disputes = data?.data ?? [];
  const openCount = disputes.filter(d => d.status === 'OPEN').length;
  const reviewCount = disputes.filter(d => d.status === 'UNDER_REVIEW').length;

  const buyerEvidence = (d: Dispute): string[] => {
    if (!d.evidence) return [];
    if (Array.isArray(d.evidence)) return d.evidence;
    try { return JSON.parse(d.evidence as string); } catch { return [d.evidence as string]; }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Tranh chấp & Khiếu nại</h1>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{openCount}</p>
          <p className="text-xs text-gray-500 mt-1">Chờ phản hồi</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{reviewCount}</p>
          <p className="text-xs text-gray-500 mt-1">Đang xem xét</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{disputes.length}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'OPEN', label: 'Mới mở' },
          { key: 'UNDER_REVIEW', label: 'Đang xem' },
          { key: 'RESOLVED_BUYER', label: 'Cho mua' },
          { key: 'RESOLVED_SELLER', label: 'Cho bán' },
        ].map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
              statusFilter === f.key ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Respond Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Phản hồi tranh chấp</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Buyer info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-500 w-28">Đơn hàng:</span>
                  <span className="font-mono font-medium">{selected.orderNumber || selected.orderId?.slice(0, 12)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-28">Người mua:</span>
                  <span>{selected.buyerName}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-28">Lý do:</span>
                  <span className="text-red-700">{selected.reason}</span>
                </div>
              </div>

              {/* Buyer evidence */}
              {buyerEvidence(selected).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Bằng chứng từ người mua:</p>
                  <div className="flex flex-wrap gap-2">
                    {buyerEvidence(selected).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`evidence-${i}`} className="w-20 h-20 object-cover rounded border hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Your response */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phản hồi của bạn *</label>
                <textarea
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Giải trình về đơn hàng, mô tả tình trạng giao hàng, lý do từ phía shop..."
                />
              </div>

              {/* Counter evidence upload */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Bằng chứng phản hồi (tuỳ chọn)</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {counterImages.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`counter-${i}`} className="w-20 h-20 object-cover rounded border" />
                      <button
                        onClick={() => setCounterImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {counterImages.length < 5 && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-400 transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={16} />
                          <span className="text-xs mt-1">Thêm ảnh</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400">Tối đa 5 ảnh (JPEG, PNG, dưới 5MB)</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => {
                    Array.from(e.target.files || []).slice(0, 5 - counterImages.length).forEach(uploadImage);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            <div className="p-5 border-t flex gap-3">
              <button onClick={() => { setSelected(null); setCounterImages([]); setResponse(''); }}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => respondMutation.mutate({ id: selected.id, response, evidence: counterImages })}
                disabled={!response.trim() || respondMutation.isPending}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {respondMutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disputes List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : disputes.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-3xl mb-2">⚖️</p>
          <p>Không có tranh chấp nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => {
            const isExpanded = expanded === d.id;
            const cfg = STATUS_CONFIG[d.status] || { label: d.status, color: 'bg-gray-100 text-gray-600' };
            const evidenceUrls = buyerEvidence(d);
            return (
              <div key={d.id} className="card overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : d.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-sm font-medium text-gray-800">
                          #{d.orderNumber || d.orderId?.slice(0, 8)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                        {!d.sellerResponse && d.status === 'OPEN' && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">Cần phản hồi</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700">{d.buyerName}</p>
                      <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{d.reason}</p>
                      {d.sellerResponse && (
                        <div className="flex items-center gap-1 mt-1">
                          <MessageCircle size={12} className="text-green-500" />
                          <span className="text-xs text-green-600">Đã phản hồi</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString('vi-VN')}</span>
                      {d.status === 'OPEN' && !d.sellerResponse && (
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(d); setResponse(''); setCounterImages([]); }}
                          className="bg-primary-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary-700"
                        >
                          Phản hồi
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-4 bg-gray-50 space-y-4">
                    {/* Buyer evidence */}
                    {evidenceUrls.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Bằng chứng người mua</p>
                        <div className="flex flex-wrap gap-2">
                          {evidenceUrls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt="" className="w-16 h-16 object-cover rounded border hover:opacity-80" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seller response */}
                    {d.sellerResponse && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Phản hồi của bạn</p>
                        <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border">{d.sellerResponse}</p>
                      </div>
                    )}

                    {/* Counter evidence */}
                    {d.counterEvidence && d.counterEvidence.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Bằng chứng của bạn</p>
                        <div className="flex flex-wrap gap-2">
                          {d.counterEvidence.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt="" className="w-16 h-16 object-cover rounded border hover:opacity-80" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resolution */}
                    {d.resolution && (
                      <div className="bg-white rounded-lg p-3 border-l-4 border-primary-500">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Kết quả xử lý</p>
                        <p className="text-sm text-gray-700">{d.resolution}</p>
                      </div>
                    )}

                    {/* Add more evidence even after responding */}
                    {d.sellerResponse && d.status !== 'CLOSED' && d.status !== 'RESOLVED_BUYER' && d.status !== 'RESOLVED_SELLER' && (
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(d); setResponse(d.sellerResponse || ''); setCounterImages(d.counterEvidence || []); }}
                        className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                      >
                        <Image size={12} /> Thêm bằng chứng
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
