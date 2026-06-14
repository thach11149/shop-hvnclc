# ROUTINE PROMPT — Agent 3 (2026-06-14 bản 3)
# Domain: Admin-console nâng cấp + Buyer remaining

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

Đọc `plans/2026-06-14-p3-agent3.md` để biết yêu cầu chức năng từng task.
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
- `frontend/admin-console/src/pages/PromotionsPage.tsx`
- `frontend/admin-console/src/pages/BannersPage.tsx`
- `frontend/admin-console/src/pages/FlashSaleAdminPage.tsx` (hoặc FlashSalePage.tsx nếu không có file kia)
- `frontend/admin-console/src/pages/DisputesPage.tsx`
- `frontend/admin-console/src/pages/DisputesManagementPage.tsx`
- `frontend/admin-console/src/pages/FraudCasesPage.tsx`
- `frontend/admin-console/src/pages/ProductsPage.tsx`
- `frontend/admin-console/src/pages/ShippingCarriersPage.tsx`
- `frontend/admin-console/src/pages/MarketingSegmentsPage.tsx`
- `frontend/admin-console/src/pages/MarketingAutomationPage.tsx`
- `frontend/admin-console/src/pages/ReturnsPage.tsx` ← Agent 1 bỏ sót, agent này làm
- `frontend/admin-console/src/pages/WithdrawalsPage.tsx` ← Agent 1 bỏ sót, agent này làm
- `frontend/buyer-web/src/pages/ReferralPage.tsx`
- `frontend/buyer-web/src/pages/DisputeDetailPage.tsx`
- `backend/src/modules/dispute/dispute.routes.ts`
- `backend/src/modules/dispute/dispute.service.ts`
- `backend/src/modules/fraud/fraud.routes.ts`
- `backend/src/modules/fraud/fraud.service.ts`
- `backend/src/modules/marketing/marketing.routes.ts`
- `backend/src/modules/marketing/marketing.service.ts`
- `backend/src/modules/admin/admin.routes.ts` — CHỈ THÊM VÀO CUỐI FILE, không sửa routes cũ
- `backend/src/modules/admin/admin.service.ts` — CHỈ THÊM method mới, không sửa method cũ
- `PROGRESS.md` (thêm section mới ở cuối, không sửa dòng cũ)

### TUYỆT ĐỐI không chạm vào
- `backend/src/app.ts`
- `frontend/*/src/App.tsx`
- Toàn bộ `frontend/seller-center/src/pages/` — của Agent 2
- Toàn bộ `frontend/buyer-web/src/pages/` NGOẠI TRỪ ReferralPage + DisputeDetailPage
- `frontend/admin-console/src/pages/DashboardPage.tsx` ✅ Agent 1 xong
- `frontend/admin-console/src/pages/OrdersPage.tsx` ✅ Agent 1 xong
- `frontend/admin-console/src/pages/SellersPage.tsx` ✅ Agent 1 xong
- `frontend/admin-console/src/pages/UsersPage.tsx` ✅ Agent 1 xong
- `backend/src/modules/catalog/` — của Agent 1
- `backend/src/modules/user/` — của Agent 1
- `backend/src/modules/analytics/` — của Agent 1
- `backend/src/modules/campaign/` — của Agent 2
- `backend/src/modules/promotion/` — của Agent 2
- `backend/src/modules/loyalty/` — của Agent 2
- `backend/src/modules/affiliate/` — của Agent 2
- `backend/src/modules/ads/` — của Agent 2

---

## NHIỆM VỤ — Nhóm chính (bắt buộc)

### Task 1 — Admin ReturnsPage (Agent 1 bỏ sót)
Filter (trạng thái/date range), table (mã đơn, người mua, seller, lý do, trạng thái, số tiền hoàn, ngày tạo), detail modal (ảnh bằng chứng gallery, timeline xử lý), actions: Duyệt/Từ chối (nhập lý do)/Hoàn tiền, bulk approve, export CSV.

### Task 2 — Admin WithdrawalsPage (Agent 1 bỏ sót)
Filter (trạng thái/date/min-max amount), table (seller, số tiền, phương thức, tài khoản ngân hàng, trạng thái, ngày yêu cầu), KPI card "Tổng đang chờ duyệt", bulk approve với confirm, actions: Duyệt (nhập transaction ID + confirm) / Từ chối (lý do).

### Task 3 — Admin PromotionsPage
Filter (loại/trạng thái/date range), search (tên/mã coupon), table (tên, loại, discount, điều kiện, thời hạn, lượt dùng, trạng thái), create/edit modal (tên, mã, loại giảm giá, đơn tối thiểu, max uses, ngày bắt đầu/kết thúc, scope), bulk activate/deactivate.
Dùng API đã có: `GET /promotions`, `POST /promotions`, `PATCH /promotions/:id`, `DELETE /promotions/:id`

