import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
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

export default function SellerOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-orders', activeTab],
    queryFn: () => apiClient.get(`/seller/orders${activeTab !== 'all' ? `?status=${activeTab}` : ''}`).then(r => r.data.data),
  });

  const confirmOrder = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/seller/orders/${id}/confirm`),
    onSuccess: () => { toast.success('Đã xác nhận đơn hàng'); queryClient.invalidateQueries({ queryKey: ['seller-orders'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const packOrder = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/seller/orders/${id}/pack`),
    onSuccess: () => { toast.success('Đã đóng gói đơn hàng'); queryClient.invalidateQueries({ queryKey: ['seller-orders'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'AWAITING_SELLER_CONFIRM', label: 'Chờ xác nhận' },
    { key: 'SELLER_CONFIRMED', label: 'Đã xác nhận' },
    { key: 'PACKED', label: 'Đã đóng gói' },
    { key: 'COMPLETED', label: 'Hoàn thành' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Đơn hàng</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${activeTab === tab.key ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Đang tải...</div>
        ) : data?.data?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có đơn hàng</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Mã đơn</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Khách hàng</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tổng tiền</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((order: any) => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{order.user?.email}</td>
                  <td className="px-4 py-3 text-right font-medium">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {order.status === 'AWAITING_SELLER_CONFIRM' && (
                        <button onClick={() => confirmOrder.mutate(order.id)} className="text-green-600 text-xs hover:underline">Xác nhận</button>
                      )}
                      {order.status === 'SELLER_CONFIRMED' && (
                        <button onClick={() => packOrder.mutate(order.id)} className="text-blue-600 text-xs hover:underline">Đóng gói</button>
                      )}
                      <Link to={`/orders/${order.id}`} className="text-gray-500 text-xs hover:underline">Chi tiết</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
