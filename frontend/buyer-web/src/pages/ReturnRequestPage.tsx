import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, X, Package, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import apiClient from '../api/client';

const RETURN_REASONS = [
  'Sản phẩm bị lỗi/hư hỏng',
  'Sản phẩm không đúng mô tả',
  'Nhận sai sản phẩm',
  'Sản phẩm không đúng size/màu',
  'Không hài lòng với chất lượng',
  'Thay đổi ý định mua hàng',
  'Khác',
];

const RETURN_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xét duyệt', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  APPROVED: { label: 'Đã chấp thuận', color: 'text-green-700 bg-green-50 border-green-200' },
  REJECTED: { label: 'Từ chối', color: 'text-red-700 bg-red-50 border-red-200' },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-gray-700 bg-gray-50 border-gray-200' },
};

export default function ReturnRequestPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiClient.get(`/orders/${orderId}`).then((r) => r.data.data),
    enabled: !!orderId,
  });

  const { data: existingReturn } = useQuery({
    queryKey: ['return-request', orderId],
    queryFn: () => apiClient.get(`/orders/${orderId}/return`).then((r) => r.data.data).catch(() => null),
    enabled: !!orderId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const imageUrls: string[] = [];
      for (const img of images) {
        const fd = new FormData();
        fd.append('file', img);
        try {
          const res = await apiClient.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          imageUrls.push(res.data.data?.url || '');
        } catch {}
      }
      return apiClient.post(`/orders/${orderId}/return`, {
        reason,
        description,
        items: selectedItems.map((id) => {
          const item = order?.items?.find((i: any) => i.id === id);
          return { orderItemId: id, quantity: item?.quantity || 1 };
        }),
        images: imageUrls.filter(Boolean),
      });
    },
    onSuccess: () => {
      toast.success('Yêu cầu đổi trả đã được gửi!');
      navigate(`/orders/${orderId}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể gửi yêu cầu'),
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) { toast.error('Tối đa 5 ảnh'); return; }
    const newFiles = [...images, ...files].slice(0, 5);
    setImages(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx: number) => {
    setImages((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const toggleItem = (itemId: string) =>
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );

  if (existingReturn) {
    const si = RETURN_STATUS_LABELS[existingReturn.status] || RETURN_STATUS_LABELS.PENDING;
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to={`/orders/${orderId}`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ArrowLeft size={16} /> Quay lại đơn hàng
        </Link>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold mb-4">Theo dõi yêu cầu đổi trả</h1>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium mb-4 ${si.color}`}>
            {si.label}
          </span>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Lý do:</span> {existingReturn.reason}</p>
            {existingReturn.description && <p><span className="font-medium">Mô tả:</span> {existingReturn.description}</p>}
            <p><span className="font-medium">Ngày gửi:</span> {new Date(existingReturn.createdAt).toLocaleDateString('vi-VN')}</p>
            {existingReturn.staffNote && (
              <div className="bg-blue-50 rounded-lg p-3 mt-3">
                <p className="font-medium text-blue-800 mb-1">Ghi chú từ bộ phận hỗ trợ:</p>
                <p className="text-blue-700">{existingReturn.staffNote}</p>
              </div>
            )}
          </div>
          {existingReturn.images?.length > 0 && (
            <div className="mt-4 flex gap-2">
              {existingReturn.images.map((url: string, i: number) => (
                <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const canReturn = order && ['DELIVERED', 'COMPLETED'].includes(order.status);
  if (!canReturn && order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center py-16">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
        <p className="text-gray-700 font-medium">Không thể yêu cầu đổi trả</p>
        <p className="text-gray-500 text-sm mt-1">Chỉ có thể yêu cầu sau khi đã nhận hàng</p>
        <Link to={`/orders/${orderId}`} className="mt-4 inline-block text-red-500 hover:underline">Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/orders/${orderId}`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} /> Quay lại đơn hàng
      </Link>
      <h1 className="text-xl font-bold mb-6">Yêu cầu đổi trả hàng</h1>

      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Package size={18} className="text-red-500" />
            Chọn sản phẩm cần đổi trả
          </h2>
          <div className="space-y-2">
            {order?.items?.map((item: any) => (
              <label key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedItems.includes(item.id) ? 'border-red-400 bg-red-50' : 'border-gray-100 hover:border-gray-200'
              }`}>
                <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItem(item.id)} className="text-red-500" />
                <img src={item.sku?.product?.images?.[0]?.url || '/placeholder.jpg'} alt="" className="w-12 h-12 rounded object-cover bg-gray-100" />
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-1">{item.sku?.product?.name}</p>
                  <p className="text-xs text-gray-500">x{item.quantity} — {Number(item.price).toLocaleString('vi-VN')}đ</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold mb-3">Lý do đổi trả</h2>
          <div className="space-y-1.5">
            {RETURN_REASONS.map((r) => (
              <label key={r} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                reason === r ? 'border-red-400 bg-red-50' : 'border-gray-100 hover:border-gray-200'
              }`}>
                <input type="radio" value={r} checked={reason === r} onChange={() => setReason(r)} className="text-red-500" />
                <span className="text-sm">{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold mb-3">Mô tả chi tiết (tùy chọn)</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả vấn đề của bạn..."
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold mb-3">Ảnh minh chứng (tối đa 5 ảnh)</h2>
          <div className="flex gap-2 flex-wrap">
            {previews.map((url, idx) => (
              <div key={idx} className="relative">
                <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                <button onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X size={12} />
                </button>
              </div>
            ))}
            {previews.length < 5 && (
              <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-400 transition-colors">
                <Upload size={20} />
                <span className="text-xs mt-1">Thêm ảnh</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
        </div>

        <button
          onClick={() => submitMutation.mutate()}
          disabled={!reason || selectedItems.length === 0 || submitMutation.isPending}
          className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitMutation.isPending ? <><Loader size={18} className="animate-spin" /> Đang gửi...</> : 'Gửi yêu cầu đổi trả'}
        </button>
      </div>
    </div>
  );
}
