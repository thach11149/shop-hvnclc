import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function CampaignPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', slug],
    queryFn: () => apiClient.get(`/campaigns/${slug}`).then(r => r.data.data),
    enabled: !!slug,
  });

  if (isLoading) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="h-48 bg-gray-100 rounded-2xl animate-pulse mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">🎪</p>
      <p className="text-gray-600">Không tìm thấy chương trình khuyến mãi</p>
      <Link to="/" className="btn-primary mt-4 inline-block">Về trang chủ</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Campaign Banner */}
      {campaign.bannerUrl && (
        <div className="rounded-2xl overflow-hidden mb-6 aspect-[3/1]">
          <img src={campaign.bannerUrl} alt={campaign.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{campaign.name}</h1>
        {campaign.description && <p className="text-gray-600">{campaign.description}</p>}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span>🗓 {new Date(campaign.startDate).toLocaleDateString('vi-VN')} - {new Date(campaign.endDate).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Campaign Products */}
      {campaign.products?.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Sản phẩm trong chương trình</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {campaign.products.map((product: any) => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="card overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.images?.[0]?.url || 'https://via.placeholder.com/300'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-800 line-clamp-2">{product.name}</p>
                  <p className="text-primary-600 font-bold text-sm mt-1">
                    {Number(product.skus?.[0]?.salePrice || product.skus?.[0]?.price || 0).toLocaleString('vi-VN')}₫
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p>Chưa có sản phẩm trong chương trình này</p>
        </div>
      )}
    </div>
  );
}
