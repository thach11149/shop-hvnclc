# Project Progress Tracker

## Overview
Vietnamese marketplace (ecommerce) platform built with:
- Backend: Node.js/Express + TypeScript + Prisma (PostgreSQL)
- Frontend: 3 React+Vite+Tailwind apps (buyer-web, seller-center, admin-console)

---

## Backend Modules

### Completed
- [x] auth
- [x] user
- [x] seller
- [x] catalog
- [x] inventory
- [x] cart
- [x] promotion
- [x] order
- [x] finance
- [x] review
- [x] admin
- [x] search
- [x] return-refund
- [x] campaign
- [x] analytics
- [x] chat

### Added (Phase 2-3)
- [x] loyalty (loyalty points system)
- [x] warehouse (warehouse management)
- [x] ads (sponsored products)
- [x] affiliate (referral system)
- [x] dispute (dispute center)
- [x] fraud (fraud & risk)

### Added (Phase 4)
- [x] ai — AI Shopping Assistant, Seller AI Listing, Price Suggestion, Inventory Forecast, Demand Forecast, ML Model Monitoring
- [x] marketing — Customer Segments CRUD, Marketing Automation Flows

---

## Frontend: buyer-web

### Completed Pages
- [x] HomePage (`/`)
- [x] LoginPage (`/login`)
- [x] RegisterPage (`/register`)
- [x] ProductsPage (`/products`)
- [x] ProductDetailPage (`/products/:slug`)
- [x] CartPage (`/cart`)
- [x] CheckoutPage (`/checkout`)
- [x] OrdersPage (`/orders`)
- [x] SearchPage (`/search`)
- [x] AccountPage (`/account`)

### Added Pages
- [x] CategoryPage (`/categories/:slug`)
- [x] OrderDetailPage (`/orders/:id`)
- [x] AddressesPage (`/account/addresses`)
- [x] WishlistPage (`/wishlist`)
- [x] CampaignDetailPage (`/campaigns/:slug`)
- [x] ShopPage (`/shops/:slug`)
- [x] ReturnOrderPage (`/orders/:id/return`)
- [x] LoyaltyPage (`/account/loyalty`)
- [x] DisputeDetailPage (`/disputes/:id`) — Phase 3
- [x] ReferralPage (`/referral`) — Phase 3
- [x] AIShoppingAssistantPage (`/ai-assistant`) — Phase 4
- [x] RecommendationsPage (`/account/recommendations`) — Phase 4
- [x] FollowedShopsPage (`/account/followed-shops`) — Phase 2

---

## Frontend: seller-center

### Completed Pages
- [x] LoginPage
- [x] RegisterPage
- [x] DashboardPage
- [x] ProductsPage
- [x] NewProductPage
- [x] EditProductPage
- [x] OrdersPage
- [x] OrderDetailPage
- [x] FinancePage
- [x] CampaignsPage
- [x] ChatPage
- [x] ReturnRequestsPage
- [x] ReportsPage
- [x] ShopPage

### Added Pages
- [x] ImportProductPage (`/products/import`)
- [x] VariantsPage (`/products/:id/variants`)
- [x] FlashSalePage (`/flash-sale`)
- [x] ComboDealsPage (`/combo-deals`)
- [x] FreeshippingPage (`/freeship-rules`)
- [x] ShopDecorationPage (`/shop-decoration`)
- [x] StaffsPage (`/staffs`)
- [x] AdsPage (`/ads`)
- [x] AdsReportsPage (`/ads/reports`)
- [x] DisputesPage (`/disputes`)
- [x] WarehousePage (`/warehouse`)
- [x] WarehouseInboundPage (`/warehouse/inbound`)
- [x] AffiliatePage (`/affiliate`)
- [x] AIListingPage (`/ai/listing`)
- [x] AIPricePage (`/ai/price`)
- [x] AIInventoryForecastPage (`/ai/inventory-forecast`)
- [x] AdsOptimizationPage (`/ai/ad-optimization`) — Phase 4

---

## Frontend: admin-console

### Completed Pages
- [x] LoginPage
- [x] DashboardPage
- [x] SellersPage
- [x] ProductsPage
- [x] CategoriesPage
- [x] OrdersPage
- [x] PromotionsPage
- [x] BannersPage
- [x] UsersPage
- [x] ReturnsPage
- [x] WithdrawalsPage
- [x] ReportsPage

