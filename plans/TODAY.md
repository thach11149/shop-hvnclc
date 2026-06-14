# Kế hoạch hôm nay

> File này luôn trỏ tới kế hoạch ngày hiện tại.
> Xem chi tiết đầy đủ tại file ngày tương ứng trong thư mục `plans/`.

**Ngày:** 2026-06-14
**Chi tiết:** xem [plans/2026-06-14.md](2026-06-14.md)

---

## Tóm tắt nhiệm vụ

**NHÓM 1 — Backend (~4,500 dòng):**
Prisma schema (ProductQnA, AuditLog) → Q&A module → Audit Log module → Payment gateway (VNPay/MoMo/ZaloPay) → Email templates → Redis cache → Export CSV → WebSocket/Socket.io

**NHÓM 2 — Buyer-web (~2,500 dòng):**
NotificationsPage, PaymentMethodsPage, TrackingPage, ProductQnASection, ReviewsPage, CheckoutPage nâng cấp, PaymentResultPage, ReturnRequestPage nâng cấp, LiveChatWidget

**NHÓM 3 — Seller-center (~2,800 dòng):**
ReviewManagementPage, QnAManagementPage, PayoutPage, InventoryAlertPage, OrderFulfillmentPage, ShopAnalyticsPage, NotificationsPage, LiveStreamPage

**NHÓM 4 — Admin-console (~2,500 dòng):**
SystemConfigPage, EmailTemplatesPage, PaymentConfigPage, AuditLogPage, AnnouncementsPage, CategoryManagementPage nâng cấp, BulkActionsPage

**NHÓM 5 — Shared (~900 dòng):**
DataTable, ImageUpload, RatingStars, WebSocket hook, Error boundary
