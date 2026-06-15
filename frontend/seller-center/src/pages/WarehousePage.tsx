import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, TrendingDown, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface WarehouseItem {
  id: string;
  sku: string;
  productName: string;
  productImage?: string;
  available: number;
  reserved: number;
  total: number;
  warehouseCode: string;
  lowStockThreshold?: number;
}

function stockLevel(item: WarehouseItem): 'out' | 'low' | 'ok' {
  if (item.available === 0) return 'out';
  const threshold = item.lowStockThreshold ?? 10;
  if (item.available <= threshold) return 'low';
  return 'ok';
}

const STOCK_COLORS = {
  out: { row: 'bg-red-50', badge: 'bg-red-100 text-red-700', text: 'text-red-600' },
  low: { row: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', text: 'text-yellow-600' },
  ok:  { row: '',             badge: 'bg-green-100 text-green-700',  text: 'text-green-600' },
};

export default function WarehousePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'out' | 'low'>('all');
  const [adjustItem, setAdjustItem] = useState<WarehouseItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-warehouse', search, stockFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (stockFilter === 'out') params.set('outOfStock', 'true');
      if (stockFilter === 'low') params.set('lowStock', 'true');
      return apiClient.get(`/seller/warehouse/inventory?${params}`).then(r => r.data);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, qty, reason }: { id: string; qty: number; reason: string }) =>
      apiClient.post(`/seller/warehouse/inventory/${id}/adjust`, { qty, reason }),
    onSuccess: () => {
      toast.success('Đã cập nhật tồn kho');
      qc.invalidateQueries({ queryKey: ['seller-warehouse'] });
      setAdjustItem(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi điều chỉnh'),
  });

  const items: WarehouseItem[] = data?.data ?? [];
  const total = data?.total || items.length;
  const totalPages = Math.ceil(total / 20);

  const outOfStockCount = items.filter(i => i.available === 0).length;
  const lowStockCount = items.filter(i => i.available > 0 && i.available <= (i.lowStockThreshold ?? 10)).length;
  const totalSKUs = data?.totalSKUs || total;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý tồn kho</h1>
        <Link to="/warehouse/inbound" className="btn-primary text-sm">
          + Tạo phiếu nhập
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tổng SKU</p>
              <p className="text-xl font-bold text-gray-800">{totalSKUs.toLocaleString('vi-VN')}</p>
            </div>
          </div>
        </div>
        <div
          className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => { setStockFilter('out'); setPage(1); }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Hết hàng</p>
              <p className="text-xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>
        </div>
        <div
          className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => { setStockFilter('low'); setPage(1); }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingDown size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Sắp hết</p>
              <p className="text-xl font-bold text-yellow-600">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Còn hàng</p>
              <p className="text-xl font-bold text-green-600">{Math.max(0, totalSKUs - outOfStockCount - lowStockCount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Tìm theo tên, SKU..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-3 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'out', label: '🔴 Hết hàng' },
            { key: 'low', label: '🟡 Sắp hết' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setStockFilter(f.key as any); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                stockFilter === f.key ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {adjustItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-1">Điều chỉnh tồn kho</h2>
            <p className="text-sm text-gray-600 mb-4">{adjustItem.productName} — <span className="font-mono">{adjustItem.sku}</span></p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Hiện tại:</span>
                <span className="font-bold">{adjustItem.available}</span>
              </div>
              {adjustQty !== 0 && (
                <div className="flex justify-between text-primary-600">
                  <span>Sau điều chỉnh:</span>
                  <span className="font-bold">{adjustItem.available + adjustQty}</span>
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng điều chỉnh (+/-)</label>
              <input
                type="number"
                value={adjustQty}
                onChange={e => setAdjustQty(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do *</label>
              <select
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
              >
                <option value="">Chọn lý do...</option>
                <option value="Nhập đầu kỳ">Nhập đầu kỳ</option>
                <option value="Hàng hư hỏng">Hàng hư hỏng</option>
                <option value="Sai lệch kiểm kê">Sai lệch kiểm kê</option>
                <option value="Điều chuyển kho">Điều chuyển kho</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAdjustItem(null)} className="flex-1 border rounded-lg py-2 text-sm">Hủy</button>
              <button
                onClick={() => adjustMutation.mutate({ id: adjustItem.id, qty: adjustQty, reason: adjustReason })}
                disabled={adjustMutation.isPending || !adjustReason || adjustQty === 0}
                className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm disabled:opacity-50"
              >
                {adjustMutation.isPending ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="card p-8 text-center text-gray-500">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-3xl mb-2">📦</p>
          <p>Không tìm thấy dữ liệu tồn kho</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Sản phẩm', 'SKU', 'Kho', 'Có sẵn', 'Đang giữ', 'Tổng', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => {
                const level = stockLevel(item);
                const colors = STOCK_COLORS[level];
                return (
                  <tr key={item.id} className={`hover:opacity-90 ${colors.row}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.productImage && (
                          <img src={item.productImage} alt="" className="w-8 h-8 object-cover rounded" />
                        )}
                        <span className="font-medium line-clamp-1 max-w-40">{item.productName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.sku}</td>
                    <td className="px-4 py-3 text-gray-500">{item.warehouseCode || 'Mặc định'}</td>
                    <td className={`px-4 py-3 font-bold ${colors.text}`}>
                      {item.available?.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-orange-600">{item.reserved?.toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3 font-medium">{item.total?.toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                        {level === 'out' ? 'Hết hàng' : level === 'low' ? 'Sắp hết' : 'Còn hàng'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setAdjustItem(item); setAdjustQty(0); setAdjustReason(''); }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Điều chỉnh
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40">←</button>
          <span className="px-3 py-1 text-sm text-gray-600">Trang {page}/{totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  );
}
