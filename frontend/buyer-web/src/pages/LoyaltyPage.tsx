import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export default function LoyaltyPage() {
  const { data: account, isLoading } = useQuery({
    queryKey: ['loyalty'],
    queryFn: () => apiClient.get('/user/loyalty').then(r => r.data.data),
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['loyalty-transactions'],
    queryFn: () => apiClient.get('/user/loyalty/transactions').then(r => r.data.data),
  });

  const TX_LABELS: Record<string, string> = {
    EARN_ORDER: 'Mua hàng',
    EARN_REVIEW: 'Đánh giá sản phẩm',
    EARN_REFERRAL: 'Giới thiệu bạn bè',
    REDEEM: 'Đổi điểm',
    EXPIRE: 'Điểm hết hạn',
    ADJUST: 'Điều chỉnh',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Điểm thưởng</h1>

      {/* Points Overview */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-6 text-white mb-6">
        {isLoading ? (
          <div className="h-16 animate-pulse" />
        ) : (
          <div>
            <p className="text-sm opacity-80 mb-1">Điểm tích lũy của bạn</p>
            <p className="text-4xl font-bold">{account?.balance?.toLocaleString('vi-VN') || 0} <span className="text-xl">điểm</span></p>
            <p className="text-sm opacity-80 mt-2">Tương đương {((account?.balance || 0) * 1000).toLocaleString('vi-VN')}₫</p>
          </div>
        )}
      </div>

      {/* How to earn */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Cách tích điểm</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">🛍 Mua hàng</span>
            <span className="font-medium">1 điểm/10.000₫</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">⭐ Đánh giá sản phẩm</span>
            <span className="font-medium">+5 điểm/đánh giá</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">👥 Giới thiệu bạn bè</span>
            <span className="font-medium">+50 điểm/người</span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Lịch sử điểm</h2>
        {txLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />)}
          </div>
        ) : !transactions?.length ? (
          <p className="text-center text-gray-500 py-6">Chưa có giao dịch điểm nào</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{TX_LABELS[tx.type] || tx.type}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <span className={`font-bold text-sm ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points} điểm
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
