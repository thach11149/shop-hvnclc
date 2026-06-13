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
// Phase 2
const CampaignDetailPage = lazy(() => import('./pages/CampaignDetailPage'));
const FlashSaleAdminPage = lazy(() => import('./pages/FlashSaleAdminPage'));
const ShippingCarriersPage = lazy(() => import('./pages/ShippingCarriersPage'));
const SearchConfigPage = lazy(() => import('./pages/SearchConfigPage'));
// Phase 3
const WarehousesPage = lazy(() => import('./pages/WarehousesPage'));
const FulfillmentPage = lazy(() => import('./pages/FulfillmentPage'));
const AdsManagementPage = lazy(() => import('./pages/AdsManagementPage'));
const AffiliateManagementPage = lazy(() => import('./pages/AffiliateManagementPage'));
const DisputesManagementPage = lazy(() => import('./pages/DisputesManagementPage'));
const FraudCasesPage = lazy(() => import('./pages/FraudCasesPage'));
const RiskScoresPage = lazy(() => import('./pages/RiskScoresPage'));
const BIDashboardPage = lazy(() => import('./pages/BIDashboardPage'));
// Phase 4
const AIFraudAlertsPage = lazy(() => import('./pages/AIFraudAlertsPage'));
const DemandForecastPage = lazy(() => import('./pages/DemandForecastPage'));
const ModelMonitoringPage = lazy(() => import('./pages/ModelMonitoringPage'));
const MarketingSegmentsPage = lazy(() => import('./pages/MarketingSegmentsPage'));
const MarketingAutomationPage = lazy(() => import('./pages/MarketingAutomationPage'));
const DataQualityPage = lazy(() => import('./pages/DataQualityPage'));
const OperationsReportPage = lazy(() => import('./pages/OperationsReportPage'));
const SellerDetailPage = lazy(() => import('./pages/SellerDetailPage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));

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
            {/* Phase 2 */}
            <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
            <Route path="/flash-sale" element={<FlashSaleAdminPage />} />
            <Route path="/shipping-carriers" element={<ShippingCarriersPage />} />
            <Route path="/search-config" element={<SearchConfigPage />} />
            {/* Phase 3 */}
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/fulfillment" element={<FulfillmentPage />} />
            <Route path="/ads" element={<AdsManagementPage />} />
            <Route path="/affiliate" element={<AffiliateManagementPage />} />
            <Route path="/disputes" element={<DisputesManagementPage />} />
            <Route path="/fraud-cases" element={<FraudCasesPage />} />
            <Route path="/risk-scores" element={<RiskScoresPage />} />
            <Route path="/bi-dashboard" element={<BIDashboardPage />} />
            {/* Phase 4 */}
            <Route path="/ai/fraud-alerts" element={<AIFraudAlertsPage />} />
            <Route path="/ai/demand-forecast" element={<DemandForecastPage />} />
            <Route path="/ai/model-monitoring" element={<ModelMonitoringPage />} />
            <Route path="/marketing/segments" element={<MarketingSegmentsPage />} />
            <Route path="/marketing/automation" element={<MarketingAutomationPage />} />
            <Route path="/data-quality" element={<DataQualityPage />} />
            <Route path="/reports/operations" element={<OperationsReportPage />} />
            <Route path="/sellers/:id" element={<SellerDetailPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
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
