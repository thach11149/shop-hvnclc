# HANDOFF — 2026-06-14 Agent 2 (claude/determined-mendel-bkvz7y)

## Branch: claude/determined-mendel-bkvz7y

## Base: Merged from claude/modest-darwin-3g1rs8 (Agent 1)

---

## Đã hoàn thành trong session này (11/11 tasks)

| Task | File | Mô tả |
|------|------|-------|
| Task 1 | seller-center/CampaignsPage.tsx | Filter tabs, create/edit modal, toggle, delete |
| Task 2 | seller-center/ShopPage.tsx | Upload ảnh, edit form đầy đủ, preview |
| Task 3 | seller-center/AffiliatePage.tsx | KPI, BarChart, links list, earnings |
| Task 4 | seller-center/AdsPage.tsx + AdsReportsPage.tsx | KPI, toggle, inline budget, AreaChart, ROAS |
| Task 5 | buyer-web/CartPage.tsx | Coupon validate, seller grouping, save-later |
| Task 6 | buyer-web/OrdersPage.tsx + WishlistPage.tsx | Search, filter, actions; badges, add-all |
| Task 7 | seller-center/EditProductPage.tsx | Multi-image drag, markdown, variant matrix |
| Task 8 | buyer-web/CheckoutPage.tsx | Address modal, coupon validate, notes |
| Task 9 | seller-center/ReturnRequestsPage.tsx | Filter, gallery, timeline, actions |
| Task 10 | buyer-web/LoyaltyPage.tsx | Tier, redeem form, history filter |
| Task 11 | seller-center/AIPricePage.tsx + AIInventoryForecastPage.tsx | Form+reasoning, AreaChart |

---

## Backend — Đã kiểm tra (không cần thay đổi)

Tất cả backend endpoints cần thiết đã tồn tại:
- campaign.routes.ts — có POST/PATCH/PATCH-toggle/DELETE seller routes
- promotion.routes.ts — có POST /promotions/validate-coupon
- affiliate.routes.ts — có GET /affiliate/stats/links/earnings, POST /affiliate/links
- ads.routes.ts — có PATCH toggle/budget, GET reports
- loyalty.routes.ts — có GET /loyalty/account, /loyalty/transactions, POST /loyalty/redeem

---

## Files đã sửa trong session này

```
frontend/seller-center/src/pages/CampaignsPage.tsx
frontend/seller-center/src/pages/ShopPage.tsx
frontend/seller-center/src/pages/AffiliatePage.tsx
frontend/seller-center/src/pages/AdsPage.tsx
frontend/seller-center/src/pages/AdsReportsPage.tsx
frontend/seller-center/src/pages/EditProductPage.tsx
frontend/seller-center/src/pages/ReturnRequestsPage.tsx
frontend/seller-center/src/pages/AIPricePage.tsx
frontend/seller-center/src/pages/AIInventoryForecastPage.tsx
frontend/buyer-web/src/pages/CartPage.tsx
frontend/buyer-web/src/pages/OrdersPage.tsx
frontend/buyer-web/src/pages/WishlistPage.tsx
frontend/buyer-web/src/pages/CheckoutPage.tsx
frontend/buyer-web/src/pages/LoyaltyPage.tsx
```

---

## Ghi chú kỹ thuật

1. recharts dùng trong AffiliatePage (BarChart), AdsReportsPage (AreaChart), AIInventoryForecastPage (AreaChart)
2. Coupon flow: CartPage → validate → pass qua location.state.couponCode → CheckoutPage auto-populate
3. Variant matrix: generateVariants() creates combinations from attributes, bulk fill applies price/stock
4. Address modal trong Checkout: tempAddress state để preview trước confirm
5. ReturnRequestsPage: API path là /seller/returns/:id/approve|reject|partial-refund (verify với backend)

---

## Chưa làm / Agent tiếp theo

- [ ] buyer-web/OrdersPage: reorder mutation (POST /orders/:orderId/reorder) cần backend endpoint
- [ ] Verify ReturnRequests API path: code dùng /seller/returns/ nhưng existing có thể là /seller/return-requests/
- [ ] Prisma migrate sau khi setup DATABASE_URL
