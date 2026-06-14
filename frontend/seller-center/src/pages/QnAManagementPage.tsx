import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { MessageSquare, CheckCircle, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function QnAManagementPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('unanswered');
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['seller-qna', filter],
    queryFn: () =>
      apiClient
        .get('/seller/qna', {
          params: {
            answered: filter === 'answered' ? true : filter === 'unanswered' ? false : undefined,
            limit: 50,
          },
        })
        .then((r) => r.data.data),
  });

  const answerMutation = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      apiClient.patch(`/qna/${id}/answer`, { answer }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-qna'] });
      setAnsweringId(null);
      setAnswerText('');
      toast.success('Đã gửi câu trả lời');
    },
    onError: () => toast.error('Không thể gửi câu trả lời'),
  });

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hỏi đáp sản phẩm</h1>
        <p className="text-gray-500 text-sm mt-1">Trả lời câu hỏi từ khách hàng về sản phẩm</p>
      </div>

      <div className="flex items-center gap-2">
        {([
          { key: 'unanswered', label: 'Chưa trả lời' },
          { key: 'answered', label: 'Đã trả lời' },
          { key: 'all', label: 'Tất cả' },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {filter === 'unanswered' ? 'Không có câu hỏi nào cần trả lời' : 'Không có câu hỏi nào'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {item.answer ? (
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock size={16} className="text-orange-500 flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium text-gray-500">
                    Sản phẩm: <span className="text-gray-800">{item.product?.name}</span>
                  </span>
                </div>
                <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>

              <div className="bg-orange-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-orange-600 font-medium mb-1">
                  {item.asker?.buyerProfile?.fullName || 'Khách hàng'} hỏi:
                </p>
                <p className="text-sm text-gray-800">{item.question}</p>
              </div>

              {item.answer ? (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-700 font-medium mb-1">Câu trả lời của bạn:</p>
                  <p className="text-sm text-gray-700">{item.answer}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.answeredAt ? new Date(item.answeredAt).toLocaleDateString('vi-VN') : ''}
                  </p>
                </div>
              ) : (
                <>
                  {answeringId === item.id ? (
                    <div>
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Nhập câu trả lời của bạn..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => answerMutation.mutate({ id: item.id, answer: answerText })}
                          disabled={!answerText.trim() || answerMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
                        >
                          <Send size={14} />
                          Gửi trả lời
                        </button>
                        <button
                          onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                          className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAnsweringId(item.id)}
                      className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-800"
                    >
                      <MessageSquare size={14} />
                      Trả lời câu hỏi này
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
