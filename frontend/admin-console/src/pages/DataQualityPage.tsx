import { useEffect, useState } from 'react';
import { Database, CheckCircle, AlertTriangle, XCircle, RefreshCw, TrendingUp } from 'lucide-react';

interface DataMetric {
  name: string;
  table: string;
  totalRows: number;
  nullRate: number;
  duplicateRate: number;
  freshnessHours: number;
  qualityScore: number;
  status: 'GOOD' | 'WARNING' | 'ERROR';
  issues: string[];
}

const MOCK_METRICS: DataMetric[] = [
  {
    name: 'Sản phẩm', table: 'products', totalRows: 12480, nullRate: 2.1, duplicateRate: 0.3,
    freshnessHours: 0.5, qualityScore: 94, status: 'GOOD', issues: [],
  },
  {
    name: 'Đơn hàng', table: 'orders', totalRows: 87320, nullRate: 0.8, duplicateRate: 0.0,
    freshnessHours: 0.1, qualityScore: 98, status: 'GOOD', issues: [],
  },
  {
    name: 'Người dùng', table: 'users', totalRows: 45200, nullRate: 5.3, duplicateRate: 0.1,
    freshnessHours: 1.2, qualityScore: 88, status: 'GOOD', issues: ['5.3% thiếu số điện thoại'],
  },
  {
    name: 'Đánh giá', table: 'reviews', totalRows: 23100, nullRate: 12.5, duplicateRate: 1.2,
    freshnessHours: 2.0, qualityScore: 71, status: 'WARNING',
    issues: ['12.5% thiếu nội dung đánh giá', '1.2% có khả năng trùng lặp'],
  },
  {
    name: 'Sự kiện hành vi', table: 'behavior_events', totalRows: 1240000, nullRate: 0.5, duplicateRate: 3.1,
    freshnessHours: 0.08, qualityScore: 85, status: 'WARNING',
    issues: ['3.1% events có thể bị ghi trùng do retry'],
  },
  {
    name: 'Log tìm kiếm', table: 'search_logs', totalRows: 580000, nullRate: 8.2, duplicateRate: 0.0,
    freshnessHours: 0.2, qualityScore: 78, status: 'WARNING',
    issues: ['8.2% không có user_id (khách ẩn danh không log đủ)'],
  },
  {
    name: 'Tồn kho', table: 'inventory_stocks', totalRows: 34200, nullRate: 0.0, duplicateRate: 0.0,
    freshnessHours: 0.3, qualityScore: 99, status: 'GOOD', issues: [],
  },
  {
    name: 'Rủi ro gian lận', table: 'risk_events', totalRows: 1820, nullRate: 15.0, duplicateRate: 0.5,
    freshnessHours: 6.0, qualityScore: 62, status: 'ERROR',
    issues: ['15% thiếu device_fingerprint', 'Dữ liệu cũ >6h chưa cập nhật'],
  },
];

