import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Heart, HeartOff, Star, Search, SlidersHorizontal } from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/auth.store';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating', label: 'Đánh giá cao' },
];

export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<'products' | 'reviews' | 'info'>('products');
  const [followed, setFollowed] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: (shopId: string) => apiClient.post(`/shops/${shopId}/follow`).then(r => r.data.data),
    onSuccess: (data) => {
      setFollowed(data?.followed ?? false);
      queryClient.invalidateQueries({ queryKey: ['followed-shops'] });
      queryClient.invalidateQueries({ queryKey: ['shop', slug] });
    },
  });

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', slug],
    queryFn: () => apiClient.get(`/shops/${slug}`).then(r => r.data.data),
    enabled: !!slug,
    onSuccess: (d: any) => { if (d?.isFollowed !== undefined) setFollowed(d.isFollowed); },
  });

  const { data: productsRes, isLoading: productsLoading } = useQuery({
    queryKey: ['shop-products', shop?.id, search, sort, minPrice, maxPrice, page],
    queryFn: () => {
      const params = new URLSearchParams({
        shopId: shop.id,
        sort,
        page: String(page),
        limit: '20',
      });
      if (search) params.set('search', search);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      return apiClient.get(`/products?${params}`).then(r => r.data.data);
    },
    enabled: !!shop?.id && tab === 'products',
  });

  const { data: reviewsRes, isLoading: reviewsLoading } = useQuery({
    queryKey: ['shop-reviews', shop?.id, page],
    queryFn: () => apiClient.get(`/shops/${shop.id}/reviews?page=${page}&limit=10`).then(r => r.data.data),
    enabled: !!shop?.id && tab === 'reviews',
  });

  if (shopLoading) return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-xl mb-4" />
      <div className="h-16 bg-gray-100 rounded-xl mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );

  if (!shop) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">🏪</p>
      <p className="text-gray-600">Không tìm thấy shop</p>
      <Link to="/" className="btn-primary mt-4 inline-block">Về trang chủ</Link>
    </div>
  );

  const products = productsRes?.data || productsRes || [];
  const totalProducts = productsRes?.total || products.length;
  const totalPages = Math.ceil(totalProducts / 20);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Banner */}
      {shop.bannerUrl && (
        <div className="h-40 md:h-56 rounded-xl overflow-hidden mb-4">
          <img src={shop.bannerUrl} alt="banner" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Shop Header Card */}
      <div className="card p-4 mb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {shop.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow -mt-10 relative z-10" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600 border-4 border-white shadow -mt-10 relative z-10">
              {shop.name?.[0]?.toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-800">{shop.name}</h1>
                {shop.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{shop.description}</p>
                )}
              </div>
              {isAuthenticated && (
                <button
                  onClick={() => shop?.id && followMutation.mutate(shop.id)}
                  disabled={followMutation.isPending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                    followed
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'bg-primary-50 text-primary-600 border border-primary-200 hover:bg-primary-100'
                  }`}
                >
                  {followed ? <HeartOff size={15} /> : <Heart size={15} />}
                  {followed ? 'Bỏ theo dõi' : 'Theo dõi'}
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-800">{shop.totalProducts || 0}</span>
                <span className="text-xs text-gray-500">Sản phẩm</span>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-800">{(shop.totalSales || 0).toLocaleString('vi-VN')}</span>
                <span className="text-xs text-gray-500">Đã bán</span>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-800 flex items-center gap-1">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  {shop.avgRating?.toFixed(1) || '0.0'}
                </span>
                <span className="text-xs text-gray-500">Đánh giá</span>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-800">{(shop._count?.followers || 0).toLocaleString('vi-VN')}</span>
                <span className="text-xs text-gray-500">Theo dõi</span>
              </div>
              {shop.responseTime && (
                <>
                  <div className="w-px bg-gray-200" />
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-gray-800">{shop.responseTime}</span>
                    <span className="text-xs text-gray-500">Phản hồi</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {[
          { key: 'products', label: 'Sản phẩm' },
          { key: 'reviews', label: 'Đánh giá' },
          { key: 'info', label: 'Thông tin' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as any); setPage(1); }}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              tab === t.key ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === 'products' && (
        <div>
          {/* Filter bar */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm trong shop..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${showFilters ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-200 text-gray-600'}`}
            >
              <SlidersHorizontal size={15} />
              Lọc
            </button>
          </div>

          {showFilters && (
            <div className="card p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Lọc theo giá</p>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  placeholder="Từ (₫)"
                  value={minPrice}
                  onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                  className="border rounded-lg px-3 py-2 text-sm w-36"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  placeholder="Đến (₫)"
                  value={maxPrice}
                  onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                  className="border rounded-lg px-3 py-2 text-sm w-36"
                />
                {(minPrice || maxPrice) && (
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="text-sm text-red-500 hover:underline">Xóa lọc</button>
                )}
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {[
                  { label: 'Dưới 100K', min: '', max: '100000' },
                  { label: '100K–300K', min: '100000', max: '300000' },
                  { label: '300K–1M', min: '300000', max: '1000000' },
                  { label: 'Trên 1M', min: '1000000', max: '' },
                ].map(r => (
                  <button
                    key={r.label}
                    onClick={() => { setMinPrice(r.min); setMaxPrice(r.max); setPage(1); }}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      minPrice === r.min && maxPrice === r.max
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : !products.length ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">📦</p>
              <p>Không tìm thấy sản phẩm nào</p>
              {search && <button onClick={() => setSearch('')} className="text-primary-600 text-sm mt-2 hover:underline">Xóa tìm kiếm</button>}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-3">{totalProducts} sản phẩm</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((product: any) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.slug}`}
                    className="card overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square overflow-hidden bg-gray-50">
                      <img
                        src={product.images?.[0]?.url || 'https://via.placeholder.com/300'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-800 line-clamp-2">{product.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-primary-600 font-bold text-sm">
                          {Number(product.skus?.[0]?.salePrice || product.skus?.[0]?.price || 0).toLocaleString('vi-VN')}₫
                        </p>
                        {product.skus?.[0]?.salePrice && product.skus?.[0]?.price > product.skus?.[0]?.salePrice && (
                          <p className="text-xs text-gray-400 line-through">
                            {Number(product.skus[0].price).toLocaleString('vi-VN')}₫
                          </p>
                        )}
                      </div>
                      {product.avgRating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-gray-500">{product.avgRating?.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-40">←</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`px-3 py-1 border rounded text-sm ${page === p ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-50'}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-40">→</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && (
        <div>
          {/* Rating summary */}
          <div className="card p-4 mb-4 flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-800">{shop.avgRating?.toFixed(1) || '0.0'}</p>
              <div className="flex justify-center gap-0.5 my-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14} className={s <= Math.round(shop.avgRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                ))}
              </div>
              <p className="text-xs text-gray-500">Đánh giá shop</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5,4,3,2,1].map(star => {
                const count = shop.ratingBreakdown?.[star] || 0;
                const total = shop.totalReviews || 1;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-gray-600">{star}</span>
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${(count/total)*100}%` }} />
                    </div>
                    <span className="w-8 text-right text-gray-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {reviewsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : !(reviewsRes?.data || reviewsRes || []).length ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-3xl mb-2">💬</p>
              <p>Chưa có đánh giá nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(reviewsRes?.data || reviewsRes || []).map((review: any) => (
                <div key={review.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                      {review.user?.fullName?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">{review.user?.fullName || 'Khách hàng'}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {review.productName && (
                        <p className="text-xs text-gray-400 mb-1">Sản phẩm: {review.productName}</p>
                      )}
                      <p className="text-sm text-gray-700">{review.comment}</p>
                      {review.images?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {review.images.slice(0, 4).map((img: string, i: number) => (
                            <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Tab */}
      {tab === 'info' && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-700 mb-4 text-lg">Thông tin về shop</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-gray-500 w-36 shrink-0">Tên shop:</span>
                <span className="font-medium">{shop.name}</span>
              </div>
              {shop.address && (
                <div className="flex gap-3">
                  <span className="text-gray-500 w-36 shrink-0">Địa chỉ:</span>
                  <span>{shop.address}</span>
                </div>
              )}
              {shop.phone && (
                <div className="flex gap-3">
                  <span className="text-gray-500 w-36 shrink-0">Điện thoại:</span>
                  <span>{shop.phone}</span>
                </div>
              )}
              <div className="flex gap-3">
                <span className="text-gray-500 w-36 shrink-0">Tham gia từ:</span>
                <span>{new Date(shop.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              {shop.returnPolicy && (
                <div className="flex gap-3">
                  <span className="text-gray-500 w-36 shrink-0">Chính sách hoàn:</span>
                  <span>{shop.returnPolicy}</span>
                </div>
              )}
              {shop.responseTime && (
                <div className="flex gap-3">
                  <span className="text-gray-500 w-36 shrink-0">Phản hồi trong:</span>
                  <span>{shop.responseTime}</span>
                </div>
              )}
            </div>
            {shop.description && (
              <div>
                <p className="text-gray-500 text-sm mb-2">Mô tả shop:</p>
                <p className="text-sm text-gray-700 leading-relaxed">{shop.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
