import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Search, Filter, Printer, Truck, CheckSquare, X, ChevronDown, Download } from 'lucide-react';
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

const STATUS_COLORS: Record<string, string> = {
  AWAITING_SELLER_CONFIRM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  SELLER_CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  PACKED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  HANDED_TO_CARRIER: 'bg-purple-50 text-purple-700 border-purple-200',
  SHIPPING: 'bg-orange-50 text-orange-700 border-orange-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

interface Filters {
  search: string;
  status: string;
  fromDate: string;
  toDate: string;
}

interface TrackingModal {
  open: boolean;
  orderIds: string[];
  trackingCode: string;
  carrierId: string;
}

interface ShippingLabelModal {
  open: boolean;
  label: any;
}

export default function SellerOrdersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>({ search: '', status: '', fromDate: '', toDate: '' });
  const [pendingFilters, setPendingFilters] = useState<Filters>({ search: '', status: '', fromDate: '', toDate: '' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [trackingModal, setTrackingModal] = useState<TrackingModal>({ open: false, orderIds: [], trackingCode: '', carrierId: '' });
  const [labelModal, setLabelModal] = useState<ShippingLabelModal>({ open: false, label: null });
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.set('status', filters.status);
  if (filters.search) queryParams.set('search', filters.search);
  if (filters.fromDate) queryParams.set('fromDate', filters.fromDate);
  if (filters.toDate) queryParams.set('toDate', filters.toDate);
  queryParams.set('page', String(page));
  queryParams.set('limit', '20');

  const { data, isLoading } = useQuery({
    queryKey: ['seller-orders-v2', filters, page],
    queryFn: () => apiClient.get(`/seller/orders?${queryParams}`).then(r => r.data.data),
  });

  const confirmOrder = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/seller/orders/${id}/confirm`),
    onSuccess: () => { toast.success('Đã xác nhận'); queryClient.invalidateQueries({ queryKey: ['seller-orders-v2'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const packOrder = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/seller/orders/${id}/pack`),
    onSuccess: () => { toast.success('Đã đóng gói'); queryClient.invalidateQueries({ queryKey: ['seller-orders-v2'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const bulkAction = useMutation({
    mutationFn: (payload: any) => apiClient.patch('/seller/orders/bulk', payload),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['seller-orders-v2'] });
      setSelectedIds(new Set());
      setTrackingModal(m => ({ ...m, open: false }));
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const fetchLabel = async (orderId: string) => {
    try {
      const res = await apiClient.get(`/seller/orders/${orderId}/shipping-label`);
      setLabelModal({ open: true, label: res.data.data });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi lấy phiếu');
    }
  };

  const orders: any[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const allSelected = orders.length > 0 && orders.every(o => selectedIds.has(o.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(orders.map(o => o.id)));
  };
  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const applyFilters = () => {
    setFilters({ ...pendingFilters });
    setPage(1);
    setSelectedIds(new Set());
  };

  const clearFilters = () => {
    const empty = { search: '', status: '', fromDate: '', toDate: '' };
    setPendingFilters(empty);
    setFilters(empty);
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Đơn hàng</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${hasActiveFilters ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
          >
            <Filter size={16} />
            Lọc nâng cao
            {hasActiveFilters && <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{Object.values(filters).filter(v => v).length}</span>}
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Quick search */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={pendingFilters.search}
            onChange={e => setPendingFilters(p => ({ ...p, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Tìm theo mã đơn, email khách..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <button onClick={applyFilters} className="btn-primary text-sm px-5">Tìm</button>
        {hasActiveFilters && <button onClick={clearFilters} className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"><X size={14} /> Xóa lọc</button>}
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="card p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái</label>
            <select
              value={pendingFilters.status}
              onChange={e => setPendingFilters(p => ({ ...p, status: e.target.value }))}
              className="input w-full"
            >
              <option value="">Tất cả</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
            <input
              type="date"
              value={pendingFilters.fromDate}
              onChange={e => setPendingFilters(p => ({ ...p, fromDate: e.target.value }))}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
            <input
              type="date"
              value={pendingFilters.toDate}
              onChange={e => setPendingFilters(p => ({ ...p, toDate: e.target.value }))}
              className="input w-full"
            />
          </div>
          <div className="flex items-end">
            <button onClick={applyFilters} className="btn-primary w-full text-sm">Áp dụng</button>
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <span className="text-sm text-blue-700 font-medium">{selectedIds.size} đơn được chọn</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => bulkAction.mutate({ orderIds: [...selectedIds], action: 'confirm' })}
              disabled={bulkAction.isPending}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckSquare size={14} /> Xác nhận đã giao
            </button>
            <button
              onClick={() => setTrackingModal({ open: true, orderIds: [...selectedIds], trackingCode: '', carrierId: '' })}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Truck size={14} /> Cập nhật tracking
            </button>
            <button
              onClick={() => {
                const firstId = [...selectedIds][0];
                if (firstId) fetchLabel(firstId);
              }}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Printer size={14} /> In phiếu
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có đơn hàng phù hợp</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Mã đơn</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Khách hàng</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ngày đặt</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tổng tiền</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id} className={`border-t hover:bg-gray-50 ${selectedIds.has(order.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleOne(order.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-700">{order.user?.buyerProfile?.fullName || order.user?.email}</p>
                      {order.user?.buyerProfile?.phone && (
                        <p className="text-xs text-gray-400">{order.user.buyerProfile.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {order.status === 'AWAITING_SELLER_CONFIRM' && (
                        <button onClick={() => confirmOrder.mutate(order.id)} className="text-green-600 text-xs hover:underline">Xác nhận</button>
                      )}
                      {order.status === 'SELLER_CONFIRMED' && (
                        <button onClick={() => packOrder.mutate(order.id)} className="text-blue-600 text-xs hover:underline">Đóng gói</button>
                      )}
                      <button onClick={() => fetchLabel(order.id)} className="text-gray-500 text-xs hover:underline flex items-center gap-1">
                        <Printer size={12} /> Phiếu
                      </button>
                      <Link to={`/orders/${order.id}`} className="text-gray-400 text-xs hover:underline">Chi tiết</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Tổng {total} đơn hàng</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded border text-sm disabled:opacity-40">Trước</button>
            <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded border text-sm disabled:opacity-40">Sau</button>
          </div>
        </div>
      )}

      {/* Tracking modal */}
      {trackingModal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-lg mb-4">Cập nhật mã tracking</h3>
            <p className="text-sm text-gray-600 mb-4">{trackingModal.orderIds.length} đơn đã chọn</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mã tracking</label>
                <input
                  value={trackingModal.trackingCode}
                  onChange={e => setTrackingModal(m => ({ ...m, trackingCode: e.target.value }))}
                  className="input w-full"
                  placeholder="VD: VN123456789"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Đơn vị vận chuyển</label>
                <select
                  value={trackingModal.carrierId}
                  onChange={e => setTrackingModal(m => ({ ...m, carrierId: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">Chọn đơn vị...</option>
                  <option value="ghn">GHN</option>
                  <option value="ghtk">GHTK</option>
                  <option value="jt">J&T Express</option>
                  <option value="vnpost">VN Post</option>
                  <option value="viettel">Viettel Post</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => bulkAction.mutate({
                  orderIds: trackingModal.orderIds,
                  action: 'tracking',
                  data: { trackingCode: trackingModal.trackingCode, carrierId: trackingModal.carrierId },
                })}
                disabled={!trackingModal.trackingCode || bulkAction.isPending}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {bulkAction.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
              <button onClick={() => setTrackingModal(m => ({ ...m, open: false }))} className="flex-1 btn-secondary">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping label modal */}
      {labelModal.open && labelModal.label && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold">Phiếu giao hàng</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Printer size={14} /> In
                </button>
                <button onClick={() => setLabelModal({ open: false, label: null })} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 text-sm" id="shipping-label">
              <div className="border-2 border-gray-800 p-4 rounded">
                <div className="text-center font-bold text-lg mb-3 border-b pb-3">PHIẾU GIAO HÀNG</div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Mã đơn</p>
                    <p className="font-bold font-mono">{labelModal.label.orderNumber}</p>
                  </div>
                  {labelModal.label.trackingCode && (
                    <div>
                      <p className="text-xs text-gray-500">Mã tracking</p>
                      <p className="font-bold font-mono">{labelModal.label.trackingCode}</p>
                    </div>
                  )}
                </div>
                <div className="mb-3 p-3 bg-gray-50 rounded">
                  <p className="text-xs font-semibold text-gray-500 mb-1">NGƯỜI GỬI</p>
                  <p className="font-medium">{labelModal.label.sender?.name}</p>
                  <p className="text-gray-600">{labelModal.label.sender?.address}</p>
                  <p className="text-gray-600">{labelModal.label.sender?.phone}</p>
                </div>
                <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs font-semibold text-blue-600 mb-1">NGƯỜI NHẬN</p>
                  <p className="font-bold text-lg">{labelModal.label.recipient?.name}</p>
                  <p className="text-gray-700">{labelModal.label.recipient?.phone}</p>
                  <p className="text-gray-700">{labelModal.label.recipient?.address}</p>
                </div>
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">HÀNG HÓA</p>
                  {labelModal.label.items?.map((item: any, i: number) => (
                    <p key={i} className="text-gray-700">• {item.name} x{item.quantity}</p>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-gray-600">Thu hộ (COD)</span>
                  <span className="font-bold text-xl text-red-600">
                    {Number(labelModal.label.codAmount || 0).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
