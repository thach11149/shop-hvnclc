import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Package, MessageSquare } from 'lucide-react';
import apiClient from '../api/client';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [filter, setFilter] = useState<'ALL' | 'PENDING'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews', filter],
    queryFn: () =>
      apiClient.get('/account/reviews', { params: { pending: filter === 'PENDING' } }).then((r) => r.data.data),
  });

  const reviews = data?.items || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Star className="text-yellow-500" size={24} />
        <h1 className="text-xl font-bold">Đánh giá của tôi</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {(['ALL', 'PENDING'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'ALL' ? 'Tất cả đánh giá' : 'Chờ đánh giá'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Chưa có đánh giá nào</p>
          <Link to="/orders" className="mt-3 inline-block text-sm text-red-500 hover:underline">
            Xem đơn hàng của bạn
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <img
                  src={r.product?.images?.[0]?.url || '/placeholder.jpg'}
                  alt={r.product?.name}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${r.product?.slug}`}
                    className="text-sm font-medium text-gray-900 hover:text-red-500 line-clamp-2"
                  >
                    {r.product?.name}
                  </Link>
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
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">{r.comment}</p>
                  )}
                  {r.images?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {r.images.map((img: any) => (
                        <img
                          key={img.id}
                          src={img.url}
                          alt=""
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {r.sellerReply && (
                <div className="mt-3 ml-20 bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Phản hồi từ người bán:</p>
                  <p className="text-sm text-gray-600">{r.sellerReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
