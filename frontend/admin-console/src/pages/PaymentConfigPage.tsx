import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CreditCard, Save, Eye, EyeOff, CheckCircle, XCircle, TestTube, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const GATEWAYS = [
  {
    id: 'vnpay',
    name: 'VNPay',
    logo: '💳',
    description: 'Cổng thanh toán VNPay — thẻ ATM, Visa, MasterCard, JCB',
    docsUrl: 'https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.md',
    fields: [
      { key: 'VNPAY_TMN_CODE', label: 'TMN Code', type: 'text', placeholder: 'SHOP1234' },
      { key: 'VNPAY_HASH_SECRET', label: 'Hash Secret', type: 'password', placeholder: '••••••••' },
      { key: 'VNPAY_URL', label: 'Payment URL', type: 'text', placeholder: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html' },
      { key: 'VNPAY_RETURN_URL', label: 'Return URL', type: 'text', placeholder: 'https://yoursite.com/payment/result' },
    ],
  },
  {
    id: 'momo',
    name: 'MoMo',
    logo: '📱',
    description: 'Ví điện tử MoMo — thanh toán qua ứng dụng hoặc QR',
    docsUrl: 'https://developers.momo.vn',
    fields: [
      { key: 'MOMO_PARTNER_CODE', label: 'Partner Code', type: 'text', placeholder: 'MOMO...' },
      { key: 'MOMO_ACCESS_KEY', label: 'Access Key', type: 'text', placeholder: 'F8BBA842ECF85...' },
      { key: 'MOMO_SECRET_KEY', label: 'Secret Key', type: 'password', placeholder: '••••••••' },
      { key: 'MOMO_API_URL', label: 'API URL', type: 'text', placeholder: 'https://test-payment.momo.vn/v2/gateway/api/create' },
      { key: 'MOMO_RETURN_URL', label: 'Return URL', type: 'text' },
      { key: 'MOMO_NOTIFY_URL', label: 'Notify URL (IPN)', type: 'text' },
    ],
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    logo: '💰',
    description: 'Ví điện tử ZaloPay — tích hợp qua ZaloPay SDK',
    docsUrl: 'https://docs.zalopay.vn',
    fields: [
      { key: 'ZALO_APP_ID', label: 'App ID', type: 'text', placeholder: '2553' },
      { key: 'ZALO_KEY1', label: 'Key 1', type: 'password', placeholder: '••••••••' },
      { key: 'ZALO_KEY2', label: 'Key 2', type: 'password', placeholder: '••••••••' },
      { key: 'ZALO_CREATE_URL', label: 'Create Order URL', type: 'text', placeholder: 'https://sb-openapi.zalopay.vn/v2/create' },
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

  const { data: config, refetch } = useQuery({
    queryKey: ['payment-config'],
    queryFn: () => apiClient.get('/admin/payment-config').then((r) => r.data.data),
    onSuccess: (data) => {
      if (data?.values) setValues(data.values);
      if (data?.enabled) setEnabledGateways(data.enabled);
    },
  } as any);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.put('/admin/payment-config', { values, enabled: enabledGateways }),
    onSuccess: () => {
      toast.success('Đã lưu cấu hình cổng thanh toán');
      refetch();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Lỗi lưu cấu hình'),
  });

  const testMutation = useMutation({
    mutationFn: (gatewayId: string) =>
      apiClient.post(`/admin/payment-config/${gatewayId}/test`),
    onSuccess: (_, gatewayId) => toast.success(`✅ ${gatewayId.toUpperCase()} kết nối thành công`),
    onError: (err: any, gatewayId) => toast.error(`❌ ${gatewayId.toUpperCase()}: ${err.response?.data?.error || 'Kết nối thất bại'}`),
  });

  const gateway = GATEWAYS.find((g) => g.id === activeGateway)!;

  const getFieldValue = (key: string) => values[key] || config?.values?.[key] || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard size={22} className="text-blue-500" />
            Cấu hình cổng thanh toán
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý API keys và bật/tắt cổng thanh toán</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={16} />
          {saveMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
      </div>

      {/* Enabled/disabled toggles */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold mb-4 text-gray-800">Phương thức thanh toán</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'cod', label: 'COD (Tiền mặt)', icon: '💵', desc: 'Trả khi nhận hàng' },
            { id: 'vnpay', label: 'VNPay', icon: '💳', desc: 'Thẻ ATM/Visa/Master' },
            { id: 'momo', label: 'MoMo', icon: '📱', desc: 'Ví điện tử MoMo' },
            { id: 'zalopay', label: 'ZaloPay', icon: '💰', desc: 'Ví ZaloPay' },
          ].map((m) => {
            const enabled = enabledGateways[m.id as keyof typeof enabledGateways];
            return (
              <div
                key={m.id}
                onClick={() => setEnabledGateways((p) => ({ ...p, [m.id]: !p[m.id as keyof typeof p] }))}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  enabled ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500 truncate">{m.desc}</p>
                </div>
                {enabled
                  ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  : <XCircle size={16} className="text-gray-400 flex-shrink-0" />
                }
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Gateway sidebar */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {GATEWAYS.map((g) => {
              const isEnabled = enabledGateways[g.id as keyof typeof enabledGateways];
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveGateway(g.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                    activeGateway === g.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xl mb-0.5">{g.logo}</p>
                    <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-gray-300'}`} />
                  </div>
                  <p className="text-sm font-medium">{g.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Config fields */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="text-2xl">{gateway.logo}</span>
                {gateway.name}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{gateway.description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => testMutation.mutate(gateway.id)}
                disabled={testMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {testMutation.isPending ? <RefreshCw size={13} className="animate-spin" /> : <TestTube size={13} />}
                Test kết nối
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {gateway.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                    value={getFieldValue(field.key)}
                    onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder || `Nhập ${field.label}`}
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
                <p className="text-xs text-gray-400 mt-0.5 font-mono">env: {field.key}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-800">
              ⚠️ API keys được lưu trong biến môi trường server. Cần <strong>restart server</strong> sau khi thay đổi để áp dụng cấu hình mới.
              Không chia sẻ các keys này với bất kỳ ai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
