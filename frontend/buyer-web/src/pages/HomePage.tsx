import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Flame, Star } from 'lucide-react';
import apiClient from '../api/client';
import ProductCard from '../components/product/ProductCard';

function getCategoryEmoji(slug: string): string {
  const map: Record<string, string> = {
    'dien-tu': '📱',
    'dien-thoai': '📱',
    'laptop': '💻',
    'may-tinh-bang': '📱',
    'thoi-trang': '👗',
    'ao': '👕',
    'quan': '👖',
    'giay-dep': '👟',
    'gia-dung': '🏠',
    'lam-dep': '💄',
    'the-thao': '⚽',
    'sach': '📚',
    'do-choi': '🧸',
    'thuc-pham': '🍎',
    'suc-khoe': '💊',
  };
  return map[slug] || '🛍️';
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':');
}

const PLACEHOLDER_BANNERS = [
  {
    id: 'p1',
    title: 'Chào mừng đến Marketplace',
    subtitle: 'Hàng triệu sản phẩm, giá tốt nhất',
    gradient: 'from-primary-600 to-orange-500',
  },
  {
    id: 'p2',
    title: 'Flash Sale Mỗi Ngày',
    subtitle: 'Giảm đến 70% cho hàng ngàn sản phẩm',
    gradient: 'from-red-500 to-pink-600',
  },
  {
    id: 'p3',
    title: 'Miễn Phí Vận Chuyển',
    subtitle: 'Cho đơn hàng từ 150.000₫',
    gradient: 'from-blue-500 to-indigo-600',
  },
];

