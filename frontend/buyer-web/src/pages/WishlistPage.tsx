import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, ShoppingCart, Trash2, ShoppingBag } from 'lucide-react';
import apiClient from '../api/client';

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiClient.get('/user/wishlist').then(r => r.data.data),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => apiClient.delete(`/user/wishlist/${productId}`),
    onSuccess: () => {
      toast.success('Đã xóa khỏi danh sách yêu thích');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ skuId, quantity }: { skuId: string; quantity: number }) =>
      apiClient.post('/cart/items', { skuId, quantity }),
    onSuccess: () => {
      toast.success('Đã thêm vào giỏ hàng');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể thêm vào giỏ'),
  });

  const items: any[] = data || [];

  const addAllToCart = async () => {
    let added = 0;
    for (const item of items) {
      const product = item.product || item;
      const defaultSku = product.skus?.[0];
      if (defaultSku) {
        try {
          await apiClient.post('/cart/items', { skuId: defaultSku.id, quantity: 1 });
          added++;
        } catch {}
      }
    }
    if (added > 0) {
      toast.success(`Đã thêm ${added} sản phẩm vào giỏ hàng`);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } else {
      toast.error('Không thể thêm sản phẩm vào giỏ');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="h-8 bg-gray-100 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Heart size={64} className="mx-auto text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Danh sách yêu thích trống</h2>
        <p className="text-sm text-gray-400 mb-6">Thêm sản phẩm yêu thích để dễ dàng mua sau</p>
        <Link to="/products" className="btn-primary">Khám phá sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Yêu thích <span className="text-gray-400 font-normal text-lg">({items.length})</span>
        </h1>
        {items.length > 1 && (
          <button
            onClick={addAllToCart}
            className="flex items-center gap-2 px-4 py-2 border border-primary-500 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            <ShoppingBag size={15} />
            Thêm tất cả vào giỏ
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item: any) => {
          const product = item.product || item;
          const defaultSku = product.skus?.[0];
          const salePrice = Number(defaultSku?.salePrice || 0);
          const originalPrice = Number(defaultSku?.price || 0);
          const price = salePrice > 0 ? salePrice : originalPrice;
          const discountPct = salePrice > 0 && originalPrice > salePrice
            ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
            : 0;
          const image = product.images?.[0]?.url || 'https://via.placeholder.com/300';

          return (
            <div key={item.id} className="card overflow-hidden group relative flex flex-col">
              {/* Discount badge */}
              {discountPct > 0 && (
                <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                  -{discountPct}%
                </div>
              )}

              {/* Remove button */}
              <button
                onClick={() => removeMutation.mutate(product.id)}
                disabled={removeMutation.isPending}
                className="absolute top-2 right-2 z-10 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={13} />
              </button>

              {/* Image */}
              <Link to={`/products/${product.slug}`} className="block">
                <div className="aspect-square overflow-hidden bg-gray-50">
                  <img
                    src={image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>

              {/* Info */}
              <div className="p-3 flex flex-col flex-1">
                <Link to={`/products/${product.slug}`}>
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1.5 hover:text-primary-600">
                    {product.name}
                  </h3>
                </Link>

                {/* Price */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary-600 font-bold text-sm">
                    {price.toLocaleString('vi-VN')}₫
                  </span>
                  {discountPct > 0 && (
                    <span className="text-gray-400 line-through text-xs">
                      {originalPrice.toLocaleString('vi-VN')}₫
                    </span>
                  )}
                </div>

                {/* Rating */}
                {product.ratingAvg > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-xs text-gray-500">{Number(product.ratingAvg).toFixed(1)}</span>
                    {product.ratingCount > 0 && (
                      <span className="text-xs text-gray-400">({product.ratingCount})</span>
                    )}
                  </div>
                )}

                {/* Add to cart button */}
                <button
                  onClick={() => defaultSku && addToCartMutation.mutate({ skuId: defaultSku.id, quantity: 1 })}
                  disabled={!defaultSku || addToCartMutation.isPending}
                  className="mt-auto w-full btn-primary text-xs py-1.5 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart size={13} />
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
