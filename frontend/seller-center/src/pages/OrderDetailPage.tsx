import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { CheckCircle, Circle, Package, Truck, Home, XCircle, Clock, Printer, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  AWAITING_SELLER_CONFIRM: 'Chờ xác nhận',
  SELLER_CONFIRMED: 'Đã xác nhận',
  PACKED: 'Đã đóng gói',
  HANDED_TO_CARRIER: 'Đã giao vận chuyển',
  SHIPPING: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_SEQUENCE = [
  'AWAITING_SELLER_CONFIRM',
  'SELLER_CONFIRMED',
  'PACKED',
  'HANDED_TO_CARRIER',
  'SHIPPING',
  'DELIVERED',
  'COMPLETED',
];

const STATUS_ICONS: Record<string, any> = {
  AWAITING_SELLER_CONFIRM: Clock,
  SELLER_CONFIRMED: CheckCircle,
  PACKED: Package,
  HANDED_TO_CARRIER: Truck,
  SHIPPING: Truck,
  DELIVERED: Home,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [showPrint, setShowPrint] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['seller-order', id],
    queryFn: () => apiClient.get(`/seller/orders/${id}`).then(r => r.data.data),
  });

  const confirmOrder = useMutation({
    mutationFn: () => apiClient.patch(`/seller/orders/${id}/confirm`),
    onSuccess: () => { toast.success('Đã xác nhận đơn'); queryClient.invalidateQueries({ queryKey: ['seller-order', id] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const packOrder = useMutation({
    mutationFn: () => apiClient.patch(`/seller/orders/${id}/pack`),
    onSuccess: () => { toast.success('Đã đóng gói'); queryClient.invalidateQueries({ queryKey: ['seller-order', id] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const handoverMutation = useMutation({
    mutationFn: (data: { trackingNumber: string; carrier: string }) =>
      apiClient.patch(`/seller/orders/${id}/handover`, data),
    onSuccess: () => {
      toast.success('Đã giao cho đơn vị vận chuyển');
      queryClient.invalidateQueries({ queryKey: ['seller-order', id] });
      setShowTrackingModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const updateTrackingMutation = useMutation({
    mutationFn: (data: { trackingNumber: string; carrier: string }) =>
      apiClient.patch(`/seller/orders/${id}/tracking`, data),
    onSuccess: () => {
      toast.success('Đã cập nhật mã vận đơn');
      queryClient.invalidateQueries({ queryKey: ['seller-order', id] });
      setShowTrackingModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  if (isLoading) return (
    <div className="max-w-3xl animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="h-32 bg-gray-200 rounded" />
      <div className="h-48 bg-gray-200 rounded" />
    </div>
  );

  if (!order) return (
    <div className="max-w-3xl p-8 text-center text-gray-500">
      <p>Không tìm thấy đơn hàng</p>
      <Link to="/orders" className="text-primary-600 hover:underline mt-2 block">Quay lại danh sách</Link>
    </div>
  );

  const currentStatusIndex = STATUS_SEQUENCE.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  const timeline = order.statusHistory || STATUS_SEQUENCE.slice(0, currentStatusIndex + 1).map((s: string, i: number) => ({
    status: s,
    timestamp: i === currentStatusIndex ? order.updatedAt : null,
  }));

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="text-gray-400 hover:text-gray-600">← Quay lại</Link>
        <h1 className="text-2xl font-bold text-gray-800">Đơn hàng #{order.orderNumber}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isCancelled ? 'bg-red-100 text-red-700' :
          order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {/* Order Timeline */}
      {!isCancelled && (
        <div className="card p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Tiến trình đơn hàng</h3>
          <div className="flex items-start justify-between overflow-x-auto pb-2">
            {STATUS_SEQUENCE.map((status, idx) => {
              const Icon = STATUS_ICONS[status] || CheckCircle;
              const isPast = currentStatusIndex > idx;
              const isCurrent = currentStatusIndex === idx;
              return (
                <div key={status} className="flex flex-col items-center flex-1 min-w-0 relative">
                  {/* Connector line */}
                  {idx > 0 && (
                    <div className={`absolute top-4 right-1/2 left-0 h-0.5 -translate-y-1/2 ${
                      isPast || isCurrent ? 'bg-primary-500' : 'bg-gray-200'
                    }`} style={{ left: '-50%', right: '50%' }} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    isCurrent ? 'bg-primary-600 text-white shadow-md' :
                    isPast ? 'bg-primary-200 text-primary-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isPast ? <CheckCircle size={16} /> : <Icon size={16} />}
                  </div>
                  <p className={`text-xs mt-1.5 text-center leading-tight max-w-16 ${
                    isCurrent ? 'text-primary-600 font-semibold' :
                    isPast ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {STATUS_LABELS[status]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tracking Info */}
      {order.trackingNumber && (
        <div className="card p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-800">Thông tin vận chuyển</p>
              <p className="text-sm text-blue-700 mt-1">
                Đơn vị: <span className="font-medium">{order.carrier || '-'}</span>
              </p>
              <p className="text-sm text-blue-700">
                Mã vận đơn: <span className="font-mono font-bold">{order.trackingNumber}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowTrackingModal(true); setTrackingNumber(order.trackingNumber || ''); setCarrier(order.carrier || ''); }}
                className="text-xs text-blue-600 border border-blue-300 px-3 py-1 rounded hover:bg-blue-100"
              >
                Cập nhật
              </button>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-700">
                  <ExternalLink size={12} /> Theo dõi
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Customer Info */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Thông tin khách hàng</h3>
          <p className="text-sm text-gray-600">{order.user?.email}</p>
          {order.shippingAddress && (
            <div className="text-sm text-gray-500 mt-2 space-y-0.5">
              <p className="font-medium text-gray-700">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.addressLine}, {order.shippingAddress.district}, {order.shippingAddress.city}</p>
            </div>
          )}
        </div>

        {/* Payment Info */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Thanh toán</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Phương thức:</span>
              <span>{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Trạng thái:</span>
              <span className={order.paymentStatus === 'PAID' ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tiền hàng:</span>
              <span>{Number(order.subtotal || order.totalAmount).toLocaleString('vi-VN')}₫</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá:</span>
                <span>-{Number(order.discountAmount).toLocaleString('vi-VN')}₫</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Tổng:</span>
              <span className="text-primary-600">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="card overflow-hidden mb-6">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">Sản phẩm</h3>
          <button
            onClick={() => setShowPrint(true)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <Printer size={15} /> In phiếu giao hàng
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500">Sản phẩm</th>
              <th className="text-right px-4 py-3 text-gray-500">SL</th>
              <th className="text-right px-4 py-3 text-gray-500">Đơn giá</th>
              <th className="text-right px-4 py-3 text-gray-500">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: any) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} className="w-10 h-10 object-cover rounded" />
                    )}
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.skuAttributes && (
                        <p className="text-xs text-gray-400">
                          {typeof item.skuAttributes === 'string' ? item.skuAttributes : JSON.stringify(item.skuAttributes)}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{Number(item.unitPrice).toLocaleString('vi-VN')}₫</td>
                <td className="px-4 py-3 text-right font-medium">{Number(item.subtotal).toLocaleString('vi-VN')}₫</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Notes */}
      {order.notes && (
        <div className="card p-4 mb-6 bg-yellow-50 border-yellow-200">
          <p className="text-sm font-medium text-yellow-800 mb-1">Ghi chú từ khách hàng:</p>
          <p className="text-sm text-yellow-700">{order.notes}</p>
        </div>
      )}

      {/* Status History */}
      {timeline.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Lịch sử đơn hàng</h3>
          <div className="space-y-3">
            {timeline.map((entry: any, idx: number) => {
              const Icon = STATUS_ICONS[entry.status] || CheckCircle;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    idx === 0 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${idx === 0 ? 'text-primary-700' : 'text-gray-700'}`}>
                      {STATUS_LABELS[entry.status] || entry.status}
                    </p>
                    {entry.timestamp && (
                      <p className="text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleString('vi-VN')}
                      </p>
                    )}
                    {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        {order.status === 'AWAITING_SELLER_CONFIRM' && (
          <button onClick={() => confirmOrder.mutate()} disabled={confirmOrder.isPending}
            className="btn-primary disabled:opacity-50">
            {confirmOrder.isPending ? 'Đang xác nhận...' : 'Xác nhận đơn hàng'}
          </button>
        )}
        {order.status === 'SELLER_CONFIRMED' && (
          <button onClick={() => packOrder.mutate()} disabled={packOrder.isPending}
            className="btn-primary disabled:opacity-50">
            {packOrder.isPending ? 'Đang xử lý...' : 'Đã đóng gói'}
          </button>
        )}
        {order.status === 'PACKED' && (
          <button
            onClick={() => setShowTrackingModal(true)}
            className="btn-primary"
          >
            Giao cho vận chuyển
          </button>
        )}
        {(order.status === 'HANDED_TO_CARRIER' || order.status === 'SHIPPING') && !order.trackingNumber && (
          <button
            onClick={() => setShowTrackingModal(true)}
            className="btn-primary"
          >
            Thêm mã vận đơn
          </button>
        )}
      </div>

      {/* Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-lg mb-4">
              {order.status === 'PACKED' ? 'Giao cho đơn vị vận chuyển' : 'Cập nhật mã vận đơn'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Đơn vị vận chuyển *</label>
                <select
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Chọn đơn vị...</option>
                  {['GHN', 'GHTK', 'VNPost', 'J&T Express', 'Ninja Van', 'DHL', 'Khác'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mã vận đơn *</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="Nhập mã tracking..."
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowTrackingModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => {
                  const data = { trackingNumber, carrier };
                  if (order.status === 'PACKED') handoverMutation.mutate(data);
                  else updateTrackingMutation.mutate(data);
                }}
                disabled={!trackingNumber || !carrier || handoverMutation.isPending || updateTrackingMutation.isPending}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {(handoverMutation.isPending || updateTrackingMutation.isPending) ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 print:shadow-none">
            <div className="text-center mb-4">
              <h3 className="font-bold text-xl">PHIẾU GIAO HÀNG</h3>
              <p className="text-sm text-gray-500">#{order.orderNumber}</p>
            </div>
            <div className="border rounded-lg p-4 space-y-2 text-sm mb-4">
              <p><span className="font-medium">Người nhận:</span> {order.shippingAddress?.fullName}</p>
              <p><span className="font-medium">SĐT:</span> {order.shippingAddress?.phone}</p>
              <p><span className="font-medium">Địa chỉ:</span> {order.shippingAddress?.addressLine}, {order.shippingAddress?.district}, {order.shippingAddress?.city}</p>
              {order.trackingNumber && (
                <p><span className="font-medium">Mã vận đơn:</span> {order.trackingNumber}</p>
              )}
              <p><span className="font-medium">COD:</span> {order.paymentMethod === 'COD' ? `${Number(order.totalAmount).toLocaleString('vi-VN')}₫` : 'Đã thanh toán'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPrint(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Đóng</button>
              <button onClick={() => window.print()}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                <Printer size={15} /> In phiếu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
