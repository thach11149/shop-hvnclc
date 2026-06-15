import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard, Banknote, Smartphone, Tag, MapPin, Plus, CheckCircle, Loader, X, Edit2 } from 'lucide-react';
import apiClient from '../api/client';

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', icon: <Banknote size={18} className="text-green-600" />, desc: 'Trả tiền mặt khi nhận hàng' },
  { value: 'VNPAY', label: 'VNPay', icon: <CreditCard size={18} className="text-blue-600" />, desc: 'Thẻ ATM, Visa, MasterCard' },
  { value: 'MOMO', label: 'Ví MoMo', icon: <Smartphone size={18} className="text-pink-600" />, desc: 'Ví điện tử MoMo' },
  { value: 'ZALOPAY', label: 'ZaloPay', icon: <Smartphone size={18} className="text-blue-500" />, desc: 'Ví điện tử ZaloPay' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [tempAddress, setTempAddress] = useState<string>('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherResult, setVoucherResult] = useState<{ discount: number; description: string } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [note, setNote] = useState('');

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/cart').then((r) => r.data.data),
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => apiClient.get('/account/addresses').then((r) => r.data.data),
  });

  // Auto-select default address on load
  useEffect(() => {
    if (addresses?.length && !selectedAddress) {
      const def = addresses.find((a: any) => a.isDefault) || addresses[0];
      if (def) setSelectedAddress(def.id);
    }
  }, [addresses]);

  // Read coupon from cart navigation state
  useEffect(() => {
    const stateCode = (location.state as any)?.couponCode;
    if (stateCode && !voucherCode) {
      setVoucherInput(stateCode);
    }
  }, []);

  const { data: preview } = useQuery({
    queryKey: ['checkout-preview', selectedAddress, voucherCode, paymentMethod],
    queryFn: () =>
      apiClient.post('/checkout/preview', {
        items: cart?.items?.map((i: any) => ({ skuId: i.skuId, quantity: i.quantity })) || [],
        shippingAddressId: selectedAddress,
        paymentMethod,
        voucherCode: voucherCode || undefined,
      }).then((r) => r.data.data),
    enabled: !!selectedAddress && !!cart?.items?.length,
  });

  const createOrder = useMutation({
    mutationFn: () =>
      apiClient.post('/orders', {
        items: cart?.items?.map((i: any) => ({ skuId: i.skuId, quantity: i.quantity })) || [],
        shippingAddressId: selectedAddress,
        paymentMethod,
        voucherCode: voucherCode || undefined,
        note: note || undefined,
      }),
    onSuccess: async (res) => {
      const order = res.data.data;
      const orderId = order?.id || order?.orderId;
      const orderCode = order?.code;
      queryClient.invalidateQueries({ queryKey: ['cart'] });

      if (paymentMethod === 'COD' || paymentMethod === 'BANK_TRANSFER') {
        toast.success('Đặt hàng thành công!');
        navigate(`/orders/${orderId}`);
        return;
      }

      try {
        const gateway = paymentMethod === 'VNPAY' ? 'vnpay' : paymentMethod === 'MOMO' ? 'momo' : 'zalopay';
        const payRes = await apiClient.post(`/payments/${gateway}/create`, { orderId, orderCode });
        const redirectUrl = payRes.data.data?.paymentUrl || payRes.data.data?.payUrl;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          toast.success('Đặt hàng thành công!');
          navigate(`/payment/result?status=success&orderId=${orderId}`);
        }
      } catch {
        toast.success('Đặt hàng thành công! Vui lòng thanh toán trong ứng dụng.');
        navigate(`/orders/${orderId}`);
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi đặt hàng'),
  });

  const validateCoupon = async () => {
    if (!voucherInput.trim()) return;
    setVoucherLoading(true);
    try {
      const res = await apiClient.post('/promotions/validate-coupon', {
        code: voucherInput.trim().toUpperCase(),
        subtotal: cart?.subtotal || 0,
        cartItems: cart?.items?.map((i: any) => ({
          skuId: i.skuId,
          quantity: i.quantity,
          unitPrice: Number(i.sku?.price || 0),
          subtotal: Number(i.sku?.price || 0) * i.quantity,
          shopId: i.sku?.product?.shopId || '',
        })) || [],
      });
      const result = res.data.data;
      if (result.valid) {
        setVoucherCode(voucherInput.trim().toUpperCase());
        setVoucherResult({ discount: result.discount, description: result.description });
        toast.success(`Áp dụng thành công! ${result.description}`);
      } else {
        toast.error(result.description || 'Mã không hợp lệ hoặc đã hết hạn');
        setVoucherResult(null);
      }
    } catch {
      toast.error('Không thể kiểm tra mã. Thử lại sau.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setVoucherCode('');
    setVoucherInput('');
    setVoucherResult(null);
  };

  const selectedAddr = addresses?.find((a: any) => a.id === selectedAddress);

  const openAddressModal = () => {
    setTempAddress(selectedAddress);
    setShowAddressModal(true);
  };

  const confirmAddress = () => {
    setSelectedAddress(tempAddress);
    setShowAddressModal(false);
  };

  const discount = voucherResult?.discount || preview?.discountAmount || 0;
  const shippingFee = preview?.shippingFee ?? (cart?.subtotal >= 500000 ? 0 : 30000);
  const subtotal = preview?.subtotal || cart?.subtotal || 0;
  const total = preview?.total || (subtotal - discount + shippingFee);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thanh toán đơn hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <MapPin size={18} className="text-red-500" />
                Địa chỉ giao hàng
              </h2>
              <div className="flex items-center gap-2">
                {addresses?.length > 0 && (
                  <button
                    onClick={openAddressModal}
                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
                  >
                    <Edit2 size={14} />
                    Thay đổi
                  </button>
                )}
                <Link to="/account/addresses" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <Plus size={14} />
                  Thêm mới
                </Link>
              </div>
            </div>

            {!addresses?.length ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-2">Chưa có địa chỉ giao hàng</p>
                <Link to="/account/addresses" className="text-red-500 hover:underline text-sm">
                  Thêm địa chỉ ngay
                </Link>
              </div>
            ) : selectedAddr ? (
              <div className="flex gap-3 p-3 rounded-lg bg-red-50 border-2 border-red-200">
                <MapPin size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{selectedAddr.fullName} — {selectedAddr.phone}</p>
                  <p className="text-sm text-gray-500">
                    {selectedAddr.addressLine}, {selectedAddr.district}, {selectedAddr.province}
                  </p>
                  {selectedAddr.isDefault && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-1 inline-block">Mặc định</span>
                  )}
                </div>
              </div>
            ) : (
              <button onClick={openAddressModal} className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-red-300 hover:text-red-400">
                Chọn địa chỉ giao hàng
              </button>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-red-500" />
              Phương thức thanh toán
            </h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    paymentMethod === m.value ? 'border-red-400 bg-red-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    value={m.value}
                    checked={paymentMethod === m.value}
                    onChange={() => setPaymentMethod(m.value)}
                    className="text-red-500"
                  />
                  {m.icon}
                  <div>
                    <p className="font-medium text-sm">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </div>
                  {paymentMethod === m.value && <CheckCircle size={16} className="text-red-500 ml-auto flex-shrink-0" />}
                </label>
              ))}
            </div>
          </div>

          {/* Coupon with real validation */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <Tag size={18} className="text-orange-500" />
              Mã giảm giá
            </h2>
            {voucherCode && voucherResult ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700">{voucherCode}</p>
                  <p className="text-xs text-green-600">{voucherResult.description}</p>
                </div>
                <button onClick={removeVoucher} className="text-gray-400 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                  placeholder="Nhập mã voucher"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                />
                <button
                  onClick={validateCoupon}
                  disabled={voucherLoading || !voucherInput.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {voucherLoading ? '...' : 'Áp dụng'}
                </button>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold mb-3 text-sm">Ghi chú đơn hàng (tùy chọn)</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho người bán: thời gian giao, yêu cầu đóng gói..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
            <h2 className="font-bold text-lg mb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {cart?.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={item.sku?.product?.images?.[0]?.url || '/placeholder.jpg'}
                    alt=""
                    className="w-10 h-10 rounded object-cover bg-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 line-clamp-2">{item.sku?.product?.name}</p>
                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium flex-shrink-0">
                    {(Number(item.sku?.price) * item.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>

            <hr className="my-3" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({voucherCode})</span>
                  <span>-{discount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Phí vận chuyển</span>
                <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}đ`}
                </span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-base">
                <span>Tổng cộng</span>
                <span className="text-red-600">{total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <button
              onClick={() => createOrder.mutate()}
              disabled={!selectedAddress || createOrder.isPending || !cart?.items?.length}
              className="w-full py-3 mt-5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createOrder.isPending ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Đặt hàng ngay'
              )}
            </button>

            <p className="text-xs text-gray-400 mt-3 text-center">
              Bằng cách đặt hàng, bạn đồng ý với{' '}
              <span className="text-red-500 cursor-pointer hover:underline">điều khoản dịch vụ</span>
            </p>
          </div>
        </div>
      </div>

      {/* Address Selector Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold">Chọn địa chỉ giao hàng</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
              {addresses?.map((addr: any) => (
                <label
                  key={addr.id}
                  className={`flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    tempAddress === addr.id ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={addr.id}
                    checked={tempAddress === addr.id}
                    onChange={() => setTempAddress(addr.id)}
                    className="mt-1 text-red-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{addr.fullName} — {addr.phone}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {addr.addressLine}, {addr.district}, {addr.province}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {addr.isDefault && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Mặc định</span>
                      )}
                    </div>
                  </div>
                  {tempAddress === addr.id && <CheckCircle size={16} className="text-red-500 mt-1 flex-shrink-0" />}
                </label>
              ))}
              <Link
                to="/account/addresses"
                className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-400 hover:border-red-300 hover:text-red-400 transition-colors"
              >
                <Plus size={16} />
                Thêm địa chỉ mới
              </Link>
            </div>
            <div className="flex gap-2 justify-end p-5 border-t">
              <button onClick={() => setShowAddressModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                Hủy
              </button>
              <button
                onClick={confirmAddress}
                disabled={!tempAddress}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
