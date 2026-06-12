import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const PAYMENT_METHODS = [
  { value: 'COD', label: '💵 Thanh toán khi nhận hàng (COD)' },
  { value: 'BANK_TRANSFER', label: '🏦 Chuyển khoản ngân hàng' },
  { value: 'VNPAY', label: '💳 VNPay' },
  { value: 'MOMO', label: '📱 MoMo' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [voucherCode, setVoucherCode] = useState('');

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/cart').then(r => r.data.data),
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => apiClient.get('/account/addresses').then(r => r.data.data),
  });

  const { data: preview } = useQuery({
    queryKey: ['checkout-preview', selectedAddress, voucherCode],
    queryFn: () => apiClient.post('/checkout/preview', {
      items: cart?.items?.map((i: any) => ({ skuId: i.skuId, quantity: i.quantity })) || [],
      shippingAddressId: selectedAddress,
      paymentMethod,
      voucherCode: voucherCode || undefined,
    }).then(r => r.data.data),
    enabled: !!selectedAddress && cart?.items?.length > 0,
  });

  const createOrder = useMutation({
    mutationFn: () => apiClient.post('/orders', {
      items: cart?.items?.map((i: any) => ({ skuId: i.skuId, quantity: i.quantity })) || [],
      shippingAddressId: selectedAddress,
      paymentMethod,
      voucherCode: voucherCode || undefined,
    }),
    onSuccess: (res) => {
      toast.success('Đặt hàng thành công!');
      navigate('/orders');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi đặt hàng'),
  });

  // Auto-select default address
  if (addresses && !selectedAddress) {
    const def = addresses.find((a: any) => a.isDefault) || addresses[0];
    if (def) setSelectedAddress(def.id);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thanh toán</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Shipping Address */}
          <div className="card p-4">
            <h2 className="font-bold mb-3">Địa chỉ giao hàng</h2>
            {addresses?.map((addr: any) => (
              <label key={addr.id} className="flex gap-3 mb-2 cursor-pointer">
                <input
                  type="radio"
                  value={addr.id}
                  checked={selectedAddress === addr.id}
                  onChange={() => setSelectedAddress(addr.id)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-sm">{addr.fullName} | {addr.phone}</p>
                  <p className="text-sm text-gray-500">{addr.addressLine}, {addr.district}, {addr.province}</p>
                  {addr.isDefault && <span className="text-xs text-primary-600">Mặc định</span>}
                </div>
              </label>
            ))}
            {!addresses?.length && (
              <p className="text-gray-500 text-sm">
                Chưa có địa chỉ.{' '}
                <a href="/account/addresses" className="text-primary-600">Thêm địa chỉ</a>
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="card p-4">
            <h2 className="font-bold mb-3">Phương thức thanh toán</h2>
            {PAYMENT_METHODS.map(method => (
              <label key={method.value} className="flex gap-3 mb-2 cursor-pointer">
                <input
                  type="radio"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={() => setPaymentMethod(method.value)}
                />
                <span className="text-sm">{method.label}</span>
              </label>
            ))}
          </div>

          {/* Voucher */}
          <div className="card p-4">
            <h2 className="font-bold mb-3">Mã giảm giá</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã voucher"
                className="input flex-1"
              />
              <button className="btn-secondary px-4">Áp dụng</button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="card p-4 h-fit">
          <h2 className="font-bold text-lg mb-4">Tóm tắt đơn hàng</h2>

          {cart?.items?.slice(0, 3).map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 line-clamp-1 flex-1">{item.sku?.product?.name} x{item.quantity}</span>
              <span className="ml-2">{(Number(item.sku?.price) * item.quantity).toLocaleString('vi-VN')}₫</span>
            </div>
          ))}
          {cart?.items?.length > 3 && (
            <p className="text-xs text-gray-400 mb-2">+{cart.items.length - 3} sản phẩm khác</p>
          )}

          <hr className="my-3" />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tạm tính</span>
              <span>{(preview?.subtotal || cart?.subtotal || 0).toLocaleString('vi-VN')}₫</span>
            </div>
            {preview?.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span>
                <span>-{preview.discountAmount.toLocaleString('vi-VN')}₫</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Phí vận chuyển</span>
              <span>{(preview?.shippingFee || 0) === 0 ? 'Miễn phí' : `${(preview?.shippingFee || 30000).toLocaleString('vi-VN')}₫`}</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-base">
              <span>Tổng cộng</span>
              <span className="text-primary-600">
                {(preview?.total || cart?.subtotal || 0).toLocaleString('vi-VN')}₫
              </span>
            </div>
          </div>

          <button
            onClick={() => createOrder.mutate()}
            disabled={!selectedAddress || createOrder.isPending}
            className="btn-primary w-full py-3 mt-4 disabled:opacity-50"
          >
            {createOrder.isPending ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>

          <p className="text-xs text-gray-400 mt-2 text-center">
            Bằng cách đặt hàng, bạn đồng ý với điều khoản dịch vụ
          </p>
        </div>
      </div>
    </div>
  );
}
