import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CreditCard, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const GATEWAYS = [
  {
    id: 'vnpay',
    name: 'VNPay',
    logo: '💳',
    description: 'Cổng thanh toán VNPay - hỗ trợ thẻ ATM, Visa, MasterCard',
    fields: [
      { key: 'VNPAY_TMN_CODE', label: 'TMN Code', type: 'text' },
      { key: 'VNPAY_HASH_SECRET', label: 'Hash Secret', type: 'password' },
      { key: 'VNPAY_URL', label: 'Payment URL', type: 'text', placeholder: 'https://sandbox.vnpayment.vn/...' },
      { key: 'VNPAY_RETURN_URL', label: 'Return URL', type: 'text' },
    ],
  },
  {
    id: 'momo',
    name: 'MoMo',
    logo: '📱',
    description: 'Ví điện tử MoMo',
    fields: [
      { key: 'MOMO_PARTNER_CODE', label: 'Partner Code', type: 'text' },
      { key: 'MOMO_ACCESS_KEY', label: 'Access Key', type: 'text' },
      { key: 'MOMO_SECRET_KEY', label: 'Secret Key', type: 'password' },
      { key: 'MOMO_API_URL', label: 'API URL', type: 'text' },
      { key: 'MOMO_RETURN_URL', label: 'Return URL', type: 'text' },
      { key: 'MOMO_NOTIFY_URL', label: 'Notify URL (Webhook)', type: 'text' },
    ],
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    logo: '💰',
    description: 'Ví điện tử ZaloPay',
    fields: [
      { key: 'ZALO_APP_ID', label: 'App ID', type: 'text' },
      { key: 'ZALO_KEY1', label: 'Key 1', type: 'password' },
      { key: 'ZALO_KEY2', label: 'Key 2', type: 'password' },
      { key: 'ZALO_CREATE_URL', label: 'Create Order URL', type: 'text' },
      { key: 'ZALO_RETURN_URL', label: 'Return URL', type: 'text' },
      { key: 'ZALO_CALLBACK_URL', label: 'Callback URL', type: 'text' },
    ],
  },
];

export default function PaymentConfigPage() {
  const [activeGateway, setActiveGateway] = useState('vnpay');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [enabledGateways, setEnabledGateways] = useState({ vnpay: true, momo: true, zalopay: true, cod: true });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 800));
    },
    onSuccess: () => toast.success('Đã lưu cấu hình cổng thanh toán'),
  });

  const gateway = GATEWAYS.find((g) => g.id === activeGateway)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard size={24} className="text-blue-500" />
            Cấu hình cổng thanh toán
          </h1>
          <p className="text-gray-500 text-sm mt-1">Cấu hình API keys cho các cổng thanh toán</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={18} />
          {saveMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold mb-4">Phương thức thanh toán đang bật</h2>
        <div className="flex gap-4 flex-wrap">
          {[
            { id: 'cod', label: 'COD (Tiền mặt)' },
            { id: 'vnpay', label: 'VNPay' },
            { id: 'momo', label: 'MoMo' },
            { id: 'zalopay', label: 'ZaloPay' },
          ].map((m) => (
            <label key={m.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledGateways[m.id as keyof typeof enabledGateways]}
                onChange={(e) => setEnabledGateways((p) => ({ ...p, [m.id]: e.target.checked }))}
                className="text-blue-600"
              />
              <span className="text-sm font-medium">{m.label}</span>
              {enabledGateways[m.id as keyof typeof enabledGateways] && (
                <CheckCircle size={14} className="text-green-500" />
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {GATEWAYS.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGateway(g.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  activeGateway === g.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                }`}
              >
                <p className="text-lg mb-0.5">{g.logo}</p>
                <p className="text-sm font-medium">{g.name}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">{gateway.logo}</span>
              {gateway.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{gateway.description}</p>
          </div>

          <div className="space-y-4">
            {gateway.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                    value={values[field.key] || ''}
                    onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 pr-10"
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPasswords((p) => ({ ...p, [field.key]: !p[field.key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Env var: {field.key}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ Các API keys này được lưu trong biến môi trường server, không được lưu trong database. Cần restart server sau khi thay đổi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
