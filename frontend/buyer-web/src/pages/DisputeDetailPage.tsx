import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

interface DisputeDetail {
  id: string;
  orderId: string;
  reason: string;
  evidence: string;
  status: string;
  sellerResponse: string | null;
  resolution: string | null;
  messages: { sender: string; content: string; createdAt: string }[];
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Mới tạo',
  UNDER_REVIEW: 'Đang xử lý',
  RESOLVED_BUYER: 'Giải quyết - có lợi cho bạn',
  RESOLVED_SELLER: 'Giải quyết - có lợi cho shop',
  CLOSED: 'Đã đóng',
};

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery<{ data: DisputeDetail }>({
    queryKey: ['dispute-detail', id],
    queryFn: () => apiClient.get(`/disputes/${id}`).then(r => r.data),
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => apiClient.post(`/disputes/${id}/messages`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dispute-detail', id] }); setMessage(''); },
  });

  const dispute = data?.data;

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-8">Đang tải...</div>;
  if (!dispute) return <div className="max-w-2xl mx-auto px-4 py-8">Không tìm thấy tranh chấp</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/orders" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Quay lại đơn hàng</Link>

      <div className="bg-white rounded-lg shadow p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Tranh chấp đơn hàng</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            dispute.status === 'RESOLVED_BUYER' ? 'bg-green-100 text-green-700' :
            dispute.status === 'OPEN' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {STATUS_LABELS[dispute.status] ?? dispute.status}
          </span>
        </div>
        <div className="text-sm text-gray-600 space-y-2">
          <p><span className="font-medium">Đơn hàng:</span> #{dispute.orderId?.slice(0, 8)}</p>
          <p><span className="font-medium">Lý do khiếu nại:</span> {dispute.reason}</p>
          <p><span className="font-medium">Bằng chứng:</span> {dispute.evidence}</p>
          {dispute.sellerResponse && (
            <p><span className="font-medium">Phản hồi từ shop:</span> {dispute.sellerResponse}</p>
          )}
          {dispute.resolution && (
            <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
              <p className="font-medium text-green-700">Kết quả giải quyết:</p>
              <p className="text-green-600">{dispute.resolution}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5 mb-4">
        <h2 className="font-semibold mb-3">Nhẫn tin</h2>
        <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
          {dispute.messages?.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'BUYER' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                msg.sender === 'BUYER' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'BUYER' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('vi-VN')}
                </p>
              </div>
            </div>
          ))}
        </div>
        {['OPEN', 'UNDER_REVIEW'].includes(dispute.status) && (
          <div className="flex gap-2">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && message && sendMutation.mutate(message)}
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Nhập tin nhắn..."
            />
            <button
              onClick={() => message && sendMutation.mutate(message)}
              disabled={!message || sendMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              Gửi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
