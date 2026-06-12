import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  AWAITING_SELLER_CONFIRM: 'Chờ xác nhận', SELLER_CONFIRMED: 'Đã xác nhận',
  PACKED: 'Đã đóng gói', HANDED_TO_CARRIER: 'Đã giao vận', SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy',
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: () => apiClient.get(`/admin/orders?page=${page}&limit=20${status ? `&status=${status}` : ''}`).then(r => r.data.data),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý đơn hàng</h1>

      <div className="flex gap-3 mb-4">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Mã đơn</th>
                <th className="text-left px-4 py-3 text-gray-500">Khách hàng</th>
                <th className="text-left px-4 py-3 text-gray-500">Shop</th>
                <th className="text-right px-4 py-3 text-gray-500">Tổng tiền</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((order: any) => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{order.user?.email}</td>
                  <td className="px-4 py-3 text-gray-500">{order.shop?.name}</td>
                  <td className="px-4 py-3 text-right font-medium">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data?.pagination && (
          <div className="p-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Tổng {data.pagination.total} đơn</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-40">Trước</button>
              <span className="px-3 py-1">Trang {page}/{data.pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.totalPages} className="px-3 py-1 border rounded disabled:opacity-40">Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