### Added Pages
- [x] SellerDetailPage (`/sellers/:id`)
- [x] CampaignsPage (`/campaigns`)
- [x] FlashSalePage (`/flash-sale`)
- [x] ShippingCarriersPage (`/shipping-carriers`)
- [x] WarehousePage (`/warehouses`)
- [x] AdsPage (`/ads`)
- [x] AffiliatePage (`/affiliate`)
- [x] DisputesPage (`/disputes`)
- [x] FraudCasesPage (`/fraud-cases`)
- [x] OperationsReportPage (`/reports/operations`)
- [x] DataQualityPage (`/data-quality`) — Phase 4 data quality dashboard
- [x] MarketingSegmentsPage (`/marketing/segments`) — Phase 4
- [x] MarketingAutomationPage (`/marketing/automation`) — Phase 4
- [x] AIFraudAlertsPage (`/ai/fraud-alerts`) — Phase 4
- [x] DemandForecastPage (`/ai/demand-forecast`) — Phase 4
- [x] ModelMonitoringPage (`/ai/model-monitoring`) — Phase 4

---

## Infrastructure / Config

- [x] Prisma schema (comprehensive, covers all 4 phases)
- [x] app.ts updated with all new module registrations

---

## Phase 4 Status (session claude/loving-mccarthy-hof6xk)
- [x] Backend AI module - recommendation endpoints (homepage/product/cart)
- [x] Backend AI module - review summary endpoint
- [x] Backend AI module - fraud score endpoints (order + user)
- [x] Backend AI module - ads optimization endpoint
- [x] Backend Marketing module (segments + automation flows)
- [x] app.ts updated with Phase 4 module registrations
- [x] Frontend: RecommendationsPage (/account/recommendations) — buyer
- [x] Frontend: AdsOptimizationPage (/ai/ad-optimization) — seller
- [x] Frontend: DataQualityPage (/data-quality) — admin
- [x] Frontend: FollowedShopsPage (/account/followed-shops) — buyer
- [x] Seller Center Sidebar: Phase 2-4 navigation (Warehouse, Ads, Affiliate, Disputes, AI, Combo, Freeship)
- [x] Admin Console Sidebar: Phase 3-4 navigation (all categories)
- [x] Buyer Header: thêm followed-shops, recommendations, AI assistant links
- [x] Dispute: createDispute (POST /orders/:id/disputes), listByBuyer
- [x] User: followShop toggle, getFollowedShops
- [x] Bug fixes: dispute service (buyer relation), ai.service (Prisma field names)

## Session 2026-06-14 (claude/kind-albattani-1qt4xk)

### Backend — Completed ✅
- [x] Prisma schema: thêm ProductQnA, Announcement, SystemConfig, LiveStream models
- [x] Module Q&A: q-and-a.service.ts, q-and-a.routes.ts (buyer hỏi, seller trả lời)
- [x] Module AuditLog: audit-log.service.ts, audit-log.routes.ts, audit-log.middleware.ts
- [x] Module Announcement: announcement.service.ts, announcement.routes.ts
- [x] Module SystemConfig: system-config.service.ts, system-config.routes.ts
- [x] Module LiveStream: live-stream.service.ts, live-stream.routes.ts
- [x] Module Export: export.routes.ts (xuất CSV đơn hàng/sản phẩm/tài chính)
- [x] EmailService: nodemailer + templates (order-confirmed, order-shipped, dispute-update, welcome)
- [x] CacheService: Redis wrapper với graceful fallback
- [x] SocketService: Socket.io + auth + rooms + typing events
- [x] ExportService: CSV export cho orders, products, finance
- [x] app.ts: wire tất cả modules mới

### Frontend Buyer-web — Completed ✅
- [x] NotificationsPage (/account/notifications)
- [x] PaymentMethodsPage (/account/payment)
- [x] TrackingPage (/orders/:id/tracking)
- [x] ReviewsPage (/account/reviews)
- [x] ProductQnASection (component cho ProductDetailPage)
- [x] LiveChatWidget (float chat widget với socket.io)
- [x] CheckoutPage upgrade (chọn VNPay/MoMo/ZaloPay + redirect)
- [x] PaymentResultPage upgrade (hiển thị đầy đủ thông tin giao dịch)
- [x] ReturnRequestPage upgrade (upload ảnh, theo dõi tiến trình)

