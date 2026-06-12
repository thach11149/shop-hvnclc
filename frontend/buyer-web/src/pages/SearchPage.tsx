import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import ProductCard from '../components/product/ProductCard';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => apiClient.get('/search', { params: { q, limit: 20 } }).then(r => r.data.data),
    enabled: !!q,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-2">
        Kết quả tìm kiếm: "{q}"
      </h1>
      {data && <p className="text-sm text-gray-500 mb-6">{data.total} sản phẩm được tìm thấy</p>}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-48 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : data?.data?.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.data.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : q ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          <p>Không tìm thấy sản phẩm cho "{q}"</p>
        </div>
      ) : null}
    </div>
  );
}
