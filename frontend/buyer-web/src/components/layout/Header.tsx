import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Heart, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/cart').then(r => r.data.data),
    enabled: isAuthenticated && user?.role === 'BUYER',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-primary-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="text-white text-xl font-bold flex-shrink-0">
            🛍️ Marketplace
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-4 py-2 rounded-l-lg text-gray-900 text-sm focus:outline-none"
              />
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-4 rounded-r-lg">
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-3 text-white">
            {isAuthenticated ? (
              <>
                <Link to="/wishlist" className="flex flex-col items-center text-xs hover:text-orange-200">
                  <Heart size={20} />
                  <span>Yêu thích</span>
                </Link>
                <Link to="/cart" className="flex flex-col items-center text-xs hover:text-orange-200 relative">
                  <ShoppingCart size={20} />
                  {cart?.items?.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {cart.items.length}
                    </span>
                  )}
                  <span>Giỏ hàng</span>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex flex-col items-center text-xs hover:text-orange-200"
                  >
                    <User size={20} />
                    <span>{user?.email?.split('@')[0]}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white text-gray-700 rounded-lg shadow-lg w-52 py-2 z-50">
                      <Link to="/account" className="block px-4 py-2 hover:bg-gray-50 text-sm">Tài khoản</Link>
                      <Link to="/orders" className="block px-4 py-2 hover:bg-gray-50 text-sm">Đơn hàng</Link>
                      <Link to="/account/addresses" className="block px-4 py-2 hover:bg-gray-50 text-sm">Địa chỉ</Link>
                      <Link to="/account/loyalty" className="block px-4 py-2 hover:bg-gray-50 text-sm">Điểm thưởng</Link>
                      <Link to="/account/followed-shops" className="block px-4 py-2 hover:bg-gray-50 text-sm">Shop đang theo dõi</Link>
                      <Link to="/wishlist" className="block px-4 py-2 hover:bg-gray-50 text-sm">Yêu thích</Link>
                      <Link to="/account/recommendations" className="block px-4 py-2 hover:bg-gray-50 text-sm">Gợi ý cho bạn ✨</Link>
                      <Link to="/ai-assistant" className="block px-4 py-2 hover:bg-gray-50 text-sm">Trợ lý AI 🤖</Link>
                      <hr className="my-1" />
                      <button onClick={logout} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600">
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex gap-2 text-sm">
                <Link to="/login" className="hover:text-orange-200">Đăng nhập</Link>
                <span>|</span>
                <Link to="/register" className="hover:text-orange-200">Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div className="bg-primary-700 border-t border-primary-500">
        <div className="max-w-7xl mx-auto px-4 flex gap-6 py-1 text-white text-xs overflow-x-auto">
          <Link to="/categories/dien-tu" className="hover:text-orange-200 whitespace-nowrap">Điện tử</Link>
          <Link to="/categories/thoi-trang" className="hover:text-orange-200 whitespace-nowrap">Thời trang</Link>
          <Link to="/categories/gia-dung" className="hover:text-orange-200 whitespace-nowrap">Gia dụng</Link>
          <Link to="/categories/lam-dep" className="hover:text-orange-200 whitespace-nowrap">Làm đẹp</Link>
          <Link to="/categories/the-thao" className="hover:text-orange-200 whitespace-nowrap">Thể thao</Link>
          <Link to="/flash-sale/active" className="hover:text-orange-200 whitespace-nowrap text-orange-300 font-bold">⚡ Flash Sale</Link>
        </div>
      </div>
    </header>
  );
}
