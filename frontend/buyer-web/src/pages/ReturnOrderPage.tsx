import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const RETURN_REASONS = [
  'Sản phẩm bị hỏng/lỗi',
  'Sản phẩm không đúng mô tả',
  'Nhận sai sản phẩm',
  'Sản phẩm kém chất lượng',
  'Không còn nhu cầu',
  'Khác',
];

export default function ReturnOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [returnType, setReturnType] = useState<'RETURN' | 'REFUND'>('RETURN');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/orders/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const returnMutation = useMutation({
    mutationFn: (data: any) => apiClient.post(`/orders/${id}/return-requests`, data),
    onSuccess: () => {
      toast.success('Yêu cầu đổi trả đã được gửi thành công!');
      navigate(`/orders/${id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể gửi yêu cầu'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItems.length) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm');
      return;
    }
    if (!reason) {
      toast.error('Vui lòng chọn lý do');
      return;
    }
    returnMutation.mutate({
      orderId: id,
      returnType,
      reason,
      description,
      items: selectedItems.map(itemId => ({
        orderItemId: itemId,
        quantity: order?.items?.find((i: any) => i.id === itemId)?.quantity || 1,
      })),
    });
  };

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-8 text-center">Đang tải...</div>;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-8 text-center">Không tìm thấy đơn hàng</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/orders/${id}`} className="text-gray-500 hover:text-gray-700">← Quay lại đơn hàng</Link>
        <h1 className="text-xl font-bold text-gray-800">Yêu cầu đổi trả/hoàn tiền</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Return Type */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Loại yêu cầu</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="RETURN"
                checked={returnType === 'RETURN'}
                onChange={e => setReturnType(e.target.value as 'RETURN' | 'REFUND')}
              />
              <span className="text-sm">Đổi hàng</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="REFUND"
                checked={returnType === 'REFUND'}
                onChange={e => setReturnType(e.target.value as 'RETURN' | 'REFUND')}
              />
              <span className="text-sm">Hoàn tiền</span>
            </label>
          </div>
        </div>

        {/* Select Items */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Chọn sản phẩm cần đổi trả</h2>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={e => {
                    if (e.target.checked) setSelectedItems(prev => [...prev, item.id]);
                    else setSelectedItems(prev => prev.filter(i => i !== item.id));
                  }}
                />
                <img
                  src={item.skuImageSnapshot || 'https://via.placeholder.com/48'}
                  alt={item.productNameSnapshot}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.productNameSnapshot}</p>
                  {item.skuNameSnapshot && <p className="text-xs text-gray-500">{item.skuNameSnapshot}</p>}
                  <p className="text-xs text-gray-500">x{item.quantity}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Lý do đổi trả</h2>
          <select
            className="input w-full mb-3"
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
          >
            <option value="">Chọn lý do...</option>
            {RETURN_REASONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <textarea
            className="input w-full h-24 resize-none"
            placeholder="Mô tả chi tiết vấn đề (tùy chọn)..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={returnMutation.isPending}
          className="w-full btn-primary py-3 text-sm"
        >
          {returnMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu đổi trả'}
        </button>
      </form>
    </div>
  );
}
