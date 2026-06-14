import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Star, ChevronDown, ChevronUp, Clock, TrendingUp } from 'lucide-react';
import apiClient from '../api/client';
import ProductCard from '../components/product/ProductCard';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Liên quan nhất' },
  { value: 'sales', label: 'Bán chạy nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'rating', label: 'Đánh giá cao' },
];

const PRICE_RANGES = [
  { label: 'Dưới 100K', min: 0, max: 100000 },
  { label: '100K - 500K', min: 100000, max: 500000 },
  { label: '500K - 1M', min: 500000, max: 1000000 },
  { label: '1M - 5M', min: 1000000, max: 5000000 },
  { label: 'Trên 5M', min: 5000000, max: undefined },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function RatingFilter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      {[5, 4, 3, 2, 1].map(star => (
        <button
          key={star}
          onClick={() => onChange(value === star ? 0 : star)}
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${value === star ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50'}`}
        >
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={12} className={i <= star ? 'fill-orange-400 text-orange-400' : 'text-gray-200'} />
            ))}
          </div>
          <span>{star === 5 ? 'Chỉ 5 sao' : `${star} sao trở lên`}</span>
        </button>
      ))}
    </div>
  );
}

const RECENT_SEARCHES_KEY = 'buyer_recent_searches';

function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); } catch { return []; }
}