### Frontend Seller-center — Completed ✅
- [x] ReviewManagementPage (/reviews)
- [x] QnAManagementPage (/qna)
- [x] PayoutPage (/finance/payouts)
- [x] InventoryAlertPage (/warehouse/alerts)
- [x] OrderFulfillmentPage (/orders/fulfillment)
- [x] ShopAnalyticsPage (/analytics) — charts + funnel
- [x] SellerNotificationsPage (/notifications)
- [x] LiveStreamPage (/live)

### Frontend Admin-console — Completed ✅
- [x] SystemConfigPage (/system/config) — key-value config management
- [x] EmailTemplatesPage (/system/emails)
- [x] PaymentConfigPage (/system/payment)
- [x] AuditLogPage (/audit-logs)
- [x] AnnouncementsPage (/announcements)
- [x] BulkActionsPage (/products/bulk)

### Shared Components — Completed ✅
- [x] DataTable (sort, filter, pagination) — copied to all 3 frontends
- [x] ImageUpload (drag-drop + preview + upload)
- [x] RatingStars (interactive + readonly)
- [x] ErrorBoundary + SkeletonCard/Text/Table
- [x] useSocket hook (Socket.io + join/leave chat + typing)

## Session 2026-06-14 (claude/epic-fermi-oecesn)

### Task 1 — Sidebar Navigation ✅
- [x] Seller-center sidebar: thêm Reviews, QnA (Sản phẩm group), Fulfillment/InventoryAlerts (Vận hành), Payouts (Tài chính), LiveStream (Bán hàng & Marketing), Analytics (Thống kê), Notifications với unread badge
- [x] Admin-console sidebar: thêm Bulk Actions (Quản lý sàn), Announcements (Vận hành), System group (Config/Emails/Payment), Audit Logs (Quản trị)

### Task 2 — ProductDetailPage ✅
- [x] Buyer-web ProductDetailPage: tích hợp ProductQnASection component
- [x] RatingBreakdown widget: chart 5 mức sao với % từng mức (GET /products/:id/reviews?summary=true)
- [x] RecommendationsWidget: horizontal scroll 4 sản phẩm tương tự (GET /ai/recommendations/product?productId=:id)

### Task 3 — CategoryManagementPage ✅
- [x] Admin-console CategoriesPage: tree view (nested indent + collapse/expand)
- [x] Drag-drop reorder (HTML5 drag API)
- [x] Modal form: tên, slug auto-gen, parent, upload ảnh (file + URL)
- [x] Inline actions: edit, toggle active/inactive, delete (confirm dialog)
- [x] Backend: GET /categories/tree (getCategoryTree), DELETE /admin/categories/:id, PATCH /admin/categories/reorder

### Task 4 — SellerDashboard ✅
- [x] Seller DashboardPage: metrics thật từ API (revenue today/week/month, orders by status, top 5 products)
- [x] LineChart 30 ngày dùng recharts (so sánh với kỳ trước)
- [x] Real-time Socket.io: lắng nghe event 'new-order', toast notification + update count
- [x] Backend: GET /seller/analytics/revenue, /analytics/orders, /analytics/top-products, /analytics/revenue-chart

### Task 5 — OrdersPage Seller ✅
- [x] Advanced filters: search (orderNumber/email), date range, status multi-select
- [x] Bulk actions: confirm (xác nhận đã giao), update tracking (modal + carrier select), print shipping label
- [x] Shipping label modal: hiển thị thông tin đơn đầy đủ, nút in
- [x] Pagination
- [x] Backend: PATCH /seller/orders/bulk (confirm/deliver/tracking), GET /seller/orders/:id/shipping-label
- [x] Improved getSellerOrders: supports search + date filters

### Task 6 — SearchPage ✅
- [x] Buyer-web SearchPage: autocomplete suggestions (GET /search/suggestions, debounce 300ms)
- [x] Recent searches (localStorage)
- [x] Filter panel: khoảng giá (preset + custom), đánh giá tối thiểu (1-5 sao)
- [x] Sort: liên quan, bán chạy, giá asc/desc, mới nhất, đánh giá cao
- [x] Active filter chips với clear buttons
- [x] Pagination

