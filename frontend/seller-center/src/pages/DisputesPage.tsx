import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

interface Dispute {
  id: string;
  orderId: string;
  buyerName: string;
  reason: string;
  evidence: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'CLOSED';
  sellerResponse: string | null;
  resolution: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  RESOLVED_BUYER: 'bg-red-100 text-red-700',
  RESOLVED_SELLER: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

export default function DisputesPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [response, setResponse] = useState('');

  const { data, isLoading } = useQuery<{ data: Dispute[] }>({
    queryKey: ['seller-disputes'],
    queryFn: () => apiClient.get('/seller/disputes').then(r => r.data),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      apiClient.post(`/seller/disputes/${id}/respond`, { response }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller-disputes'] }); setSelected(null); },
  });

  const disputes = data?.data ?? [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tranh chấp</h1>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-3">Phản hồi tranh chấp</h2>
            <div className="text-sm text-gray-600 mb-4 space-y-1 bg-gray-50 rounded p-3">
              <p><span className="font-medium">Đơn hàng:</span> {selected.orderId}</p>
              <p><span className="font-medium">Người mua:</span> {selected.buyerName}</p>
              <p><span className="font-medium">Lý do:</span> {selected.reason}</p>
              <p><span className="font-medium">Bằng chứng:</span> {selected.evidence}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phản hồi của bạn</label>
              <textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                rows={4}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Giải trình về đơn hàng, bằng chứng gửi hàng..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSelected(null)} className="px-4 py-2 border rounded text-sm">Hủy</button>
              <button
                onClick={() => respondMutation.mutate({ id: selected.id, response })}
                disabled={!response || respondMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                Gửi phản hồi
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
                {['Đơn hàng', 'Người mua', 'Lý do', 'Phản hồi của bạn', 'Trạng thái', 'Ngày', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {disputes.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{d.orderId?.slice(0, 8)}</td>
                  <td className="px-4 py-3">{d.buyerName}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{d.reason}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {d.sellerResponse ?? <span className="text-gray-400 italic">Chưa phản hồi</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] ?? ''}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(d.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    {d.status === 'OPEN' && !d.sellerResponse && (
                      <button onClick={() => { setSelected(d); setResponse(''); }} className="text-blue-600 hover:underline text-xs">Phản hồi</button>
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