export default function DataQualityPage() {
  const [metrics, setMetrics] = useState<DataMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(new Date());

  useEffect(() => {
    setTimeout(() => { setMetrics(MOCK_METRICS); setLoading(false); }, 600);
  }, []);

  const runScan = async () => {
    setScanning(true);
    await new Promise(r => setTimeout(r, 2000));
    setMetrics(MOCK_METRICS.map(m => ({
      ...m,
      qualityScore: Math.min(100, m.qualityScore + Math.floor(Math.random() * 3 - 1)),
    })));
    setLastScan(new Date());
    setScanning(false);
  };

  const statusCounts = {
    GOOD: metrics.filter(m => m.status === 'GOOD').length,
    WARNING: metrics.filter(m => m.status === 'WARNING').length,
    ERROR: metrics.filter(m => m.status === 'ERROR').length,
  };

  const overallScore = metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + m.qualityScore, 0) / metrics.length)
    : 0;

  const getStatusIcon = (status: DataMetric['status']) => {
    if (status === 'GOOD') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'WARNING') return <AlertTriangle size={16} className="text-yellow-500" />;
    return <XCircle size={16} className="text-red-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 75) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Database className="text-indigo-600" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Chất lượng dữ liệu</h1>
            <p className="text-sm text-gray-500">Quét lúc {lastScan.toLocaleTimeString('vi-VN')}</p>
          </div>
        </div>
        <button
          onClick={runScan}
          disabled={scanning || loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw size={15} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Đang quét...' : 'Quét lại'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-xl border ${getScoreBg(overallScore)} border-gray-200`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className={getScoreColor(overallScore)} />
            <span className="text-sm text-gray-600">Điểm tổng</span>
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</div>
          <div className="text-xs text-gray-500">/100</div>
        </div>
        <div className="p-4 rounded-xl bg-green-50 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-sm text-gray-600">Tốt</span>
          </div>
          <div className="text-3xl font-bold text-green-600">{statusCounts.GOOD}</div>
          <div className="text-xs text-gray-500">bảng dữ liệu</div>
        </div>
        <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-yellow-500" />
            <span className="text-sm text-gray-600">Cảnh báo</span>
          </div>
          <div className="text-3xl font-bold text-yellow-600">{statusCounts.WARNING}</div>
          <div className="text-xs text-gray-500">bảng dữ liệu</div>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={16} className="text-red-500" />
            <span className="text-sm text-gray-600">Lỗi</span>
          </div>
          <div className="text-3xl font-bold text-red-600">{statusCounts.ERROR}</div>
          <div className="text-xs text-gray-500">bảng dữ liệu</div>
        </div>
      </div>

      {/* Metrics table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-medium text-gray-700">Chi tiết theo bảng dữ liệu</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <RefreshCw size={24} className="mx-auto animate-spin mb-2" />
            Đang quét dữ liệu...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Bảng</th>
                  <th className="text-right px-4 py-3">Tổng bản ghi</th>
                  <th className="text-right px-4 py-3">Null rate</th>
                  <th className="text-right px-4 py-3">Duplicate</th>
                  <th className="text-right px-4 py-3">Freshness</th>
                  <th className="text-center px-4 py-3">Điểm</th>
                  <th className="text-left px-4 py-3">Vấn đề</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.map(m => (
                  <tr key={m.table} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(m.status)}
                        <div>
                          <div className="font-medium text-gray-900">{m.name}</div>
                          <div className="text-xs text-gray-400 font-mono">{m.table}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 text-gray-700">{m.totalRows.toLocaleString()}</td>
                    <td className="text-right px-4 py-3">
                      <span className={m.nullRate > 10 ? 'text-red-600 font-medium' : m.nullRate > 5 ? 'text-yellow-600' : 'text-gray-600'}>
                        {m.nullRate}%
                      </span>
                    </td>
                    <td className="text-right px-4 py-3">
                      <span className={m.duplicateRate > 2 ? 'text-red-600 font-medium' : m.duplicateRate > 0.5 ? 'text-yellow-600' : 'text-gray-600'}>
                        {m.duplicateRate}%
                      </span>
                    </td>
                    <td className="text-right px-4 py-3">
                      <span className={m.freshnessHours > 4 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {m.freshnessHours < 1 ? `${Math.round(m.freshnessHours * 60)}p` : `${m.freshnessHours}h`}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreBg(m.qualityScore)} ${getScoreColor(m.qualityScore)}`}>
                        {m.qualityScore}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.issues.length === 0 ? (
                        <span className="text-xs text-green-600">Không có vấn đề</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {m.issues.map((issue, i) => (
                            <li key={i} className="text-xs text-orange-600 flex items-start gap-1">
                              <span className="mt-0.5 flex-shrink-0">•</span>{issue}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
        <strong>Lưu ý:</strong> Điểm chất lượng được tính dựa trên null rate, duplicate rate và freshness. Dữ liệu có điểm thấp (&lt;75) cần được xử lý trước khi sử dụng cho mô hình AI.
      </div>
    </div>
  );
}
