# ROUTINE PROMPT — Copy toàn bộ file này khi tạo Claude Routine

> File này được cập nhật mỗi ngày trước khi chạy routine.
> Xem lịch sử kế hoạch theo ngày tại thư mục `plans/`.

---

Repo: https://github.com/thach11149/shop-hvnclc

## BƯỚC 1 — Đọc trạng thái trước khi làm bất cứ thứ gì

```bash
git fetch origin
git log --oneline origin/main -15
git branch -r | grep -E "claude/|wip/"
cat HANDOFF.md 2>/dev/null || echo "No handoff file"
cat PROGRESS.md 2>/dev/null || echo "No progress file"
```

## BƯỚC 2 — Đọc kế hoạch hôm nay

Đọc file `plans/TODAY.md` để biết nhiệm vụ cụ thể của session này.
Đọc `PROGRESS.md` để biết đã làm đến đâu — những gì đã ✅ thì bỏ qua hoàn toàn.

## BƯỚC 3 — Tạo branch đúng cách

- Nếu có branch `claude/xxx` chưa merge trên remote → tạo branch mới TỪ branch đó
- Nếu không có WIP branch → tạo từ `origin/main` mới nhất

## BƯỚC 4 — Triển khai

- Tự code, tự xử lý lỗi, tự quyết định — **không hỏi lại cho tới khi hết token**
- Nếu gặp vấn đề không giải quyết được: ghi vào `ERRORS_AND_SOLUTIONS.md` và làm tiếp item tiếp theo
- Commit và push sau mỗi module hoàn thành
- Cập nhật `PROGRESS.md` sau mỗi item xong

## BƯỚC 5 — Khi sắp hết token hoặc cần dừng

Bắt buộc theo thứ tự:
1. `git add -A && git commit -m "wip: dừng tại [X]" && git push origin <branch>`
2. Cập nhật `HANDOFF.md` — đã làm gì (commit hash), đang dở gì, chưa làm gì
3. Cập nhật `PROGRESS.md`
4. `git add HANDOFF.md PROGRESS.md && git commit -m "docs: cập nhật handoff" && git push`

## BƯỚC 6 — Kết thúc session

```bash
gh pr create --base main --head <branch> --title "feat: [mô tả]" --body "..."
```
Không tự merge. Đọc `CLAUDE.md` để biết thêm quy tắc.

---

## NHIỆM VỤ HÔM NAY — 2026-06-14

> Xem chi tiết đầy đủ tại `plans/2026-06-14.md`

**Phạm vi:** Backend + Frontend toàn bộ (1 agent, không conflict)
**Mục tiêu:** ~15,000 dòng code — hoàn thiện tính năng còn thiếu

### Thứ tự ưu tiên:

**NHÓM 1 — Backend** (làm trước để frontend có API)
- [ ] Prisma schema: thêm model `ProductQnA`, `AuditLog` → chạy `prisma migrate`
- [ ] Module Product Q&A: `q-and-a.service.ts`, `q-and-a.routes.ts`, wire `app.ts`
- [ ] Module Audit Log: `audit-log.service.ts`, `audit-log.routes.ts`, middleware tự động log
- [ ] Payment gateway: `vnpay.service.ts`, `momo.service.ts`, `zalopay.service.ts` + webhook handlers
- [ ] Email templates: order-confirmed, order-shipped, dispute-update, welcome (nodemailer)
- [ ] Redis caching: `cache.service.ts` + apply vào product detail / search / recommendations
- [ ] Export CSV/Excel: orders, products, finance (admin + seller)
- [ ] WebSocket: Socket.io setup, real-time chat + notifications, seller online/offline

**NHÓM 2 — Frontend Buyer-web**
- [ ] NotificationsPage `/account/notifications`
- [ ] PaymentMethodsPage `/account/payment`
- [ ] TrackingPage `/orders/:id/tracking`
- [ ] ProductQnASection (component nhúng vào ProductDetailPage)
- [ ] ReviewsPage `/account/reviews`
- [ ] CheckoutPage nâng cấp — tích hợp chọn payment gateway
- [ ] PaymentResultPage — làm thật (đang là skeleton)
- [ ] ReturnRequestPage nâng cấp — upload ảnh, theo dõi tiến trình
- [ ] LiveChatWidget — float chat với seller qua Socket.io

**NHÓM 3 — Frontend Seller-center**
- [ ] ReviewManagementPage `/reviews`
- [ ] QnAManagementPage `/qna`
- [ ] PayoutPage `/finance/payouts`
- [ ] InventoryAlertPage `/warehouse/alerts`
- [ ] OrderFulfillmentPage `/orders/fulfillment` — in phiếu, cập nhật tracking hàng loạt
- [ ] ShopAnalyticsPage nâng cấp — chart doanh thu, funnel
- [ ] NotificationsPage `/notifications`
- [ ] LiveStreamPage `/live` — UI quản lý buổi live

**NHÓM 4 — Frontend Admin-console**
- [ ] SystemConfigPage `/system/config`
- [ ] EmailTemplatesPage `/system/emails`
- [ ] PaymentConfigPage `/system/payment`
- [ ] AuditLogPage `/audit-logs`
- [ ] AnnouncementsPage `/announcements`
- [ ] CategoryManagementPage nâng cấp — drag-drop, ảnh
- [ ] BulkActionsPage `/products/bulk`

**NHÓM 5 — Shared**
- [ ] DataTable component (sort/filter/pagination)
- [ ] ImageUpload component (drag-drop + preview)
- [ ] RatingStars interactive component
- [ ] WebSocket hook cho real-time
- [ ] Error boundary + Skeleton loading
