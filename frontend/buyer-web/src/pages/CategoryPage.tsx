import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => apiClient.get(`/categories/${slug}`).then(r => r.data.data),
  });

  const { data: products, isLoading: prodLoading } = useQuery({
    queryKey: ['category-products', slug],
    queryFn: () => apiClient.get(`/products?categorySlug=${slug}&limit=24`).then(r => r.data.data),
    enabled: !!slug,
  });

  const isLoading = catLoading || prodLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{category?.name || slug}</span>
      </nav>

      {/* Category Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{category?.name || 'Danh mục'}</h1>
        {category?.description && <p className="text-gray-500 mt-1">{category.description}</p>}
      </div>

      {/* Subcategories */}
      {category?.children?.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-6">
          {category.children.map((sub: any) => (
            <Link
              key={sub.id}
              to={`/categories/${sub.slug}`}
              className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {sub.image && <img src={sub.image} alt={sub.name} className="w-12 h-12 object-contain mb-2" />}
              <span className="text-xs text-center text-gray-700">{sub.name}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Products */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg animate-pulse h-56" />
          ))}
        </div>
      ) : products?.data?.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">📦</p>
          <p>Chưa có sản phẩm nào trong danh mục này</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products?.data?.map((product: any) => (
            <Link
              key={product.id}
              to={`/products/${product.slug}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/200'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-2">
                <p className="text-sm text-gray-800 line-clamp-2 mb-1">{product.name}</p>
                <p className="text-primary-600 font-semibold text-sm">
                  {Number(product.minPrice || product.skus?.[0]?.price || 0).toLocaleString('vi-VN')}₫
                </p>
                {product.reviewCount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {product.avgRating?.toFixed(1)} ⭐ ({product.reviewCount})
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
