import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Award, TrendingUp, Gift, Filter } from 'lucide-react';
import apiClient from '../api/client';

const TX_LABELS: Record<string, string> = {
  EARN_ORDER: 'Mua hàng',
  EARN_REVIEW: 'Đánh giá sản phẩm',
  EARN_REFERRAL: 'Giới thiệu bạn bè',
  REDEEM: 'Đổi điểm',
  EXPIRE: 'Điểm hết hạn',
  ADJUST: 'Điều chỉnh thủ công',
};

const TX_ICONS: Record<string, string> = {
  EARN_ORDER: '🛍',
  EARN_REVIEW: '⭐',
  EARN_REFERRAL: '👥',
  REDEEM: '🎁',
  EXPIRE: '⏰',
  ADJUST: '⚙️',
};

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  BRONZE: { bg: 'from-amber-700 to-amber-500', text: 'text-amber-800', border: 'border-amber-300' },
  SILVER: { bg: 'from-gray-500 to-gray-400', text: 'text-gray-700', border: 'border-gray-300' },
  GOLD: { bg: 'from-yellow-500 to-yellow-400', text: 'text-yellow-800', border: 'border-yellow-300' },
  PLATINUM: { bg: 'from-blue-500 to-blue-400', text: 'text-blue-800', border: 'border-blue-300' },
  DIAMOND: { bg: 'from-purple-600 to-purple-400', text: 'text-purple-900', border: 'border-purple-300' },
};

