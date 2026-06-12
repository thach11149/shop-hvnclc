import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  SELLER_RESPONDED: 'bg-yellow-100 text-yellow-700',
  ADMIN_REVIEWING: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Đang mở',
  SELLER_RESPONDED: 'Người bán đã phản hồi',
  ADMIN_REVIEWING: 'Admin đang xem xét',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
};

export default function DisputesPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', activeFilter],
    queryFn: () => apiClient.get(`/admin/disputes${activeFilter !== 'all' ? `?status=${activeFilter}` : ''}`).then(r => r.data.data),
  });

  const { data: detail } = useQuery({
    queryKey: ['dispute-detail', selectedDispute?.id],
    queryFn: () => apiClient.get(`/disputes/${selectedDispute.id}`).then(r => r.data.data),
    enabled: !!selectedDispute?.id,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/disputes/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      if (selectedDispute) setSelectedDispute((d: any) => ({ ...d, status: 'ADMIN_REVIEWING' }));
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const resolveDispute = useMutation({
    mutationFn: (data: any) => apiClient.patch(`/admin/disputes/${selectedDispute.id}/resolve`, data),
    onSuccess: () => {
      toast.success('Đã giải quyết tranh chấp');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute-detail', selectedDispute?.id] });
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'OPEN', label: 'Đang mở' },
    { key: 'SELLER_RESPONDED', label: 'Đã phản hồi' },
    { key: 'ADMIN_REVIEWING', label: 'Đang xem xét' },
    { key: 'RESOLVED', label: 'Đã giải quyết' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Trung tâm tranh chấp</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${activeFilter === tab.key ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Disputes List */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Đang tải...</div>
            ) : !data?.data?.length ? (
              <div className="p-8 text-center text-gray-500 text-sm">Không có tranh chấp nào</div>
            ) : (
              <div className="divide-y">
                {data.data.map((dispute: any) => (
                  <button
                    key={dispute.id}
                    onClick={() => setSelectedDispute(dispute)}
                    className={`w-full text-left p-4 hover:bg-gray-50 ${selectedDispute?.id === dispute.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-sm font-medium">#{dispute.order?.orderNumber}</p>
                        <p className="text-xs text-gray-500">{dispute.shop?.name}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[dispute.status]}`}>
                        {STATUS_LABELS[dispute.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-1">{dispute.reason}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">{new Date(dispute.createdAt).toLocaleDateString('vi-VN')}</p>
                      <p className="text-xs text-gray-400">{dispute._count?.messages || 0} tin nhắn</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dispute Detail */}
        <div className="lg:col-span-3">
          {!selectedDispute ? (
            <div className="card p-12 text-center text-gray-500">
              <p className="text-4xl mb-3">⚖️</p>
              <p>Chọn một tranh chấp để xem và xử lý</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold">Chi tiết tranh chấp</h2>
                  <div className="flex gap-2">
                    {selectedDispute.status !== 'ADMIN_REVIEWING' && !['RESOLVED', 'CLOSED'].includes(selectedDispute.status) && (
                      <button
                        onClick={() => updateStatus.mutate({ id: selectedDispute.id, status: 'ADMIN_REVIEWING' })}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded"
                      >
                        Nhận xử lý
                      </button>
                    )}
                    {!['RESOLVED', 'CLOSED'].includes(selectedDispute.status) && (
                      <button
                        onClick={() => updateStatus.mutate({ id: selectedDispute.id, status: 'CLOSED' })}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded"
                      >
                        Đóng
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Đơn hàng: </span><span className="font-medium">#{detail?.order?.orderNumber}</span></div>
                  <div><span className="text-gray-500">Shop: </span><span className="font-medium">{selectedDispute.shop?.name}</span></div>
                  <div><span className="text-gray-500">Lý do: </span><span>{selectedDispute.reason}</span></div>
                  <div><span className="text-gray-500">Ngày mở: </span><span>{new Date(selectedDispute.createdAt).toLocaleDateString('vi-VN')}</span></div>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                {detail?.messages?.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.senderType === 'admin' ? 'bg-blue-600 text-white' :
                      msg.senderType === 'seller' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {msg.senderType === 'admin' ? 'Admin' : msg.senderType === 'seller' ? 'Người bán' : 'Người mua'}
                      </p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resolve form */}
              {!['RESOLVED', 'CLOSED'].includes(selectedDispute.status) && (
                <div className="p-4 border-t bg-gray-50">
                  <h3 className="text-sm font-medium mb-3">Giải quyết tranh chấp</h3>
                  <form onSubmit={handleSubmit((data) => resolveDispute.mutate(data))} className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Quyết định *</label>
                      <select {...register('decision', { required: true })} className="input mt-1 text-sm">
                        <option value="">-- Chọn quyết định --</option>
                        <option value="Đồng ý hoàn tiền cho người mua">Đồng ý hoàn tiền cho người mua</option>
                        <option value="Ủng hộ người bán">Ủng hộ người bán</option>
                        <option value="Giải quyết theo thỏa thuận">Giải quyết theo thỏa thuận</option>
                        <option value="Yêu cầu thêm bằng chứng">Yêu cầu thêm bằng chứng</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Ghi chú giải quyết *</label>
                      <textarea {...register('resolution', { required: true })} rows={2} className="input mt-1 text-sm resize-none w-full" />
                    </div>
                    <button type="submit" disabled={resolveDispute.isPending} className="btn-primary text-sm disabled:opacity-50">
                      {resolveDispute.isPending ? 'Đang xử lý...' : 'Giải quyết tranh chấp'}
                    </button>
                  </form>
                </div>
              )}

              {selectedDispute.status === 'RESOLVED' && detail?.decisions?.[0] && (
                <div className="p-4 border-t bg-green-50">
                  <p className="text-sm font-medium text-green-700">Đã giải quyết</p>
                  <p className="text-sm text-green-600">{detail.decisions[0].decision}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
