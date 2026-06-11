import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import ProductCard from '../components/product/ProductCard';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState('newest');
  const page = Number(searchParams.get('page') || 1);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { sort, page, categoryId: searchParams.get('categoryId') }],
    queryFn: () => apiClient.get('/products', {
      params: { sort, page, limit: 20, categoryId: searchParams.get('categoryId') },
    }).then(r => r.data.data),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Tất cả sản phẩm</h1>
        <select value={sort} onChange={e => setSort(e.target.value)} className="input w-auto text-sm py-1.5">
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá thấp đến cao</option>
          <option value="price_desc">Giá cao đến thấp</option>
          <option value="popular">Bán chạy nhất</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card aspect-square animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : data?.data?.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.data.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setSearchParams({ page: String(p) })}
                  className={`w-9 h-9 rounded-lg text-sm ${p === page ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-gray-500">Chưa có sản phẩm nào</div>
      )}
    </div>
  );
}