export default function HomePage() {
  const [bannerIdx, setBannerIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: () =>
      apiClient.get('/admin/banners').then(r => r.data.data).catch(() => []),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      apiClient.get('/categories').then(r => r.data.data).catch(() => []),
  });

  const { data: flashSales } = useQuery({
    queryKey: ['flash-sale'],
    queryFn: () =>
      apiClient.get('/flash-sale/active').then(r => r.data.data).catch(() => []),
  });

  const { data: aiRecs } = useQuery({
    queryKey: ['ai-recs-homepage'],
    queryFn: () =>
      apiClient.get('/ai/recommendations/homepage').then(r => r.data.data).catch(() => []),
  });

  const { data: bestSellers } = useQuery({
    queryKey: ['products', 'best-sellers'],
    queryFn: () =>
      apiClient.get('/products', { params: { sort: 'popular', limit: 10 } })
        .then(r => r.data.data)
        .catch(() => []),
  });

  // Banner auto-play
  const bannerList: any[] = banners?.length > 0 ? banners : PLACEHOLDER_BANNERS;
  useEffect(() => {
    if (bannerList.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIdx(prev => (prev + 1) % bannerList.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerList.length]);

  // Countdown to next midnight
  useEffect(() => {
    const computeSeconds = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
    };
    setCountdown(computeSeconds());
    const timer = setInterval(() => {
      setCountdown(computeSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const flashItems: any[] = flashSales?.[0]?.items || [];
  const aiProducts: any[] = Array.isArray(aiRecs) ? aiRecs : [];
  const bestSellerList: any[] = Array.isArray(bestSellers)
    ? bestSellers
    : bestSellers?.data || [];
  const catList: any[] = Array.isArray(categories) ? categories : [];

  const prevBanner = () =>
    setBannerIdx(prev => (prev - 1 + bannerList.length) % bannerList.length);
  const nextBanner = () =>
    setBannerIdx(prev => (prev + 1) % bannerList.length);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Banner Carousel */}
      <div className="relative rounded-xl overflow-hidden mb-6 h-64 select-none">
        {bannerList.map((banner: any, idx: number) => {
          const isActive = idx === bannerIdx;
          if (banner.imageUrl) {
            return (
              <a
                key={banner.id}
                href={banner.link || '/'}
                className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              </a>
            );
          }
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 bg-gradient-to-r ${banner.gradient || 'from-primary-600 to-orange-500'} flex items-center justify-center transition-opacity duration-700 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <div className="text-center text-white px-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{banner.title}</h1>
                <p className="text-lg opacity-90">{banner.subtitle}</p>
                <Link
                  to="/products"
                  className="mt-4 inline-block bg-white text-primary-600 font-semibold px-6 py-2 rounded-full hover:bg-opacity-90 transition-colors"
                >
                  Mua ngay
                </Link>
              </div>
            </div>
          );
        })}

        {/* Arrows */}
        {bannerList.length > 1 && (
          <>
            <button
              onClick={prevBanner}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {bannerList.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {bannerList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setBannerIdx(idx)}
                className={`rounded-full transition-all ${idx === bannerIdx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white bg-opacity-60'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Featured Categories */}
      {catList.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Danh mục nổi bật</h2>
          <div className="grid grid-cols-5 gap-3">
            {catList.slice(0, 10).map((cat: any) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="card p-3 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 mx-auto mb-2 bg-primary-50 rounded-full flex items-center justify-center text-2xl">
                  {cat.image
                    ? <img src={cat.image} alt={cat.name} className="w-8 h-8 object-contain" />
                    : getCategoryEmoji(cat.slug)}
                </div>
                <span className="text-xs text-gray-700 line-clamp-1">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Flash Sale */}
      <section className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-orange-600">
              <Flame size={22} className="fill-orange-500" />
              <h2 className="text-xl font-bold">Flash Sale</h2>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-mono px-3 py-1 rounded-lg">
              <Clock size={14} />
              <span>{formatCountdown(countdown)}</span>
            </div>
          </div>
          <Link
            to="/flash-sale/active"
            className="flex items-center text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Xem tất cả <ChevronRight size={16} />
          </Link>
        </div>

        {flashItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {flashItems.slice(0, 5).map((item: any) => {
              const soldPct = item.quota > 0
                ? Math.min(100, Math.round((item.soldCount / item.quota) * 100))
                : 0;
              return (
                <Link
                  key={item.id}
                  to={`/products/${item.product?.slug}`}
                  className="card hover:shadow-md transition-shadow overflow-hidden group"
                >
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/150'}
                      alt={item.product?.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {item.discountPct && (
                      <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        -{item.discountPct}%
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-700 line-clamp-1 mb-1">{item.product?.name}</p>
                    <p className="text-red-600 font-bold text-sm">
                      {Number(item.flashPrice).toLocaleString('vi-VN')}₫
                    </p>
                    {item.originalPrice && (
                      <p className="text-gray-400 text-xs line-through">
                        {Number(item.originalPrice).toLocaleString('vi-VN')}₫
                      </p>
                    )}
                    <div className="mt-1.5">
                      <div className="bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.max(5, soldPct)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Đã bán {soldPct}%</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-4xl">
                  🔥
                </div>
                <div className="p-2">
                  <div className="h-3 bg-gray-100 rounded mb-1 animate-pulse" />
                  <div className="h-4 bg-orange-100 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Recommendations */}
      {aiProducts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star size={20} className="fill-yellow-400 text-yellow-400" />
            <h2 className="text-xl font-bold text-gray-800">Gợi ý cho bạn</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {aiProducts.map((product: any) => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="card flex-shrink-0 w-40 hover:shadow-md transition-shadow group overflow-hidden"
              >
                <div className="relative overflow-hidden aspect-square">
                  <img
                    src={product.images?.[0]?.url || 'https://via.placeholder.com/160'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-800 line-clamp-2 mb-1">{product.name}</p>
                  <p className="text-primary-600 font-semibold text-sm">
                    {Number(product.skus?.[0]?.price || product.minPrice || 0).toLocaleString('vi-VN')}₫
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Bán chạy nhất</h2>
          <Link
            to="/products?sort=popular"
            className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Xem tất cả <ChevronRight size={16} />
          </Link>
        </div>
        {bestSellerList.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bestSellerList.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-primary-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
