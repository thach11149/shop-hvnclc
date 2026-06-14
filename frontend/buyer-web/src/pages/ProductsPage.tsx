import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, Star, Truck } from 'lucide-react';
import apiClient from '../api/client';
import ProductCard from '../components/product/ProductCard';

const PRICE_PRESETS = [
  { label: 'Dưới 100K', min: 0, max: 100000 },
  { label: '100K–500K', min: 100000, max: 500000 },
  { label: '500K–1M', min: 500000, max: 1000000 },
  { label: 'Trên 1M', min: 1000000, max: undefined },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'popular', label: 'Bán chạy' },
  { value: 'price_asc', label: 'Giá thấp – cao' },
  { value: 'price_desc', label: 'Giá cao – thấp' },
  { value: 'rating', label: 'Đánh giá cao' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Temp filter state (applied on "Áp dụng" click)
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [tempMinRating, setTempMinRating] = useState<number>(0);
  const [tempFreeship, setTempFreeship] = useState(false);
  const [tempPreset, setTempPreset] = useState<number | null>(null);

  // Read active filters from URL
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const freeship = searchParams.get('freeship') === 'true';
  const categoryId = searchParams.get('categoryId') || '';

  const setParam = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, v);
    });
    next.set('page', '1');
    setSearchParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['products', { sort, page, minPrice, maxPrice, minRating, freeship, categoryId }],
    queryFn: () =>
      apiClient
        .get('/products', {
          params: {
            sort,
            page,
            limit: 20,
            ...(minPrice ? { minPrice } : {}),
            ...(maxPrice ? { maxPrice } : {}),
            ...(minRating ? { minRating } : {}),
            ...(freeship ? { freeship: 'true' } : {}),
            ...(categoryId ? { categoryId } : {}),
          },
        })
        .then(r => r.data.data),
  });

  const products: any[] = Array.isArray(data)
    ? data
    : data?.data || data?.items || [];
  const totalPages: number = data?.totalPages || data?.meta?.totalPages || 1;

  const applyFilters = () => {
    const updates: Record<string, string | undefined> = {};
    if (tempPreset !== null) {
      const p = PRICE_PRESETS[tempPreset];
      updates.minPrice = p.min ? String(p.min) : undefined;
      updates.maxPrice = p.max ? String(p.max) : undefined;
    } else {
      updates.minPrice = tempMinPrice || undefined;
      updates.maxPrice = tempMaxPrice || undefined;
    }
    updates.minRating = tempMinRating > 0 ? String(tempMinRating) : undefined;
    updates.freeship = tempFreeship ? 'true' : undefined;
    setParam(updates);
  };

  const clearFilters = () => {
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempMinRating(0);
    setTempFreeship(false);
    setTempPreset(null);
    const next = new URLSearchParams();
    if (sort !== 'newest') next.set('sort', sort);
    setSearchParams(next);
  };

  const activeFilterCount = [minPrice, maxPrice, minRating, freeship ? 'y' : ''].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Sidebar Filter */}
        <aside className="w-60 shrink-0 self-start sticky top-4">
          <div className="card p-4 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-800">
                <SlidersHorizontal size={16} />
                <span>Bộ lọc</span>
                {activeFilterCount > 0 && (
                  <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Khoảng giá</p>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {PRICE_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.label}
                    onClick={() => setTempPreset(tempPreset === idx ? null : idx)}
                    className={`text-xs py-1.5 px-2 rounded border transition-colors ${tempPreset === idx
                      ? 'bg-primary-50 border-primary-500 text-primary-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Từ"
                  value={tempMinPrice}
                  onChange={e => { setTempMinPrice(e.target.value); setTempPreset(null); }}
                  className="input text-xs py-1.5 w-full"
                />
                <span className="text-gray-400 text-xs shrink-0">–</span>
                <input
                  type="number"
                  placeholder="Đến"
                  value={tempMaxPrice}
                  onChange={e => { setTempMaxPrice(e.target.value); setTempPreset(null); }}
                  className="input text-xs py-1.5 w-full"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Đánh giá tối thiểu</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => setTempMinRating(tempMinRating === r ? 0 : r)}
                    className={`flex items-center gap-0.5 px-2 py-1 rounded border text-xs transition-colors ${tempMinRating === r
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {r}<Star size={10} className={tempMinRating >= r ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Freeship */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tempFreeship}
                  onChange={e => setTempFreeship(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Truck size={14} className="text-green-600" />
                  Miễn phí vận chuyển
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={applyFilters}
                className="flex-1 btn-primary text-sm py-1.5"
              >
                Áp dụng
              </button>
              <button
                onClick={clearFilters}
                className="flex-1 text-sm py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Tất cả sản phẩm</h1>
              {data?.total != null && (
                <p className="text-sm text-gray-500">{data.total.toLocaleString('vi-VN')} sản phẩm</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <select
                value={sort}
                onChange={e => setParam({ sort: e.target.value })}
                className="input w-auto text-sm py-1.5"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter badges */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {(minPrice || maxPrice) && (
                <span className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-1 rounded-full">
                  Giá: {minPrice ? `${Number(minPrice).toLocaleString('vi-VN')}₫` : '0'} – {maxPrice ? `${Number(maxPrice).toLocaleString('vi-VN')}₫` : 'Không giới hạn'}
                  <button onClick={() => setParam({ minPrice: undefined, maxPrice: undefined })} className="ml-0.5 hover:text-primary-900">×</button>
                </span>
              )}
              {minRating && (
                <span className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full">
                  ≥ {minRating} sao
                  <button onClick={() => setParam({ minRating: undefined })} className="ml-0.5 hover:text-yellow-900">×</button>
                </span>
              )}
              {freeship && (
                <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">
                  <Truck size={10} /> Freeship
                  <button onClick={() => setParam({ freeship: undefined })} className="ml-0.5 hover:text-green-900">×</button>
                </span>
              )}
            </div>
          )}

          {/* Product grid/list */}
          {isLoading ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="card overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-100 rounded" />
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card p-3 flex gap-4 animate-pulse">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-5 bg-gray-100 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium mb-2">Không tìm thấy sản phẩm</p>
              <p className="text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              <button onClick={clearFilters} className="btn-primary mt-4 text-sm">
                Xóa bộ lọc
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product: any) => {
                const price = product.skus?.[0]?.price || product.minPrice || 0;
                const comparePrice = product.skus?.[0]?.comparePrice;
                const discount = comparePrice && price
                  ? Math.round(((comparePrice - price) / comparePrice) * 100)
                  : 0;
                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.slug}`}
                    className="card p-3 flex gap-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="w-28 h-28 shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={product.images?.[0]?.url || 'https://via.placeholder.com/112'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-primary-600 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{product.shop?.name}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-primary-600 font-bold text-base">
                          {Number(price).toLocaleString('vi-VN')}₫
                        </span>
                        {comparePrice && (
                          <span className="text-gray-400 text-xs line-through">
                            {Number(comparePrice).toLocaleString('vi-VN')}₫
                          </span>
                        )}
                        {discount > 0 && (
                          <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded">
                            -{discount}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {product.avgRating > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-500">
                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            {Number(product.avgRating).toFixed(1)}
                            <span className="text-gray-400">({product.reviewCount || product._count?.reviews || 0})</span>
                          </span>
                        )}
                        {product.freeShipping && (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <Truck size={12} /> Freeship
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex justify-center gap-1.5 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => setParam({ page: String(page - 1) })}
                className="w-9 h-9 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setParam({ page: String(p) })}
                    className={`w-9 h-9 rounded-lg text-sm transition-colors ${p === page
                      ? 'bg-primary-600 text-white font-medium'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setParam({ page: String(page + 1) })}
                className="w-9 h-9 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
