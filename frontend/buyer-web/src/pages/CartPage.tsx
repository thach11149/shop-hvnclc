import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { useAuthStore } from '../store/auth.store';

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg text-gray-500 mb-4">Vui lòng đăng nhập để xem giỏ hàng</p>
        <Link to="/login" className="btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8">Đang tải...</div>;

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg text-gray-500 mb-4">Giỏ hàng trống</p>
        <Link to="/products" className="btn-primary">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Giỏ hàng ({items.length} sản phẩm)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className="card p-4 flex gap-4">
              <img
                src={item.sku?.product?.images?.[0]?.url || 'https://via.placeholder.com/80'}
                alt={item.sku?.name}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 line-clamp-2">
                  {item.sku?.product?.name}
                </p>
                <p className="text-xs text-gray-500">{item.sku?.name}</p>
                <p className="text-xs text-gray-400">{item.sku?.product?.shop?.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                      className="p-1.5 hover:bg-gray-50"
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
                    <span className="text-primary-600 font-semibold">
                      {(Number(item.sku?.price) * item.quantity).toLocaleString('vi-VN')}₫
                    </span>
                    <button
                      onClick={() => removeItem.mutate(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
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

        {/* Summary */}
        <div className="card p-4 h-fit sticky top-24">
          <h2 className="font-bold text-lg mb-4">Tổng đơn hàng</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tạm tính</span>
              <span>{subtotal.toLocaleString('vi-VN')}₫</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phí vận chuyển</span>
              <span>{subtotal >= 500000 ? 'Miễn phí' : '30.000₫'}</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-base">
              <span>Tổng cộng</span>
              <span className="text-primary-600">
                {(subtotal + (subtotal >= 500000 ? 0 : 30000)).toLocaleString('vi-VN')}₫
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            disabled={items.some((i: any) => !i.isAvailable)}
            className="btn-primary w-full py-3 mt-4 disabled:opacity-50"
          >
            Tiến hành thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
