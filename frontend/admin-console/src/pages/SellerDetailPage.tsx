import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ShoppingBag, Star, TrendingUp, Users, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const SHOP_STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  AWAITING_SELLER_CONFIRM: 'Chờ xác nhận',
  SELLER_CONFIRMED: 'Đã xác nhận',
  PACKED: 'Đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const TIERS = [
  { value: 5, label: 'Đồng (5%)', color: 'text-yellow-700 bg-yellow-50' },
  { value: 8, label: 'Bạc (8%)', color: 'text-gray-500 bg-gray-100' },
  { value: 10, label: 'Vàng (10%)', color: 'text-yellow-500 bg-yellow-50' },
  { value: 12, label: 'Kim cương (12%)', color: 'text-blue-600 bg-blue-50' },
  { value: 15, label: 'Nền tảng (15%)', color: 'text-purple-600 bg-purple-50' },
];

function MiniChart({ data }: { data: number[] }) {
  if (!data?.length) return null;
  const max = Math.max(...data, 1);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 40`} className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline
        points={data.map((v, i) => `${i * w + w/2},${40 - (v/max)*36}`).join(' ')}
        fill="none" stroke="#6366f1" strokeWidth="1.5"
      />
    </svg>
  );
}

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'info' | 'stats' | 'products' | 'orders'>('info');
  const [showTierModal, setShowTierModal] = useState(false);
  const [newCommission, setNewCommission] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const { data: seller, isLoading } = useQuery({
    queryKey: ['admin-seller', id],
    queryFn: () => apiClient.get(`/admin/sellers/${id}`).then(r => r.data.data),
  });

  const { data: analytics } = useQuery({
    queryKey: ['admin-seller-analytics', id],
    queryFn: () => apiClient.get(`/admin/sellers/${id}/analytics`).then(r => r.data.data),
    enabled: tab === 'stats',
  });

  const { data: sellerProducts } = useQuery({
    queryKey: ['admin-seller-products', id],
    queryFn: () => apiClient.get(`/admin/products?shopId=${id}&limit=20`).then(r => r.data.data),
    enabled: tab === 'products',
  });

  const { data: sellerOrders } = useQuery({
    queryKey: ['admin-seller-orders', id],
    queryFn: () => apiClient.get(`/admin/orders?shopId=${id}&limit=20`).then(r => r.data.data),
    enabled: tab === 'orders',
  });

  const approve = useMutation({
    mutationFn: () => apiClient.patch(`/admin/sellers/${id}/approve`),
    onSuccess: () => { toast.success('Đã duyệt người bán'); queryClient.invalidateQueries({ queryKey: ['admin-seller', id] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const reject = useMutation({
    mutationFn: () => apiClient.patch(`/admin/sellers/${id}/reject`),
    onSuccess: () => { toast.success('Đã từ chối'); queryClient.invalidateQueries({ queryKey: ['admin-seller', id] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const suspend = useMutation({
    mutationFn: (reason: string) => apiClient.patch(`/admin/sellers/${id}/suspend`, { reason }),
    onSuccess: () => {
      toast.success('Đã tạm dừng shop');
      queryClient.invalidateQueries({ queryKey: ['admin-seller', id] });
      setShowSuspendModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const unsuspend = useMutation({
    mutationFn: () => apiClient.patch(`/admin/sellers/${id}/unsuspend`),
    onSuccess: () => { toast.success('Đã khôi phục shop'); queryClient.invalidateQueries({ queryKey: ['admin-seller', id] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const updateTier = useMutation({
    mutationFn: (commissionRate: number) => apiClient.patch(`/admin/sellers/${id}/commission`, { commissionRate }),
    onSuccess: () => {
      toast.success('Đã cập nhật tier/hoa hồng');
      queryClient.invalidateQueries({ queryKey: ['admin-seller', id] });
      setShowTierModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  if (isLoading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-48 bg-gray-200 rounded" />
    </div>
  );

  if (!seller) return (
    <div className="text-center py-16 text-gray-500">
      <p>Không tìm thấy người bán</p>
      <Link to="/sellers" className="text-primary-600 hover:underline mt-2 block">Quay lại</Link>
    </div>
  );

  const shop = seller.shop;
  const currentTier = TIERS.find(t => t.value === shop?.commissionRate) || TIERS[2];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/sellers" className="text-gray-500 hover:text-gray-700">← Người bán</Link>
          <div className="flex items-center gap-3">
            {shop?.logo ? (
              <img src={shop.logo} alt={shop.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
                {shop?.name?.[0]}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-800">{shop?.name || 'Shop'}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-xs ${SHOP_STATUS_COLORS[shop?.status] || 'bg-gray-100'}`}>
                  {shop?.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${currentTier.color}`}>
                  {currentTier.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {shop?.status === 'PENDING_APPROVAL' && (
            <>
              <button onClick={() => approve.mutate()} disabled={approve.isPending}
                className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                <CheckCircle size={15} /> {approve.isPending ? '...' : 'Duyệt'}
              </button>
              <button onClick={() => reject.mutate()} disabled={reject.isPending}
                className="flex items-center gap-1 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
                <XCircle size={15} /> {reject.isPending ? '...' : 'Từ chối'}
              </button>
            </>
          )}
          {(shop?.status === 'APPROVED' || shop?.status === 'ACTIVE') && (
            <button onClick={() => setShowSuspendModal(true)}
              className="border border-orange-500 text-orange-500 px-4 py-2 rounded-lg text-sm hover:bg-orange-50">
              Tạm dừng
            </button>
          )}
          {shop?.status === 'SUSPENDED' && (
            <button onClick={() => unsuspend.mutate()} disabled={unsuspend.isPending}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
              {unsuspend.isPending ? '...' : 'Khôi phục'}
            </button>
          )}
          <button onClick={() => setShowTierModal(true)}
            className="border border-primary-500 text-primary-600 px-4 py-2 rounded-lg text-sm hover:bg-primary-50">
            Đổi tier
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {[
          { key: 'info', label: 'Thông tin' },
          { key: 'stats', label: 'Thống kê' },
          { key: 'products', label: 'Sản phẩm' },
          { key: 'orders', label: 'Đơn hàng' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              tab === t.key ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Thông tin shop</h2>
            {shop?.bannerUrl && (
              <img src={shop.bannerUrl} alt="banner" className="w-full h-24 object-cover rounded-lg mb-3" />
            )}
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Tên shop', value: shop?.name },
                { label: 'Email shop', value: shop?.email || '-' },
                { label: 'Điện thoại', value: shop?.phone || '-' },
                { label: 'Địa chỉ', value: shop?.address || '-' },
                { label: 'Tỉnh/TP', value: shop?.province || '-' },
                { label: 'Hoa hồng', value: `${shop?.commissionRate || 10}%` },
                { label: 'Tham gia', value: new Date(seller.createdAt).toLocaleDateString('vi-VN') },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Thông tin người bán</h2>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: 'Họ tên', value: seller.fullName || '-' },
                  { label: 'Email', value: seller.user?.email || '-' },
                  { label: 'CMND/CCCD', value: seller.idNumber || 'Chưa cung cấp' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
              {(seller.idFront || seller.idBack) && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">CMND/CCCD</p>
                  <div className="flex gap-2">
                    {seller.idFront && <img src={seller.idFront} alt="Front" className="w-32 h-20 object-cover rounded border" />}
                    {seller.idBack && <img src={seller.idBack} alt="Back" className="w-32 h-20 object-cover rounded border" />}
                  </div>
                </div>
              )}
            </div>

            {shop?.wallet && (
              <div className="card p-5">
                <h2 className="font-semibold mb-4">Ví tiền</h2>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Số dư khả dụng', value: `${Number(shop.wallet.balance || 0).toLocaleString('vi-VN')}₫`, color: 'text-green-600' },
                    { label: 'Đang chờ', value: `${Number(shop.wallet.pendingBalance || 0).toLocaleString('vi-VN')}₫`, color: 'text-yellow-600' },
                    { label: 'Tổng đã nhận', value: `${Number(shop.wallet.totalReceived || 0).toLocaleString('vi-VN')}₫`, color: '' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-500">{label}</span>
                      <span className={`font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Tổng GMV', value: `${Number(analytics?.totalRevenue || 0).toLocaleString('vi-VN')}₫`, icon: TrendingUp, color: 'text-primary-600 bg-primary-50' },
              { label: 'Tổng đơn hàng', value: (analytics?.totalOrders || shop?._count?.orders || 0).toLocaleString('vi-VN'), icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
              { label: 'Sản phẩm', value: (analytics?.totalProducts || shop?._count?.products || 0).toLocaleString('vi-VN'), icon: Package, color: 'text-green-600 bg-green-50' },
              { label: 'Đánh giá TB', value: `⭐ ${(analytics?.avgRating || shop?.avgRating || 0).toFixed(1)}`, icon: Star, color: 'text-yellow-600 bg-yellow-50' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-lg font-bold text-gray-800">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          {analytics?.revenueChart && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Doanh thu 30 ngày gần đây</h3>
              <MiniChart data={analytics.revenueChart.map((d: any) => d.revenue || d)} />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>30 ngày trước</span>
                <span>Hôm nay</span>
              </div>
            </div>
          )}

          {/* Order status breakdown */}
          {analytics?.ordersByStatus && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Đơn hàng theo trạng thái</h3>
              <div className="space-y-2">
                {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-40">{ORDER_STATUS_LABELS[status] || status}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, ((count as number) / (analytics?.totalOrders || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {tab === 'products' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b">
            <p className="text-sm text-gray-500">{sellerProducts?.total || sellerProducts?.data?.length || 0} sản phẩm</p>
          </div>
          {!sellerProducts?.data?.length ? (
            <p className="p-8 text-center text-gray-400">Không có sản phẩm</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Sản phẩm</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Giá</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {sellerProducts.data.map((p: any) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={p.images?.[0]?.url || 'https://via.placeholder.com/32'} alt=""
                          className="w-8 h-8 object-cover rounded" />
                        <span className="font-medium line-clamp-1">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.skus?.[0] ? `${Number(p.skus[0].price).toLocaleString('vi-VN')}₫` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        p.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">
                      {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b">
            <p className="text-sm text-gray-500">{sellerOrders?.total || sellerOrders?.data?.length || 0} đơn hàng</p>
          </div>
          {!sellerOrders?.data?.length ? (
            <p className="p-8 text-center text-gray-400">Không có đơn hàng</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Mã đơn</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Khách hàng</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Tổng tiền</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Ngày đặt</th>
                </tr>
              </thead>
              <tbody>
                {sellerOrders.data.map((o: any) => (
                  <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{o.user?.email || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(o.totalAmount).toLocaleString('vi-VN')}₫</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{ORDER_STATUS_LABELS[o.status] || o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tier Modal */}
      {showTierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-lg mb-4">Thay đổi tier / hoa hồng</h3>
            <p className="text-sm text-gray-500 mb-4">
              Tier hiện tại: <strong>{currentTier.label}</strong>
            </p>
            <div className="space-y-2 mb-4">
              {TIERS.map(tier => (
                <label key={tier.value} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                  Number(newCommission) === tier.value ? 'border-primary-500 bg-primary-50' : 'hover:border-gray-300'
                }`}>
                  <input type="radio" name="tier" value={tier.value} checked={Number(newCommission) === tier.value}
                    onChange={() => setNewCommission(String(tier.value))} />
                  <span className={`px-2 py-0.5 rounded text-xs ${tier.color}`}>{tier.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTierModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => newCommission && updateTier.mutate(Number(newCommission))}
                disabled={!newCommission || updateTier.isPending}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {updateTier.isPending ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-lg mb-2">Tạm dừng shop</h3>
            <p className="text-sm text-gray-500 mb-4">Shop sẽ không thể bán hàng sau khi tạm dừng.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do tạm dừng *</label>
              <textarea
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="Vi phạm chính sách, sản phẩm giả mạo..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSuspendModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => suspend.mutate(suspendReason)}
                disabled={!suspendReason.trim() || suspend.isPending}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {suspend.isPending ? 'Đang xử lý...' : 'Tạm dừng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
