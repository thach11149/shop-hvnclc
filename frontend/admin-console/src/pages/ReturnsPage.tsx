import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý', SELLER_APPROVED: 'Người bán chấp nhận',
  SELLER_REJECTED: 'Người bán từ chối', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy',
};

export default function ReturnsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-returns'],
    queryFn: () => apiClient.get('/admin/return-requests').then(r => r.data.data),
  });

  const processRefund = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/return-requests/${id}/refund`),
    onSuccess: () => { toast.success('Đã xử lý hoàn tiền'); queryClient.invalidateQueries({ queryKey: ['admin-returns'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý đổi trả</h1>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center text-gray-500">Không có yêu cầu đổi trả</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500">Đơn hàng</th>
                <th className="text-left px-4 py-3 text-gray-500">Khách hàng</th>
                <th className="text-left px-4 py-3 text-gray-500">Lý do</th>
                <th className="text-left px-4 py-3 text-gray-500">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500">Ngày yêu cầu</th>
                <th className="text-left px-4 py-3 text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((req: any) => (
                <tr key={req.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{req.order?.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{req.user?.email}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{req.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${req.status === 'SELLER_APPROVED' ? 'bg-green-100 text-green-700' : req.status === 'SELLER_REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {STATUS_LABELS[req.status] || req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    {req.status === 'SELLER_APPROVED' && !req.refundRequest && (
                      <button onClick={() => processRefund.mutate(req.id)} className="text-green-600 text-xs hover:underline">
                        Hoàn tiền
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