### Task 7 — Chat Nâng Cấp ✅
- [x] Seller-center ChatPage: typing indicator (3 dots animation)
- [x] Read receipts (tick xanh/xám)
- [x] Online status (chấm xanh/xám theo userId)
- [x] Tìm kiếm trong tin nhắn (search bar toggle)
- [x] Upload file/ảnh (Paperclip button, POST /upload/image)
- [x] Socket.io events: typing, stop-typing, user-online, user-offline, message-read
- [x] Thread search filter

### Task 8 — Admin Reports ✅
- [x] Admin-console ReportsPage upgrade
- [x] Real-time metrics panel: đơn đang xử lý, tranh chấp mở, seller chờ duyệt (GET /admin/analytics/realtime, refetch 30s)
- [x] AreaChart doanh thu theo ngày (inline SVG, không cần recharts)
- [x] Bar chart đơn theo trạng thái
- [x] Top sellers table: GMV, số đơn, tỷ lệ hoàn thành (GET /admin/analytics/top-sellers)
- [x] Top categories bar chart (GET /admin/analytics/top-categories)
- [x] Growth badges (so sánh với kỳ trước)
- [x] Backend: GET /admin/analytics/top-sellers, /top-categories, /realtime endpoints

## Session 2026-06-14 (claude/modest-darwin-3g1rs8) — bản 3

### Task 1 — HomePage buyer-web ✅
- [x] Banner carousel auto-play (useEffect + setInterval 4s), left/right arrows, dot indicators
- [x] Flash sale countdown timer (HH:MM:SS, useEffect interval to midnight)
- [x] Flash sale products grid with sold% progress bar
- [x] Featured categories grid (10 items, getCategoryEmoji)
- [x] AI recommendations section (GET /ai/recommendations/homepage, horizontal scroll)
- [x] Best sellers section (GET /products?sort=popular&limit=10)

### Task 2 — ProductsPage + CategoryPage ✅
- [x] ProductsPage: filter sidebar (price presets + custom range, rating buttons, freeship checkbox)
- [x] ProductsPage: grid/list toggle (LayoutGrid/List icons)
- [x] ProductsPage: URL sync (useSearchParams for sort/minPrice/maxPrice/minRating/freeship/page)
- [x] ProductsPage: list view (image + name/price/rating/shop/freeship badge)
- [x] CategoryPage: breadcrumb (Home > parent > current)
- [x] CategoryPage: subcategories grid with emoji fallback
- [x] CategoryPage: full filter sidebar matching ProductsPage
- [x] CategoryPage: active filter chips with × remove
- [x] CategoryPage: grid/list toggle + URL sync
- [x] CategoryPage: windowed pagination

### Task 3 — AccountPage buyer-web ✅
- [x] Tab Hồ sơ: avatar upload (FileReader preview + POST /upload/image), edit form (fullName/phone/gender/birthday)
- [x] Tab Bảo mật: change password form (currentPassword/newPassword/confirmPassword + validation)
- [x] Tab Địa chỉ: list addresses, inline add/edit form (6 fields + isDefault), CRUD operations
- [x] Tab Đơn hàng: recent orders table with status badges, link to /orders/:id

### Task 4 — Admin DashboardPage + OrdersPage ✅
- [x] DashboardPage: 6 KPI cards (users, sellers, todayOrders, monthRevenue, pendingSellers, pendingProducts)
- [x] DashboardPage: inline SVG MiniAreaChart (area fill + line + dots + x-axis labels)
- [x] DashboardPage: dual-source revenue data (analytics endpoint + dashboard fallback)
- [x] DashboardPage: recent orders table (5 rows)
- [x] DashboardPage: recent users table (5 rows)
- [x] DashboardPage: quick action link buttons
- [x] OrdersPage: search + status + date range filter bar
- [x] OrdersPage: export CSV button
- [x] OrdersPage: checkbox bulk select + bulk actions bar

