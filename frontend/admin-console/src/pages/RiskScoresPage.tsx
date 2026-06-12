import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

type EntityType = 'USER' | 'SHOP' | 'ORDER';

interface RiskEntry {
  entityId: string;
  entityName: string;
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
  lastUpdated: string;
}

const LEVEL_COLORS: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export default function RiskScoresPage() {
  const [entityType, setEntityType] = useState<EntityType>('USER');
  const [minScore, setMinScore] = useState(50);

  const { data, isLoading } = useQuery<{ data: RiskEntry[] }>({
    queryKey: ['admin-risk-scores', entityType, minScore],
    queryFn: () => apiClient.get(`/admin/fraud/risk-scores?entityType=${entityType}&minScore=${minScore}`).then(r => r.data),
  });

  const entries = data?.data ?? [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Điểm rủi ro</h1>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-1">
          {(['USER', 'SHOP', 'ORDER'] as EntityType[]).map(t => (
            <button
              key={t}
              onClick={() => setEntityType(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                entityType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'USER' ? 'Người dùng' : t === 'SHOP' ? 'Shop' : 'Đơn hàng'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Điểm tối thiểu:</label>
          <input
            type="range" min={0} max={100} value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm font-medium w-8">{minScore}</span>
        </div>
      </div>

      {isLoading ? <p>Đang tải...</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Tên/ID', 'Điểm rủi ro', 'Mức độ', 'Yếu tố rủi ro', 'Cập nhật lần cuối'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((e, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.entityName}</div>
                    <div className="text-xs text-gray-400 font-mono">{e.entityId?.slice(0, 12)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            e.score >= 80 ? 'bg-red-500' : e.score >= 50 ? 'bg-orange-400' : 'bg-yellow-400'
                          }`}
                          style={{ width: `${e.score}%` }}
                        />
                      </div>
                      <span className="font-bold">{e.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${LEVEL_COLORS[e.level] ?? ''}`}>
                      {e.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <ul className="list-disc list-inside">
                      {e.factors?.slice(0, 3).map((f, fi) => <li key={fi} className="text-xs">{f}</li>)}
                    </ul>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(e.lastUpdated).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
