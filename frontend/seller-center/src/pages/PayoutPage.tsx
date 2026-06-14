import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle, Download } from 'lucide-react';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Thất bại', color: 'bg-red-100 text-red-700' },
};

export default function PayoutPage() {
  const [tab, setTab] = useState<'summary' | 'history'>('summary');

  const { data: wallet } = useQuery({
    queryKey: ['seller-wallet'],
    queryFn: () => apiClient.get('/seller/wallet').then((r) => r.data.data),
  });

  const { data: payouts } = useQuery({
    queryKey: ['seller-payouts'],
    queryFn: () => apiClient.get('/seller/payouts', { params: { limit: 50 } }).then((r) => r.data.data),
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ['seller-pending-revenue'],
    queryFn: () =>
      apiClient
        .get('/seller/orders', { params: { status: 'COMPLETED', limit: 5 } })
        .then((r) => r.data.data),
  });

  const handleExport = () => {
    const url = `/api/v1/seller/export/finance`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thanh toán & Rút tiền</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý số dư và lịch sử thanh toán</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <Download size={16} />
          Xuất báo cáo
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Số dư khả dụng', value: wallet?.availableBalance || 0, icon: <DollarSign size={20} className="text-green-500" />, color: 'text-green-600' },
          { label: 'Đang chờ', value: wallet?.pendingBalance || 0, icon: <Clock size={20} className="text-yellow-500" />, color: 'text-yellow-600' },
          { label: 'Đã rút tổng', value: wallet?.totalWithdrawn || 0, icon: <TrendingUp size={20} className="text-blue-500" />, color: 'text-blue-600' },
          { label: 'Doanh thu tháng', value: wallet?.monthRevenue || 0, icon: <CheckCircle size={20} className="text-purple-500" />, color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{s.label}</span>
              {s.icon}
            </div>
            <p className={`text-xl font-bold ${s.color}`}>
              {Number(s.value).toLocaleString('vi-VN')}đ
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold mb-4">Thông tin tài khoản ngân hàng</h2>
        {wallet?.bankAccounts?.length > 0 ? (
          <div className="space-y-3">
            {wallet.bankAccounts.map((acc: any) => (
              <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{acc.bankName}</p>
                  <p className="text-xs text-gray-500">{acc.accountNumber} — {acc.accountName}</p>
                </div>
                {acc.isDefault && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Mặc định</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Chưa có tài khoản ngân hàng. Vui lòng thêm trong cài đặt shop.</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          {(['summary', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'summary' ? 'Tổng quan' : 'Lịch sử rút tiền'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'summary' ? (
            <div>
              <h3 className="font-medium mb-3">Đơn hàng gần đây đã hoàn thành</h3>
              {pendingOrders?.items?.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có đơn hàng nào</p>
              ) : (
                <div className="space-y-2">
                  {pendingOrders?.items?.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-600">#{o.code}</span>
                      <span className="text-sm font-medium">{Number(o.totalAmount).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {payouts?.items?.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Chưa có lịch sử rút tiền</p>
              ) : (
                <div className="space-y-3">
                  {payouts?.items?.map((p: any) => {
                    const si = STATUS_LABELS[p.status] || STATUS_LABELS.PENDING;
                    return (
                      <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{Number(p.amount).toLocaleString('vi-VN')}đ</p>
                          <p className="text-xs text-gray-500">
                            {new Date(p.createdAt).toLocaleDateString('vi-VN')} — {p.bankName} {p.accountNumber}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${si.color}`}>{si.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
