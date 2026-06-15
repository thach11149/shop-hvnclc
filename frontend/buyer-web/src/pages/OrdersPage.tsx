import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Calendar, X, Package, RotateCcw, Star, ShoppingCart } from 'lucide-react';
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
  SELLER_CONFIRMED: 'bg-blue-100 text-blue-700',
  PACKED: 'bg-indigo-100 text-indigo-700',
  HANDED_TO_CARRIER: 'bg-purple-100 text-purple-700',
  SHIPPING: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  RETURN_REQUESTED: 'bg-orange-100 text-orange-700',
  RETURNED: 'bg-gray-100 text-gray-600',
  REFUNDED: 'bg-gray-100 text-gray-600',
};

const CANCEL_REASONS = [
  'Tôi muốn thay đổi địa chỉ giao hàng',
  'Tôi muốn thay đổi phương thức thanh toán',
  'Tôi tìm được giá tốt hơn ở nơi khác',
  'Tôi không muốn mua nữa',
  'Sản phẩm giao hàng quá lâu',
  'Lý do khác',
];

const DATE_RANGES = [
  { label: '7 ngày', value: 7 },
  { label: '30 ngày', value: 30 },
  { label: '90 ngày', value: 90 },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateRange, setDateRange] = useState<number | null>(null);
  const [cancelModal, setCancelModal] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const queryClient = useQueryClient();

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('status', activeTab);
    if (search) params.set('search', search);
    if (dateRange) {
      const from = new Date();
      from.setDate(from.getDate() - dateRange);
      params.set('from', from.toISOString());
    }
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['orders', activeTab, search, dateRange],
    queryFn: () => {
      const q = buildQuery();
      return apiClient.get(`/orders${q ? '?' + q : ''}`).then(r => r.data.data);
    },
  });

  const cancelOrder = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(`/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      toast.success('Đơn hàng đã được hủy');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCancelModal(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể hủy đơn'),
  });

  const buyAgain = useMutation({
    mutationFn: (orderId: string) => apiClient.post(`/orders/${orderId}/reorder`),
    onSuccess: () => {
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể mua lại'),
  });

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'PENDING_PAYMENT', label: 'Chờ TT' },
    { key: 'AWAITING_SELLER_CONFIRM', label: 'Chờ XN' },
    { key: 'SHIPPING', label: 'Đang giao' },
    { key: 'DELIVERED', label: 'Đã giao' },
    { key: 'COMPLETED', label: 'Hoàn thành' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ];

  const orders: any[] = data?.data || data || [];
  const hasFilters = search || dateRange !== null || activeTab !== 'all';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setActiveTab('all');
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setDateRange(null);
    setActiveTab('all');
  };

  const handleCancelSubmit = () => {
    if (!cancelModal) return;
    const reason = cancelReason === 'Lý do khác' ? (customReason || 'Người mua hủy đơn') : cancelReason;
    cancelOrder.mutate({ id: cancelModal.orderId, reason });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Đơn hàng của tôi</h1>

      {/* Search & Date Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm mã đơn, tên sản phẩm..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm">Tìm</button>
        </form>

        <div className="flex items-center gap-1">
          <Calendar size={15} className="text-gray-400" />
          {DATE_RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setDateRange(prev => prev === r.value ? null : r.value)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                dateRange === r.value
                  ? 'border-primary-500 bg-primary-50 text-primary-600 font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 px-1">
            <X size={14} /> Xóa
          </button>
        )}
      </div>

      {/* Status Tabs */}
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

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="card h-32 animate-pulse bg-gray-50" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-lg mb-2">{hasFilters ? 'Không tìm thấy đơn hàng' : 'Chưa có đơn hàng nào'}</p>
          {hasFilters ? (
            <button onClick={clearFilters} className="text-primary-600 text-sm hover:underline mt-2">Xóa bộ lọc</button>
          ) : (
            <Link to="/products" className="btn-primary mt-4 inline-block">Mua sắm ngay</Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono">#{order.orderNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''}
                  </span>
                  <Link to={`/orders/${order.id}`} className="text-primary-600 text-sm hover:underline font-medium">
                    Chi tiết
                  </Link>
                </div>
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
              {order.items?.length > 2 && (
                <p className="text-xs text-gray-400 mb-2">+{order.items.length - 2} sản phẩm khác</p>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-sm font-bold">
                  Tổng: <span className="text-primary-600">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</span>
                </span>
                <div className="flex gap-2 flex-wrap justify-end">
                  {order.status === 'DELIVERED' && (
                    <button className="flex items-center gap-1 text-xs border border-green-500 text-green-600 px-3 py-1.5 rounded hover:bg-green-50">
                      <Package size={12} /> Đã nhận hàng
                    </button>
                  )}
                  {order.status === 'SHIPPING' && (
                    <Link
                      to={`/orders/${order.id}/tracking`}
                      className="flex items-center gap-1 text-xs border border-purple-400 text-purple-600 px-3 py-1.5 rounded hover:bg-purple-50"
                    >
                      Theo dõi
                    </Link>
                  )}
                  {order.status === 'COMPLETED' && (
                    <>
                      <button
                        onClick={() => buyAgain.mutate(order.id)}
                        disabled={buyAgain.isPending}
                        className="flex items-center gap-1 text-xs border border-primary-400 text-primary-600 px-3 py-1.5 rounded hover:bg-primary-50 disabled:opacity-50"
                      >
                        <ShoppingCart size={12} /> Mua lại
                      </button>
                      <Link
                        to={`/orders/${order.id}?review=true`}
                        className="flex items-center gap-1 text-xs border border-yellow-400 text-yellow-600 px-3 py-1.5 rounded hover:bg-yellow-50"
                      >
                        <Star size={12} /> Đánh giá
                      </Link>
                      <Link
                        to={`/orders/${order.id}/return`}
                        className="flex items-center gap-1 text-xs border border-orange-400 text-orange-500 px-3 py-1.5 rounded hover:bg-orange-50"
                      >
                        <RotateCcw size={12} /> Đổi trả
                      </Link>
                    </>
                  )}
                  {['PENDING_PAYMENT', 'AWAITING_SELLER_CONFIRM'].includes(order.status) && (
                    <button
                      onClick={() => setCancelModal({ orderId: order.id, orderNumber: order.orderNumber })}
                      className="text-xs border border-gray-300 text-gray-500 px-3 py-1.5 rounded hover:bg-gray-50"
                    >
                      Hủy đơn
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-800">Hủy đơn #{cancelModal.orderNumber}?</h3>
              <p className="text-sm text-gray-500 mt-1">Vui lòng chọn lý do hủy đơn</p>
            </div>
            <div className="p-5 space-y-2.5">
              {CANCEL_REASONS.map(reason => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="text-primary-500"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
              {cancelReason === 'Lý do khác' && (
                <textarea
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể..."
                  rows={2}
                  className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                />
              )}
            </div>
            <div className="flex gap-2 justify-end p-5 border-t">
              <button onClick={() => setCancelModal(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                Giữ đơn
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={cancelOrder.isPending || (cancelReason === 'Lý do khác' && !customReason.trim())}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {cancelOrder.isPending ? 'Đang hủy...' : 'Hủy đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
