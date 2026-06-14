import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Send, User } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/auth.store';

interface Props {
  productId: string;
}

export default function ProductQnASection({ productId }: Props) {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [question, setQuestion] = useState('');
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['product-qna', productId],
    queryFn: () => apiClient.get(`/products/${productId}/qna`, { params: { limit: 20 } }).then((r) => r.data.data),
    enabled: !!productId,
  });

  const askMutation = useMutation({
    mutationFn: (q: string) => apiClient.post(`/products/${productId}/qna`, { question: q }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-qna', productId] });
      setQuestion('');
      toast.success('Câu hỏi đã được gửi. Người bán sẽ trả lời sớm nhất có thể.');
    },
    onError: () => toast.error('Không thể gửi câu hỏi'),
  });

  const items = data?.items || [];
  const displayed = showAll ? items : items.slice(0, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    askMutation.mutate(question.trim());
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={20} className="text-orange-500" />
        <h2 className="text-lg font-bold">Hỏi đáp ({data?.total || 0})</h2>
      </div>

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Đặt câu hỏi về sản phẩm này..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!question.trim() || askMutation.isPending}
              className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium"
            >
              <Send size={16} />
              Gửi
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
          <p>Chưa có câu hỏi nào. Hãy là người đầu tiên hỏi!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((item: any) => (
            <div key={item.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {item.asker?.buyerProfile?.fullName || 'Người dùng ẩn danh'}
                  </p>
                  <p className="text-sm text-gray-800 mt-0.5">{item.question}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              {item.answer && (
                <div className="ml-11 bg-white border border-orange-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-orange-600 mb-1">Người bán trả lời:</p>
                  <p className="text-sm text-gray-700">{item.answer}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.answeredAt ? new Date(item.answeredAt).toLocaleDateString('vi-VN') : ''}
                  </p>
                </div>
              )}
              {!item.answer && (
                <div className="ml-11 text-xs text-gray-400 italic">Đang chờ người bán trả lời...</div>
              )}
            </div>
          ))}

          {items.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-800 mx-auto"
            >
              {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showAll ? 'Thu gọn' : `Xem thêm ${items.length - 3} câu hỏi`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
