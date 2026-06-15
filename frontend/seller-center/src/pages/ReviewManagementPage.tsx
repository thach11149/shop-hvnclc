import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Star, MessageSquare, Send, Filter, BarChart2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
      ))}
    </div>
  );
}

function RatingChart({ stats }: { stats: Record<string, number> }) {
  const total = Object.values(stats).reduce((sum, v) => sum + v, 0);
  const avg = total > 0
    ? Object.entries(stats).reduce((sum, [k, v]) => sum + Number(k) * v, 0) / total
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
        <BarChart2 size={18} className="text-yellow-500" />
        Phân tích đánh giá
      </h2>
      <div className="flex gap-6">
        {/* Average */}
        <div className="text-center flex-shrink-0">
          <p className="text-5xl font-bold text-yellow-500">{avg.toFixed(1)}</p>
          <StarRating rating={Math.round(avg)} size={16} />
          <p className="text-xs text-gray-500 mt-1">{total.toLocaleString()} đánh giá</p>
        </div>
        {/* Bars */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats[star] || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                <Star size={10} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ReviewManagementPage() {
  const qc = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [replyFilter, setReplyFilter] = useState<'ALL' | 'UNREPLIED'>('ALL');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['seller-reviews', ratingFilter, replyFilter],
    queryFn: () =>
      apiClient
        .get('/seller/reviews', {
          params: {
            rating: ratingFilter !== 'ALL' ? Number(ratingFilter) : undefined,
            unreplied: replyFilter === 'UNREPLIED' ? true : undefined,
            limit: 50,
          },
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

  const reviews: any[] = data?.items || [];
  const stats: Record<string, number> = data?.ratingStats || {};
  const total: number = data?.total || 0;
  const avgRating: number = data?.avgRating || 0;
  const unrepliedCount: number = data?.unreplied || 0;

  const REPLY_TEMPLATES = [
    'Cảm ơn bạn đã tin tưởng và ủng hộ shop! ❤️',
    'Xin lỗi vì trải nghiệm chưa tốt. Chúng tôi sẽ cải thiện ngay!',
    'Cảm ơn đánh giá tích cực của bạn! Rất vui được phục vụ bạn.',
    'Chúng tôi ghi nhận và sẽ cải thiện chất lượng dịch vụ.',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá</h1>
          <p className="text-gray-500 text-sm mt-1">Phản hồi và quản lý đánh giá từ khách hàng</p>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-gray-500 text-sm">Tổng đánh giá</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-gray-500 text-sm">Trung bình</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-yellow-500">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} size={14} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-sm">Chưa phản hồi</p>
            {unrepliedCount > 0 && <TrendingUp size={14} className="text-red-400" />}
          </div>
          <p className={`text-2xl font-bold mt-1 ${unrepliedCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {unrepliedCount}
          </p>
        </div>
      </div>

      {/* Rating chart */}
      {Object.keys(stats).length > 0 && <RatingChart stats={stats} />}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-gray-400" />
          {(['ALL', '5', '4', '3', '2', '1'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setRatingFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                ratingFilter === f ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'ALL' ? 'Tất cả' : `${f} ⭐`}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['ALL', 'UNREPLIED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setReplyFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                replyFilter === f ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'ALL' ? 'Tất cả' : 'Chưa phản hồi'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <Star size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Chưa có đánh giá nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600 flex-shrink-0">
                  {(review.user?.buyerProfile?.fullName || 'K')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{review.user?.buyerProfile?.fullName || 'Khách hàng'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    {!review.sellerReply && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex-shrink-0">
                        Chờ phản hồi
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-1 font-medium">{review.product?.name}</p>
                  {review.comment && <p className="text-sm text-gray-700 mt-2">{review.comment}</p>}

                  {review.images?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {review.images.map((img: any) => (
                        <img key={img.id} src={img.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}

                  {review.sellerReply ? (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Phản hồi của bạn:</p>
                      <p className="text-sm text-blue-800">{review.sellerReply}</p>
                    </div>
                  ) : replyingTo === review.id ? (
                    <div className="mt-3">
                      {/* Quick reply templates */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {REPLY_TEMPLATES.map((t, i) => (
                          <button
                            key={i}
                            onClick={() => setReplyText(t)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
                          >
                            {t.slice(0, 30)}...
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Viết phản hồi cho khách hàng..."
                        rows={3}
                        autoFocus
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => replyMutation.mutate({ id: review.id, reply: replyText })}
                          disabled={!replyText.trim() || replyMutation.isPending}
                          className="flex items-center gap-1 px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                        >
                          <Send size={13} />
                          {replyMutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
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
                      onClick={() => { setReplyingTo(review.id); setReplyText(''); }}
                      className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <MessageSquare size={13} />
                      Phản hồi khách hàng
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
