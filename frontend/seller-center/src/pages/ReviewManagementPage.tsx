import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={12} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
      ))}
    </div>
  );
}

export default function ReviewManagementPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('ALL');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['seller-reviews', filter],
    queryFn: () =>
      apiClient
        .get('/seller/reviews', {
          params: { rating: filter !== 'ALL' ? Number(filter) : undefined, limit: 50 },
        })
        .then((r) => r.data.data),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      apiClient.patch(`/reviews/${id}/reply`, { reply }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-reviews'] });
      setReplyingTo(null);
      setReplyText('');
      toast.success('Đã phản hồi đánh giá');
    },
    onError: () => toast.error('Không thể phản hồi'),
  });

  const reviews = data?.items || [];
  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá</h1>
          <p className="text-gray-500 text-sm mt-1">Phản hồi và quản lý đánh giá từ khách hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng đánh giá', value: data?.total || 0, color: 'text-blue-600' },
          { label: 'Đánh giá trung bình', value: `${(data?.avgRating || 0).toFixed(1)} ⭐`, color: 'text-yellow-600' },
          { label: 'Chưa phản hồi', value: data?.unreplied || 0, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        {['ALL', '5', '4', '3', '2', '1'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'ALL' ? 'Tất cả' : `${f} ⭐`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Chưa có đánh giá nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                    {(review.user?.buyerProfile?.fullName || 'A')[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{review.user?.buyerProfile?.fullName || 'Khách hàng'}</p>
                    <StarRating rating={review.rating} />
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>

              <div className="mt-3 ml-12">
                <p className="text-sm text-gray-700 line-clamp-2 font-medium mb-1">{review.product?.name}</p>
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                {review.images?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {review.images.map((img: any) => (
                      <img key={img.id} src={img.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ))}
                  </div>
                )}

                {review.sellerReply ? (
                  <div className="mt-3 bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Phản hồi của bạn:</p>
                    <p className="text-sm text-blue-800">{review.sellerReply}</p>
                  </div>
                ) : (
                  <>
                    {replyingTo === review.id ? (
                      <div className="mt-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Viết phản hồi..."
                          rows={3}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => replyMutation.mutate({ id: review.id, reply: replyText })}
                            disabled={!replyText.trim() || replyMutation.isPending}
                            className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                          >
                            Gửi phản hồi
                          </button>
                          <button
                            onClick={() => { setReplyingTo(null); setReplyText(''); }}
                            className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <MessageSquare size={14} />
                        Phản hồi
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
