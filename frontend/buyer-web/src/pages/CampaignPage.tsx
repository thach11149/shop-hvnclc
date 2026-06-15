import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag, Gift, ChevronRight, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (timeLeft.d > 0) {
    return (
      <div className="flex items-center gap-1 text-sm">
        <Clock size={13} className="text-orange-500" />
        <span className="text-orange-600 font-medium">Còn {timeLeft.d}n {pad(timeLeft.h)}g</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Clock size={13} className="text-red-500" />
      {[timeLeft.h, timeLeft.m, timeLeft.s].map((v, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className="bg-red-500 text-white text-xs font-bold rounded px-1.5 py-0.5 min-w-[1.6rem] text-center font-mono">
            {pad(v)}
          </span>
          {i < 2 && <span className="text-red-500 font-bold text-xs">:</span>}
        </span>
      ))}
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Đang diễn ra</span>;
  if (status === 'UPCOMING') return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Sắp diễn ra</span>;
  return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Đã kết thúc</span>;
}

export default function CampaignPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'ACTIVE' | 'UPCOMING' | 'ENDED'>('ACTIVE');

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns-list', tab],
    queryFn: () =>
      apiClient.get('/campaigns', { params: { status: tab, limit: 30 } }).then((r) => r.data.data),
  });

  const joinMutation = useMutation({
    mutationFn: (slug: string) => apiClient.post(`/campaigns/${slug}/join`),
    onSuccess: () => {
      toast.success('Đã tham gia chương trình!');
      qc.invalidateQueries({ queryKey: ['campaigns-list'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Không thể tham gia'),
  });

  const campaigns = data?.items || [];
  const tabs = [
    { key: 'ACTIVE', label: 'Đang diễn ra', icon: <Flame size={14} /> },
    { key: 'UPCOMING', label: 'Sắp diễn ra', icon: <Clock size={14} /> },
    { key: 'ENDED', label: 'Đã kết thúc', icon: <Tag size={14} /> },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Gift size={24} className="text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">Chương trình khuyến mãi</h1>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20">
          <Gift size={56} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Không có chương trình khuyến mãi nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign: any) => {
            const now = Date.now();
            const start = new Date(campaign.startDate).getTime();
            const end = new Date(campaign.endDate).getTime();
            const isActive = now >= start && now < end;
            const isUpcoming = now < start;

            return (
              <div
                key={campaign.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Banner */}
                <div className="relative h-40 bg-gradient-to-br from-red-500 to-orange-500">
                  {campaign.bannerUrl ? (
                    <img
                      src={campaign.bannerUrl}
                      alt={campaign.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Gift size={40} className="text-white/60" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <CampaignStatusBadge status={tab} />
                  </div>
                  {campaign.discountPercent && (
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-sm font-bold px-2 py-1 rounded-lg">
                      -{campaign.discountPercent}%
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{campaign.name}</h3>
                  {campaign.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{campaign.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      {isActive && (
                        <CountdownTimer endDate={campaign.endDate} />
                      )}
                      {isUpcoming && (
                        <div className="text-sm text-blue-600 font-medium">
                          Bắt đầu: {new Date(campaign.startDate).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                      {!isActive && !isUpcoming && (
                        <p className="text-xs text-gray-400">
                          {new Date(campaign.startDate).toLocaleDateString('vi-VN')} — {new Date(campaign.endDate).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <button
                          onClick={() => joinMutation.mutate(campaign.slug)}
                          disabled={campaign.isJoined || joinMutation.isPending}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                            campaign.isJoined
                              ? 'bg-gray-100 text-gray-500 cursor-default'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          {campaign.isJoined ? 'Đã tham gia' : 'Tham gia'}
                        </button>
                      )}
                      <Link
                        to={`/campaigns/${campaign.slug}`}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
                      >
                        Xem <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>

                  {campaign._count?.products > 0 && (
                    <p className="text-xs text-gray-400 mt-2">{campaign._count.products} sản phẩm tham gia</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
