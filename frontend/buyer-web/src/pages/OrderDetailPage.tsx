import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Star, RefreshCw, AlertTriangle, Truck, CheckCircle, Package, Clock, XCircle } from 'lucide-react';
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
  { status: 'PENDING_PAYMENT', label: 'Đặt hàng', icon: Clock },
  { status: 'SELLER_CONFIRMED', label: 'Xác nhận', icon: CheckCircle },
  { status: 'PACKED', label: 'Đóng gói', icon: Package },
  { status: 'SHIPPING', label: 'Vận chuyển', icon: Truck },
  { status: 'COMPLETED', label: 'Hoàn thành', icon: CheckCircle },
];

const STATUS_SEQUENCE = [
  'PENDING_PAYMENT', 'AWAITING_SELLER_CONFIRM', 'SELLER_CONFIRMED',
  'PACKED', 'HANDED_TO_CARRIER', 'SHIPPING', 'DELIVERED', 'COMPLETED',
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reviewItem, setReviewItem] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hoverStar, setHoverStar] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/orders/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: disputeData } = useQuery({
    queryKey: ['order-dispute', id],
    queryFn: () => apiClient.get(`/orders/${id}/disputes`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: trackingData } = useQuery({
    queryKey: ['order-tracking', id],
    queryFn: () => apiClient.get(`/orders/${id}/tracking`).then(r => r.data.data),
    enabled: !!data?.trackingNumber,
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

  const reorderMutation = useMutation({
    mutationFn: () => apiClient.post(`/orders/${id}/reorder`),
    onSuccess: (res) => {
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
      navigate('/cart');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể mua lại'),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ itemId, rating, comment }: { itemId: string; rating: number; comment: string }) =>
      apiClient.post(`/orders/${id}/items/${itemId}/review`, { rating, comment }),
    onSuccess: () => {
      toast.success('Đã gửi đánh giá!');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setReviewItem(null);
      setReviewComment('');
      setReviewRating(5);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi gửi đánh giá'),
  });

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
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
  const canReview = order.status === 'COMPLETED';
  const canReorder = ['COMPLETED', 'CANCELLED'].includes(order.status);
  const canDispute = ['DELIVERED', 'COMPLETED', 'SHIPPING'].includes(order.status);
  const isCancelled = order.status === 'CANCELLED';

  const currentIdx = STATUS_SEQUENCE.indexOf(order.status);
  const timelineIdx = TIMELINE_STEPS.findIndex(s => STATUS_SEQUENCE.indexOf(s.status) >= currentIdx);

  const activeDispute = Array.isArray(disputeData) ? disputeData.find((d: any) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW') : disputeData;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">← Quay lại</button>
        <h1 className="text-xl font-bold text-gray-800">Đơn hàng #{order.orderNumber}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {/* Dispute Banner */}
      {activeDispute && (
        <div className="card p-4 mb-4 bg-orange-50 border-orange-300 flex items-start gap-3">
          <AlertTriangle size={18} className="text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">Đang có tranh chấp mở</p>
            <p className="text-xs text-orange-600 mt-0.5">{activeDispute.reason}</p>
          </div>
          <Link to={`/disputes/${activeDispute.id}`}
            className="text-xs text-orange-700 border border-orange-400 px-3 py-1 rounded-lg hover:bg-orange-100 shrink-0">
            Xem chi tiết
          </Link>
        </div>
      )}

      {/* Progress Timeline */}
      {!isCancelled && !['RETURN_REQUESTED', 'RETURNED', 'REFUNDED'].includes(order.status) && (
        <div className="card p-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-4 text-sm">Trạng thái đơn hàng</h2>
          <div className="flex items-start justify-between">
            {TIMELINE_STEPS.map((step, index) => {
              const Icon = step.icon;
              const stepSeqIdx = STATUS_SEQUENCE.indexOf(step.status);
              const isPast = currentIdx > stepSeqIdx;
              const isCurrent = Math.abs(currentIdx - stepSeqIdx) <= 1 && index === Math.min(timelineIdx, TIMELINE_STEPS.length - 1);
              return (
                <div key={step.status} className="flex flex-col items-center flex-1 relative">
                  {index > 0 && (
                    <div className={`absolute top-4 h-0.5 -translate-y-1/2 ${isPast ? 'bg-primary-500' : 'bg-gray-200'}`}
                      style={{ left: '-50%', right: '50%' }} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    isPast ? 'bg-primary-200 text-primary-600' :
                    isCurrent ? 'bg-primary-600 text-white shadow-md' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <span className={`text-xs mt-1.5 text-center leading-tight max-w-14 ${
                    isCurrent ? 'text-primary-600 font-semibold' : isPast ? 'text-gray-600' : 'text-gray-400'
                  }`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tracking Info */}
      {order.trackingNumber && (
        <div className="card p-4 mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <Truck size={16} /> Thông tin vận chuyển
            </p>
            {order.trackingUrl && (
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline">Theo dõi →</a>
            )}
          </div>
          <div className="text-sm text-blue-700 space-y-0.5">
            <p>Đơn vị: <span className="font-medium">{order.carrier}</span></p>
            <p>Mã vận đơn: <span className="font-mono font-bold">{order.trackingNumber}</span></p>
          </div>

          {/* Tracking History */}
          {trackingData?.events?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs font-semibold text-blue-700 mb-2">Lịch sử vận chuyển</p>
              <div className="space-y-2">
                {trackingData.events.slice(0, 5).map((evt: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-blue-600' : 'bg-blue-300'}`} />
                    <div>
                      <p className="text-xs text-blue-800">{evt.description || evt.status}</p>
                      <p className="text-xs text-blue-500">{new Date(evt.timestamp || evt.time).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shipping Address */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-2 text-sm">Địa chỉ giao hàng</h2>
        {order.shippingAddress && (
          <div className="text-sm text-gray-600 space-y-0.5">
            <p className="font-medium text-gray-800">{order.shippingAddress.recipientName || order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.street || order.shippingAddress.addressLine}, {order.shippingAddress.district}, {order.shippingAddress.city}</p>
          </div>
        )}
      </div>

      {/* Order Items with per-item review */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3 text-sm">Sản phẩm đã đặt</h2>
        <div className="space-y-4">
          {order.items?.map((item: any) => (
            <div key={item.id}>
              <div className="flex gap-3">
                <img
                  src={item.skuImageSnapshot || item.productImage || 'https://via.placeholder.com/64'}
                  alt={item.productNameSnapshot || item.productName}
                  className="w-16 h-16 object-cover rounded-lg border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm line-clamp-2">
                    {item.productNameSnapshot || item.productName}
                  </p>
                  {(item.skuNameSnapshot || item.skuName) && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.skuNameSnapshot || item.skuName}</p>
                  )}
                  <p className="text-xs text-gray-500">x{item.quantity}</p>

                  {/* Review status / button */}
                  {canReview && (
                    item.reviewed || item.review ? (
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={11}
                            className={s <= (item.review?.rating || item.reviewed?.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                        <span className="text-xs text-green-600 ml-1">Đã đánh giá</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setReviewItem(item); setReviewRating(5); setReviewComment(''); }}
                        className="text-xs text-primary-600 hover:underline mt-1 flex items-center gap-1"
                      >
                        <Star size={11} /> Đánh giá sản phẩm
                      </button>
                    )
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">{Number(item.subtotal).toLocaleString('vi-VN')}₫</p>
                  <p className="text-xs text-gray-400">{Number(item.unitPrice).toLocaleString('vi-VN')}₫/cái</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3 text-sm">Tóm tắt thanh toán</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tiền hàng</span>
            <span>{Number(order.subtotalAmount || order.subtotal).toLocaleString('vi-VN')}₫</span>
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
            <span>{Number(order.shippingFee || 0).toLocaleString('vi-VN')}₫</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Tổng cộng</span>
            <span className="text-primary-600">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-2 text-sm">Thanh toán</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Phương thức:</span>
            <span className="font-medium">{order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : order.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Trạng thái:</span>
            <span className={`font-medium ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
              {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end flex-wrap">
        {canCancel && (
          <button onClick={() => setShowCancelModal(true)}
            className="border border-red-400 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 text-sm">
            Hủy đơn
          </button>
        )}
        {canReturn && (
          <Link to={`/orders/${id}/return`}
            className="border border-orange-400 text-orange-500 px-4 py-2 rounded-lg hover:bg-orange-50 text-sm">
            Đổi trả
          </Link>
        )}
        {canDispute && !activeDispute && (
          <Link to={`/orders/${id}/dispute`}
            className="flex items-center gap-1 border border-red-400 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm">
            <AlertTriangle size={14} /> Tranh chấp
          </Link>
        )}
        {canReorder && (
          <button
            onClick={() => reorderMutation.mutate()}
            disabled={reorderMutation.isPending}
            className="flex items-center gap-2 btn-primary text-sm disabled:opacity-50"
          >
            <RefreshCw size={15} />
            {reorderMutation.isPending ? 'Đang xử lý...' : 'Mua lại'}
          </button>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">Xác nhận hủy đơn hàng</h3>
            <p className="text-sm text-gray-500 mb-3">Chọn lý do hủy:</p>
            <div className="space-y-2 mb-4">
              {[
                'Tôi muốn thay đổi địa chỉ giao hàng',
                'Tôi muốn thay đổi sản phẩm/số lượng',
                'Tìm được giá tốt hơn',
                'Không còn nhu cầu',
                'Lý do khác',
              ].map(reason => (
                <label key={reason} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                  cancelReason === reason ? 'bg-primary-50 border border-primary-300' : 'hover:bg-gray-50'
                }`}>
                  <input type="radio" name="cancelReason" value={reason}
                    checked={cancelReason === reason} onChange={() => setCancelReason(reason)} />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Giữ đơn</button>
              <button
                onClick={() => cancelMutation.mutate(cancelReason || 'Người mua hủy đơn')}
                disabled={!cancelReason || cancelMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">Đánh giá sản phẩm</h3>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={reviewItem.skuImageSnapshot || reviewItem.productImage || 'https://via.placeholder.com/48'}
                alt={reviewItem.productNameSnapshot || reviewItem.productName}
                className="w-12 h-12 object-cover rounded"
              />
              <div>
                <p className="text-sm font-medium">{reviewItem.productNameSnapshot || reviewItem.productName}</p>
                {reviewItem.skuNameSnapshot && <p className="text-xs text-gray-500">{reviewItem.skuNameSnapshot}</p>}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Đánh giá của bạn</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={star <= (hoverStar || reviewRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reviewRating === 5 ? 'Tuyệt vời' : reviewRating === 4 ? 'Tốt' : reviewRating === 3 ? 'Bình thường' : reviewRating === 2 ? 'Không hài lòng' : 'Rất tệ'}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét</label>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setReviewItem(null); setReviewComment(''); setReviewRating(5); }}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => reviewMutation.mutate({ itemId: reviewItem.id, rating: reviewRating, comment: reviewComment })}
                disabled={reviewMutation.isPending}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Star size={15} className="fill-current" />
                {reviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
