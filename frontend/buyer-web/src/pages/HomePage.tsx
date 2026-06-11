import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import ProductCard from '../components/product/ProductCard';
import { ChevronRight } from 'lucide-react';

export default function HomePage() {
  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: () => apiClient.get('/admin/banners').then(r => r.data.data).catch(() => []),
  });

  const { data: products } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => apiClient.get('/products?limit=20').then(r => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then(r => r.data.data),
  });

  const { data: flashSales } = useQuery({
    queryKey: ['flash-sale'],
    queryFn: () => apiClient.get('/flash-sale/active').then(r => r.data.data).catch(() => []),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero Banner */}
      <div className="rounded-xl overflow-hidden mb-6 h-60 bg-gradient-to-r from-primary-600 to-orange-500 flex items-center justify-center">
        {banners?.[0] ? (
          <a href={banners[0].link || '/'}>
            <img src={banners[0].imageUrl} alt={banners[0].title} className="w-full h-full object-cover" />
          </a>
        ) : (
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-2">🛍️ Chào mừng đến Marketplace</h1>
            <p className="text-lg opacity-90">Hàng triệu sản phẩm, giá tốt nhất</p>
          </div>
        )}
      </div>

      {/* Categories */}
      {categories?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Danh mục</h2>
          <div className="grid grid-cols-5 gap-3">
            {categories.slice(0, 10).map((cat: { id: string; slug: string; name: string; image?: string }) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="card p-3 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 mx-auto mb-2 bg-primary-50 rounded-full flex items-center justify-center text-2xl">
                  {getCategoryEmoji(cat.slug)}
                </div>
                <span className="text-xs text-gray-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Flash Sale */}
      {flashSales?.length > 0 && (
        <section className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-orange-600">⚡ Flash Sale</h2>
            <Link to="/flash-sale/active" className="flex items-center text-sm text-orange-500 hover:text-orange-600">
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {flashSales.slice(0, 5).flatMap((slot: { items: any[] }) => slot.items?.slice(0, 1) || []).map((item: any) => (
              <div key={item.id} className="card">
                <img
                  src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/150'}
                  alt={item.product?.name}
                  className="w-full aspect-square object-cover rounded-t-lg"
                />
                <div className="p-2">
                  <p className="text-xs text-gray-700 line-clamp-1">{item.product?.name}</p>
                  <p className="text-primary-600 font-bold text-sm">
                    {Number(item.flashPrice).toLocaleString('vi-VN')}₫
                  </p>
                  <div className="bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full"
                      style={{ width: `${Math.max(10, 100 - (item.soldCount / item.quota) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Đã bán {item.soldCount}/{item.quota}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Sản phẩm nổi bật</h2>
          <Link to="/products" className="flex items-center text-sm text-primary-600 hover:text-primary-700">
            Xem tất cả <ChevronRight size={16} />
          </Link>
        </div>
        {products?.data?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.data.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">🛍️</p>
            <p>Chưa có sản phẩm nào. Hãy là người bán đầu tiên!</p>
            <a href="/seller/register" className="btn-primary mt-4 inline-block">Bắt đầu bán hàng</a>
          </div>
        )}
      </section>
    </div>
  );
}

function getCategoryEmoji(slug: string): string {
  const map: Record<string, string> = {
    'dien-tu': '📱', 'dien-thoai': '📱', 'laptop': '💻', 'may-tinh-bang': '📱',
    'thoi-trang': '👗', 'ao': '👕', 'quan': '👖', 'giay-dep': '👟',
    'gia-dung': '🏠', 'lam-dep': '💄', 'the-thao': '⚽',
  };
  return map[slug] || '🛍️';
}
