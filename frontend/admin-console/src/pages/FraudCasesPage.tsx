import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  INVESTIGATING: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-red-100 text-red-700',
  DISMISSED: 'bg-gray-100 text-gray-500',
  BLOCKED: 'bg-red-200 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Mới phát hiện',
  INVESTIGATING: 'Đang điều tra',
  CONFIRMED: 'Đã xác nhận',
  DISMISSED: 'Đã bỏ qua',
  BLOCKED: 'Đã chặn',
};

function RiskBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-red-500' : score >= 50 ? 'bg-orange-400' : 'bg-yellow-400';
  const label = score >= 80 ? 'Cao' : score >= 50 ? 'Trung bình' : 'Thấp';
  const labelColor = score >= 80 ? 'text-red-600' : score >= 50 ? 'text-orange-500' : 'text-yellow-600';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 w-20">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${labelColor}`}>{score}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded ${score >= 80 ? 'bg-red-100 text-red-700' : score >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
        {label}
      </span>
    </div>
  );
}

export default function FraudCasesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [riskFilter, setRiskFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [blockConfirm, setBlockConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-fraud-cases', statusFilter, riskFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ status: statusFilter });
      if (riskFilter) params.set('riskLevel', riskFilter);
      return apiClient.get(`/admin/fraud/cases?${params}`).then(r => r.data);
    },
  });

  const rawCases: any[] = data?.data?.data || data?.data || [];
  const cases = rawCases.filter((c: any) => {
    if (dateFrom && new Date(c.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(c.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/fraud/cases/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-cases'] });
      if (selectedCase) setSelectedCase((c: any) => ({ ...c, status: 'CONFIRMED' }));
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const blockUser = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/fraud/cases/${id}/block-user`),
    onSuccess: () => {
      toast.success('Đã chặn người dùng');
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-cases'] });
      setBlockConfirm(false);
      setSelectedCase(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const statusTabs = [
    { key: 'OPEN', label: 'Mới' },
    { key: 'INVESTIGATING', label: 'Đang điều tra' },
    { key: 'CONFIRMED', label: 'Đã xác nhận' },
    { key: 'DISMISSED', label: 'Đã bỏ qua' },
  ];

  return (
    <div>
      {blockConfirm && selectedCase && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3 text-red-600">
              <ShieldX size={24} />
              <h3 className="font-semibold">Chặn người dùng</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Bạn sắp chặn người dùng liên quan đến ca gian lận này. Họ sẽ không thể đăng nhập hoặc thực hiện giao dịch.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => blockUser.mutate(selectedCase.id)}
                disabled={blockUser.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-lg flex-1 hover:bg-red-700 disabled:opacity-50"
              >
                Xác nhận chặn
              </button>
              <button onClick={() => setBlockConfirm(false)} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {selectedCase && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-lg">Chi tiết ca gian lận</h3>
              <button onClick={() => setSelectedCase(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">Loại: </span><strong>{selectedCase.entityType}</strong></div>
                <div><span className="text-gray-400">ID: </span><code className="text-xs bg-gray-100 px-1 rounded">{selectedCase.entityId?.slice(0, 16)}</code></div>
                <div><span className="text-gray-400">Ngày phát hiện: </span><span>{new Date(selectedCase.createdAt).toLocaleString('vi-VN')}</span></div>
                <div><span className="text-gray-400">Trạng thái: </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedCase.status] || ''}`}>
                    {STATUS_LABELS[selectedCase.status] || selectedCase.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold mb-2">Điểm rủi ro</p>
                <RiskBar score={selectedCase.riskScore} />
              </div>

              {selectedCase.reasons?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-2">Yếu tố rủi ro</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.reasons.map((r: string, i: number) => (
                      <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCase.details && (
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-2">Chi tiết phân tích</p>
                  <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto">
                    {typeof selectedCase.details === 'string' ? selectedCase.details : JSON.stringify(selectedCase.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedCase.relatedCases?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-2">Ca liên quan</p>
                  <div className="space-y-1">
                    {selectedCase.relatedCases.map((rc: any) => (
                      <div key={rc.id} className="text-xs flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                        <code>{rc.entityId?.slice(0, 12)}</code>
                        <RiskBar score={rc.riskScore} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t flex gap-2 flex-wrap">
              {selectedCase.status === 'OPEN' && (
                <button
                  onClick={() => updateStatus.mutate({ id: selectedCase.id, status: 'INVESTIGATING' })}
                  className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200"
                >
                  <ShieldAlert size={14} className="inline mr-1" /> Bắt đầu điều tra
                </button>
              )}
              {['OPEN', 'INVESTIGATING'].includes(selectedCase.status) && (
                <>
                  <button
                    onClick={() => updateStatus.mutate({ id: selectedCase.id, status: 'DISMISSED' })}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200"
                  >
                    <ShieldCheck size={14} className="inline mr-1" /> Nhận định sai
                  </button>
                  <button
                    onClick={() => updateStatus.mutate({ id: selectedCase.id, status: 'CONFIRMED' })}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200"
                  >
                    Xác nhận gian lận
                  </button>
                  <button
                    onClick={() => setBlockConfirm(true)}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700"
                  >
                    <ShieldX size={14} className="inline mr-1" /> Chặn người dùng
                  </button>
                </>
              )}
              <button onClick={() => setSelectedCase(null)} className="btn-secondary text-sm ml-auto">Đóng</button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Phát hiện gian lận</h1>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm ${statusFilter === tab.key ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="input text-sm">
          <option value="">Tất cả mức độ rủi ro</option>
          <option value="high">Cao (&ge; 80)</option>
          <option value="medium">Trung bình (50-79)</option>
          <option value="low">Thấp (&lt; 50)</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Từ:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Đến:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input text-sm" />
        </div>
        <button onClick={() => { setRiskFilter(''); setDateFrom(''); setDateTo(''); }} className="text-sm text-gray-500 hover:text-gray-700">
          Xóa lọc
        </button>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-500">Đang tải...</div>
      ) : cases.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">Không có ca gian lận nào</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cases.map((c: any) => (
            <div
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className="card p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4"
              style={{ borderLeftColor: c.riskScore >= 80 ? '#ef4444' : c.riskScore >= 50 ? '#f97316' : '#eab308' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{c.entityType} · {new Date(c.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${c.riskScore >= 80 ? 'text-red-600' : c.riskScore >= 50 ? 'text-orange-500' : 'text-yellow-600'}`}>
                    {c.riskScore}
                  </p>
                  <p className="text-xs text-gray-400">/ 100</p>
                </div>
              </div>

              <div className="mb-3">
                <RiskBar score={c.riskScore} />
              </div>

              {c.reasons?.slice(0, 3).map((r: string, i: number) => (
                <span key={i} className="inline-block text-xs bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded mr-1 mb-1">
                  {r}
                </span>
              ))}

              <div className="mt-3 pt-3 border-t flex gap-2">
                {c.status === 'OPEN' && (
                  <button
                    onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: c.id, status: 'INVESTIGATING' }); }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Điều tra
                  </button>
                )}
                {['OPEN', 'INVESTIGATING'].includes(c.status) && (
                  <button
                    onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: c.id, status: 'DISMISSED' }); }}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Nhận định sai
                  </button>
                )}
                <span className="text-xs text-gray-400 ml-auto">Nhấn để xem chi tiết</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
