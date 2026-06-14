import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, MapPin, Clock, ArrowLeft, Phone } from 'lucide-react';
import apiClient from '../api/client';

const STEP_CONFIG = [
  { key: 'ordered', label: 'Đặt hàng thành công', icon: <Package size={18} /> },
  { key: 'confirmed', label: 'Người bán xác nhận', icon: <CheckCircle size={18} /> },
  { key: 'packed', label: 'Đã đóng gói', icon: <Package size={18} /> },
  { key: 'shipped', label: 'Đang vận chuyển', icon: <Truck size={18} /> },
  { key: 'delivered', label: 'Đã giao hàng', icon: <CheckCircle size={18} /> },
];

const STATUS_TO_STEP: Record<string, number> = {
  PENDING_PAYMENT: 0,
  AWAITING_SELLER_CONFIRM: 1,
  SELLER_CONFIRMED: 1,
  PACKED: 2,
  HANDED_TO_CARRIER: 3,
  SHIPPING: 3,
  DELIVERED: 4,
  COMPLETED: 4,
};

export default function TrackingPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['order-tracking', id],
    queryFn: () => apiClient.get(`/orders/${id}`).then((r) => r.data.data),
    enabled: !!id,
    refetchInterval: 30000,
  });

  const order = data;
  const currentStep = order ? STATUS_TO_STEP[order.status] ?? 0 : 0;
  const shipment = order?.shipments?.[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Không tìm thấy đơn hàng</p>
        <Link to="/orders" className="mt-4 inline-block text-red-500 hover:underline">
          Quay lại đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/orders/${id}`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} />
        Quay lại chi tiết đơn hàng
      </Link>

      <h1 className="text-xl font-bold mb-2">Theo dõi đơn hàng</h1>
      <p className="text-gray-500 text-sm mb-6">Mã đơn: #{order.code}</p>

      {shipment && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={18} className="text-blue-600" />
            <span className="font-medium text-blue-800">Thông tin vận chuyển</span>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p><span className="font-medium">Đơn vị:</span> {shipment.carrier?.name || 'N/A'}</p>
            <p><span className="font-medium">Mã vận đơn:</span> {shipment.trackingCode || 'Chưa có'}</p>
            {shipment.estimatedDeliveryAt && (
              <p><span className="font-medium">Dự kiến giao:</span> {new Date(shipment.estimatedDeliveryAt).toLocaleDateString('vi-VN')}</p>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        {STEP_CONFIG.map((step, idx) => {
          const isDone = idx <= currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div key={step.key} className="flex gap-4 mb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isDone ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                >
                  {step.icon}
                </div>
                {idx < STEP_CONFIG.length - 1 && (
                  <div className={`w-0.5 h-12 mt-1 ${isDone && idx < currentStep ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="flex-1 pt-2 pb-10">
                <p className={`font-medium text-sm ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                {isCurrent && (
                  <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                    <Clock size={12} />
                    Trạng thái hiện tại
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {order.shippingAddress && (
        <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-red-500" />
            <span className="font-medium text-gray-700 text-sm">Địa chỉ giao hàng</span>
          </div>
          <p className="text-sm text-gray-600">
            {order.shippingAddress.fullName} — {order.shippingAddress.phone}
          </p>
          <p className="text-sm text-gray-500">
            {order.shippingAddress.addressLine}, {order.shippingAddress.district}, {order.shippingAddress.province}
          </p>
        </div>
      )}

      {shipment?.carrier?.hotline && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Phone size={14} />
          <span>Hotline: <a href={`tel:${shipment.carrier.hotline}`} className="text-blue-600 hover:underline">{shipment.carrier.hotline}</a></span>
        </div>
      )}
    </div>
  );
}
