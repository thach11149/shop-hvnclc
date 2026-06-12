import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './store/auth.store';
import Sidebar from './components/layout/Sidebar';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const SellersPage = lazy(() => import('./pages/SellersPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage'));
const BannersPage = lazy(() => import('./pages/BannersPage'));
const WithdrawalsPage = lazy(() => import('./pages/WithdrawalsPage'));
const ReturnsPage = lazy(() => import('./pages/ReturnsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Đang tải...</div>}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/sellers" element={<SellersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/banners" element={<BannersPage />} />
            <Route path="/withdrawals" element={<WithdrawalsPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </Suspense>
  );
}
