import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard, Banknote, Smartphone, Tag, MapPin, Plus, CheckCircle, Loader } from 'lucide-react';
import apiClient from '../api/client';

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', icon: <Banknote size={18} className="text-green-600" />, desc: 'Trả tiền mặt khi nhận hàng' },
  { value: 'VNPAY', label: 'VNPay', icon: <CreditCard size={18} className="text-blue-600" />, desc: 'Thẻ ATM, Visa, MasterCard' },
  { value: 'MOMO', label: 'Ví MoMo', icon: <Smartphone size={18} className="text-pink-600" />, desc: 'Ví điện tử MoMo' },
  { value: 'ZALOPAY', label: 'ZaloPay', icon: <Smartphone size={18} className="text-blue-500" />, desc: 'Ví điện tử ZaloPay' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [note, setNote] = useState('');

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/cart').then((r) => r.data.data),
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => apiClient.get('/account/addresses').then((r) => r.data.data),
    onSuccess: (data: any[]) => {
      if (!selectedAddress && data?.length) {
        const def = data.find((a) => a.isDefault) || data[0];
        if (def) setSelectedAddress(def.id);
      }
    },
  } as any);

  const { data: preview } = useQuery({
    queryKey: ['checkout-preview', selectedAddress, voucherCode, paymentMethod],
    queryFn: () =>
      apiClient
        .post('/checkout/preview', {
          items: cart?.items?.map((i: any) => ({ skuId: i.skuId, quantity: i.quantity })) || [],
          shippingAddressId: selectedAddress,
          paymentMethod,
          voucherCode: voucherCode || undefined,
        })
        .then((r) => r.data.data),
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

  if (!addresses) setSelectedAddress('');

  const applyVoucher = () => {
    if (!voucherInput.trim()) return;
    setVoucherCode(voucherInput.trim().toUpperCase());
    toast.success('Đã áp dụng mã giảm giá');
  };

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
              <Link to="/account/addresses" className="text-sm text-red-500 hover:underline flex items-center gap-1">
                <Plus size={14} />
                Thêm địa chỉ
              </Link>
            </div>
            {!addresses?.length ? (
              <p className="text-gray-500 text-sm">
                Chưa có địa chỉ.{' '}
                <Link to="/account/addresses" className="text-red-500 hover:underline">
                  Thêm ngay
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr: any) => (
                  <label
                    key={addr.id}
                    className={`flex gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedAddress === addr.id ? 'border-red-400 bg-red-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      value={addr.id}
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      className="mt-1 text-red-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{addr.fullName} — {addr.phone}</p>
                      <p className="text-sm text-gray-500">
                        {addr.addressLine}, {addr.district}, {addr.province}
                      </p>
                      {addr.isDefault && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-1 inline-block">Mặc định</span>
                      )}
                    </div>
                    {selectedAddress === addr.id && <CheckCircle size={16} className="text-red-500 mt-1 flex-shrink-0" />}
                  </label>
                ))}
              </div>
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

          {/* Voucher */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <Tag size={18} className="text-orange-500" />
              Mã giảm giá
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                placeholder="Nhập mã voucher"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <button
                onClick={applyVoucher}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Áp dụng
              </button>
            </div>
            {voucherCode && (
              <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle size={14} />
                Đã áp dụng mã: {voucherCode}
                <button onClick={() => { setVoucherCode(''); setVoucherInput(''); }} className="text-gray-400 hover:text-red-500 ml-auto">✕</button>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold mb-3 text-sm">Ghi chú đơn hàng (tùy chọn)</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho người bán..."
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
                <span>{(preview?.subtotal || cart?.subtotal || 0).toLocaleString('vi-VN')}đ</span>
              </div>
              {(preview?.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{(preview?.discountAmount || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Phí vận chuyển</span>
                <span>
                  {(preview?.shippingFee || 0) === 0
                    ? 'Miễn phí'
                    : `${(preview?.shippingFee || 30000).toLocaleString('vi-VN')}đ`}
                </span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-base">
                <span>Tổng cộng</span>
                <span className="text-red-600">
                  {(preview?.total || cart?.subtotal || 0).toLocaleString('vi-VN')}đ
                </span>
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
    </div>
  );
}
