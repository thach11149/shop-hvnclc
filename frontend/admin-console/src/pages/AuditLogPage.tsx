import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Shield, Search, Filter, Download, Eye } from 'lucide-react';
import apiClient from '../api/client';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  EXPORT: 'bg-yellow-100 text-yellow-700',
};

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', entityType, action, from, to, page],
    queryFn: () =>
      apiClient
        .get('/admin/audit-logs', {
          params: { entityType: entityType || undefined, action: action || undefined, from: from || undefined, to: to || undefined, page, limit: 50 },
        })
        .then((r) => r.data.data),
  });

  const logs = data?.items || [];

  const handleExport = () => {
    window.open('/api/v1/admin/export/orders', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={24} className="text-blue-500" />
            Nhật ký hoạt động
          </h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi tất cả hành động trong hệ thống</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <Download size={16} />
          Xuất CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm actor ID, entity ID..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">Tất cả entity</option>
            {['USER', 'PRODUCT', 'ORDER', 'SELLER', 'PROMOTION', 'CATEGORY', 'DISPUTE', 'SYSTEM'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">Tất cả hành động</option>
            {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Thời gian</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Hành động</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Đối tượng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">IP</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs font-mono text-gray-700">{log.actorId?.slice(-8)}</p>
                      <p className="text-xs text-gray-400">{log.actorType}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs font-medium">{log.entityType}</p>
                      <p className="text-xs text-gray-400 font-mono">{log.entityId?.slice(-12)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{log.ipAddress || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(log)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {logs.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-400">Không có log nào</div>
        )}
      </div>

      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-50">
            Trước
          </button>
          <span className="px-3 py-1.5 text-sm">Trang {page} / {data.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page === data.totalPages} className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-50">
            Sau
          </button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold mb-4">Chi tiết log</h3>
            <pre className="text-xs bg-gray-50 rounded p-4 overflow-auto">
              {JSON.stringify(selected, null, 2)}
            </pre>
            <button onClick={() => setSelected(null)} className="mt-4 px-4 py-2 bg-gray-100 rounded text-sm hover:bg-gray-200">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