### Task 5 — Admin SellersPage + UsersPage ✅
- [x] SellersPage: search input (shop name/email), status filter tabs
- [x] SellersPage: bulk select + bulk approve/suspend
- [x] SellersPage: confirm dialog modal before destructive actions
- [x] SellersPage: row actions per status (PENDING/ACTIVE/SUSPENDED)
- [x] SellersPage: suspend mutation (PATCH /admin/sellers/:id/suspend)
- [x] SellersPage: pagination
- [x] UsersPage: search + role filter (all/BUYER/SELLER_OWNER/ADMIN_OPERATOR)
- [x] UsersPage: bulk select + bulk ban/activate
- [x] UsersPage: confirm dialog modal
- [x] UsersPage: color-coded status + role badges
- [x] UsersPage: row actions per status, "Xem Profile" link

### Task 6 — Seller FinancePage + ReportsPage ✅
- [x] FinancePage: balance overview cards (available/pending/total + totalWithdrawn)
- [x] FinancePage: payout request form (amount + bankName/accountNumber/accountName)
- [x] FinancePage: pending withdrawals list
- [x] FinancePage: transaction filter (type + date range) + paginated ledger table
- [x] FinancePage: quick stats (last 30 days revenue/orders/fee/net)
- [x] ReportsPage: KPI cards with growth % indicators vs previous period
- [x] ReportsPage: inline SVG revenue chart (area + line + dots + date labels)
- [x] ReportsPage: top products table with mini progress bars
- [x] ReportsPage: chart/table toggle for daily data
- [x] ReportsPage: 7/30/90 day range buttons + export CSV

## Pending / Future Work
- [ ] Payment gateway integration: cần cấu hình env vars (VNPAY_TMN_CODE, MOMO_PARTNER_CODE, ZALO_APP_ID)
- [ ] Push notifications (Firebase FCM)
- [ ] Redis caching: cần cấu hình REDIS_URL env var
- [ ] Elasticsearch integration for search
- [ ] Mobile app (React Native)
- [ ] Prisma migrate: cần chạy sau khi setup DB với schema mới
- [ ] npm install recharts trong admin-console (đã add vào package.json)

## Session 2026-06-14 Agent 2 (claude/determined-mendel-bkvz7y)

### Task 1 — Seller CampaignsPage ✅
- [x] Filter tabs (active/upcoming/paused/expired/all)
- [x] Create/edit modal (tên, loại, thời gian, mã voucher, discount, điều kiện)
- [x] Toggle activate/deactivate
- [x] Delete with confirm dialog
- [x] API: POST /seller/campaigns/create, PATCH /seller/campaigns/:id/update, PATCH /seller/campaigns/:id/toggle, DELETE /seller/campaigns/:id

### Task 2 — Seller ShopPage ✅
- [x] Upload ảnh đại diện + banner (FileReader preview + POST /upload/image)
- [x] Edit tên/mô tả/phone/địa chỉ/danh mục/chính sách hoàn trả/thời gian phản hồi
- [x] Preview shop button (ExternalLink)
- [x] API: PATCH /seller/shop (PATCH /sellers/profile)

### Task 3 — Seller AffiliatePage ✅
- [x] KPI cards (hoa hồng tháng này/tổng/chờ/đã nhận)
- [x] Biểu đồ 30 ngày (recharts BarChart)
- [x] List affiliate links (click, đơn, hoa hồng, copy link)
- [x] Lịch sử thanh toán tab
- [x] Create link modal
- [x] API: GET /affiliate/stats, /affiliate/links, POST /affiliate/links, /affiliate/earnings

### Task 4 — Seller AdsPage + AdsReportsPage ✅
- [x] KPI cards (chi tiêu/impressions/clicks/CTR)
- [x] List campaigns với toggle bật/tắt, edit budget nhanh (inline)
- [x] Create ad modal (loại, sản phẩm/keyword, CPC/CPM, bid, budget, ngày)
- [x] AdsReportsPage: AreaChart chi tiêu (recharts), bảng top sản phẩm ROAS, bảng daily
- [x] API: PATCH /seller/ads/campaigns/:id/toggle, PATCH /seller/ads/campaigns/:id/budget, GET /seller/ads/reports

### Task 5 — buyer-web CartPage ✅
- [x] Coupon code input → POST /promotions/validate-coupon → hiện discount/lỗi
- [x] Group items by seller (tên shop, subtotal per shop, collapse/expand)
- [x] Save for later (Heart button → wishlist)
- [x] Order summary realtime (discount, shipping free >500K)
- [x] Pass coupon code to checkout via location state

