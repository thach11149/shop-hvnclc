import { useQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  AWAITING_SELLER_CONFIRM: 'Chờ xác nhận',
  SELLER_CONFIRMED: 'Đã xác nhận',
  PACKED: 'Đã đóng gói',
  HANDED_TO_CARRIER: 'Đã giao vận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  SHIPPING: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-teal-100 text-teal-700',
  PACKED: 'bg-purple-100 text-purple-700',
  AWAITING_SELLER_CONFIRM: 'bg-yellow-100 text-yellow-700',
  SELLER_CONFIRMED: 'bg-orange-100 text-orange-700',
  HANDED_TO_CARRIER: 'bg-indigo-100 text-indigo-700',
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status, search, dateFrom, dateTo],
    queryFn: () => apiClient.get(`/admin/orders?${buildQuery()}`).then(r => r.data.data),
  });

  const orders: any[] = data?.data || [];
  const pagination = data?.pagination;

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
    setSelected(new Set());
  };

  const allIds = orders.map(o => o.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const baseUrl = (apiClient.defaults.baseURL || '').replace(/\/$/, '');
    const params = new URLSearchParams();
    params.set('format', 'csv');
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    const url = `${baseUrl}/admin/export/orders?${params.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    if (token) a.href = `${url}&token=${encodeURIComponent(token)}`;
    a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const selectedCount = selected.size;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Download size={16} /> Xuất CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              className="input pl-9 w-full"
              placeholder="Tìm theo mã đơn hoặc email..."
            />
          </div>
          <select
            value={status}
            onChange={handleFilterChange(setStatus)}
            className="input min-w-[160px]"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={handleFilterChange(setDateFrom)}
              className="input text-sm"
            />
            <span className="text-gray-400 text-sm">đến</span>
            <input
              type="date"
              value={dateTo}
              onChange={handleFilterChange(setDateTo)}
              className="input text-sm"
            />
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <span className="text-sm font-medium text-orange-700">Đã chọn {selectedCount} đơn</span>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700 px-3 py-1 border rounded"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-4 py-3 text-gray-500">Mã đơn</th>
                <th className="text-left px-4 py-3 text-gray-500">Khách hàng</th>
                <th className="text-left px-4 py-3 text-gray-500">Shop</th>
                <th className="text-right px-4 py-3 text-gray-500">Tổng tiền</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Không có đơn hàng nào</td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className={`border-t hover:bg-gray-50 ${selected.has(order.id) ? 'bg-orange-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(order.id)}
                        onChange={() => toggleOne(order.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{order.user?.email || order.buyerEmail || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{order.shop?.name || order.shopName || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {pagination && (
          <div className="p-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Tổng {pagination.total} đơn</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1">Trang {page} / {pagination.totalPages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pagination.totalPages}
                className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
