import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  AWAITING_SELLER_CONFIRM: 'Chờ xác nhận',
  SELLER_CONFIRMED: 'Đã xác nhận',
  PACKED: 'Đã đóng gói',
  HANDED_TO_CARRIER: 'Đã giao vận chuyển',
  SHIPPING: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  RETURN_REQUESTED: 'Yêu cầu đổi trả',
  RETURNED: 'Đã đổi trả',
  REFUNDED: 'Đã hoàn tiền',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  AWAITING_SELLER_CONFIRM: 'bg-blue-100 text-blue-700',
  SELLER_CONFIRMED: 'bg-blue-100 text-blue-700',
  PACKED: 'bg-indigo-100 text-indigo-700',
  HANDED_TO_CARRIER: 'bg-purple-100 text-purple-700',
  SHIPPING: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  RETURN_REQUESTED: 'bg-orange-100 text-orange-700',
  RETURNED: 'bg-gray-100 text-gray-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

const TIMELINE_STEPS = [
  { status: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { status: 'AWAITING_SELLER_CONFIRM', label: 'Chờ xác nhận' },
  { status: 'PACKED', label: 'Đóng gói' },
  { status: 'SHIPPING', label: 'Đang vận chuyển' },
  { status: 'COMPLETED', label: 'Hoàn thành' },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/orders/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => apiClient.post(`/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      toast.success('Đơn hàng đã được hủy');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowCancelModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể hủy đơn'),
  });

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-center">
      <p className="text-gray-500">Không tìm thấy đơn hàng</p>
      <Link to="/orders" className="btn-primary mt-4 inline-block">Về danh sách đơn</Link>
    </div>
  );

  const order = data;
  const canCancel = ['PENDING_PAYMENT', 'AWAITING_SELLER_CONFIRM'].includes(order.status);
  const canReturn = order.status === 'COMPLETED';

  const currentStep = TIMELINE_STEPS.findIndex(s => s.status === order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          ← Quay lại
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          Đơn hàng #{order.orderNumber}
        </h1>
        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {/* Timeline */}
      {!['CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'].includes(order.status) && (
        <div className="card p-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-4">Trạng thái đơn hàng</h2>
          <div className="flex items-center">
            {TIMELINE_STEPS.map((step, index) => (
              <div key={step.status} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold 
                    ${index <= currentStep ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs mt-1 text-center w-16 ${index <= currentStep ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {index < TIMELINE_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${index < currentStep ? 'bg-primary-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Address */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-2">Địa chỉ giao hàng</h2>
        {order.shippingAddress && (
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-800">{order.shippingAddress.recipientName}</p>
            <p>{order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.street}, {order.shippingAddress.district}, {order.shippingAddress.city}</p>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Sản phẩm đã đặt</h2>
        <div className="space-y-3">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex gap-3">
              <img
                src={item.skuImageSnapshot || 'https://via.placeholder.com/64'}
                alt={item.productNameSnapshot}
                className="w-16 h-16 object-cover rounded-lg border"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.productNameSnapshot}</p>
                {item.skuNameSnapshot && (
                  <p className="text-sm text-gray-500">{item.skuNameSnapshot}</p>
                )}
                <p className="text-sm text-gray-500">x{item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{Number(item.subtotal).toLocaleString('vi-VN')}₫</p>
                <p className="text-xs text-gray-400">{Number(item.unitPrice).toLocaleString('vi-VN')}₫/cái</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Tóm tắt thanh toán</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tiền hàng</span>
            <span>{Number(order.subtotalAmount).toLocaleString('vi-VN')}₫</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá</span>
              <span>-{Number(order.discountAmount).toLocaleString('vi-VN')}₫</span>
            </div>
          )}
          {order.voucherDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Voucher</span>
              <span>-{Number(order.voucherDiscount).toLocaleString('vi-VN')}₫</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Phí vận chuyển</span>
            <span>{Number(order.shippingFee).toLocaleString('vi-VN')}₫</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Tổng cộng</span>
            <span className="text-primary-600">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-2">Thanh toán</h2>
        <div className="text-sm text-gray-600">
          <p>Phương thức: <span className="font-medium">{order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : order.paymentMethod}</span></p>
          <p>Trạng thái: <span className="font-medium">{order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="border border-red-400 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 text-sm"
          >
            Hủy đơn hàng
          </button>
        )}
        {canReturn && (
          <Link
            to={`/orders/${id}/return`}
            className="border border-orange-400 text-orange-500 px-4 py-2 rounded-lg hover:bg-orange-50 text-sm"
          >
            Yêu cầu đổi trả
          </Link>
        )}
        {order.status === 'COMPLETED' && (
          <Link
            to={`/products/${order.items?.[0]?.sku?.product?.slug}`}
            className="btn-primary text-sm"
          >
            Mua lại
          </Link>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">Xác nhận hủy đơn hàng</h3>
            <textarea
              className="input w-full h-24 resize-none mb-4"
              placeholder="Lý do hủy đơn..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCancelModal(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Quay lại</button>
              <button
                onClick={() => cancelMutation.mutate(cancelReason || 'Người mua hủy đơn')}
                disabled={cancelMutation.isPending}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
