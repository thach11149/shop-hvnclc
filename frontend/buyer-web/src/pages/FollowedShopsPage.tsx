import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Package, Users } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

interface FollowedShop {
  shopId: string;
  shopName: string;
  shopSlug: string;
  logoUrl: string | null;
  isActive: boolean;
  followerCount: number;
  productCount: number;
  followedAt: string;
}

export default function FollowedShopsPage() {
  const { token } = useAuthStore();
  const [shops, setShops] = useState<FollowedShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowing, setUnfollowing] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/account/followed-shops', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setShops(d.data ?? []); })
      .finally(() => setLoading(false));
  }, [token]);

  const unfollow = async (shopId: string) => {
    setUnfollowing(shopId);
    try {
      await fetch(`/api/v1/shops/${shopId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setShops(prev => prev.filter(s => s.shopId !== shopId));
    } finally {
      setUnfollowing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Store className="text-blue-500" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Shop đang theo dõi</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Store size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Chưa theo dõi shop nào</p>
          <p className="text-sm mt-1">Ghé thăm các shop và nhấn "Theo dõi" để nhận thông tin mới nhất!</p>
          <Link to="/products" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map(shop => (
            <div key={shop.shopId} className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {shop.logoUrl ? (
                    <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" />
                  ) : (
                    <Store size={24} className="text-blue-400" />
                  )}
                </div>
                <div>
                  <Link to={`/shops/${shop.shopSlug}`} className="font-semibold text-gray-900 hover:text-blue-600">
                    {shop.shopName}
                  </Link>
                  {!shop.isActive && (
                    <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Tạm nghỉ</span>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={11} />{shop.followerCount.toLocaleString()} theo dõi
                    </span>
                    <span className="flex items-center gap-1">
                      <Package size={11} />{shop.productCount.toLocaleString()} sản phẩm
                    </span>
                    <span>Theo dõi {new Date(shop.followedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to={`/shops/${shop.shopSlug}`}
                  className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  Xem shop
                </Link>
                <button
                  onClick={() => unfollow(shop.shopId)}
                  disabled={unfollowing === shop.shopId}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {unfollowing === shop.shopId ? '...' : 'Bỏ theo dõi'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
