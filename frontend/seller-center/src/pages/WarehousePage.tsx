import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

interface WarehouseItem {
  id: string;
  sku: string;
  productName: string;
  available: number;
  reserved: number;
  total: number;
  warehouseCode: string;
}

export default function WarehousePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [adjustItem, setAdjustItem] = useState<WarehouseItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  const { data, isLoading } = useQuery<{ data: WarehouseItem[] }>({
    queryKey: ['seller-warehouse', search],
    queryFn: () => apiClient.get(`/seller/warehouse/inventory?search=${search}`).then(r => r.data),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, qty, reason }: { id: string; qty: number; reason: string }) =>
      apiClient.post(`/seller/warehouse/inventory/${id}/adjust`, { qty, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-warehouse'] });
      setAdjustItem(null);
    },
  });

  const items = data?.data ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tồn kho</h1>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Tìm kiếm theo tên sản phẩm, SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-80"
        />
      </div>

      {adjustItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-3">Chỉnh sửa tồn kho</h2>
            <p className="text-sm text-gray-600 mb-3">{adjustItem.productName} — {adjustItem.sku}</p>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng điều chỉnh (+/-)</label>
              <input
                type="number"
                value={adjustQty}
                onChange={e => setAdjustQty(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
              <input
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Nhập đầu kỳ, hư hỏng, kiểm kê..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdjustItem(null)} className="px-4 py-2 border rounded text-sm">Hủy</button>
              <button
                onClick={() => adjustMutation.mutate({ id: adjustItem.id, qty: adjustQty, reason: adjustReason })}
                disabled={adjustMutation.isPending || !adjustReason}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <p>Đang tải...</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['SKU', 'Sản phẩm', 'Kho', 'Có sẵn', 'Đang giữ', 'Tổng', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.available === 0 ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3 font-medium">{item.productName}</td>
                  <td className="px-4 py-3 text-gray-500">{item.warehouseCode}</td>
                  <td className={`px-4 py-3 font-medium ${item.available === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.available?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-orange-600">{item.reserved?.toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold">{item.total?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setAdjustItem(item); setAdjustQty(0); setAdjustReason(''); }}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Điều chỉnh
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
