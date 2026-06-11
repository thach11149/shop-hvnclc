import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-3">Về Marketplace</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white">Giới thiệu</Link></li>
              <li><Link to="/careers" className="hover:text-white">Tuyển dụng</Link></li>
              <li><Link to="/press" className="hover:text-white">Báo chí</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="hover:text-white">Trung tâm hỗ trợ</Link></li>
              <li><Link to="/shipping" className="hover:text-white">Chính sách vận chuyển</Link></li>
              <li><Link to="/return-policy" className="hover:text-white">Chính sách đổi trả</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Nhà bán hàng</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/seller/register" className="hover:text-white">Đăng ký bán hàng</a></li>
              <li><a href="/seller" className="hover:text-white">Seller Center</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Liên hệ</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: support@marketplace.vn</li>
              <li>Hotline: 1800-1234</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
          © 2024 Marketplace. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
