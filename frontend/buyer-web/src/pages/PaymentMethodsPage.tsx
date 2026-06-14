import { useState } from 'react';
import { CreditCard, Smartphone, Banknote, Plus, CheckCircle } from 'lucide-react';

const PAYMENT_METHODS = [
  {
    id: 'cod',
    name: 'Thanh toán khi nhận hàng (COD)',
    description: 'Trả tiền mặt khi nhận hàng',
    icon: <Banknote size={24} className="text-green-600" />,
    isDefault: true,
    enabled: true,
  },
  {
    id: 'vnpay',
    name: 'VNPay',
    description: 'Thanh toán qua cổng VNPay (thẻ ATM, Visa, MasterCard)',
    icon: <CreditCard size={24} className="text-blue-600" />,
    isDefault: false,
    enabled: true,
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    description: 'Thanh toán qua ví điện tử MoMo',
    icon: <Smartphone size={24} className="text-pink-600" />,
    isDefault: false,
    enabled: true,
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    description: 'Thanh toán qua ví ZaloPay',
    icon: <Smartphone size={24} className="text-blue-500" />,
    isDefault: false,
    enabled: true,
  },
];

export default function PaymentMethodsPage() {
  const [selected, setSelected] = useState('cod');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="text-red-500" size={24} />
        <h1 className="text-xl font-bold">Phương thức thanh toán</h1>
      </div>

      <p className="text-gray-500 text-sm mb-6">
        Chọn phương thức thanh toán ưa thích của bạn. Cài đặt này sẽ được áp dụng trong quá trình thanh toán.
      </p>

      <div className="space-y-3 mb-8">
        {PAYMENT_METHODS.map((method) => (
          <div
            key={method.id}
            onClick={() => setSelected(method.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selected === method.id
                ? 'border-red-400 bg-red-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex-shrink-0">{method.icon}</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{method.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{method.description}</p>
            </div>
            {selected === method.id && <CheckCircle size={20} className="text-red-500 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Plus size={18} className="text-gray-500" />
          <span className="font-medium text-gray-700">Thêm thẻ ngân hàng</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Lưu thẻ ngân hàng để thanh toán nhanh hơn trong những lần mua sắm tiếp theo.
        </p>
        <button className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm hover:border-red-300 hover:text-red-500 transition-colors">
          + Thêm thẻ mới
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs text-blue-700">
          🔒 Thông tin thanh toán của bạn được bảo mật theo tiêu chuẩn PCI DSS. Chúng tôi không lưu trữ thông tin thẻ đầy đủ của bạn.
        </p>
      </div>
    </div>
  );
}
