import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

interface FraudAlert {
  id: string;
  modelName: string;
  entityType: string;
  entityId: string;
  entityName: string;
  confidence: number;
  alertType: string;
  features: Record<string, number>;
  status: 'NEW' | 'REVIEWED' | 'ACTIONED' | 'FALSE_POSITIVE';
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-red-100 text-red-700',
  REVIEWED: 'bg-yellow-100 text-yellow-700',
  ACTIONED: 'bg-blue-100 text-blue-700',
  FALSE_POSITIVE: 'bg-gray-100 text-gray-500',
};

export default function AIFraudAlertsPage() {
  const [statusFilter, setStatusFilter] = useState('NEW');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: FraudAlert[] }>({
    queryKey: ['admin-ai-fraud-alerts', statusFilter],
    queryFn: () => apiClient.get(`/admin/ai/fraud-alerts?status=${statusFilter}`).then(r => r.data),
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/ai/fraud-alerts/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-ai-fraud-alerts'] }),
  });

  const alerts = data?.data ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cảnh báo Gian lận AI</h1>
        <span className="text-sm text-gray-500">Tự động cập nhật mỗi 30s</span>
      </div>

      <div className="flex gap-2 mb-6">
        {['NEW', 'REVIEWED', 'ACTIONED', 'FALSE_POSITIVE'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'FALSE_POSITIVE' ? 'Sai' : s}
          </button>
        ))}
      </div>

      {isLoading ? <p>Đang tải...</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Model', 'Loại', 'Thực thể', 'Độ tin cậy', 'Loại cảnh báo', 'Thời gian', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {alerts.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-mono">{a.modelName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{a.entityType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.entityName}</div>
                    <div className="text-xs text-gray-400">{a.entityId?.slice(0, 8)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${a.confidence * 100}%` }} />
                      </div>
                      <span className="font-bold text-red-600">{(a.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{a.alertType}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(a.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] ?? ''}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.status === 'NEW' && (
                      <div className="flex gap-1">
                        <button onClick={() => updateMutation.mutate({ id: a.id, status: 'ACTIONED' })} className="text-red-600 hover:underline text-xs">Xử lý</button>
                        <button onClick={() => updateMutation.mutate({ id: a.id, status: 'FALSE_POSITIVE' })} className="text-gray-500 hover:underline text-xs">Sai</button>
                      </div>
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
