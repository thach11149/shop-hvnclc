import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: seller, isLoading } = useQuery({
    queryKey: ['admin-seller', id],
    queryFn: () => apiClient.get(`/admin/sellers/${id}`).then(r => r.data.data),
  });

  const approve = useMutation({
    mutationFn: () => apiClient.patch(`/admin/sellers/${id}/approve`),
    onSuccess: () => {
      toast.success('Đã duyệt người bán');
      queryClient.invalidateQueries({ queryKey: ['admin-seller', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const reject = useMutation({
    mutationFn: () => apiClient.patch(`/admin/sellers/${id}/reject`),
    onSuccess: () => {
      toast.success('Đã từ chối');
      queryClient.invalidateQueries({ queryKey: ['admin-seller', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const suspend = useMutation({
    mutationFn: () => apiClient.patch(`/admin/sellers/${id}/suspend`),
    onSuccess: () => {
      toast.success('Đã tạm dừng shop');
      queryClient.invalidateQueries({ queryKey: ['admin-seller', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-48 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Không tìm thấy người bán</p>
        <Link to="/sellers" className="text-primary-600 hover:underline mt-2 block">Quay lại</Link>
      </div>
    );
  }

  const shop = seller.shop;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/sellers" className="text-gray-500 hover:text-gray-700">&larr; Người bán</Link>
        <h1 className="text-2xl font-bold text-gray-800">{shop?.name || 'Shop'}</h1>
        <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[shop?.status] || 'bg-gray-100'}`}>
          {shop?.status}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        {shop?.status === 'PENDING_APPROVAL' && (
          <>
            <button onClick={() => approve.mutate()} disabled={approve.isPending} className="btn-primary">
              {approve.isPending ? 'Đang duyệt...' : 'Duyệt'}
            </button>
            <button onClick={() => reject.mutate()} disabled={reject.isPending} className="border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-50">
              {reject.isPending ? 'Đang từ chối...' : 'Từ chối'}
            </button>
          </>
        )}
        {shop?.status === 'APPROVED' && (
          <button onClick={() => suspend.mutate()} disabled={suspend.isPending} className="border border-orange-500 text-orange-500 px-4 py-2 rounded-lg text-sm hover:bg-orange-50">
            {suspend.isPending ? '...' : 'Tạm dừng shop'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shop Info */}
        <div className="card p-4">
          <h2 className="font-semibold mb-4">Thông tin shop</h2>
          <div className="flex items-center gap-3 mb-4">
            {shop?.logo ? (
              <img src={shop.logo} alt={shop.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-500">
                {shop?.name?.[0]}
              </div>
            )}
            <div>
              <p className="font-bold text-lg">{shop?.name}</p>
              <p className="text-sm text-gray-500">/{shop?.slug}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Email shop', value: shop?.email || '-' },
              { label: 'Điện thoại', value: shop?.phone || '-' },
              { label: 'Tỉnh/TP', value: shop?.province || '-' },
              { label: 'Hoa hồng', value: `${shop?.commissionRate || 10}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seller Profile */}
        <div className="card p-4">
          <h2 className="font-semibold mb-4">Thông tin người bán</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Họ tên', value: seller.fullName || '-' },
              { label: 'Email', value: seller.user?.email || '-' },
              { label: 'CMND/CCCD', value: seller.idNumber || 'Chưa cung cấp' },
              { label: 'Ngày đăng ký', value: new Date(seller.createdAt).toLocaleDateString('vi-VN') },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
          {(seller.idFront || seller.idBack) && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Hình ảnh CMND/CCCD</p>
              <div className="flex gap-2">
                {seller.idFront && <img src={seller.idFront} alt="Front" className="w-32 h-20 object-cover rounded border" />}
                {seller.idBack && <img src={seller.idBack} alt="Back" className="w-32 h-20 object-cover rounded border" />}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="card p-4">
          <h2 className="font-semibold mb-4">Thống kê</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Sản phẩm', value: shop?._count?.products || 0 },
              { label: 'Đơn hàng', value: shop?._count?.orders || 0 },
              { label: 'Người theo dõi', value: shop?._count?.followers || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet */}
        {seller.shop?.wallet && (
          <div className="card p-4">
            <h2 className="font-semibold mb-4">Ví tiền</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Số dư khả dụng</span>
                <span className="font-bold text-green-600">{Number(seller.shop.wallet.balance || 0).toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Đang chờ</span>
                <span className="font-medium text-yellow-600">{Number(seller.shop.wallet.pendingBalance || 0).toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Tổng đã nhận</span>
                <span className="font-medium">{Number(seller.shop.wallet.totalReceived || 0).toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
