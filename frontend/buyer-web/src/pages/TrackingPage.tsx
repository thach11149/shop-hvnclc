import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, MapPin, Clock, ArrowLeft, Phone, Box, ClipboardCheck, Home } from 'lucide-react';
import apiClient from '../api/client';

const STEP_CONFIG = [
  { key: 'ordered', label: 'Đặt hàng thành công', subLabel: 'Đơn hàng đã được tạo', icon: <ClipboardCheck size={16} /> },
  { key: 'confirmed', label: 'Người bán xác nhận', subLabel: 'Đơn hàng đang chuẩn bị', icon: <CheckCircle size={16} /> },
  { key: 'packed', label: 'Đã đóng gói', subLabel: 'Hàng đã được đóng gói', icon: <Box size={16} /> },
  { key: 'shipped', label: 'Đang vận chuyển', subLabel: 'Hàng đang trên đường giao', icon: <Truck size={16} /> },
  { key: 'delivered', label: 'Đã giao hàng', subLabel: 'Giao hàng thành công', icon: <Home size={16} /> },
];

const STATUS_TO_STEP: Record<string, number> = {
  PENDING_PAYMENT: 0,
  AWAITING_SELLER_CONFIRM: 0,
  SELLER_CONFIRMED: 1,
  PACKED: 2,
  HANDED_TO_CARRIER: 3,
  SHIPPING: 3,
  DELIVERED: 4,
  COMPLETED: 4,
};

export default function TrackingPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-tracking', id],
    queryFn: () => apiClient.get(`/orders/${id}`).then((r) => r.data.data),
    enabled: !!id,
    refetchInterval: 30000,
  });

  const { data: trackingData } = useQuery({
    queryKey: ['tracking-events', id],
    queryFn: () => apiClient.get(`/orders/${id}/tracking`).then((r) => r.data.data),
    enabled: !!id && !!order?.shipments?.[0]?.trackingCode,
    refetchInterval: 60000,
  });

  const currentStep = order ? (STATUS_TO_STEP[order.status] ?? 0) : 0;
  const shipment = order?.shipments?.[0];
  const trackingEvents: any[] = trackingData?.events || [];

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
        <ArrowLeft size={15} />
        Quay lại chi tiết đơn hàng
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Theo dõi đơn hàng</h1>
          <p className="text-gray-500 text-sm">Mã đơn: <span className="font-mono font-medium">#{order.code}</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Cập nhật lúc</p>
          <p className="text-xs text-gray-600">{new Date().toLocaleTimeString('vi-VN')}</p>
        </div>
      </div>

      {/* Shipment info */}
      {shipment && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-blue-800 text-sm">
                {shipment.carrier?.name || 'Đơn vị vận chuyển'}
              </p>
              {shipment.carrier?.hotline && (
                <a href={`tel:${shipment.carrier.hotline}`} className="text-xs text-blue-600 flex items-center gap-0.5 hover:underline">
                  <Phone size={10} /> {shipment.carrier.hotline}
                </a>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-blue-600 font-medium">Mã vận đơn</p>
              <p className="font-mono text-blue-900 font-bold">{shipment.trackingCode || 'Chưa có'}</p>
            </div>
            {shipment.estimatedDeliveryAt && (
              <div>
                <p className="text-xs text-blue-600 font-medium">Dự kiến giao</p>
                <p className="text-blue-900 font-bold">
                  {new Date(shipment.estimatedDeliveryAt).toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress steps */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h2 className="font-bold text-gray-800 mb-5">Trạng thái đơn hàng</h2>
        <div className="relative">
          {STEP_CONFIG.map((step, idx) => {
            const isDone = idx <= currentStep;
            const isCurrent = idx === currentStep;
            const isLast = idx === STEP_CONFIG.length - 1;

            return (
              <div key={step.key} className="flex gap-4">
                {/* Icon + line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isDone
                        ? isCurrent
                          ? 'bg-green-500 text-white ring-4 ring-green-100'
                          : 'bg-green-400 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.icon}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 h-10 mt-1 ${isDone && idx < currentStep ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1.5 pb-8">
                  <p className={`font-semibold text-sm ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${isDone ? 'text-gray-500' : 'text-gray-300'}`}>
                    {step.subLabel}
                  </p>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      <Clock size={10} />
                      Trạng thái hiện tại
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracking events from carrier */}
      {trackingEvents.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">Lịch sử vận chuyển</h2>
          <div className="relative">
            {trackingEvents.map((event: any, idx: number) => (
              <div key={idx} className="flex gap-4 mb-4 last:mb-0">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${idx === 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {idx < trackingEvents.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className={`text-sm font-medium ${idx === 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                    {event.description || event.status}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {event.location && `${event.location} · `}
                    {new Date(event.time || event.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping address */}
      {order.shippingAddress && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-red-500 flex-shrink-0" />
            <span className="font-semibold text-gray-700 text-sm">Địa chỉ giao hàng</span>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {order.shippingAddress.fullName}
          </p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <Phone size={12} className="flex-shrink-0" />
            {order.shippingAddress.phone}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {[order.shippingAddress.addressLine, order.shippingAddress.ward, order.shippingAddress.district, order.shippingAddress.province]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
