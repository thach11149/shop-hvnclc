import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AlertTriangle, Package, TrendingDown, RefreshCw, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const THRESHOLD = 10;

export default function InventoryAlertPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'LOW' | 'OUT'>('LOW');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory-alerts', filter],
    queryFn: () =>
      apiClient
        .get('/seller/products', {
          params: {
            stockLte: filter === 'LOW' ? THRESHOLD : 0,
            status: 'ACTIVE',
            limit: 100,
          },
        })
        .then((r) => r.data.data),
  });

  const restockMutation = useMutation({
    mutationFn: ({ skuId, quantity }: { skuId: string; quantity: number }) =>
      apiClient.post(`/inventory/restock`, { skuId, quantity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-alerts'] });
      toast.success('Đã cập nhật tồn kho');
    },
  });

  const products = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cảnh báo tồn kho</h1>
          <p className="text-gray-500 text-sm mt-1">Sản phẩm sắp hết hoặc đã hết hàng</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => setFilter('LOW')}
          className={`cursor-pointer rounded-xl p-4 border-2 ${
            filter === 'LOW' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-yellow-500" />
            <span className="font-medium text-sm">Sắp hết hàng</span>
          </div>
          <p className="text-xs text-gray-500">Tồn kho ≤ {THRESHOLD}</p>
        </div>
        <div
          onClick={() => setFilter('OUT')}
          className={`cursor-pointer rounded-xl p-4 border-2 ${
            filter === 'OUT' ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={18} className="text-red-500" />
            <span className="font-medium text-sm">Hết hàng</span>
          </div>
          <p className="text-xs text-gray-500">Tồn kho = 0</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Không có sản phẩm nào trong tình trạng này</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sản phẩm</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">SKU</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Tồn kho</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.flatMap((product: any) =>
                (product.skus || []).map((sku: any) => (
                  <tr key={sku.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0]?.url || '/placeholder.jpg'}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                        />
                        <div>
                          <p className="font-medium line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-500">{sku.variantName || 'Mặc định'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">{sku.sku || sku.id.slice(-8)}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span className={sku.stock === 0 ? 'text-red-600' : 'text-yellow-600'}>{sku.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {sku.stock === 0 ? (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Hết hàng</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Sắp hết</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => restockMutation.mutate({ skuId: sku.id, quantity: 50 })}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Nhập thêm
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Cài đặt cảnh báo tự động</span>
        </div>
        <p className="text-xs text-blue-700">
          Hệ thống sẽ gửi thông báo email và trong ứng dụng khi tồn kho xuống dưới {THRESHOLD}.
          Bạn có thể thay đổi ngưỡng này trong cài đặt cửa hàng.
        </p>
      </div>
    </div>
  );
}
