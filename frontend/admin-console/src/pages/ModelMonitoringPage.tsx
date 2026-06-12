import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

interface ModelInfo {
  id: string;
  name: string;
  type: string;
  version: string;
  status: 'ACTIVE' | 'TRAINING' | 'DEPRECATED' | 'FAILED';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  predictionCount24h: number;
  avgLatencyMs: number;
  lastTrainedAt: string;
  nextTrainingAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  TRAINING: 'bg-blue-100 text-blue-700',
  DEPRECATED: 'bg-gray-100 text-gray-500',
  FAILED: 'bg-red-100 text-red-700',
};

function MetricBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-10 text-right">{pct}%</span>
    </div>
  );
}

export default function ModelMonitoringPage() {
  const { data, isLoading } = useQuery<{ data: ModelInfo[] }>({
    queryKey: ['admin-ml-models'],
    queryFn: () => apiClient.get('/admin/ai/models').then(r => r.data),
    refetchInterval: 60000,
  });

  const models = data?.data ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Giám sát Model ML</h1>
        <span className="text-sm text-gray-500">Cập nhật mỗi 60s</span>
      </div>

      {isLoading ? <p>Đang tải...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {models.map(model => (
            <div key={model.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{model.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{model.type}</span>
                    <span className="text-xs text-gray-400">v{model.version}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[model.status] ?? ''}`}>
                  {model.status}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                <MetricBar value={model.accuracy} label="Accuracy" />
                <MetricBar value={model.precision} label="Precision" />
                <MetricBar value={model.recall} label="Recall" />
                <MetricBar value={model.f1Score} label="F1 Score" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 text-xs">Dự đoán 24h</p>
                  <p className="font-bold">{model.predictionCount24h?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 text-xs">Latency TB</p>
                  <p className="font-bold">{model.avgLatencyMs}ms</p>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-400 flex justify-between">
                <span>Train lần cuối: {new Date(model.lastTrainedAt).toLocaleDateString('vi-VN')}</span>
                <span>Train tiếp: {new Date(model.nextTrainingAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
