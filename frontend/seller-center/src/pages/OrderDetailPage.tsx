import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

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

  if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  if (!order) return <div className="p-8 text-center text-gray-500">Không tìm thấy đơn hàng</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="text-gray-400 hover:text-gray-600">← Quay lại</Link>
        <h1 className="text-2xl font-bold text-gray-800">Đơn hàng #{order.orderNumber}</h1>
        <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Thông tin khách hàng</h3>
          <p className="text-sm text-gray-600">{order.user?.email}</p>
          {order.shippingAddress && (
            <div className="text-sm text-gray-500 mt-2">
              <p>{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.addressLine}, {order.shippingAddress.district}, {order.shippingAddress.city}</p>
            </div>
          )}
        </div>
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Thanh toán</h3>
          <p className="text-sm text-gray-500">Phương thức: {order.paymentMethod}</p>
          <p className="text-sm font-medium mt-1">Tổng: {Number(order.totalAmount).toLocaleString('vi-VN')}₫</p>
        </div>
      </div>

      <div className="card overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-700">Sản phẩm</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500">Sản phẩm</th>
              <th className="text-right px-4 py-3 text-gray-500">Số lượng</th>
              <th className="text-right px-4 py-3 text-gray-500">Đơn giá</th>
              <th className="text-right px-4 py-3 text-gray-500">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: any) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.productName}</p>
                  {item.skuAttributes && <p className="text-xs text-gray-400">{JSON.stringify(item.skuAttributes)}</p>}
                </td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{Number(item.unitPrice).toLocaleString('vi-VN')}₫</td>
                <td className="px-4 py-3 text-right font-medium">{Number(item.subtotal).toLocaleString('vi-VN')}₫</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        {order.status === 'AWAITING_SELLER_CONFIRM' && (
          <button onClick={() => confirmOrder.mutate()} disabled={confirmOrder.isPending} className="btn-primary disabled:opacity-50">
            Xác nhận đơn hàng
          </button>
        )}
        {order.status === 'SELLER_CONFIRMED' && (
          <button onClick={() => packOrder.mutate()} disabled={packOrder.isPending} className="btn-primary disabled:opacity-50">
            Đóng gói
          </button>
        )}
      </div>
    </div>
  );
}
