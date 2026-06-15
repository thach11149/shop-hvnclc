import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { useAuthStore } from './store/auth.store';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const ReturnOrderPage = lazy(() => import('./pages/ReturnOrderPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AddressesPage = lazy(() => import('./pages/AddressesPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage'));
// Phase 2
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const CampaignDetailPage = lazy(() => import('./pages/CampaignDetailPage'));
const FollowedShopsPage = lazy(() => import('./pages/FollowedShopsPage'));
// Phase 3
const DisputeDetailPage = lazy(() => import('./pages/DisputeDetailPage'));
const CreateDisputePage = lazy(() => import('./pages/CreateDisputePage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
// Phase 4
const AIShoppingAssistantPage = lazy(() => import('./pages/AIShoppingAssistantPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
// Session 2026-06-15
const CampaignPage = lazy(() => import('./pages/CampaignPage'));
// New pages
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const PaymentMethodsPage = lazy(() => import('./pages/PaymentMethodsPage'));
const TrackingPage = lazy(() => import('./pages/TrackingPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Đang tải...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<Layout><Suspense fallback={null}><Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/shops/:slug" element={<ShopPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/orders/:id/return" element={<ProtectedRoute><ReturnOrderPage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/account/addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
          <Route path="/account/loyalty" element={<ProtectedRoute><LoyaltyPage /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          {/* Phase 2 */}
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/campaigns" element={<CampaignPage />} />
          <Route path="/campaigns/:slug" element={<CampaignDetailPage />} />
          <Route path="/account/followed-shops" element={<ProtectedRoute><FollowedShopsPage /></ProtectedRoute>} />
          {/* Phase 3 */}
          <Route path="/disputes/:id" element={<ProtectedRoute><DisputeDetailPage /></ProtectedRoute>} />
          <Route path="/orders/:id/dispute" element={<ProtectedRoute><CreateDisputePage /></ProtectedRoute>} />
          <Route path="/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
          {/* Phase 4 */}
          <Route path="/ai-assistant" element={<ProtectedRoute><AIShoppingAssistantPage /></ProtectedRoute>} />
          <Route path="/account/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
          {/* New pages */}
          <Route path="/account/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/account/payment" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
          <Route path="/account/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
          <Route path="/orders/:id/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
          <Route path="/payment/result" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
        </Routes></Suspense></Layout>} path="/*" />
      </Routes>
    </Suspense>
  );
}
