import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Printer, Truck, Package, CheckSquare, Square, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  AWAITING_SELLER_CONFIRM: 'Chờ xác nhận',
  SELLER_CONFIRMED: 'Đã xác nhận',
  PACKED: 'Đã đóng gói',
  HANDED_TO_CARRIER: 'Đã giao vận chuyển',
};

export default function OrderFulfillmentPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('AWAITING_SELLER_CONFIRM');
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['fulfillment-orders', statusFilter, search],
    queryFn: () =>
      apiClient
        .get('/seller/orders', {
          params: { status: statusFilter, search: search || undefined, limit: 50 },
        })
        .then((r) => r.data.data),
  });

  const bulkConfirmMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => apiClient.patch(`/orders/${id}/confirm`))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fulfillment-orders'] });
      setSelected([]);
      toast.success(`Đã xác nhận ${selected.length} đơn hàng`);
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const bulkPackMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => apiClient.patch(`/orders/${id}/pack`))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fulfillment-orders'] });
      setSelected([]);
      toast.success(`Đã cập nhật ${selected.length} đơn hàng`);
    },
  });

  const updateTrackingMutation = useMutation({
    mutationFn: ({ orderId, trackingCode }: { orderId: string; trackingCode: string }) =>
      apiClient.patch(`/orders/${orderId}/tracking`, { trackingCode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fulfillment-orders'] });
      toast.success('Đã cập nhật mã vận đơn');
    },
  });

  const orders = data?.items || [];
  const allSelected = orders.length > 0 && selected.length === orders.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : orders.map((o: any) => o.id));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const printSlips = () => {
    toast.success('Đang in phiếu giao hàng...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xử lý đơn hàng</h1>
          <p className="text-gray-500 text-sm mt-1">Xác nhận, đóng gói và giao đơn hàng</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <>
              <button
                onClick={printSlips}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <Printer size={16} />
                In phiếu ({selected.length})
              </button>
              {statusFilter === 'AWAITING_SELLER_CONFIRM' && (
                <button
                  onClick={() => bulkConfirmMutation.mutate(selected)}
                  disabled={bulkConfirmMutation.isPending}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  <CheckSquare size={16} />
                  Xác nhận ({selected.length})
                </button>
              )}
              {statusFilter === 'SELLER_CONFIRMED' && (
                <button
                  onClick={() => bulkPackMutation.mutate(selected)}
                  disabled={bulkPackMutation.isPending}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50"
                >
                  <Package size={16} />
                  Đóng gói ({selected.length})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([s, label]) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setSelected([]); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã đơn, tên khách..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <button onClick={toggleAll} className="flex items-center gap-1 text-sm text-gray-500">
              {allSelected ? <CheckSquare size={16} className="text-orange-500" /> : <Square size={16} />}
              Chọn tất cả
            </button>
            <span className="text-xs text-gray-400">({orders.length} đơn)</span>
          </div>
          <div className="divide-y divide-gray-100">
            {orders.map((order: any) => (
              <div key={order.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleOne(order.id)} className="mt-1">
                    {selected.includes(order.id) ? (
                      <CheckSquare size={18} className="text-orange-500" />
                    ) : (
                      <Square size={18} className="text-gray-300" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm">#{order.code}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-orange-600">
                        {Number(order.totalAmount).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.shippingAddress?.fullName} — {order.shippingAddress?.phone}
                    </p>
                    <p className="text-xs text-gray-500">{order.shippingAddress?.addressLine}, {order.shippingAddress?.province}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {statusFilter === 'HANDED_TO_CARRIER' && (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={trackingInputs[order.id] || ''}
                            onChange={(e) => setTrackingInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                            placeholder="Nhập mã vận đơn"
                            className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => updateTrackingMutation.mutate({ orderId: order.id, trackingCode: trackingInputs[order.id] || '' })}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            Cập nhật
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
