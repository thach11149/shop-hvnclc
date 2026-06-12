import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  AWAITING_SELLER_CONFIRM: 'Chờ xác nhận',
  SELLER_CONFIRMED: 'Đã xác nhận',
  PACKED: 'Đã đóng gói',
  HANDED_TO_CARRIER: 'Đã giao vận chuyển',
  SHIPPING: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  RETURN_REQUESTED: 'Đang yêu cầu đổi trả',
  RETURNED: 'Đã đổi trả',
  REFUNDED: 'Đã hoàn tiền',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  AWAITING_SELLER_CONFIRM: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  SHIPPING: 'bg-purple-100 text-purple-700',
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: () => apiClient.get(`/orders${activeTab !== 'all' ? `?status=${activeTab}` : ''}`).then(r => r.data.data),
  });

  const cancelOrder = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(`/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      toast.success('Đơn hàng đã được hủy');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể hủy đơn'),
  });

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'PENDING_PAYMENT', label: 'Chờ TT' },
    { key: 'AWAITING_SELLER_CONFIRM', label: 'Chờ xác nhận' },
    { key: 'SHIPPING', label: 'Đang giao' },
    { key: 'COMPLETED', label: 'Hoàn thành' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Đơn hàng của tôi</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-800 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="card h-32 animate-pulse bg-gray-50" />)}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">📦</p>
          <p>Chưa có đơn hàng nào</p>
          <Link to="/products" className="btn-primary mt-4 inline-block">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.data?.map((order: any) => (
            <div key={order.id} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-gray-500">Đơn hàng #{order.orderNumber}</span>
                  <span className={`ml-3 px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <Link to={`/orders/${order.id}`} className="text-primary-600 text-sm hover:underline">
                  Chi tiết
                </Link>
              </div>

              {order.items?.slice(0, 2).map((item: any) => (
                <div key={item.id} className="flex gap-3 mb-2">
                  <img
                    src={item.skuImageSnapshot || item.sku?.product?.images?.[0]?.url || 'https://via.placeholder.com/48'}
                    alt={item.productNameSnapshot}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 line-clamp-1">{item.productNameSnapshot}</p>
                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">{Number(item.subtotal).toLocaleString('vi-VN')}₫</p>
                </div>
              ))}

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-sm font-bold">
                  Tổng: {Number(order.totalAmount).toLocaleString('vi-VN')}₫
                </span>
                <div className="flex gap-2">
                  {['PENDING_PAYMENT', 'AWAITING_SELLER_CONFIRM'].includes(order.status) && (
                    <button
                      onClick={() => cancelOrder.mutate({ id: order.id, reason: 'Người mua hủy đơn' })}
                      className="text-xs border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
                    >
                      Hủy đơn
                    </button>
                  )}
                  {order.status === 'COMPLETED' && (
                    <Link to={`/orders/${order.id}/return`} className="text-xs border border-orange-500 text-orange-500 px-3 py-1 rounded hover:bg-orange-50">
                      Đổi trả
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