export default function LoyaltyPage() {
  const qc = useQueryClient();
  const [txFilter, setTxFilter] = useState<'all' | 'earn' | 'spend'>('all');
  const [redeemPoints, setRedeemPoints] = useState('');
  const [showRedeem, setShowRedeem] = useState(false);

  const { data: account, isLoading } = useQuery({
    queryKey: ['loyalty-account'],
    queryFn: () => apiClient.get('/loyalty/account').then(r => r.data.data),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['loyalty-history', txFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (txFilter !== 'all') params.set('type', txFilter);
      return apiClient.get(`/loyalty/transactions?${params}&limit=30`).then(r => r.data.data);
    },
  });

  const { data: tiers } = useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: () => apiClient.get('/loyalty/tiers').then(r => r.data.data),
  });

  const redeemMutation = useMutation({
    mutationFn: (points: number) => apiClient.post('/loyalty/redeem', { points }),
    onSuccess: (res) => {
      toast.success(`Đã đổi ${redeemPoints} điểm thành công! Mã coupon: ${res.data.data?.couponCode || 'đã tạo'}`);
      setRedeemPoints('');
      setShowRedeem(false);
      qc.invalidateQueries({ queryKey: ['loyalty-account'] });
      qc.invalidateQueries({ queryKey: ['loyalty-history'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể đổi điểm'),
  });

  const balance = account?.balance || 0;
  const totalEarned = account?.totalEarned || 0;
  const currentTier = account?.tier?.name || 'BRONZE';
  const nextTier = account?.nextTier;
  const pointsToNext = nextTier ? (nextTier.minPoints - balance) : 0;
  const tierProgress = nextTier
    ? Math.min(100, ((balance - (account?.tier?.minPoints || 0)) / (nextTier.minPoints - (account?.tier?.minPoints || 0))) * 100)
    : 100;

  const tierStyle = TIER_COLORS[currentTier] || TIER_COLORS.BRONZE;

  const transactions: any[] = txData?.data || txData || [];
  const filtered = txFilter === 'earn'
    ? transactions.filter((t: any) => t.points > 0)
    : txFilter === 'spend'
    ? transactions.filter((t: any) => t.points < 0)
    : transactions;

  const pointsToRedeem = Number(redeemPoints) || 0;
  const estimatedValue = pointsToRedeem * 1000;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Điểm thưởng</h1>

      {/* Balance Card */}
      <div className={`bg-gradient-to-br ${tierStyle.bg} rounded-2xl p-6 text-white relative overflow-hidden`}>
        <div className="absolute top-3 right-3">
          <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Award size={12} />
            {currentTier}
          </span>
        </div>
        {isLoading ? (
          <div className="h-20 animate-pulse" />
        ) : (
          <>
            <p className="text-sm opacity-80 mb-1">Điểm tích lũy của bạn</p>
            <p className="text-5xl font-bold mb-1">
              {balance.toLocaleString('vi-VN')}
              <span className="text-2xl ml-2 opacity-80">điểm</span>
            </p>
            <p className="text-sm opacity-70">Tương đương {(balance * 1000).toLocaleString('vi-VN')}₫</p>

            {nextTier && (
              <div className="mt-4">
                <div className="flex justify-between text-xs opacity-80 mb-1">
                  <span>{currentTier}</span>
                  <span>{nextTier.name} ({pointsToNext.toLocaleString()} điểm nữa)</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${tierProgress}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <TrendingUp size={20} className="mx-auto text-green-500 mb-1" />
          <p className="text-lg font-bold text-gray-800">{totalEarned.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Tổng tích lũy</p>
        </div>
        <div className="card p-4 text-center">
          <Gift size={20} className="mx-auto text-blue-500 mb-1" />
          <p className="text-lg font-bold text-gray-800">{(account?.totalRedeemed || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">Đã sử dụng</p>
        </div>
        <div className="card p-4 text-center">
          <Award size={20} className="mx-auto text-purple-500 mb-1" />
          <p className="text-lg font-bold text-gray-800">{balance.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Khả dụng</p>
        </div>
      </div>

      {/* Redeem Points */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">Đổi điểm lấy voucher</h2>
          <button
            onClick={() => setShowRedeem(!showRedeem)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {showRedeem ? 'Thu gọn' : 'Đổi ngay'}
          </button>
        </div>
        {showRedeem && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p>• 100 điểm = 100.000₫ giảm giá</p>
              <p>• Tối thiểu 50 điểm để đổi</p>
              <p>• Coupon có giá trị 30 ngày</p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={redeemPoints}
                onChange={e => setRedeemPoints(e.target.value)}
                min={50}
                max={balance}
                step={10}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Nhập số điểm muốn đổi (tối thiểu 50)"
              />
              <button
                onClick={() => redeemMutation.mutate(pointsToRedeem)}
                disabled={redeemMutation.isPending || pointsToRedeem < 50 || pointsToRedeem > balance}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {redeemMutation.isPending ? 'Đang xử lý...' : 'Đổi điểm'}
              </button>
            </div>
            {pointsToRedeem >= 50 && (
              <p className="text-xs text-green-600">
                Bạn sẽ nhận được voucher <strong>{estimatedValue.toLocaleString('vi-VN')}₫</strong>
              </p>
            )}
            {pointsToRedeem > balance && (
              <p className="text-xs text-red-500">Số điểm không đủ (còn {balance.toLocaleString()} điểm)</p>
            )}
          </div>
        )}
      </div>

      {/* How to earn */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-700 mb-3">Cách tích điểm</h2>
        <div className="space-y-2 text-sm">
          {[
            { icon: '🛍', label: 'Mua hàng', value: '1 điểm / 10.000₫' },
            { icon: '⭐', label: 'Đánh giá sản phẩm', value: '+5 điểm / đánh giá' },
            { icon: '📷', label: 'Đánh giá có ảnh', value: '+10 điểm / đánh giá' },
            { icon: '👥', label: 'Giới thiệu bạn bè', value: '+50 điểm / người' },
            { icon: '🎂', label: 'Sinh nhật', value: '+100 điểm' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-gray-600">{item.icon} {item.label}</span>
              <span className="font-medium text-gray-800">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Lịch sử điểm</h2>
          <div className="flex gap-1">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'earn', label: 'Nhận' },
              { key: 'spend', label: 'Dùng' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setTxFilter(f.key as any)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  txFilter === f.key ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-700 border border-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {txLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm">Chưa có lịch sử điểm</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{TX_ICONS[tx.type] || '•'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{TX_LABELS[tx.type] || tx.type}</p>
                    <p className="text-xs text-gray-400">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('vi-VN') : '—'}
                      {tx.description && ` • ${tx.description}`}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points?.toLocaleString()} điểm
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
