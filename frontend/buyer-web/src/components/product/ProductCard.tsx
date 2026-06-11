import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import clsx from 'clsx';

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    images: { url: string }[];
    skus: { price: number; comparePrice?: number }[];
    shop: { name: string; slug: string };
    _count?: { reviews: number };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const price = product.skus[0]?.price;
  const comparePrice = product.skus[0]?.comparePrice;
  const discount = comparePrice && price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  return (
    <div className="card hover:shadow-md transition-shadow group">
      <Link to={`/products/${product.slug}`}>
        <div className="relative overflow-hidden aspect-square">
          <img
            src={product.images[0]?.url || 'https://via.placeholder.com/300'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded">
              -{discount}%
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm text-gray-800 line-clamp-2 mb-1 group-hover:text-primary-600">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-primary-600 font-semibold text-base">
              {price?.toLocaleString('vi-VN')}₫
            </span>
            {comparePrice && (
              <span className="text-gray-400 text-xs line-through">
                {comparePrice.toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">{product.shop.name}</span>
            {product._count?.reviews > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-gray-500">
                <Star size={12} className="fill-orange-400 text-orange-400" />
                {product._count.reviews} đánh giá
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
