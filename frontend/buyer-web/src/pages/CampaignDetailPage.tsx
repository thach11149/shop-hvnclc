import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import apiClient from '../api/client';

function CountdownTimer({ endAt }: { endAt: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ hours: 0, minutes: 0, seconds: 0 }); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ hours: h, minutes: m, seconds: s });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  return (
    <div className="flex items-center gap-1 text-white font-mono">
      {['hours', 'minutes', 'seconds'].map((unit, i) => (
        <span key={unit} className="flex items-center gap-1">
          <span className="bg-white text-primary-600 px-2 py-1 rounded font-bold text-lg min-w-[2.5rem] text-center">
            {String(timeLeft[unit as keyof typeof timeLeft]).padStart(2, '0')}
          </span>
          {i < 2 && <span className="font-bold">:</span>}
        </span>
      ))}
    </div>
  );
}

export default function CampaignDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', slug],
    queryFn: () => apiClient.get(`/campaigns/${slug}`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200" />
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-56 bg-gray-200 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Chiến dịch không tồn tại hoặc đã kết thúc</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Về trang chủ</Link>
      </div>
    );
  }

  const isFlashSale = campaign.type === 'FLASH_SALE';

  return (
    <div>
      {/* Campaign Banner */}
      {campaign.bannerUrl ? (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img src={campaign.bannerUrl} alt={campaign.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`w-full h-48 md:h-64 flex items-center justify-center ${isFlashSale ? 'bg-red-500' : 'bg-primary-600'}`}>
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
            {campaign.description && <p className="text-white/80">{campaign.description}</p>}
            {isFlashSale && campaign.flashSaleSlots?.[0] && (
              <div className="mt-4">
                <p className="text-sm mb-2">Kết thúc sau</p>
                <CountdownTimer endAt={campaign.flashSaleSlots[0].endAt} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{campaign.name}</h2>
            <p className="text-sm text-gray-500">
              {new Date(campaign.startAt).toLocaleDateString('vi-VN')} - {new Date(campaign.endAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
          {isFlashSale && campaign.flashSaleSlots?.[0] && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Kết thúc sau:</span>
              <CountdownTimer endAt={campaign.flashSaleSlots[0].endAt} />
            </div>
          )}
        </div>

        {/* Flash Sale Products */}
        {isFlashSale && campaign.flashSaleSlots?.length > 0 && (
          <div>
            <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
              <span>⚡</span> Flash Sale
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {campaign.flashSaleSlots[0].items?.map((item: any) => (
                <Link
                  key={item.id}
                  to={`/products/${item.product?.slug}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/200'}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                    {item.quota > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-red-500 h-1">
                        <div
                          className="bg-yellow-400 h-full"
                          style={{ width: `${Math.max(10, 100 - (item.soldCount / item.quota * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-700 line-clamp-2 mb-1">{item.product?.name}</p>
                    <p className="text-red-600 font-bold text-sm">{Number(item.flashPrice).toLocaleString('vi-VN')}₫</p>
                    <p className="text-xs text-gray-400 line-through">{Number(item.sku?.price || 0).toLocaleString('vi-VN')}₫</p>
                    <p className="text-xs text-gray-500">{item.soldCount}/{item.quota} đã bán</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Campaign Products */}
        {campaign.products?.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Sản phẩm trong chiến dịch</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {campaign.products.map((cp: any) => {
                const product = cp.product;
                return (
                  <Link
                    key={cp.id}
                    to={`/products/${product?.slug}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={product?.images?.[0]?.url || 'https://via.placeholder.com/200'}
                        alt={product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-gray-700 line-clamp-2 mb-1">{product?.name}</p>
                      <p className="text-primary-600 font-semibold text-sm">
                        {Number(product?.skus?.[0]?.price || 0).toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {!campaign.products?.length && !campaign.flashSaleSlots?.length && (
          <div className="text-center py-16 text-gray-500">
            <p>Chiến dịch chưa có sản phẩm</p>
          </div>
        )}
      </div>
    </div>
  );
}
