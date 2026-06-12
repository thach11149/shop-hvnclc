import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  province: string;
  isActive: boolean;
  totalSkus: number;
  createdAt: string;
}

export default function WarehousesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', address: '', province: '' });

  const { data, isLoading } = useQuery<{ data: Warehouse[] }>({
    queryKey: ['admin-warehouses'],
    queryFn: () => apiClient.get('/admin/warehouses').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => apiClient.post('/admin/warehouses', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-warehouses'] }); setShowForm(false); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/warehouses/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-warehouses'] }),
  });

  const warehouses = data?.data ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý kho hàng</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Thêm kho
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Tạo kho mới</h2>
            {(['name', 'code', 'address', 'province'] as const).map(field => (
              <div key={field} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                />
              </div>
            ))}
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm">Hủy</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Tạo kho
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
                {['Mã kho', 'Tên kho', 'Tỉnh/TP', 'Địa chỉ', 'Số SKU', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {warehouses.map(w => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{w.code}</td>
                  <td className="px-4 py-3 font-medium">{w.name}</td>
                  <td className="px-4 py-3 text-gray-600">{w.province}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{w.address}</td>
                  <td className="px-4 py-3">{w.totalSkus?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${w.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {w.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMutation.mutate(w.id)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      {w.isActive ? 'Tạm dừng' : 'Kích hoạt'}
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
