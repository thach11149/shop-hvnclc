import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function ShippingCarriersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    trackingUrl: '',
    apiEndpoint: '',
    apiKey: '',
    isActive: true,
  });

  const { data: carriers, isLoading } = useQuery({
    queryKey: ['shipping-carriers'],
    queryFn: () => apiClient.get('/admin/shipping-carriers').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/shipping-carriers', data),
    onSuccess: () => {
      toast.success('Đã thêm đơn vị vận chuyển');
      queryClient.invalidateQueries({ queryKey: ['shipping-carriers'] });
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi thêm carrier'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/admin/shipping-carriers/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-carriers'] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Đơn vị vận chuyển</h1>
        <button onClick={() => setShowForm(true)} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm">
          + Thêm hãng VC
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}
          </div>
        ) : !carriers?.length ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">🚚</p>
            <p>Chưa có đơn vị vận chuyển</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Tên hãng</th>
                <th className="px-4 py-3 text-left">Mã</th>
                <th className="px-4 py-3 text-left">URL tracking</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {carriers.map((carrier: any) => (
                <tr key={carrier.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{carrier.name}</td>
                  <td className="px-4 py-3 text-gray-500">{carrier.code}</td>
                  <td className="px-4 py-3">
                    <a href={carrier.trackingUrl} target="_blank" rel="noreferrer"
                      className="text-blue-600 hover:underline text-xs truncate block max-w-[200px]">
                      {carrier.trackingUrl || '-'}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleMutation.mutate({ id: carrier.id, isActive: !carrier.isActive })}
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        carrier.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {carrier.isActive ? 'Hoạt động' : 'Tắt'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-blue-600 hover:underline">Sửa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-bold text-lg mb-4">Thêm đơn vị vận chuyển</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Tên hãng *</label>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Mã *</label>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="VD: GHTK, GHN, VTP"
                    value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">URL Tracking</label>
                <input type="url" className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="https://..."
                  value={form.trackingUrl} onChange={e => setForm(f => ({ ...f, trackingUrl: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm mb-1">API Endpoint</label>
                <input type="url" className="w-full border rounded px-3 py-2 text-sm"
                  value={form.apiEndpoint} onChange={e => setForm(f => ({ ...f, apiEndpoint: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm mb-1">API Key</label>
                <input type="password" className="w-full border rounded px-3 py-2 text-sm"
                  value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded-lg text-sm">Hủy</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name || !form.code || createMutation.isPending}
                className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? 'Đang thêm...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
