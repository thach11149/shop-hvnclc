import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  SELLER_APPROVED: 'Đã chấp nhận',
  SELLER_REJECTED: 'Đã từ chối',
  COMPLETED: 'Hoàn thành',
};

export default function ReturnRequestsPage() {
  const queryClient = useQueryClient();
  const [rejectNote, setRejectNote] = useState<{ id: string; note: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-returns'],
    queryFn: () => apiClient.get('/seller/return-requests').then(r => r.data.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/seller/return-requests/${id}/approve`),
    onSuccess: () => { toast.success('Đã chấp nhận yêu cầu'); queryClient.invalidateQueries({ queryKey: ['seller-returns'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => apiClient.patch(`/seller/return-requests/${id}/reject`, { note }),
    onSuccess: () => { toast.success('Đã từ chối yêu cầu'); setRejectNote(null); queryClient.invalidateQueries({ queryKey: ['seller-returns'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Yêu cầu đổi trả</h1>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center text-gray-500">Không có yêu cầu đổi trả nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Đơn hàng</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Lý do</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ngày yêu cầu</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((req: any) => (
                <tr key={req.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{req.order?.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{req.reason}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : req.status === 'SELLER_APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {STATUS_LABELS[req.status] || req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => approve.mutate(req.id)} className="text-green-600 text-xs hover:underline">Chấp nhận</button>
                        <button onClick={() => setRejectNote({ id: req.id, note: '' })} className="text-red-500 text-xs hover:underline">Từ chối</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejectNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold mb-3">Lý do từ chối</h3>
            <textarea
              value={rejectNote.note}
              onChange={e => setRejectNote({ ...rejectNote, note: e.target.value })}
              rows={3}
              className="input w-full mb-4"
              placeholder="Nhập lý do từ chối..."
            />
            <div className="flex gap-3">
              <button onClick={() => reject.mutate({ id: rejectNote.id, note: rejectNote.note })} disabled={reject.isPending} className="btn-primary disabled:opacity-50">
                Xác nhận
              </button>
              <button onClick={() => setRejectNote(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
