# ROUTINE PROMPT — Copy toàn bộ file này khi tạo Claude Routine

> File này được cập nhật mỗi ngày trước khi chạy routine.
> Xem lịch sử kế hoạch tại thư mục `plans/`.

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

Đọc `plans/TODAY.md` để biết tóm tắt.
Đọc `plans/2026-06-15.md` để biết yêu cầu chức năng cụ thể của từng task.
Đọc `PROGRESS.md` — những gì đã ✅ thì bỏ qua hoàn toàn.

## BƯỚC 3 — Tạo branch

- Có branch `claude/xxx` chưa merge → tạo từ branch đó
- Không có WIP → tạo từ `origin/main` mới nhất

## BƯỚC 4 — Triển khai

- **Không hỏi lại, không chờ phản hồi** cho tới khi hết token
- Làm đúng yêu cầu chức năng ghi trong plan — không viết placeholder
- Nếu gặp blocker không giải quyết được: ghi vào `ERRORS_AND_SOLUTIONS.md`, bỏ qua task đó, làm task tiếp theo
- Commit sau mỗi task xong, cập nhật `PROGRESS.md`
- Xong **nhóm chính** → tự động làm tiếp **nhóm dự phòng**

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

## NHIỆM VỤ HÔM NAY — 2026-06-15

> Chi tiết yêu cầu chức năng từng task: xem `plans/2026-06-15.md`

### Nhóm chính (bắt buộc)

- [ ] **Task 1 — HomePage buyer-web**: banner carousel auto-play, flash sale countdown, danh mục nổi bật, AI recommendations, sản phẩm bán chạy
- [ ] **Task 2 — ProductsPage + CategoryPage**: filter sidebar (giá/rating/category/freeship), grid/list toggle, sort, URL sync, breadcrumb, subcategories
- [ ] **Task 3 — AccountPage buyer-web**: 4 tabs — hồ sơ (avatar upload + edit form), bảo mật (đổi mật khẩu), địa chỉ CRUD, đơn hàng gần đây
- [ ] **Task 4 — Admin DashboardPage + OrdersPage**: KPI cards thật, AreaChart 30 ngày, recent orders/users, OrdersPage filter/search/export
- [ ] **Task 5 — Admin SellersPage + UsersPage**: filter nâng cao, bulk approve/suspend/ban, confirm dialogs, row actions
- [ ] **Task 6 — Seller FinancePage + ReportsPage**: balance overview, transaction history, payout request, revenue chart, top products

### Nhóm dự phòng (nếu còn token)

- [ ] **Task 7 — Admin ReturnsPage + WithdrawalsPage**: detail modal, approve/reject/refund actions, bulk approve
- [ ] **Task 8 — Seller EditProductPage**: multi-image upload + drag reorder, variant matrix, shipping info
- [ ] **Task 9 — buyer-web ShopPage + CheckoutPage**: shop tabs (products/reviews/info), follow button, coupon code, address selector
