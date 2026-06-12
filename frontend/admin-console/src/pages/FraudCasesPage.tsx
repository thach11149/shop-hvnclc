import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

interface FraudCase {
  id: string;
  entityType: 'ORDER' | 'USER' | 'SHOP' | 'PAYMENT';
  entityId: string;
  riskScore: number;
  reasons: string[];
  status: 'OPEN' | 'INVESTIGATING' | 'CONFIRMED' | 'DISMISSED';
  assignee: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  INVESTIGATING: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-red-100 text-red-700',
  DISMISSED: 'bg-gray-100 text-gray-500',
};

const RISK_COLOR = (score: number) => {
  if (score >= 80) return 'text-red-600 font-bold';
  if (score >= 50) return 'text-orange-500 font-medium';
  return 'text-yellow-600';
};

export default function FraudCasesPage() {
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: FraudCase[] }>({
    queryKey: ['admin-fraud-cases', statusFilter],
    queryFn: () => apiClient.get(`/admin/fraud/cases?status=${statusFilter}`).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/fraud/cases/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-fraud-cases'] }),
  });

  const cases = data?.data ?? [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý Gian lận</h1>

      <div className="flex gap-2 mb-6">
        {['OPEN', 'INVESTIGATING', 'CONFIRMED', 'DISMISSED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? <p>Đang tải...</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Loại', 'ID thực thể', 'Điểm rủi ro', 'Lý do', 'Trạng thái', 'Ngày phát hiện', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {cases.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{c.entityType}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.entityId?.slice(0, 12)}</td>
                  <td className={`px-4 py-3 ${RISK_COLOR(c.riskScore)}`}>{c.riskScore}/100</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    <ul className="list-disc list-inside">
                      {c.reasons?.slice(0, 2).map((r, i) => <li key={i} className="text-xs">{r}</li>)}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? ''}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {c.status === 'OPEN' && (
                        <button onClick={() => updateMutation.mutate({ id: c.id, status: 'INVESTIGATING' })} className="text-blue-600 hover:underline text-xs">Điều tra</button>
                      )}
                      {c.status === 'INVESTIGATING' && (
                        <>
                          <button onClick={() => updateMutation.mutate({ id: c.id, status: 'CONFIRMED' })} className="text-red-600 hover:underline text-xs">Xác nhận</button>
                          <button onClick={() => updateMutation.mutate({ id: c.id, status: 'DISMISSED' })} className="text-gray-500 hover:underline text-xs">Bỏ qua</button>
                        </>
                      )}
                    </div>
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