### Task 6 — buyer-web OrdersPage + WishlistPage ✅
- [x] OrdersPage: filter tabs trạng thái, search (mã đơn/sản phẩm), date filter (7/30/90 ngày)
- [x] OrdersPage: order cards với actions (Đã nhận/Theo dõi/Mua lại/Đánh giá/Đổi trả/Hủy)
- [x] OrdersPage: cancel modal với dropdown lý do
- [x] WishlistPage: grid 4 cột, badge "Giảm X%", nút "Thêm vào giỏ", "Thêm tất cả", xóa, empty state
- [x] WishlistPage: rating display

### Task 7 — Seller EditProductPage ✅
- [x] Multi-image upload tối đa 8 ảnh + HTML5 drag reorder
- [x] Rich text description (textarea + markdown preview toggle)
- [x] Variant matrix: thêm attribute → auto-gen tổ hợp → SKU/giá/tồn kho/bulk fill
- [x] Shipping info (cân nặng, kích thước LxWxH, thời gian xử lý)

### Task 8 — buyer-web CheckoutPage ✅
- [x] Address selector modal: danh sách địa chỉ + radio chọn + link thêm mới
- [x] Coupon code input → POST /promotions/validate-coupon → discount hiển thị realtime
- [x] Ghi chú đơn hàng
- [x] Order summary cập nhật động khi apply coupon
- [x] Nhận coupon code từ CartPage qua location.state

### Task 9 — Seller ReturnRequestsPage ✅
- [x] Filter (trạng thái/search mã đơn)
- [x] Return card expandable (buyer info, lý do, ảnh gallery với lightbox, timeline)
- [x] Actions: Duyệt / Từ chối (modal lý do) / Hoàn tiền một phần (modal số tiền)

### Task 10 — buyer-web LoyaltyPage ✅
- [x] Points balance card gradient lớn với tier badge
- [x] Tier progress bar (current → next tier)
- [x] Stats row (tổng tích lũy / đã dùng / khả dụng)
- [x] Form đổi điểm → coupon với preview giá trị
- [x] Lịch sử điểm với filter loại (all/earn/spend)
- [x] API: GET /loyalty/account, /loyalty/transactions, POST /loyalty/redeem

### Task 11 — Seller AIPricePage + AIInventoryForecastPage ✅
- [x] AIPricePage: form (tên, category, giá vốn, giá hiện tại) → POST /ai/price-suggestion → giá đề xuất + khoảng + confidence + reasoning
- [x] AIPricePage: so sánh giá hiện tại vs đề xuất (tăng/giảm %)
- [x] AIInventoryForecastPage: selector sản phẩm → AreaChart dự báo 30 ngày (stock + demand)
- [x] AIInventoryForecastPage: alerts tồn kho thấp (≤7 ngày, ≤14 ngày)
- [x] AIInventoryForecastPage: reorder suggestion


## Session 2026-06-15 Agent 3 (claude/elegant-dijkstra-f8na2g)

### Task 1 — Admin ReturnsPage ✅ (Agent 1 bỏ sót)
- [x] Filter: status dropdown + date range (from/to)
- [x] Table: mã đơn, người mua, lý do, trạng thái badge, số tiền hoàn, ngày tạo
- [x] Expand row: evidence gallery (click-to-zoom lightbox) + timeline xử lý
- [x] Actions: Duyệt (approve), Từ chối (modal + lý do), Hoàn tiền
- [x] Bulk approve (checkbox + confirm)
- [x] Export CSV

### Task 2 — Admin WithdrawalsPage ✅ (Agent 1 bỏ sót)
- [x] KPI cards: Đang chờ duyệt (count + tổng tiền) + Kết quả lọc
- [x] Filter: status tabs + date range + min/max amount
- [x] Table: seller, số tiền, phương thức, tài khoản NH, trạng thái, ngày yêu cầu
- [x] Bulk approve: confirm dialog cảnh báo
- [x] Approve modal: nhập transaction ID + xác nhận
- [x] Reject modal: nhập lý do

### Task 3 — Admin PromotionsPage ✅
- [x] Filter: search (tên/mã), loại giảm giá, trạng thái (active/upcoming/expired/inactive)
- [x] Table đầy đủ: tên, mã, giảm giá, đã dùng/giới hạn, thời gian, trạng thái
- [x] Create/Edit modal: tên, mã, loại, giá trị, đơn min, max discount, giới hạn, scope, ngày
- [x] Bulk activate/deactivate (checkbox selection)
- [x] Toggle individual + delete

