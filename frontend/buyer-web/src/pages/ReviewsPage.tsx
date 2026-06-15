import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, Edit2, Trash2, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

function StarRating({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={interactive ? 22 : 14}
          className={`${
            s <= (interactive ? hovered || rating : rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          } ${interactive ? 'cursor-pointer transition-colors' : ''}`}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(s)}
        />
      ))}
    </div>
  );
}

function EditReviewModal({
  review,
  onClose,
}: {
  review: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || '');

  const updateMutation = useMutation({
    mutationFn: () => apiClient.patch(`/reviews/${review.id}`, { rating, comment }),
    onSuccess: () => {
      toast.success('Đã cập nhật đánh giá');
      qc.invalidateQueries({ queryKey: ['my-reviews'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể cập nhật'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">Sửa đánh giá</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <img
              src={review.product?.images?.[0]?.url || '/placeholder.jpg'}
              alt={review.product?.name}
              className="w-14 h-14 rounded-lg object-cover bg-gray-100"
            />
            <p className="text-sm font-medium text-gray-800 line-clamp-2">{review.product?.name}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Điểm đánh giá</p>
            <div className="flex items-center gap-3">
              <StarRating rating={rating} interactive onChange={setRating} />
              <span className="text-sm text-gray-500">
                {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'][rating]}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nhận xét</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-200"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Hủy</button>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={!rating || updateMutation.isPending}
            className="flex-1 bg-yellow-400 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-yellow-500"
          >
            {updateMutation.isPending ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'PENDING'>('ALL');
  const [editingReview, setEditingReview] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews', filter],
    queryFn: () =>
      apiClient
        .get('/account/reviews', { params: { pending: filter === 'PENDING', limit: 50 } })
        .then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/reviews/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa đánh giá');
      qc.invalidateQueries({ queryKey: ['my-reviews'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể xóa'),
  });

  const reviews = data?.items || [];
  const pendingCount = data?.pendingCount || 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Star className="text-yellow-500" size={24} />
        <h1 className="text-xl font-bold">Đánh giá của tôi</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['ALL', 'PENDING'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'ALL' ? 'Tất cả đánh giá' : 'Chờ đánh giá'}
            {f === 'PENDING' && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          {filter === 'PENDING' ? (
            <>
              <Camera size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Không có sản phẩm nào chờ đánh giá</p>
            </>
          ) : (
            <>
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Chưa có đánh giá nào</p>
              <Link to="/orders" className="mt-3 inline-block text-sm text-red-500 hover:underline">
                Xem đơn hàng của bạn →
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <img
                  src={r.product?.images?.[0]?.url || '/placeholder.jpg'}
                  alt={r.product?.name}
                  className="w-16 h-16 object-cover rounded-xl flex-shrink-0 bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${r.product?.slug}`}
                    className="text-sm font-medium text-gray-900 hover:text-red-500 line-clamp-2"
                  >
                    {r.product?.name}
                  </Link>

                  {filter === 'PENDING' ? (
                    <Link
                      to={`/orders/${r.orderId}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-lg hover:bg-yellow-100"
                    >
                      <Star size={12} />
                      Viết đánh giá
                    </Link>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mt-2">
                        <StarRating rating={r.rating} />
                        <span className="text-xs text-gray-500">
                          {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {r.isVerified && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đã mua</span>
                        )}
                      </div>
                      {r.comment && (
                        <p className="text-sm text-gray-600 mt-2">{r.comment}</p>
                      )}
                      {r.images?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {r.images.map((img: any) => (
                            <img key={img.id} src={img.url} alt="" className="w-12 h-12 object-cover rounded-lg" />
                          ))}
                        </div>
                      )}
                      {r.sellerReply && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-1">Phản hồi từ người bán:</p>
                          <p className="text-sm text-gray-600">{r.sellerReply}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {filter === 'ALL' && (
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditingReview(r)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Sửa đánh giá"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => window.confirm('Xóa đánh giá này?') && deleteMutation.mutate(r.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Xóa đánh giá"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingReview && (
        <EditReviewModal review={editingReview} onClose={() => setEditingReview(null)} />
      )}
    </div>
  );
}
