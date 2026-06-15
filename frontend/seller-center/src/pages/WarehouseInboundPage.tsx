import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface InboundItem {
  sku: string;
  productName?: string;
  expectedQty: number;
  receivedQty: number;
  note?: string;
}

interface InboundOrder {
  id: string;
  code: string;
  warehouseCode: string;
  status: 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'CANCELLED';
  items: InboundItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp', SUBMITTED: 'Đã gửi', RECEIVED: 'Đã nhận', CANCELLED: 'Đã hủy',
};

const WAREHOUSE_OPTIONS = ['WH-HN', 'WH-HCM', 'WH-DN', 'Kho mặc định'];

export default function WarehouseInboundPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Create form state
  const [warehouseCode, setWarehouseCode] = useState('');
  const [notes, setNotes] = useState('');
  const [formItems, setFormItems] = useState([{ sku: '', productName: '', qty: 1, note: '' }]);
  const [skuSearch, setSkuSearch] = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery<{ data: InboundOrder[] }>({
    queryKey: ['seller-inbound-orders', statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      return apiClient.get(`/seller/warehouse/inbound?${params}`).then(r => r.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/seller/warehouse/inbound', {
      warehouseCode,
      notes,
      items: formItems.map(i => ({ sku: i.sku, expectedQty: i.qty, note: i.note })),
    }),
    onSuccess: () => {
      toast.success('Đã tạo phiếu nhập kho');
      qc.invalidateQueries({ queryKey: ['seller-inbound-orders'] });
      setShowCreate(false);
      setWarehouseCode('');
      setNotes('');
      setFormItems([{ sku: '', productName: '', qty: 1, note: '' }]);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi tạo phiếu'),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/seller/warehouse/inbound/${id}/submit`),
    onSuccess: () => { toast.success('Đã gửi phiếu nhập'); qc.invalidateQueries({ queryKey: ['seller-inbound-orders'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/seller/warehouse/inbound/${id}/cancel`),
    onSuccess: () => { toast.success('Đã hủy phiếu'); qc.invalidateQueries({ queryKey: ['seller-inbound-orders'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const orders = data?.data ?? [];

  const addItem = () => setFormItems(p => [...p, { sku: '', productName: '', qty: 1, note: '' }]);
  const removeItem = (i: number) => setFormItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: any) =>
    setFormItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const totalExpected = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.expectedQty, 0), 0);
  const totalReceived = orders.filter(o => o.status === 'RECEIVED').reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.receivedQty, 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/warehouse" className="text-gray-400 hover:text-gray-600">← Tồn kho</Link>
          <h1 className="text-2xl font-bold text-gray-800">Phiếu nhập kho</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Tạo phiếu nhập
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng phiếu</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalExpected.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-gray-500 mt-1">SL dự kiến</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{totalReceived.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-gray-500 mt-1">Đã nhận</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['all', 'DRAFT', 'SUBMITTED', 'RECEIVED', 'CANCELLED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                statusFilter === s ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all' ? 'Tất cả' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-3xl mb-2">📋</p>
          <p>Chưa có phiếu nhập nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const isExpanded = expanded === order.id;
            const itemCount = order.items?.length || 0;
            const totalQty = order.items?.reduce((s, i) => s + i.expectedQty, 0) || 0;
            return (
              <div key={order.id} className="card overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-mono font-bold text-gray-800">{order.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      <span className="text-sm text-gray-500">{order.warehouseCode || 'Kho mặc định'}</span>
                      <span className="text-xs text-gray-400">{itemCount} SKU • {totalQty.toLocaleString('vi-VN')} sản phẩm</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                      {order.status === 'DRAFT' && (
                        <button
                          onClick={e => { e.stopPropagation(); submitMutation.mutate(order.id); }}
                          disabled={submitMutation.isPending}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Gửi phiếu
                        </button>
                      )}
                      {(order.status === 'DRAFT' || order.status === 'SUBMITTED') && (
                        <button
                          onClick={e => { e.stopPropagation(); if (window.confirm('Hủy phiếu này?')) cancelMutation.mutate(order.id); }}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                        >
                          Hủy
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>
                  {order.notes && (
                    <p className="text-xs text-gray-500 mt-1">Ghi chú: {order.notes}</p>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">SKU</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Tên sản phẩm</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Dự kiến</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Đã nhận</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {order.items?.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono text-xs">{item.sku}</td>
                            <td className="px-4 py-2 text-gray-700">{item.productName || '-'}</td>
                            <td className="px-4 py-2 text-right font-medium">{item.expectedQty.toLocaleString('vi-VN')}</td>
                            <td className={`px-4 py-2 text-right font-medium ${
                              item.receivedQty === item.expectedQty ? 'text-green-600' :
                              item.receivedQty > 0 ? 'text-yellow-600' : 'text-gray-400'
                            }`}>
                              {item.receivedQty.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-2 text-gray-400 text-xs">{item.note || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Tạo phiếu nhập kho</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kho nhận hàng *</label>
                <select
                  value={warehouseCode}
                  onChange={e => setWarehouseCode(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Chọn kho...</option>
                  {WAREHOUSE_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ghi chú phiếu nhập..."
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Danh sách sản phẩm *</label>
                <button onClick={addItem} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                  <Plus size={12} /> Thêm dòng
                </button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs text-gray-500">SKU *</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500">Tên SP</th>
                      <th className="text-right px-3 py-2 text-xs text-gray-500">SL dự kiến *</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500">Ghi chú</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {formItems.map((item, i) => (
                      <tr key={i}>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.sku}
                            onChange={e => updateItem(i, 'sku', e.target.value)}
                            placeholder="SKU-001"
                            className="w-full border rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.productName}
                            onChange={e => updateItem(i, 'productName', e.target.value)}
                            placeholder="Tên sản phẩm"
                            className="w-full border rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={e => updateItem(i, 'qty', Number(e.target.value))}
                            className="w-20 border rounded px-2 py-1 text-xs text-right ml-auto block"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.note}
                            onChange={e => updateItem(i, 'note', e.target.value)}
                            placeholder="Ghi chú..."
                            className="w-full border rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          {formItems.length > 1 && (
                            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-right">
                Tổng: {formItems.reduce((s, i) => s + i.qty, 0).toLocaleString('vi-VN')} sản phẩm
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowCreate(false); setFormItems([{ sku: '', productName: '', qty: 1, note: '' }]); }}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !warehouseCode || formItems.some(i => !i.sku || i.qty < 1)}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo phiếu nhập'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
