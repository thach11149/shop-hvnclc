import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

interface InboundOrder {
  id: string;
  code: string;
  warehouseCode: string;
  status: 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'CANCELLED';
  items: { sku: string; productName: string; expectedQty: number; receivedQty: number }[];
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

export default function WarehouseInboundPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [warehouseCode, setWarehouseCode] = useState('');
  const [items, setItems] = useState([{ sku: '', qty: 1 }]);

  const { data, isLoading } = useQuery<{ data: InboundOrder[] }>({
    queryKey: ['seller-inbound-orders'],
    queryFn: () => apiClient.get('/seller/warehouse/inbound').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/seller/warehouse/inbound', { warehouseCode, items }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller-inbound-orders'] }); setShowCreate(false); },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/seller/warehouse/inbound/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-inbound-orders'] }),
  });

  const orders = data?.data ?? [];

  const addItem = () => setItems(p => [...p, { sku: '', qty: 1 }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: 'sku' | 'qty', val: string | number) =>
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Phiếu nhập kho</h1>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          + Tạo phiếu nhập
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Tạo phiếu nhập kho</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã kho</label>
              <input value={warehouseCode} onChange={e => setWarehouseCode(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sản phẩm</label>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={item.sku} onChange={e => updateItem(i, 'sku', e.target.value)} placeholder="SKU" className="flex-1 border rounded px-3 py-2 text-sm" />
                  <input type="number" min={1} value={item.qty} onChange={e => updateItem(i, 'qty', Number(e.target.value))} className="w-24 border rounded px-3 py-2 text-sm" />
                  <button onClick={() => removeItem(i)} className="text-red-500 text-sm px-2">×</button>
                </div>
              ))}
              <button onClick={addItem} className="text-blue-600 text-sm hover:underline">+ Thêm dòng</button>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded text-sm">Hủy</button>
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
                Tạo phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <p>Đang tải...</p> : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium">{order.code}</span>
                  <span className="text-gray-500 text-sm">{order.warehouseCode}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                  {order.status === 'DRAFT' && (
                    <button onClick={() => submitMutation.mutate(order.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      Gửi phiếu
                    </button>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {order.items?.length} sản phẩm,&nbsp;
                {order.items?.reduce((s, i) => s + i.expectedQty, 0)?.toLocaleString()} sản phẩm dự kiến
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
