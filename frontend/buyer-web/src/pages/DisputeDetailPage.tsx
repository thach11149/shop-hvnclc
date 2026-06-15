import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, ZoomIn, Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: 'Mới tạo', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: AlertCircle },
  UNDER_REVIEW: { label: 'Đang xem xét', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Clock },
  SELLER_RESPONDED: { label: 'Shop đã phản hồi', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: MessageSquare },
  ADMIN_REVIEWING: { label: 'Admin đang xử lý', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: Clock },
  RESOLVED_BUYER: { label: 'Giải quyết: có lợi cho bạn', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle },
  RESOLVED_SELLER: { label: 'Giải quyết: có lợi cho shop', color: 'text-teal-600 bg-teal-50 border-teal-200', icon: CheckCircle },
  RESOLVED: { label: 'Đã giải quyết', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle },
  CLOSED: { label: 'Đã đóng', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: CheckCircle },
  ESCALATED: { label: 'Đang leo thang', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertCircle },
  PENDING_EVIDENCE: { label: 'Chờ bổ sung bằng chứng', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: AlertCircle },
};

const SENDER_LABELS: Record<string, string> = { BUYER: 'Bạn', SELLER: 'Shop', ADMIN: 'Admin' };

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dispute-detail-buyer', id],
    queryFn: () => apiClient.get(`/disputes/${id}`).then(r => r.data.data),
  });

  const dispute = data;

  const sendMessage = useMutation({
    mutationFn: (content: string) => apiClient.post(`/disputes/${id}/messages`, { content }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dispute-detail-buyer', id] }); setMessage(''); },
    onError: () => toast.error('Không gửi được tin nhắn'),
  });

  const submitEvidence = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      for (const f of evidenceFiles) fd.append('files', f);
      return apiClient.post(`/disputes/${id}/evidence`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Đã gửi bằng chứng');
      queryClient.invalidateQueries({ queryKey: ['dispute-detail-buyer', id] });
      setEvidenceFiles([]);
      setEvidencePreviews([]);
      setShowEvidenceForm(false);
    },
    onError: () => toast.error('Không gửi được bằng chứng'),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidenceFiles(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setEvidencePreviews(prev => [...prev, ...previews]);
  };

  const removeEvidence = (idx: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== idx));
    setEvidencePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const statusConfig = STATUS_CONFIG[dispute?.status] || { label: dispute?.status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: AlertCircle };
  const StatusIcon = statusConfig.icon;

  const isOpen = dispute && ['OPEN', 'UNDER_REVIEW', 'SELLER_RESPONDED', 'ADMIN_REVIEWING', 'ESCALATED', 'PENDING_EVIDENCE'].includes(dispute.status);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Không tìm thấy tranh chấp</p>
        <Link to="/orders" className="text-blue-600 hover:underline mt-2 inline-block">← Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full" onClick={() => setLightbox(null)}>
            <X size={20} />
          </button>
          <img src={lightbox} className="max-w-full max-h-full rounded-xl shadow-2xl" alt="evidence" />
        </div>
      )}

      <Link to="/orders" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft size={16} /> Quay lại đơn hàng
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tranh chấp đơn hàng</h1>
            <p className="text-xs text-gray-400 mt-0.5">Mã đơn: #{dispute.order?.orderNumber || dispute.orderId?.slice(0, 8)}</p>
          </div>
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
            <StatusIcon size={14} />
            {statusConfig.label}
          </span>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex gap-2">
            <span className="text-gray-400 w-28 flex-shrink-0">Lý do:</span>
            <span className="font-medium text-gray-800">{dispute.reason}</span>
          </div>
          {dispute.description && (
            <div className="flex gap-2">
              <span className="text-gray-400 w-28 flex-shrink-0">Mô tả:</span>
              <span className="text-gray-600">{dispute.description}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-gray-400 w-28 flex-shrink-0">Ngày tạo:</span>
            <span className="text-gray-600">{new Date(dispute.createdAt).toLocaleString('vi-VN')}</span>
          </div>
          {isOpen && (
            <div className="flex gap-2">
              <span className="text-gray-400 w-28 flex-shrink-0">Dự kiến xong:</span>
              <span className="text-blue-600 font-medium">Trong vòng 3-5 ngày làm việc</span>
            </div>
          )}
        </div>

        {/* Evidence Gallery */}
        {dispute.evidences?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bằng chứng đã gửi</p>
            <div className="flex gap-2 flex-wrap">
              {dispute.evidences.map((ev: any) => (
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

        {/* Resolution */}
        {dispute.resolution && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-700">Kết quả giải quyết</p>
            <p className="text-sm text-green-600 mt-1">{dispute.resolution}</p>
            {dispute.resolvedAt && <p className="text-xs text-gray-400 mt-1">{new Date(dispute.resolvedAt).toLocaleString('vi-VN')}</p>}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h2 className="font-semibold text-gray-800 mb-4">Lịch sử xử lý</h2>
        <div className="space-y-4">
          {dispute.messages?.map((msg: any, i: number) => (
            <div key={msg.id || i} className="flex gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  msg.sender === 'BUYER' ? 'bg-blue-100 text-blue-700' :
                  msg.sender === 'SELLER' ? 'bg-orange-100 text-orange-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {SENDER_LABELS[msg.sender]?.[0] || '?'}
                </div>
                {i < dispute.messages.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold ${
                    msg.sender === 'BUYER' ? 'text-blue-700' :
                    msg.sender === 'SELLER' ? 'text-orange-700' :
                    'text-purple-700'
                  }`}>
                    {SENDER_LABELS[msg.sender] || msg.sender}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <div className={`rounded-xl p-3 text-sm ${
                  msg.sender === 'BUYER' ? 'bg-blue-50 text-blue-800' :
                  msg.sender === 'SELLER' ? 'bg-orange-50 text-orange-800' :
                  'bg-purple-50 text-purple-800'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {(!dispute.messages || dispute.messages.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">Chưa có tin nhắn nào</p>
          )}
        </div>
      </div>

      {/* Actions */}
      {isOpen && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Gửi tin nhắn</h2>
          <div className="flex gap-2">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && message.trim() && sendMessage.mutate(message)}
              className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="Nhập tin nhắn..."
            />
            <button
              onClick={() => message.trim() && sendMessage.mutate(message)}
              disabled={!message.trim() || sendMessage.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50 hover:bg-blue-700"
            >
              Gửi
            </button>
          </div>

          <div>
            <button
              onClick={() => setShowEvidenceForm(!showEvidenceForm)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Upload size={14} /> Gửi thêm bằng chứng
            </button>

            {showEvidenceForm && (
              <div className="mt-3 space-y-3">
                <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                >
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Nhấn để chọn ảnh/video bằng chứng</p>
                  <p className="text-xs text-gray-400 mt-0.5">Hỗ trợ JPG, PNG, MP4</p>
                </div>

                {evidencePreviews.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {evidencePreviews.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} className="w-20 h-20 object-cover rounded-lg" alt="" />
                        <button
                          onClick={() => removeEvidence(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {evidenceFiles.length > 0 && (
                  <button
                    onClick={() => submitEvidence.mutate()}
                    disabled={submitEvidence.isPending}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitEvidence.isPending ? 'Đang gửi...' : `Gửi ${evidenceFiles.length} tệp bằng chứng`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
