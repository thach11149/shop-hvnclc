import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AlertTriangle, Package, TrendingDown, RefreshCw, Bell, Settings, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

function ThresholdModal({ current, onClose }: { current: number; onClose: (val?: number) => void }) {
  const [value, setValue] = useState(String(current));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">Cài đặt ngưỡng cảnh báo</h3>
          <button onClick={() => onClose()} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5">
          <label className="block text-sm font-medium mb-2">Ngưỡng tồn kho thấp</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min="1"
              max="1000"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-sm text-gray-500">sản phẩm</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Sản phẩm có tồn kho ≤ giá trị này sẽ được đánh dấu "Sắp hết hàng"
          </p>
          <div className="flex gap-2 mt-2">
            {[5, 10, 20, 50].map((v) => (
              <button
                key={v}
                onClick={() => setValue(String(v))}
                className={`px-3 py-1 rounded text-xs border transition-colors ${
                  value === String(v) ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={() => onClose()} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Hủy</button>
          <button
            onClick={() => onClose(Number(value))}
            disabled={!value || Number(value) < 1}
            className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

function RestockModal({ sku, onClose }: { sku: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [qty, setQty] = useState('50');

  const mutation = useMutation({
    mutationFn: () => apiClient.post('/inventory/restock', { skuId: sku.id, quantity: Number(qty) }),
    onSuccess: () => {
      toast.success(`Đã thêm ${qty} sản phẩm vào kho`);
      qc.invalidateQueries({ queryKey: ['inventory-alerts'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi nhập kho'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">Nhập thêm hàng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700">{sku.productName}</p>
            {sku.variantName && <p className="text-xs text-gray-500 mt-0.5">Phân loại: {sku.variantName}</p>}
            <p className="text-xs text-gray-400">Tồn kho hiện tại: <span className={sku.stock === 0 ? 'text-red-600 font-bold' : 'text-yellow-600 font-bold'}>{sku.stock}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Số lượng nhập *</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              min="1"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2 mt-2">
              {[10, 50, 100, 200].map((v) => (
                <button key={v} onClick={() => setQty(String(v))} className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">{v}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Hủy</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!qty || Number(qty) < 1 || mutation.isPending}
            className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang nhập...' : 'Xác nhận nhập hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryAlertPage() {
  const qc = useQueryClient();
  const [threshold, setThreshold] = useState(10);
  const [filter, setFilter] = useState<'LOW' | 'OUT'>('LOW');
  const [showThreshold, setShowThreshold] = useState(false);
  const [restockSku, setRestockSku] = useState<any | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory-alerts', filter, threshold],
    queryFn: () =>
      apiClient
        .get('/seller/products', {
          params: {
            stockLte: filter === 'LOW' ? threshold : 0,
            status: 'ACTIVE',
            limit: 100,
          },
        })
        .then((r) => r.data.data),
  });

  const products: any[] = data?.items || [];

  const allSkus = products.flatMap((p: any) =>
    (p.skus || []).map((sku: any) => ({ ...sku, productName: p.name, productImage: p.images?.[0]?.url }))
  );

  const outOfStock = allSkus.filter((s) => s.stock === 0);
  const lowStock = allSkus.filter((s) => s.stock > 0 && s.stock <= threshold);

  const displaySkus = filter === 'OUT' ? outOfStock : allSkus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cảnh báo tồn kho</h1>
          <p className="text-gray-500 text-sm mt-1">Sản phẩm cần nhập hàng ngay</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowThreshold(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            <Settings size={14} /> Ngưỡng: {threshold}
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setFilter('LOW')}
          className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
            filter === 'LOW' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white hover:border-yellow-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-yellow-500" />
            <span className="font-medium text-sm">Sắp hết hàng</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{lowStock.length}</p>
          <p className="text-xs text-gray-500 mt-1">Tồn kho ≤ {threshold}</p>
        </div>

        <div
          onClick={() => setFilter('OUT')}
          className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
            filter === 'OUT' ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-red-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-red-500" />
            <span className="font-medium text-sm">Hết hàng</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{outOfStock.length}</p>
          <p className="text-xs text-gray-500 mt-1">Tồn kho = 0</p>
        </div>

        <div className="rounded-xl p-4 border-2 border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Package size={18} className="text-blue-500" />
            <span className="font-medium text-sm">Tổng SKU cảnh báo</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{allSkus.length}</p>
          <p className="text-xs text-gray-500 mt-1">{products.length} sản phẩm</p>
        </div>

        <div className="rounded-xl p-4 border-2 border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={18} className="text-purple-500" />
            <span className="font-medium text-sm">Cần nhập gấp</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{outOfStock.length}</p>
          <p className="text-xs text-gray-500 mt-1">SKU đã hết hàng</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 border-b animate-pulse bg-gray-50" />)}
        </div>
      ) : displaySkus.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Package size={48} className="mx-auto text-green-300 mb-3" />
          <p className="text-gray-500 font-medium">Tuyệt vời! Không có sản phẩm nào trong tình trạng này</p>
          <p className="text-xs text-gray-400 mt-1">Tất cả sản phẩm đều có tồn kho ổn định</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sản phẩm</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">SKU</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Tồn kho</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displaySkus.map((sku: any) => (
                <tr key={sku.id} className={`hover:bg-gray-50 ${sku.stock === 0 ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={sku.productImage || '/placeholder.jpg'}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                      />
                      <div>
                        <p className="font-medium line-clamp-1 text-gray-900">{sku.productName}</p>
                        <p className="text-xs text-gray-500">{sku.variantName || 'Mặc định'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-400 font-mono">{sku.sku || sku.id.slice(-8)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-lg font-bold ${sku.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {sku.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {sku.stock === 0 ? (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">Hết hàng</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">Sắp hết</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setRestockSku(sku)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium ml-auto"
                    >
                      <Plus size={12} /> Nhập hàng
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Alert info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
        <Bell size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">Cảnh báo tự động</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Hệ thống sẽ gửi email và thông báo trong app khi tồn kho xuống dưới <strong>{threshold}</strong>.
            Bạn có thể thay đổi ngưỡng bằng nút "Ngưỡng: {threshold}" ở trên.
          </p>
        </div>
      </div>

      {showThreshold && (
        <ThresholdModal
          current={threshold}
          onClose={(val) => {
            if (val !== undefined) {
              setThreshold(val);
              toast.success(`Đã đặt ngưỡng cảnh báo: ${val}`);
              qc.invalidateQueries({ queryKey: ['inventory-alerts'] });
            }
            setShowThreshold(false);
          }}
        />
      )}

      {restockSku && <RestockModal sku={restockSku} onClose={() => setRestockSku(null)} />}
    </div>
  );
}
