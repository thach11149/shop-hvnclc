import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Edit, Send, Search, Copy, Eye, EyeOff, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp', PENDING_APPROVAL: 'Chờ duyệt', APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối', ACTIVE: 'Đang bán', INACTIVE: 'Tạm dừng',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700', REJECTED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-green-100 text-green-700', INACTIVE: 'bg-orange-100 text-orange-600',
};

const STATUS_TABS = ['all', 'ACTIVE', 'INACTIVE', 'DRAFT', 'PENDING_APPROVAL', 'REJECTED'] as const;
const STATUS_TAB_LABELS: Record<string, string> = {
  all: 'Tất cả', ACTIVE: 'Đang bán', INACTIVE: 'Tạm dừng',
  DRAFT: 'Nháp', PENDING_APPROVAL: 'Chờ duyệt', REJECTED: 'Từ chối',
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<null | { action: string; label: string }>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-products', statusTab, search, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusTab !== 'all') params.set('status', statusTab);
      if (search) params.set('search', search);
      return apiClient.get(`/seller/products?${params}`).then(r => r.data.data);
    },
  });

  const submitApproval = useMutation({
    mutationFn: (id: string) => apiClient.post(`/seller/products/${id}/submit-approval`),
    onSuccess: () => { toast.success('Đã gửi duyệt'); queryClient.invalidateQueries({ queryKey: ['seller-products'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/seller/products/${id}/toggle-status`, { status }),
    onSuccess: () => { toast.success('Đã cập nhật'); queryClient.invalidateQueries({ queryKey: ['seller-products'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/seller/products/${id}/duplicate`),
    onSuccess: () => { toast.success('Đã nhân đôi sản phẩm'); queryClient.invalidateQueries({ queryKey: ['seller-products'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => apiClient.post('/seller/products/bulk-delete', { ids }),
    onSuccess: () => {
      toast.success('Đã xóa sản phẩm');
      setSelected(new Set());
      setBulkConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (err: any) => { toast.error(err.response?.data?.error || 'Lỗi'); setBulkConfirm(null); },
  });

  const bulkToggleMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      apiClient.post('/seller/products/bulk-toggle', { ids, status }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      setSelected(new Set());
      setBulkConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (err: any) => { toast.error(err.response?.data?.error || 'Lỗi'); setBulkConfirm(null); },
  });

  const products: any[] = data?.data || data || [];
  const total = data?.total || products.length;
  const totalPages = Math.ceil(total / 20);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p: any) => p.id)));
    }
  };

  const handleBulkAction = (action: string, label: string) => {
    if (selected.size === 0) { toast.error('Chưa chọn sản phẩm'); return; }
    setBulkConfirm({ action, label });
  };

  const confirmBulkAction = () => {
    const ids = Array.from(selected);
    if (bulkConfirm?.action === 'delete') bulkDeleteMutation.mutate(ids);
    else if (bulkConfirm?.action === 'activate') bulkToggleMutation.mutate({ ids, status: 'ACTIVE' });
    else if (bulkConfirm?.action === 'deactivate') bulkToggleMutation.mutate({ ids, status: 'INACTIVE' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sản phẩm</h1>
        <Link to="/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm sản phẩm
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 overflow-x-auto">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => { setStatusTab(s); setPage(1); setSelected(new Set()); }}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
              statusTab === s ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {STATUS_TAB_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-3">
          <span className="text-sm text-primary-700 font-medium">Đã chọn {selected.size} sản phẩm</span>
          <button onClick={() => handleBulkAction('activate', 'Kích hoạt')}
            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Kích hoạt</button>
          <button onClick={() => handleBulkAction('deactivate', 'Tạm dừng')}
            className="text-xs bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600">Tạm dừng</button>
          <button onClick={() => handleBulkAction('delete', 'Xóa')}
            className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Xóa</button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-700 ml-auto">Bỏ chọn</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !products.length ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-3">📦</p>
            <p>Chưa có sản phẩm nào</p>
            <Link to="/products/new" className="btn-primary mt-3 inline-block">Thêm sản phẩm đầu tiên</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.size === products.length && products.length > 0}
                    onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Sản phẩm</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Danh mục</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Giá</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tồn kho</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any) => (
                <tr key={product.id} className={`border-t hover:bg-gray-50 ${selected.has(product.id) ? 'bg-primary-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(product.id)}
                      onChange={() => toggleSelect(product.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]?.url || 'https://via.placeholder.com/40'}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div>
                        <span className="font-medium line-clamp-1 block">{product.name}</span>
                        <span className="text-xs text-gray-400">{product.skus?.length || 0} biến thể</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{product.category?.name || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {product.skus?.[0] ? `${Number(product.skus[0].price).toLocaleString('vi-VN')}₫` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {product.skus?.reduce((s: number, sku: any) => s + (sku.stock || 0), 0).toLocaleString('vi-VN') || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[product.status] || ''}`}>
                      {STATUS_LABELS[product.status] || product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <Link to={`/products/${product.id}/edit`} className="text-blue-600 hover:underline flex items-center gap-1 text-xs">
                        <Edit size={12} /> Sửa
                      </Link>
                      <button
                        onClick={() => duplicateMutation.mutate(product.id)}
                        className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-xs"
                        title="Nhân đôi"
                      >
                        <Copy size={12} /> Nhân đôi
                      </button>
                      {product.status === 'DRAFT' && (
                        <button
                          onClick={() => submitApproval.mutate(product.id)}
                          className="text-green-600 hover:underline flex items-center gap-1 text-xs"
                        >
                          <Send size={12} /> Gửi duyệt
                        </button>
                      )}
                      {(product.status === 'ACTIVE' || product.status === 'APPROVED') && (
                        <button
                          onClick={() => toggleStatus.mutate({ id: product.id, status: 'INACTIVE' })}
                          className="text-orange-500 hover:underline flex items-center gap-1 text-xs"
                        >
                          <EyeOff size={12} /> Tạm dừng
                        </button>
                      )}
                      {product.status === 'INACTIVE' && (
                        <button
                          onClick={() => toggleStatus.mutate({ id: product.id, status: 'ACTIVE' })}
                          className="text-green-600 hover:underline flex items-center gap-1 text-xs"
                        >
                          <Eye size={12} /> Kích hoạt
                        </button>
                      )}
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
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40">←</button>
          <span className="px-3 py-1 text-sm text-gray-600">Trang {page}/{totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40">→</button>
        </div>
      )}

      {/* Bulk Confirm Modal */}
      {bulkConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-lg mb-2">{bulkConfirm.label} {selected.size} sản phẩm</h3>
            <p className="text-sm text-gray-600 mb-4">Hành động này không thể hoàn tác. Tiếp tục?</p>
            <div className="flex gap-3">
              <button onClick={() => setBulkConfirm(null)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button onClick={confirmBulkAction}
                disabled={bulkDeleteMutation.isPending || bulkToggleMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                {(bulkDeleteMutation.isPending || bulkToggleMutation.isPending) ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
