# Kế hoạch hôm nay

**Ngày:** 2026-06-15
**Chi tiết:** xem [plans/2026-06-15.md](2026-06-15.md)

---

## Tóm tắt

**NHÓM CHÍNH — bắt buộc hoàn thành cả 5:**

1. **Sidebar navigation** — thêm 14 trang mới vào sidebar seller + admin (hiện tại routes có nhưng không navigate được)
2. **ProductDetailPage** — tích hợp Q&A section, rating breakdown chart, recommendations widget
3. **CategoryManagementPage** — tree view, inline edit, drag reorder, upload ảnh (backend endpoint nếu thiếu)
4. **SellerDashboard** — metrics thật từ API, LineChart 30 ngày (recharts), real-time đơn mới qua Socket.io
5. **OrdersPage seller** — filter nâng cao (date range, status, kho), bulk actions (tracking, in phiếu, xác nhận)

**NHÓM DỰ PHÒNG — làm tiếp nếu còn token:**

6. **SearchPage** — filter giá/rating/thương hiệu, autocomplete suggestions, sort
7. **Chat nâng cấp** — typing indicator, read receipts, online status, file upload
8. **Admin Reports** — charts doanh thu platform, top sellers, top categories
