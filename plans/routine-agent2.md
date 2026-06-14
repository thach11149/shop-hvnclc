# ROUTINE PROMPT — Agent 2 (2026-06-14 bản 3)
# Domain: Seller-center nâng cấp + Buyer cart/orders/wishlist

> Copy toàn bộ nội dung bên dưới khi tạo Claude Routine.

---

Repo: https://github.com/thach11149/shop-hvnclc

## BƯỚC 1 — Đọc trạng thái trước khi làm bất cứ thứ gì

```bash
git fetch origin
git log --oneline origin/claude/modest-darwin-3g1rs8 -10
git branch -r | grep -E "claude/|wip/"
git show origin/claude/modest-darwin-3g1rs8:HANDOFF.md
git show origin/claude/modest-darwin-3g1rs8:PROGRESS.md
```

## BƯỚC 2 — Đọc kế hoạch

Đọc `plans/2026-06-14-p3-agent2.md` để biết yêu cầu chức năng từng task.
Những gì đã ✅ trong PROGRESS.md thì bỏ qua hoàn toàn.

## BƯỚC 3 — Tạo branch TỪ BRANCH AGENT 1

Agent 1 đã hoàn thành và branch **chưa merge vào main**. Bắt buộc tạo branch từ đó:

```bash
git checkout -b claude/<tên-mới> origin/claude/modest-darwin-3g1rs8
```

## BƯỚC 4 — Triển khai

- **Không hỏi lại, không chờ phản hồi** cho tới khi hết token
- Làm đúng yêu cầu chức năng — không viết placeholder
- Nếu gặp blocker: ghi vào `ERRORS_AND_SOLUTIONS.md`, bỏ qua, làm task tiếp
- Commit sau mỗi task, cập nhật `PROGRESS.md`
- Xong nhóm chính → tự làm tiếp nhóm dự phòng

## BƯỚC 5 — Khi sắp hết token

```bash
git add -A
git commit -m "wip: dừng tại [task đang làm]"
git push origin <branch>
# Cập nhật HANDOFF.md + PROGRESS.md rồi push thêm 1 commit
```

## BƯỚC 6 — Kết thúc

```bash
gh pr create --base main --head <branch> --title "feat: [mô tả]" --body "..."
```
Không tự merge. Đọc `CLAUDE.md` để biết thêm quy tắc.

---

## ⚠️ PHÂN CÔNG DOMAIN — ĐỌC TRƯỚC KHI CODE

### Chỉ được sửa các files này
- `frontend/seller-center/src/pages/CampaignsPage.tsx`
- `frontend/seller-center/src/pages/ShopPage.tsx`
- `frontend/seller-center/src/pages/AffiliatePage.tsx`
- `frontend/seller-center/src/pages/AdsPage.tsx`
- `frontend/seller-center/src/pages/AdsReportsPage.tsx`
- `frontend/seller-center/src/pages/ReturnRequestsPage.tsx`
- `frontend/seller-center/src/pages/AIPricePage.tsx`
- `frontend/seller-center/src/pages/AIInventoryForecastPage.tsx`
- `frontend/seller-center/src/pages/EditProductPage.tsx` ← Agent 1 bỏ sót, agent này làm
- `frontend/buyer-web/src/pages/CartPage.tsx`
- `frontend/buyer-web/src/pages/OrdersPage.tsx`
- `frontend/buyer-web/src/pages/WishlistPage.tsx`
- `frontend/buyer-web/src/pages/LoyaltyPage.tsx`
- `frontend/buyer-web/src/pages/CheckoutPage.tsx` ← coupon + address selector (Agent 1 bỏ sót)
- `backend/src/modules/campaign/campaign.routes.ts`
- `backend/src/modules/campaign/campaign.service.ts`
- `backend/src/modules/promotion/promotion.routes.ts`
- `backend/src/modules/promotion/promotion.service.ts`
- `backend/src/modules/loyalty/loyalty.routes.ts`
- `backend/src/modules/loyalty/loyalty.service.ts`
- `backend/src/modules/affiliate/affiliate.routes.ts`
- `backend/src/modules/affiliate/affiliate.service.ts`
- `backend/src/modules/ads/ads.routes.ts`
- `backend/src/modules/ads/ads.service.ts`
- `PROGRESS.md` (thêm section mới ở cuối, không sửa dòng cũ)

### TUYỆT ĐỐI không chạm vào
- `backend/src/app.ts`
- `frontend/*/src/App.tsx`
- `frontend/buyer-web/src/pages/HomePage.tsx` ✅ Agent 1 xong
- `frontend/buyer-web/src/pages/ProductsPage.tsx` ✅ Agent 1 xong
- `frontend/buyer-web/src/pages/CategoryPage.tsx` ✅ Agent 1 xong
- `frontend/buyer-web/src/pages/AccountPage.tsx` ✅ Agent 1 xong
- `frontend/buyer-web/src/pages/ShopPage.tsx` (buyer) — không phân công
- `frontend/seller-center/src/pages/FinancePage.tsx` ✅ Agent 1 xong
- `frontend/seller-center/src/pages/ReportsPage.tsx` ✅ Agent 1 xong
- Toàn bộ `frontend/admin-console/src/pages/` — của Agent 3
- `backend/src/modules/catalog/` — của Agent 1
- `backend/src/modules/user/` — của Agent 1
- `backend/src/modules/admin/` — của Agent 1 + Agent 3
- `backend/src/modules/analytics/` — của Agent 1
- `backend/src/modules/dispute/` — của Agent 3
- `backend/src/modules/fraud/` — của Agent 3
- `backend/src/modules/marketing/` — của Agent 3