### Task 4 — Admin BannersPage
Preview thumbnail thật, create/edit modal (upload ảnh + ImageUpload component, tiêu đề, link, trang target, vị trí, schedule dates), drag reorder hoặc ↑↓ priority, toggle active/inactive.
Backend thêm vào CUỐI `admin.routes.ts` + `admin.service.ts`:
`GET /admin/banners`, `POST /admin/banners`, `PATCH /admin/banners/:id`, `DELETE /admin/banners/:id`, `PATCH /admin/banners/reorder`

### Task 5 — Admin DisputesPage (admin view)
Filter (trạng thái/loại/date range), search mã đơn, table đầy đủ, detail modal (evidence gallery click-to-zoom, timeline, phản hồi buyer + seller), actions: Resolve nghiêng buyer (full refund) / Resolve nghiêng seller (close) / Hoàn tiền một phần (input amount) / Escalate / Request thêm bằng chứng.
Backend thêm vào CUỐI `dispute.routes.ts` + `dispute.service.ts`:
`GET /admin/disputes?status=&type=&search=&page=`, `PATCH /admin/disputes/:id/resolve`, `PATCH /admin/disputes/:id/escalate`, `PATCH /admin/disputes/:id/request-evidence`

### Task 6 — Admin ProductsPage (kiểm duyệt sản phẩm)
Filter (trạng thái: pending/approved/rejected/hidden, category, seller search), table (thumbnail, tên, seller, giá, trạng thái, ngày tạo), Product Detail modal (xem đầy đủ ảnh + mô tả + variants), bulk Duyệt/Từ chối/Ẩn (với confirm summary "Bạn sắp duyệt X sản phẩm"), row actions (Duyệt/Từ chối với lý do/Ẩn).
Backend thêm vào CUỐI `admin.routes.ts`:
`PATCH /admin/products/:id/status` `{status, reason?}`, `PATCH /admin/products/bulk-status` `{productIds[], status, reason?}`

---

## NHIỆM VỤ — Nhóm dự phòng (nếu còn token)

### Task 7 — Admin ShippingCarriersPage
List (logo, tên, COD support, tracking URL, trạng thái, priority), toggle active nhanh, nút "Đặt mặc định", create/edit modal (tên, logo upload, tracking URL template, COD toggle, estimated delivery, bảng phí theo vùng + cân nặng).
Backend thêm vào CUỐI `admin.routes.ts`: `GET/POST /admin/shipping-carriers`, `PATCH /admin/shipping-carriers/:id`

### Task 8 — Admin FraudCasesPage
Filter (risk level: high/medium/low, trạng thái, date range), fraud case card (risk score color-coded 0-100, danh sách yếu tố rủi ro dạng badge), detail modal (risk factors breakdown, lịch sử đơn của user, related cases), actions: False Positive / Confirmed / Block User.
Backend thêm vào CUỐI `fraud.routes.ts`:
`GET /admin/fraud/cases?riskLevel=&status=&page=`, `PATCH /admin/fraud/cases/:id/status`, `PATCH /admin/fraud/cases/:id/block-user`

### Task 9 — Admin MarketingSegmentsPage + MarketingAutomationPage
**SegmentsPage**: CRUD segments (tên, criteria mô tả, estimated reach), toggle active, export user list.
**AutomationPage**: list flows (trigger/action display, toggle on/off), view flow detail (trigger → conditions → actions timeline), create flow wizard 3 bước.
Backend bổ sung nếu thiếu vào `marketing.routes.ts`: `GET/POST/PATCH/DELETE /marketing/segments`, `GET/PATCH /marketing/automations/:id/toggle`

### Task 10 — buyer-web ReferralPage + DisputeDetailPage
**ReferralPage**: referral code lớn + nút Copy, QR code, chia sẻ (Zalo/Facebook/copy link), stats (đã giới thiệu/đang chờ/đã nhận thưởng), bảng lịch sử (tên ẩn bớt, ngày, trạng thái, thưởng).
**DisputeDetailPage**: timeline vertical với icon + timestamp, evidence gallery (click-to-fullscreen), phản hồi seller, nút Submit thêm bằng chứng (upload ảnh + text → `POST /disputes/:id/evidence`), estimated resolution time.

---

## Lưu ý kỹ thuật khi sửa admin.routes.ts

File `admin.routes.ts` đã được Agent 1 sửa (thêm bulk-seller, bulk-user, seller-status, user-ban). Khi agent này thêm routes mới (banners, product-status, shipping-carriers), **chỉ thêm vào cuối router**, không đụng vào các route đã có. Ví dụ:

```typescript
// === BANNERS (added by agent3) ===
router.get('/banners', async (req, res) => { ... });
router.post('/banners', async (req, res) => { ... });
// ...
```

Nếu có conflict khi merge sau này: giữ tất cả routes (không xóa cái nào), chỉ sắp xếp lại thứ tự.
