import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import apiClient from '../api/client';

export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<'products' | 'info'>('products');

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', slug],
    queryFn: () => apiClient.get(`/shops/${slug}`).then(r => r.data.data),
    enabled: !!slug,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['shop-products', shop?.id],
    queryFn: () => apiClient.get(`/products?shopId=${shop.id}`).then(r => r.data.data),
    enabled: !!shop?.id,
  });

  if (shopLoading) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="h-40 bg-gray-100 rounded-xl animate-pulse mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Shop Header */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-4">
          {shop.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.name} className="w-20 h-20 rounded-full object-cover border" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
              {shop.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{shop.name}</h1>
            {shop.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{shop.description}</p>}
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>⭐ {shop.avgRating?.toFixed(1) || '0.0'}</span>
              <span>📦 {shop.totalProducts || 0} sản phẩm</span>
              <span>🛍 {shop.totalSales || 0} đã bán</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        <button
          onClick={() => setTab('products')}
          className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
            tab === 'products' ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sản phẩm
        </button>
        <button
          onClick={() => setTab('info')}
          className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
            tab === 'info' ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Thông tin shop
        </button>
      </div>

      {tab === 'products' && (
        <div>
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : !products?.data?.length ? (
            <div className="text-center py-12 text-gray-500">Shop chưa có sản phẩm nào</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.data.map((product: any) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="card overflow-hidden group hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.images?.[0]?.url || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2">{product.name}</p>
                    <p className="text-primary-600 font-bold text-sm mt-1">
                      {Number(product.skus?.[0]?.salePrice || product.skus?.[0]?.price || 0).toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'info' && (
        <div className="card p-4">
          <h2 className="font-semibold text-gray-700 mb-4">Thông tin về shop</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-32">Tên shop:</span>
              <span className="font-medium">{shop.name}</span>
            </div>
            {shop.address && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-32">Địa chỉ:</span>
                <span>{shop.address}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-gray-500 w-32">Tham gia từ:</span>
              <span>{new Date(shop.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
