import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  shopName: string;
  price: number;
  originalPrice: number | null;
  soldCount: number;
  reason: string;
}

export default function RecommendationsPage() {
  const { token } = useAuthStore();
  const [items, setItems] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async (showSpinner = true) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch('/api/v1/ai/recommendations/homepage', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) setItems(data.data?.items ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(false);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="text-purple-500" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gợi ý cho bạn</h1>
            <p className="text-sm text-gray-500">Dựa trên hành vi mua sắm của bạn</p>
          </div>
        </div>
        <button
          onClick={() => fetchRecommendations()}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Sparkles size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Chưa có gợi ý nào. Hãy mua sắm thêm để nhận gợi ý cá nhân hóa!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
              <Link to={`/products/${product.slug}`}>
                <div className="bg-gray-100 h-40 flex items-center justify-center text-4xl group-hover:bg-gray-200 transition-colors">
                  🛍️
                </div>
              </Link>
              <div className="p-3">
                <div className="text-xs text-purple-600 bg-purple-50 rounded px-2 py-0.5 inline-flex items-center gap-1 mb-2">
                  <Sparkles size={10} />
                  {product.reason}
                </div>
                <Link to={`/products/${product.slug}`}>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600 mb-1">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-xs text-gray-500 mb-2">{product.shopName}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-red-600">
                      {product.price.toLocaleString('vi-VN')}₫
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through ml-1">
                        {product.originalPrice.toLocaleString('vi-VN')}₫
                      </span>
                    )}
                  </div>
                  <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <ShoppingCart size={15} />
                  </button>
                </div>
                {product.soldCount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">Đã bán {product.soldCount.toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
