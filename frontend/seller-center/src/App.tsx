import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './store/auth.store';
import Sidebar from './components/layout/Sidebar';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const NewProductPage = lazy(() => import('./pages/NewProductPage'));
const EditProductPage = lazy(() => import('./pages/EditProductPage'));
const VariantsPage = lazy(() => import('./pages/VariantsPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ShopDecorationPage = lazy(() => import('./pages/ShopDecorationPage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const FlashSalePage = lazy(() => import('./pages/FlashSalePage'));
const CombosPage = lazy(() => import('./pages/CombosPage'));
const FreeshippingPage = lazy(() => import('./pages/FreeshippingPage'));
const ReturnRequestsPage = lazy(() => import('./pages/ReturnRequestsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const StaffsPage = lazy(() => import('./pages/StaffsPage'));
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
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<NewProductPage />} />
            <Route path="/products/import" element={<ImportPage />} />
            <Route path="/products/:id/edit" element={<EditProductPage />} />
            <Route path="/products/:id/variants" element={<VariantsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/decoration" element={<ShopDecorationPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/flash-sale" element={<FlashSalePage />} />
            <Route path="/combo-deals" element={<CombosPage />} />
            <Route path="/freeship-rules" element={<FreeshippingPage />} />
            <Route path="/return-requests" element={<ReturnRequestsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/staffs" element={<StaffsPage />} />
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
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </Suspense>
  );
}
