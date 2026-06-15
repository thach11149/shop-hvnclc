# HANDOFF — 2026-06-15 (Session: claude/eager-turing-wevzel)

## Branch: claude/eager-turing-wevzel (based on claude/pensive-cerf-w35shf)

---

## Đã hoàn thành trong session này

### Required Tasks (Tasks 1-6) ✅

| Task | Mô tả |
|------|-------|
| Task 1 | buyer CampaignPage (listing /campaigns + countdown + join) + NotificationsPage (type tabs + mark-all-read) |
| Task 2 | buyer PaymentMethodsPage (wallet link/unlink + bank accounts set-default) + ReviewsPage (edit/delete + interactive stars) |
| Task 3 | seller StaffsPage (MANAGER/WAREHOUSE/SUPPORT/CUSTOM role presets + permissions modal) + QnAManagementPage (unanswered badge + product filter) |
| Task 4 | seller FreeshippingPage (edit modal + delete + status badges) + PayoutPage (request payout + add bank + 3 tabs) |
| Task 5 | seller ReviewManagementPage (SVG rating chart + quick reply templates) + InventoryAlertPage (configurable threshold + restock modal) |
| Task 6 | admin EmailTemplatesPage (7 templates + send test modal) + PaymentConfigPage (real API + test connect) + OperationsReportPage (SLA gauges + fulfillment chart) |

### Bonus Tasks (Tasks 7-9) ✅

| Task | Mô tả |
|------|-------|
| Task 7 | seller ShopDecorationPage — 4 tabs (banners/featured/announcement/theme), banner slider, product picker, announcement live preview, theme color picker |
| Task 8 | buyer AIShoppingAssistantPage (chat + ProductCardView + suggestion chips) + TrackingPage (5-step timeline + carrier events) |
| Task 9 | admin AdsManagementPage (3 tabs: campaigns/keywords/revenue) + WarehousesPage (full CRUD: create/edit/delete/toggle + 4 KPI cards + province dropdown) |

---

## Files thay đổi chính (session này)

### Frontend buyer-web
- `src/pages/CampaignPage.tsx` — full rewrite (countdown timer, join mutation, tab filter)
- `src/pages/NotificationsPage.tsx` — full rewrite (type tabs, group by date, mark-all-read)
- `src/pages/PaymentMethodsPage.tsx` — full rewrite (wallets + bank accounts)
- `src/pages/ReviewsPage.tsx` — full rewrite (edit modal, delete confirm, pending tab)
- `src/pages/AIShoppingAssistantPage.tsx` — full rewrite (chat UI, product cards, session)
- `src/pages/TrackingPage.tsx` — full rewrite (5-step timeline, carrier events, address)
- `src/App.tsx` — thêm `/campaigns` route cho CampaignPage listing

### Frontend seller-center
- `src/pages/StaffsPage.tsx` — full rewrite (roles, permissions, invite modal)
- `src/pages/QnAManagementPage.tsx` — full rewrite (unanswered badge, product filter)
- `src/pages/FreeshippingPage.tsx` — full rewrite (RuleModal create/edit, delete confirm)
- `src/pages/PayoutPage.tsx` — full rewrite (3 tabs, payout request, bank accounts)
- `src/pages/ReviewManagementPage.tsx` — full rewrite (SVG chart, quick replies, unreplied tab)
- `src/pages/InventoryAlertPage.tsx` — full rewrite (threshold modal, restock modal, 4 KPI)
- `src/pages/ShopDecorationPage.tsx` — full rewrite (4 tabs, banners, products, announcement, theme)

### Frontend admin-console
- `src/pages/EmailTemplatesPage.tsx` — full rewrite (7 templates, variable chips, test modal)
- `src/pages/PaymentConfigPage.tsx` — full rewrite (real API, toggle, test connect per gateway)
- `src/pages/OperationsReportPage.tsx` — full rewrite (SLA gauges SVG, fulfillment chart, health metrics)
- `src/pages/AdsManagementPage.tsx` — full rewrite (3 tabs, approve/pause/filter actions)
- `src/pages/WarehousesPage.tsx` — full rewrite (create/edit/delete/toggle, 4 KPI, 63 provinces)

---

## Ghi chú kỹ thuật

1. **CampaignPage route conflict**: existing `/campaigns/:slug` = CampaignDetailPage. Added new `/campaigns` exact route for listing page (CampaignPage). Route order matters in React Router.
2. **Inline SVG charts**: All charts in this session use inline SVG — no recharts dependency. Patterns: `ReviewManagementPage` bar chart, `OperationsReportPage` SLA circle gauge.
3. **SLA Gauge formula**: `dash = (pct/100) * circumference` where `circumference = 2π * r`. Gap = circumference - dash.
4. **ThresholdModal**: local state threshold used in query params to dynamically filter inventory alerts.
5. **ShopDecorationPage**: 4 separate API endpoints (banners/products/announcement/theme). Banner preview uses local array state with idx pointer.
6. **AdsManagementPage**: actionMutation handles 4 action types (approve/reject/pause/resume) → `PATCH /admin/ads/:id/action` with `{ action }` body.
7. **WarehousesPage**: 63 Vietnamese provinces as static array. Province selector is a `<select>` dropdown. Edit modal pre-populates from selected warehouse.

---

## Chưa làm / Cần làm tiếp

- [ ] Prisma migrate sau khi có DATABASE_URL
- [ ] npm install recharts trong seller-center (DashboardPage seller dùng recharts LineChart)
- [ ] Cấu hình env: REDIS_URL, SMTP, VNPAY/MOMO/ZALO keys
- [ ] Payment gateway integration (env vars)
- [ ] Push notifications (Firebase FCM)
- [ ] Mobile app (React Native)
- [ ] Elasticsearch full-text search integration
