import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface ReturnFormData {
  reason: string;
  description: string;
  items: Array<{ orderItemId: string; quantity: number }>;
}

const RETURN_REASONS = [
  'Sản phẩm bị lỗi/hư hỏng',
  'Sản phẩm không đúng mô tả',
  'Nhận sai sản phẩm',
  'Sản phẩm không đúng size/màu',
  'Không hài lòng với chất lượng',
  'Khác',
];

export default function ReturnRequestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/orders/${id}`).then(r => r.data.data),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ReturnFormData>();

  const createReturn = useMutation({
    mutationFn: (data: any) => apiClient.post('/returns', { ...data, orderId: id }),
    onSuccess: () => {
      toast.success('Yêu cầu đổi trả đã được gửi thành công!');
      navigate('/orders');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể gửi yêu cầu'),
  });

  const onSubmit = (data: ReturnFormData) => {
    const items = order?.items?.map((item: any) => ({
      orderItemId: item.id,
      quantity: item.quantity,
    })) || [];
    createReturn.mutate({ ...data, items });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
        <p>Không tìm thấy đơn hàng</p>
        <Link to="/orders" className="btn-primary mt-4 inline-block">Quay lại đơn hàng</Link>
      </div>
    );
  }

  if (order.status !== 'COMPLETED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
        <p>Chỉ có thể yêu cầu đổi trả cho đơn hàng đã hoàn thành</p>
        <Link to={`/orders/${id}`} className="btn-primary mt-4 inline-block">Quay lại đơn hàng</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/orders" className="hover:text-primary-600">Đơn hàng</Link>
        <span className="mx-2">/</span>
        <Link to={`/orders/${id}`} className="hover:text-primary-600">#{order.orderNumber}</Link>
        <span className="mx-2">/</span>
        <span>Yêu cầu đổi trả</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Yêu cầu đổi trả</h1>

      {/* Order Summary */}
      <div className="card p-4 mb-6">
        <h2 className="font-semibold mb-3">Đơn hàng #{order.orderNumber}</h2>
        <div className="space-y-3">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex gap-3">
              <img
                src={item.skuImageSnapshot || 'https://via.placeholder.com/48'}
                alt={item.productNameSnapshot}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-800">{item.productNameSnapshot}</p>
                {item.skuNameSnapshot && <p className="text-xs text-gray-500">{item.skuNameSnapshot}</p>}
                <p className="text-xs text-gray-500">x{item.quantity}</p>
              </div>
              <p className="text-sm font-medium">{Number(item.subtotal).toLocaleString('vi-VN')}₫</p>
            </div>
          ))}
        </div>
      </div>

      {/* Return Form */}
      <div className="card p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Lý do đổi trả *</label>
            <select
              {...register('reason', { required: 'Vui lòng chọn lý do' })}
              className="input mt-1"
            >
              <option value="">-- Chọn lý do --</option>
              {RETURN_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Mô tả chi tiết *</label>
            <textarea
              {...register('description', { required: 'Vui lòng mô tả vấn đề' })}
              rows={4}
              className="input mt-1 resize-none"
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải với sản phẩm..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-medium mb-1">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Yêu cầu đổi trả phải được gửi trong vòng 7 ngày kể từ khi nhận hàng</li>
              <li>Sản phẩm phải còn nguyên vẹn, chưa qua sử dụng (trừ trường hợp lỗi)</li>
              <li>Đơn vị xử lý sẽ liên hệ với bạn trong vòng 24 giờ</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createReturn.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {createReturn.isPending ? 'Đang gửi...' : 'Gửi yêu cầu đổi trả'}
            </button>
            <Link
              to={`/orders/${id}`}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