function addRecentSearch(q: string) {
  const list = getRecentSearches().filter(s => s !== q).slice(0, 7);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([q, ...list]));
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const [inputVal, setInputVal] = useState(q);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sort, setSort] = useState(searchParams.get('sort') || 'relevance');
  const [minPrice, setMinPrice] = useState<number | undefined>(searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined);
  const [minRating, setMinRating] = useState(Number(searchParams.get('minRating') || 0));
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const recentSearches = getRecentSearches();

  const debouncedInput = useDebounce(inputVal, 300);

  const { data: suggestData } = useQuery({
    queryKey: ['search-suggestions', debouncedInput],
    queryFn: () => apiClient.get('/search/suggestions', { params: { q: debouncedInput } }).then(r => r.data.data || []),
    enabled: debouncedInput.length >= 2 && showSuggestions,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['search', q, sort, minPrice, maxPrice, minRating, page],
    queryFn: () =>
      apiClient.get('/search', {
        params: {
          q,
          sort,
          minPrice,
          maxPrice,
          minRating: minRating || undefined,
          page,
          limit: 20,
        },
      }).then(r => r.data.data),
    enabled: !!q,
  });

  useEffect(() => {
    setInputVal(q);
  }, [q]);

  const handleSearch = (value: string) => {
    if (!value.trim()) return;
    addRecentSearch(value.trim());
    setShowSuggestions(false);
    setPage(1);
    const params: any = { q: value.trim() };
    if (sort !== 'relevance') params.sort = sort;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (minRating) params.minRating = minRating;
    setSearchParams(params);
  };

  const applyFilters = () => {
    const customMin = customMinPrice ? Number(customMinPrice) * 1000 : undefined;
    const customMax = customMaxPrice ? Number(customMaxPrice) * 1000 : undefined;
    const finalMin = customMin || minPrice;
    const finalMax = customMax || maxPrice;
    setMinPrice(finalMin);
    setMaxPrice(finalMax);
    setPage(1);
    const params: any = { q };
    if (sort !== 'relevance') params.sort = sort;
    if (finalMin) params.minPrice = finalMin;
    if (finalMax) params.maxPrice = finalMax;
    if (minRating) params.minRating = minRating;
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilter = (key: 'price' | 'rating' | 'sort') => {
    if (key === 'price') { setMinPrice(undefined); setMaxPrice(undefined); setCustomMinPrice(''); setCustomMaxPrice(''); }
    if (key === 'rating') setMinRating(0);
    if (key === 'sort') setSort('relevance');
  };

  const suggestions: string[] = suggestData?.suggestions || suggestData || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  const activeFiltersCount = [minPrice || maxPrice, minRating, sort !== 'relevance'].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search bar */}
      <div className="relative mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              value={inputVal}
              onChange={e => { setInputVal(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(inputVal); if (e.key === 'Escape') setShowSuggestions(false); }}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 focus:border-primary-400 rounded-xl text-sm outline-none"
            />
            {inputVal && (
              <button onClick={() => { setInputVal(''); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          <button onClick={() => handleSearch(inputVal)} className="btn-primary px-6 text-sm rounded-xl">Tìm</button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl text-sm transition-colors ${showFilters || activeFiltersCount > 0 ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
          >
            <SlidersHorizontal size={16} />
            Lọc
            {activeFiltersCount > 0 && (
              <span className="bg-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && (inputVal.length >= 2 || recentSearches.length > 0) && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
            {inputVal.length >= 2 && suggestions.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs text-gray-500 font-semibold border-b">Gợi ý tìm kiếm</div>
                {suggestions.slice(0, 6).map((s: string) => (
                  <button
                    key={s}
                    onClick={() => { setInputVal(s); handleSearch(s); }}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-gray-50 text-sm"
                  >
                    <TrendingUp size={14} className="text-gray-400 flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: s.replace(new RegExp(inputVal, 'gi'), m => `<strong>${m}</strong>`) }} />
                  </button>
                ))}
              </div>
            )}
            {recentSearches.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs text-gray-500 font-semibold border-b">Tìm kiếm gần đây</div>
                {recentSearches.slice(0, 5).map(s => (
                  <button
                    key={s}
                    onClick={() => { setInputVal(s); handleSearch(s); }}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-gray-50 text-sm"
                  >
                    <Clock size={14} className="text-gray-400 flex-shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        {showFilters && (
          <aside className="w-56 flex-shrink-0">
            <div className="card p-4 sticky top-4">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                Bộ lọc
                <button onClick={() => { clearFilter('price'); clearFilter('rating'); clearFilter('sort'); }} className="text-xs text-primary-600 hover:underline">Xóa tất cả</button>
              </h3>

              {/* Price ranges */}
              <div className="mb-5">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Khoảng giá</h4>
                <div className="space-y-1 mb-3">
                  {PRICE_RANGES.map(range => (
                    <button
                      key={range.label}
                      onClick={() => { setMinPrice(range.min || undefined); setMaxPrice(range.max); setCustomMinPrice(''); setCustomMaxPrice(''); }}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${minPrice === (range.min || undefined) && maxPrice === range.max ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50 text-gray-600'}`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center text-sm">
                  <input
                    value={customMinPrice}
                    onChange={e => setCustomMinPrice(e.target.value)}
                    placeholder="Min (K)"
                    className="input flex-1 text-xs py-1.5"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    value={customMaxPrice}
                    onChange={e => setCustomMaxPrice(e.target.value)}
                    placeholder="Max (K)"
                    className="input flex-1 text-xs py-1.5"
                  />
                </div>
              </div>

              {/* Rating filter */}
              <div className="mb-5">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Đánh giá tối thiểu</h4>
                <RatingFilter value={minRating} onChange={setMinRating} />
              </div>

              <button onClick={applyFilters} className="btn-primary w-full text-sm">Áp dụng</button>
            </div>
          </aside>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {q && (
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  Kết quả cho: "<span className="text-primary-600">{q}</span>"
                </h1>
                {data && <p className="text-sm text-gray-500">{data.total?.toLocaleString()} sản phẩm</p>}
              </div>

              {/* Active filter chips */}
              <div className="flex gap-2 flex-wrap items-center">
                {(minPrice || maxPrice) && (
                  <span className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                    {minPrice ? (minPrice / 1000).toFixed(0) + 'K' : ''} - {maxPrice ? (maxPrice / 1000000).toFixed(1) + 'M' : ''}
                    <button onClick={() => clearFilter('price')}><X size={12} /></button>
                  </span>
                )}
                {minRating > 0 && (
                  <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                    {minRating}★ trở lên
                    <button onClick={() => clearFilter('rating')}><X size={12} /></button>
                  </span>
                )}

                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={e => { setSort(e.target.value); setPage(1); }}
                    className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card h-56 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : data?.data?.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.data.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40">Trước</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page - 2 + i;
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-lg border text-sm ${p === page ? 'bg-primary-600 text-white border-primary-600' : 'hover:border-gray-300'}`}>{p}</button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40">Sau</button>
                </div>
              )}
            </>
          ) : q ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium mb-2">Không tìm thấy sản phẩm</p>
              <p className="text-sm text-gray-400">Thử từ khóa khác hoặc bỏ bớt bộ lọc</p>
              {activeFiltersCount > 0 && (
                <button onClick={() => { clearFilter('price'); clearFilter('rating'); clearFilter('sort'); applyFilters(); }} className="mt-4 text-primary-600 text-sm hover:underline">
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Search size={48} className="mx-auto mb-4 opacity-30" />
              <p>Nhập từ khóa để tìm kiếm</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