---

## NHIỆM VỤ — Nhóm chính (bắt buộc)

### Task 1 — Seller CampaignsPage
Filter tabs (active/upcoming/expired), create/edit modal (tên, loại, thời gian, điều kiện, mã voucher, discount), activate/deactivate/delete actions.
Backend thêm vào `campaign.routes.ts`: `POST /seller/campaigns`, `PATCH /seller/campaigns/:id`, `PATCH /seller/campaigns/:id/toggle`

### Task 2 — Seller ShopPage (cài đặt shop)
Upload ảnh đại diện + banner, edit tên/mô tả/phone/địa chỉ/danh mục, chính sách hoàn trả (textarea), giờ phản hồi chat, nút preview shop. `PATCH /sellers/profile`

### Task 3 — Seller AffiliatePage
KPI cards (hoa hồng tháng này/tổng/chờ), biểu đồ 30 ngày (recharts BarChart), list affiliate links theo sản phẩm (click count, đơn, hoa hồng, copy link), lịch sử thanh toán.
Backend thêm vào `affiliate.routes.ts`: `GET /affiliate/stats`, `GET /affiliate/links`, `POST /affiliate/links`, `GET /affiliate/earnings`

### Task 4 — Seller AdsPage + AdsReportsPage
KPI (chi tiêu hôm nay/impressions/clicks/CTR), list campaigns (toggle bật/tắt, edit budget nhanh), create ad modal (chọn sản phẩm, loại CPC/CPM, budget, bid, từ khóa). AdsReportsPage: AreaChart chi tiêu, bảng top sản phẩm ROAS.
Backend thêm vào `ads.routes.ts`: `POST /ads/campaigns`, `PATCH /ads/campaigns/:id/toggle`, `PATCH /ads/campaigns/:id/budget`, `GET /ads/reports`

### Task 5 — buyer-web CartPage
Coupon code input → `POST /promotions/validate-coupon` → hiện discount/lỗi, group items by seller (tên shop, subtotal), Save for later button (move sang wishlist), order summary cập nhật realtime.
Backend thêm vào `promotion.routes.ts`: `POST /promotions/validate-coupon` → `{valid, discount, type, description}`

### Task 6 — buyer-web OrdersPage + WishlistPage
**OrdersPage**: filter tabs theo trạng thái, search (mã đơn/sản phẩm), date filter (7/30/90 ngày), card mỗi đơn với actions phù hợp (Xác nhận nhận/Theo dõi/Mua lại/Đánh giá/Hủy), cancel modal chọn lý do.
**WishlistPage**: grid 4 cột, badge "Giảm X%" nếu giá giảm, nút "Thêm vào giỏ", "Thêm tất cả", xóa từng item, empty state đẹp.
Backend thêm vào `order.routes.ts` nếu chưa có: `POST /orders/:id/cancel`

### Task 7 — Seller EditProductPage (Agent 1 bỏ sót)
Multi-image upload tối đa 8 ảnh với drag reorder (dùng HTML5 drag), rich text description (textarea + markdown preview toggle), variant matrix (thêm attribute → auto-gen tổ hợp → mỗi variant có SKU/giá/tồn kho/bulk fill), shipping info (cân nặng, kích thước, thời gian xử lý).

### Task 8 — buyer-web CheckoutPage bổ sung (Agent 1 bỏ sót)
Address selector modal: danh sách địa chỉ đã lưu với radio chọn, thêm địa chỉ mới. Coupon code input (gọi `POST /promotions/validate-coupon`). Ghi chú đơn. Order summary cập nhật động khi apply coupon.

---

## NHIỆM VỤ — Nhóm dự phòng (nếu còn token)

### Task 9 — Seller ReturnRequestsPage
Filter (trạng thái/date/mã đơn), return card (buyer, lý do, ảnh bằng chứng gallery, timeline), actions: Duyệt/Từ chối (lý do)/Hoàn tiền một phần. `PATCH /seller/returns/:id/approve|reject|partial-refund`

### Task 10 — buyer-web LoyaltyPage
Points balance card lớn, tier badge + progress bar, form quy đổi điểm → coupon, lịch sử điểm với filter loại (earn/spend).
Backend thêm vào `loyalty.routes.ts`: `GET /loyalty/history`, `POST /loyalty/redeem`

### Task 11 — Seller AIPricePage + AIInventoryForecastPage
AIPricePage: form (tên, category, giá vốn) → `GET /ai/price-suggestion` → hiện giá đề xuất + khoảng cạnh tranh + reasoning. AIInventoryForecastPage: chọn sản phẩm → `GET /ai/inventory-forecast` → AreaChart dự báo 30 ngày + alert tồn kho thấp.
