import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';

interface ReferralData {
  code: string;
  link: string;
  totalInvited: number;
  totalQualified: number;
  totalRewardEarned: number;
  pendingReward: number;
  history: { friendName: string; status: string; rewardAmount: number; joinedAt: string }[];
}

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<{ data: ReferralData }>({
    queryKey: ['referral-data'],
    queryFn: () => apiClient.get('/referral/my').then(r => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => apiClient.post('/referral/generate'),
  });

  const referral = data?.data;

  const copyLink = () => {
    if (referral?.link) {
      navigator.clipboard.writeText(referral.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Giới thiệu bạn bè</h1>
      <p className="text-gray-500 text-sm mb-6">Mời bạn bè tham gia và nhận thưởng hấp dẫn!</p>

      {isLoading ? <p>Đang tải...</p> : (
        <>
          {referral ? (
            <div className="bg-white rounded-lg shadow p-5 mb-6">
              <h2 className="font-semibold mb-3">Link giới thiệu của bạn</h2>
              <div className="flex gap-2 mb-2">
                <input
                  readOnly
                  value={referral.link}
                  className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50 font-mono"
                />
                <button
                  onClick={copyLink}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? 'Đã sao chép!' : 'Sao chép'}
                </button>
              </div>
              <p className="text-sm text-gray-500">Mã giới thiệu: <span className="font-bold text-blue-600">{referral.code}</span></p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-5 mb-6 text-center">
              <p className="text-gray-500 mb-3">Bạn chưa có link giới thiệu</p>
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Tạo link giới thiệu
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Đã mời', value: referral?.totalInvited ?? 0 },
              { label: 'Đủ điều kiện', value: referral?.totalQualified ?? 0 },
              { label: 'Thưởng đã nhận', value: `${(referral?.totalRewardEarned ?? 0).toLocaleString('vi-VN')}đ` },
              { label: 'Chờ duyệt', value: `${(referral?.pendingReward ?? 0).toLocaleString('vi-VN')}đ` },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {referral?.history?.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-5 py-4 border-b font-semibold">Lịch sử giới thiệu</div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Bạn bè', 'Trạng thái', 'Thưởng', 'Ngày tham gia'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {referral.history.map((h, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{h.friendName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          h.status === 'QUALIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{h.status === 'QUALIFIED' ? 'Đủ điều kiện' : 'Chưa đủ'}</span>
                      </td>
                      <td className="px-4 py-3 text-green-600 font-medium">{h.rewardAmount?.toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(h.joinedAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
