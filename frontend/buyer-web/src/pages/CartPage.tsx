import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Tag, Heart, ChevronDown, ChevronUp, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { useAuthStore } from '../store/auth.store';

interface CouponResult {
  valid: boolean;
  discount: number;
  type: string | null;
  description: string;
}

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; result: CouponResult } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [collapsedShops, setCollapsedShops] = useState<Set<string>>(new Set());

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/cart').then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      apiClient.patch(`/cart/items/${itemId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi'),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => apiClient.delete(`/cart/items/${itemId}`),
    onSuccess: () => {
      toast.success('Đã xóa khỏi giỏ hàng');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const saveForLater = useMutation({
    mutationFn: async ({ itemId, productId }: { itemId: string; productId: string }) => {
      await apiClient.post('/user/wishlist', { productId });
      return apiClient.delete(`/cart/items/${itemId}`);
    },
    onSuccess: () => {
      toast.success('Đã lưu vào danh sách yêu thích');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể lưu'),
  });

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const res = await apiClient.post('/promotions/validate-coupon', {
        code: couponInput.trim().toUpperCase(),
        subtotal: cart?.subtotal || 0,
        cartItems: cart?.items?.map((i: any) => ({
          skuId: i.skuId,
          quantity: i.quantity,
          unitPrice: Number(i.sku?.price || 0),
          subtotal: Number(i.sku?.price || 0) * i.quantity,
          shopId: i.sku?.product?.shopId || '',
        })) || [],
      });
      const result: CouponResult = res.data.data;
      if (result.valid) {
        setAppliedCoupon({ code: couponInput.trim().toUpperCase(), result });
        toast.success(`Áp dụng thành công! ${result.description}`);
      } else {
        toast.error(result.description || 'Mã không hợp lệ');
      }
    } catch {
      toast.error('Không thể kiểm tra mã giảm giá');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponInput(''); };

  const toggleShop = (shopId: string) => {
    setCollapsedShops(prev => {
      const next = new Set(prev);
      next.has(shopId) ? next.delete(shopId) : next.add(shopId);
      return next;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg text-gray-500 mb-4">Vui lòng đăng nhập để xem giỏ hàng</p>
        <Link to="/login" className="btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-400">Đang tải...</div>;

  const items: any[] = cart?.items || [];
  const subtotal: number = cart?.subtotal || 0;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg text-gray-500 mb-4">Giỏ hàng trống</p>
        <Link to="/products" className="btn-primary">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  // Group items by shop
  const shopGroups = items.reduce((acc: Record<string, { shop: any; items: any[] }>, item: any) => {
    const shopId = item.sku?.product?.shopId || item.sku?.product?.shop?.id || 'unknown';
    const shopName = item.sku?.product?.shop?.name || 'Người bán khác';
    if (!acc[shopId]) acc[shopId] = { shop: { id: shopId, name: shopName }, items: [] };
    acc[shopId].items.push(item);
    return acc;
  }, {});

  const shopList = Object.values(shopGroups) as { shop: any; items: any[] }[];
  const discount = appliedCoupon?.result?.discount || 0;
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal - discount + shippingFee;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Giỏ hàng <span className="text-gray-400 font-normal text-lg">({items.length} sản phẩm)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items grouped by shop */}
        <div className="lg:col-span-2 space-y-4">
          {shopList.map(({ shop, items: shopItems }) => {
            const shopSubtotal = shopItems.reduce((s: number, i: any) => s + Number(i.sku?.price || 0) * i.quantity, 0);
            const isCollapsed = collapsedShops.has(shop.id);
            return (
              <div key={shop.id} className="card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
                      {shop.name[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{shop.name}</span>
                    <span className="text-xs text-gray-400">• {shopItems.length} sản phẩm</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      Tạm tính: <span className="font-medium text-gray-800">{shopSubtotal.toLocaleString('vi-VN')}₫</span>
                    </span>
                    <button onClick={() => toggleShop(shop.id)} className="text-gray-400 hover:text-gray-600">
                      {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="divide-y">
                    {shopItems.map((item: any) => (
                      <div key={item.id} className="p-4 flex gap-4">
                        <img
                          src={item.sku?.product?.images?.[0]?.url || 'https://via.placeholder.com/80'}
                          alt={item.sku?.name}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.sku?.product?.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.sku?.name}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-gray-200 rounded-lg">
                              <button
                                onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                                className="p-1.5 hover:bg-gray-50"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-3 py-1 text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                                className="p-1.5 hover:bg-gray-50"
                                disabled={item.quantity >= (item.availableQuantity || 99)}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-primary-600 font-semibold text-sm">
                                {(Number(item.sku?.price) * item.quantity).toLocaleString('vi-VN')}₫
                              </span>
                              <button
                                onClick={() => saveForLater.mutate({ itemId: item.id, productId: item.sku?.product?.id || '' })}
                                className="text-gray-400 hover:text-red-400"
                                title="Lưu để sau"
                              >
                                <Heart size={15} />
                              </button>
                              <button
                                onClick={() => removeItem.mutate(item.id)}
                                className="text-gray-400 hover:text-red-500"
                                title="Xóa"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                          {!item.isAvailable && (
                            <p className="text-red-500 text-xs mt-1">Sản phẩm không còn đủ hàng</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="card p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Tag size={16} className="text-orange-500" />
              Mã giảm giá
            </h3>
            {appliedCoupon ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-700">{appliedCoupon.code}</p>
                  <p className="text-xs text-green-600">{appliedCoupon.result.description}</p>
                </div>
                <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  placeholder="Nhập mã voucher"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Áp dụng'}
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="card p-4 sticky top-24">
            <h2 className="font-bold text-lg mb-4">Tổng đơn hàng</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính ({items.length} sản phẩm)</span>
                <span>{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({appliedCoupon?.code})</span>
                  <span>-{discount.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Phí vận chuyển</span>
                <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}₫`}
                </span>
              </div>
              {subtotal < 500000 && (
                <p className="text-xs text-gray-400 bg-orange-50 px-2 py-1 rounded">
                  Mua thêm {(500000 - subtotal).toLocaleString('vi-VN')}₫ để được miễn phí vận chuyển
                </p>
              )}
              <hr />
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Tổng cộng</span>
                <span className="text-primary-600">{total.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon?.code } })}
              disabled={items.some((i: any) => !i.isAvailable)}
              className="btn-primary w-full py-3 mt-4 disabled:opacity-50 text-sm font-medium"
            >
              Tiến hành thanh toán
            </button>
            <Link to="/products" className="block text-center text-sm text-gray-400 hover:text-primary-600 mt-2">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
