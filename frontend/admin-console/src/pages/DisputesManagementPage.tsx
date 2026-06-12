import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

interface Dispute {
  id: string;
  orderId: string;
  buyerName: string;
  shopName: string;
  reason: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  RESOLVED_BUYER: 'bg-green-100 text-green-700',
  RESOLVED_SELLER: 'bg-purple-100 text-purple-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

export default function DisputesManagementPage() {
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [favor, setFavor] = useState<'buyer' | 'seller'>('buyer');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: Dispute[] }>({
    queryKey: ['admin-disputes'],
    queryFn: () => apiClient.get('/admin/disputes').then(r => r.data),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution, favor }: { id: string; resolution: string; favor: string }) =>
      apiClient.post(`/admin/disputes/${id}/resolve`, { resolution, favor }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      setSelectedDispute(null);
      setResolution('');
    },
  });

  const disputes = data?.data ?? [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Trung tâm Tranh chấp</h1>

      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Xử lý tranh chấp</h2>
            <div className="text-sm text-gray-600 mb-4 space-y-1">
              <p><span className="font-medium">Đơn hàng:</span> {selectedDispute.orderId}</p>
              <p><span className="font-medium">Người mua:</span> {selectedDispute.buyerName}</p>
              <p><span className="font-medium">Shop:</span> {selectedDispute.shopName}</p>
              <p><span className="font-medium">Lý do:</span> {selectedDispute.reason}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quyết định có lợi cho</label>
              <div className="flex gap-4">
                {(['buyer', 'seller'] as const).map(f => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={f} checked={favor === f} onChange={() => setFavor(f)} />
                    <span className="text-sm">{f === 'buyer' ? 'Người mua' : 'Người bán'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Giải quyết</label>
              <textarea
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Mô tả cách giải quyết..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSelectedDispute(null)} className="px-4 py-2 border rounded text-sm">Hủy</button>
              <button
                onClick={() => resolveMutation.mutate({ id: selectedDispute.id, resolution, favor })}
                disabled={!resolution || resolveMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Xác nhận giải quyết
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
                {['Đơn hàng', 'Người mua', 'Shop', 'Lý do', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {disputes.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{d.orderId?.slice(0, 8)}</td>
                  <td className="px-4 py-3">{d.buyerName}</td>
                  <td className="px-4 py-3">{d.shopName}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-600">{d.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(d.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    {['OPEN', 'UNDER_REVIEW'].includes(d.status) && (
                      <button onClick={() => setSelectedDispute(d)} className="text-blue-600 hover:underline text-xs">Xử lý</button>
                    )}
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
