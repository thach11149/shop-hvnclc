import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ShoppingCart, Heart, Star, Minus, Plus, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { useAuthStore } from '../store/auth.store';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => apiClient.get(`/products/${slug}`).then(r => r.data.data),
  });

  const addToCart = useMutation({
    mutationFn: () => apiClient.post('/cart/items', { skuId: selectedSku || product?.skus?.[0]?.id, quantity }),
    onSuccess: () => {
      toast.success('Đã thêm vào giỏ hàng!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-8"><div className="animate-pulse h-64 bg-gray-100 rounded-xl" /></div>;
  if (!product) return <div className="text-center py-16">Sản phẩm không tồn tại</div>;

  const activeSku = product.skus?.find((s: any) => s.id === selectedSku) || product.skus?.[0];
  const available = activeSku?.inventoryStock
    ? activeSku.inventoryStock.totalQuantity - activeSku.inventoryStock.reservedQuantity - activeSku.inventoryStock.soldQuantity
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to={`/categories/${product.category?.slug}`} className="hover:text-primary-600">{product.category?.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-xl overflow-hidden mb-4">
            <img
              src={product.images?.[selectedImage]?.url || 'https://via.placeholder.com/500'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${i === selectedImage ? 'border-primary-500' : 'border-transparent'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={16} className="fill-orange-400 text-orange-400" />
              ))}
            </div>
            <span className="text-sm text-gray-500">({product._count?.reviews} đánh giá)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-primary-600">
              {Number(activeSku?.price || 0).toLocaleString('vi-VN')}₫
            </span>
            {activeSku?.comparePrice && (
              <span className="text-lg text-gray-400 line-through">
                {Number(activeSku.comparePrice).toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>

          {/* Variants */}
          {product.variantGroups?.map((group: any) => (
            <div key={group.id} className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">{group.name}</p>
              <div className="flex gap-2 flex-wrap">
                {group.options.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      const sku = product.skus?.find((s: any) =>
                        s.variantValues?.some((v: any) => v.optionId === opt.id)
                      );
                      if (sku) setSelectedSku(sku.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${
                      activeSku?.variantValues?.some((v: any) => v.optionId === opt.id)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="flex items-center gap-3 mb-6">
            <p className="text-sm font-medium text-gray-700">Số lượng:</p>
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-50">
                <Minus size={16} />
              </button>
              <span className="px-4 py-2 min-w-[40px] text-center">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(available, quantity + 1))} className="p-2 hover:bg-gray-50">
                <Plus size={16} />
              </button>
            </div>
            <span className="text-sm text-gray-500">{available} sản phẩm có sẵn</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => {
                if (!isAuthenticated) { toast.error('Vui lòng đăng nhập'); return; }
                addToCart.mutate();
              }}
              disabled={available === 0 || addToCart.isPending}
              className="flex-1 flex items-center justify-center gap-2 border border-primary-500 text-primary-600 py-3 rounded-lg hover:bg-primary-50 font-medium disabled:opacity-50"
            >
              <ShoppingCart size={18} />
              {available === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            </button>
            <button className="btn-primary flex-1 py-3">Mua ngay</button>
          </div>

          {/* Shop info */}
          <div className="card p-4 flex items-center gap-3">
            <Store size={20} className="text-primary-600" />
            <div>
              <p className="font-medium text-sm">{product.shop?.name}</p>
              <Link to={`/shops/${product.shop?.slug}`} className="text-xs text-primary-600 hover:underline">Xem Shop</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card p-6 mt-8">
        <h2 className="text-lg font-bold mb-4">Mô tả sản phẩm</h2>
        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
          {product.description || 'Chưa có mô tả'}
        </div>
      </div>

      {/* Reviews */}
      <div className="card p-6 mt-6">
        <h2 className="text-lg font-bold mb-4">Đánh giá ({product._count?.reviews})</h2>
        {product.reviews?.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((review: any) => (
              <div key={review.id} className="border-b pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                    {review.user?.buyerProfile?.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.user?.buyerProfile?.fullName || 'Người dùng'}</p>
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={12} className={i <= review.rating ? 'fill-orange-400 text-orange-400' : 'text-gray-300'} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Chưa có đánh giá nào</p>
        )}
      </div>
    </div>
  );
}