### Task 4 — Admin BannersPage ✅
- [x] Preview thumbnail thật trong card
- [x] Create/edit modal: ImageUpload component + URL fallback, tiêu đề, link, target page, vị trí, schedule dates
- [x] ↑↓ priority reorder (gọi PATCH /admin/banners/reorder)
- [x] Toggle active/inactive button on card
- [x] Backend: PATCH /admin/banners/reorder, GET /admin/banners/all

### Task 5 — Admin DisputesPage ✅ (admin view)
- [x] Filter bar: search mã đơn, status dropdown, date range
- [x] List panel: order#, shop, lý do, trạng thái, ngày
- [x] Detail panel: evidence gallery (click-to-zoom lightbox), timeline tin nhắn (buyer/seller/admin colored)
- [x] Actions: Giải quyết modal (buyer/seller/partial + lý do), Leo thang, Yêu cầu bằng chứng
- [x] Backend: PATCH /admin/disputes/:id/resolve, /escalate, /request-evidence
- [x] dispute.service.ts: escalate() + requestEvidence() methods

### Task 6 — Admin ProductsPage (kiểm duyệt) ✅
- [x] Filter: status tabs (chờ duyệt/đang bán/từ chối/ẩn/tất cả) + seller search
- [x] Table: thumbnail, tên (clickable), seller, giá, trạng thái, ngày tạo
- [x] Product detail modal: image gallery (prev/next + thumbnail strip), mô tả, variants table
- [x] Bulk actions: Duyệt/Từ chối/Ẩn + confirm dialog với summary list
- [x] Row actions: Approve, Reject (modal + lý do), Hide
- [x] Backend: PATCH /admin/products/:id/status, PATCH /admin/products/bulk-status, GET /admin/products/:id

### Task 7 — Admin ShippingCarriersPage ✅
- [x] List với logo, tên, COD badge, thời gian giao, tracking URL, trạng thái
- [x] Toggle active/inactive
- [x] Đặt mặc định (Star button)
- [x] Create/edit modal: tên, mã, logo URL, tracking URL template, COD toggle, estimated days, bảng phí (region+weight+fee)
- [x] Backend: GET/POST /admin/shipping-carriers, PATCH /admin/shipping-carriers/:id

### Task 8 — Admin FraudCasesPage ✅
- [x] Status tabs: Mới/Đang điều tra/Đã xác nhận/Đã bỏ qua
- [x] Filter: risk level, date range
- [x] Fraud card: risk score 0-100 color-coded bar, risk factors badges, border-left color indicator
- [x] Detail modal: breakdown chi tiết, breakdown JSON, related cases
- [x] Actions: Bắt đầu điều tra, Nhận định sai, Xác nhận gian lận, Chặn người dùng (confirm)
- [x] Backend: PATCH /admin/fraud/cases/:id/status, /block-user
- [x] fraud.service.ts: blockUserFromCase() - set user status BANNED

### Task 9 — Admin MarketingSegmentsPage + MarketingAutomationPage ✅
- [x] SegmentsPage: CRUD (create/edit modal), toggle active, estimated reach, export user list
- [x] AutomationPage: list flows với trigger/action display, toggle on/off
- [x] AutomationPage: view flow detail modal với vertical timeline
- [x] AutomationPage: create wizard 3 bước (Cơ bản → Đối tượng → Hành động)

### Task 10 — buyer-web ReferralPage + DisputeDetailPage ✅
- [x] ReferralPage: referral code large + copy, link + copy, share Zalo/Facebook
- [x] ReferralPage: stats 4 cards (invited/qualified/pending/earned)
- [x] ReferralPage: history table, how-it-works section
- [x] DisputeDetailPage: vertical timeline icon+timestamp (buyer/seller/admin colored)
- [x] DisputeDetailPage: evidence gallery click-to-fullscreen lightbox
- [x] DisputeDetailPage: submit thêm bằng chứng (upload files → POST /disputes/:id/evidence)
- [x] DisputeDetailPage: estimated resolution time display
- [x] DisputeDetailPage: status config với label + color + icon
