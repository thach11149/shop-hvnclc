import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Share2, Gift, Users, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function ReferralPage() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['referral-data'],
    queryFn: () => apiClient.get('/referral/my').then(r => r.data),
  });

  const generate = useMutation({
    mutationFn: () => apiClient.post('/referral/generate'),
    onSuccess: () => { toast.success('Đã tạo link giới thiệu'); queryClient.invalidateQueries({ queryKey: ['referral-data'] }); },
    onError: () => toast.error('Không thể tạo link'),
  });

  const referral = data?.data;
  const code = referral?.code || '';
  const link = referral?.link || (typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${code}` : '');

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Đã sao chép link');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    toast.success('Đã sao chép mã');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const shareZalo = () => {
    window.open(`https://zalo.me/share/url?url=${encodeURIComponent(link)}&title=${encodeURIComponent('Mua hàng siêu rẻ tại ShopVN! Dùng mã giới thiệu của mình để được giảm giá ngay!')}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
  };

  const stats = [
    { label: 'Đã giới thiệu', value: referral?.totalInvited ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Đủ điều kiện', value: referral?.totalQualified ?? 0, icon: Check, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Chờ duyệt', value: `${(referral?.pendingReward ?? 0).toLocaleString('vi-VN')}₫`, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Đã nhận thưởng', value: `${(referral?.totalRewardEarned ?? 0).toLocaleString('vi-VN')}₫`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Gift className="text-pink-500" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">Giới thiệu bạn bè</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">Mời bạn bè mua hàng và nhận thưởng hấp dẫn cùng nhau!</p>

      {/* Referral Code Card */}
      {referral ? (
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
          <p className="text-blue-100 text-sm mb-2">Mã giới thiệu của bạn</p>
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl font-bold tracking-widest">{code}</span>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {codeCopied ? <Check size={16} /> : <Copy size={16} />}
              {codeCopied ? 'Đã sao chép' : 'Sao chép mã'}
            </button>
          </div>

          <div className="bg-white/10 rounded-xl p-3 mb-4">
            <p className="text-blue-100 text-xs mb-1">Link giới thiệu</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono flex-1 truncate text-white/90">{link}</span>
              <button
                onClick={copyLink}
                className="flex-shrink-0 bg-white/20 hover:bg-white/30 p-1.5 rounded-lg"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <button
              onClick={shareZalo}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0068FF]/80 hover:bg-[#0068FF] text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Share2 size={15} /> Chia sẻ Zalo
            </button>
            <button
              onClick={shareFacebook}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1877F2]/80 hover:bg-[#1877F2] text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Share2 size={15} /> Chia sẻ Facebook
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 mb-6 text-center">
          <Gift size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-4">Bạn chưa có link giới thiệu</p>
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {generate.isPending ? 'Đang tạo...' : 'Tạo link giới thiệu'}
          </button>
        </div>
      )}

      {/* How it works */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
        <p className="font-semibold text-orange-800 mb-2 text-sm">Cách thức hoạt động</p>
        <div className="space-y-1.5">
          {[
            'Chia sẻ link/mã giới thiệu của bạn với bạn bè',
            'Bạn bè đăng ký và thực hiện đơn hàng đầu tiên',
            'Cả 2 đều nhận thưởng khi đơn hàng hoàn thành',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-200 text-orange-700 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{i + 1}</span>
              <p className="text-sm text-orange-700">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={stat.color} />
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* History */}
      {referral?.history?.length > 0 ? (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-gray-800">Lịch sử giới thiệu</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 text-gray-500 text-xs">Bạn bè</th>
                <th className="text-left px-4 py-2.5 text-gray-500 text-xs">Trạng thái</th>
                <th className="text-right px-4 py-2.5 text-gray-500 text-xs">Thưởng</th>
                <th className="text-left px-4 py-2.5 text-gray-500 text-xs">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {referral.history.map((h: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{h.friendName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${h.status === 'QUALIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {h.status === 'QUALIFIED' ? 'Đủ điều kiện' : 'Chờ xác nhận'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">
                    {h.rewardAmount ? `+${h.rewardAmount.toLocaleString('vi-VN')}₫` : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(h.joinedAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          <Users size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Bạn chưa giới thiệu được ai. Hãy chia sẻ link ngay!</p>
        </div>
      )}
    </div>
  );
}
