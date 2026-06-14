import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Package, CheckSquare, Square, ChevronDown, Search, Tag, Trash2, TrendingDown, ToggleRight, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const BULK_ACTIONS = [
  { id: 'approve', label: 'Duyệt sản phẩm', color: 'text-green-600', icon: <ToggleRight size={14} /> },
  { id: 'reject', label: 'Từ chối sản phẩm', color: 'text-red-600', icon: <TrendingDown size={14} /> },
  { id: 'add_tag', label: 'Thêm tag', color: 'text-blue-600', icon: <Tag size={14} /> },
  { id: 'export', label: 'Xuất danh sách', color: 'text-gray-600', icon: <Download size={14} /> },
  { id: 'delete', label: 'Xóa sản phẩm', color: 'text-red-700', icon: <Trash2 size={14} /> },
];

export default function BulkActionsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [showActionMenu, setShowActionMenu] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bulk-products', statusFilter, search],
    queryFn: () =>
      apiClient
        .get('/admin/products', {
          params: { status: statusFilter || undefined, search: search || undefined, limit: 50 },
        })
        .then((r) => r.data.data),
  });

  const bulkMutation = useMutation({
    mutationFn: async (action: string) => {
      if (action === 'approve') {
        return Promise.all(selected.map((id) => apiClient.patch(`/admin/products/${id}/approve`)));
      }
      if (action === 'reject') {
        return Promise.all(selected.map((id) => apiClient.patch(`/admin/products/${id}/reject`, { reason: 'Không phù hợp' })));
      }
      if (action === 'export') {
        window.open('/api/v1/admin/export/products', '_blank');
        return;
      }
      if (action === 'delete') {
        return Promise.all(selected.map((id) => apiClient.delete(`/admin/products/${id}`)));
      }
    },
    onSuccess: (_, action) => {
      if (action !== 'export') {
        qc.invalidateQueries({ queryKey: ['admin-bulk-products'] });
        setSelected([]);
        toast.success(`Đã thực hiện hành động: ${BULK_ACTIONS.find((a) => a.id === action)?.label}`);
      }
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const products = data?.items || [];
  const allSelected = products.length > 0 && selected.length === products.length;

  const toggleAll = () => setSelected(allSelected ? [] : products.map((p: any) => p.id));
  const toggleOne = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thao tác hàng loạt</h1>
        <p className="text-gray-500 text-sm mt-1">Duyệt, từ chối, tag nhiều sản phẩm cùng lúc</p>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setSelected([]); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING_APPROVAL">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Bị từ chối</option>
          <option value="ACTIVE">Đang bán</option>
          <option value="INACTIVE">Ẩn</option>
        </select>

        {selected.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thao tác ({selected.length})
              <ChevronDown size={16} />
            </button>
            {showActionMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-48">
                {BULK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => { bulkMutation.mutate(action.id); setShowActionMenu(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${action.color}`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-sm text-gray-600">
              {allSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
              Chọn tất cả ({products.length})
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {products.map((product: any) => (
              <div key={product.id} className="flex items-center gap-3 p-4 hover:bg-gray-50">
                <button onClick={() => toggleOne(product.id)}>
                  {selected.includes(product.id) ? (
                    <CheckSquare size={18} className="text-blue-600" />
                  ) : (
                    <Square size={18} className="text-gray-300" />
                  )}
                </button>
                <img
                  src={product.images?.[0]?.url || '/placeholder.jpg'}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 line-clamp-1">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.shop?.name} — {product.category?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{Number(Math.min(...(product.skus || []).map((s: any) => Number(s.price)))).toLocaleString('vi-VN')}đ</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    product.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                    product.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    product.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {product.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {products.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Package size={36} className="mx-auto mb-2 opacity-40" />
              <p>Không có sản phẩm nào</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
