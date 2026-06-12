import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

type TabType = 'inbound' | 'outbound' | 'inventory';

interface FulfillmentOrder {
  id: string;
  type: 'INBOUND' | 'OUTBOUND';
  warehouseCode: string;
  status: string;
  totalSkus: number;
  totalQty: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function FulfillmentPage() {
  const [tab, setTab] = useState<TabType>('inbound');

  const { data, isLoading } = useQuery<{ data: FulfillmentOrder[] }>({
    queryKey: ['admin-fulfillment', tab],
    queryFn: () => apiClient.get(`/admin/fulfillment?type=${tab.toUpperCase()}`).then(r => r.data),
  });

  const orders = data?.data ?? [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Vận hành kho (Fulfillment)</h1>

      <div className="flex gap-1 mb-6 border-b">
        {(['inbound', 'outbound', 'inventory'] as TabType[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'inbound' ? 'Nhập kho' : t === 'outbound' ? 'Xuất kho' : 'Tồn kho'}
          </button>
        ))}
      </div>

      {tab === 'inventory' ? (
        <InventoryTab />
      ) : (
        isLoading ? <p>Đang tải...</p> : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Mã phiếu', 'Kho', 'Trạng thái', 'Số SKU', 'Số lượng', 'Ngày tạo'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{o.warehouseCode}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{o.totalSkus}</td>
                    <td className="px-4 py-3">{o.totalQty?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function InventoryTab() {
  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['admin-warehouse-inventory'],
    queryFn: () => apiClient.get('/admin/fulfillment/inventory').then(r => r.data),
  });

  const items = data?.data ?? [];

  return isLoading ? <p>Đang tải...</p> : (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['SKU', 'Sản phẩm', 'Kho', 'Tồn có sẵn', 'Đang giữ', 'Tổng'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
              <td className="px-4 py-3">{item.productName}</td>
              <td className="px-4 py-3">{item.warehouseCode}</td>
              <td className="px-4 py-3 text-green-600 font-medium">{item.available?.toLocaleString()}</td>
              <td className="px-4 py-3 text-orange-600">{item.reserved?.toLocaleString()}</td>
              <td className="px-4 py-3 font-medium">{item.total?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
