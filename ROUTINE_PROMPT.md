# ROUTINE PROMPT — Copy toàn bộ file này khi tạo Claude Routine

> File này được cập nhật mỗi ngày trước khi chạy routine.
> Xem lịch sử kế hoạch tại thư mục `plans/`.

---

Repo: https://github.com/thach11149/shop-hvnclc

## BƯỚC 1 — Đọc trạng thái trước khi làm bất cứ thứ gì

```bash
git fetch origin
git log --oneline origin/claude/elegant-dijkstra-f8na2g -10
git branch -r | grep -E "claude/|wip/"
git show origin/claude/elegant-dijkstra-f8na2g:HANDOFF.md
git show origin/claude/elegant-dijkstra-f8na2g:PROGRESS.md
```

## BƯỚC 2 — Đọc kế hoạch hôm nay

Đọc `plans/TODAY.md` để biết tóm tắt.
Đọc `plans/2026-06-15.md` để biết yêu cầu chức năng cụ thể của từng task.
Đọc `PROGRESS.md` — những gì đã ✅ thì bỏ qua hoàn toàn.

## BƯỚC 3 — Tạo branch

Branch mới nhất là `claude/elegant-dijkstra-f8na2g` (Agent 3, chứa code cả 3 agent hôm qua). Tạo từ đó:

```bash
git checkout -b claude/<tên-mới> origin/claude/elegant-dijkstra-f8na2g
```

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

- [ ] **Task 1 — buyer-web ShopPage**: header (banner/avatar/follow), 3 tabs (Sản phẩm/Đánh giá/Thông tin), product grid + filter trong shop
- [ ] **Task 2 — seller ProductsPage + OrderDetailPage**: filter/bulk/duplicate, order timeline + tracking + actions
- [ ] **Task 3 — seller WarehousePage + WarehouseInboundPage**: KPI tồn kho, color-coded stock, inbound form + history
- [ ] **Task 4 — seller FlashSalePage + DisputesPage**: flash sale create (products+flash price+qty), dispute response + counter-evidence
- [ ] **Task 5 — admin SellerDetailPage**: 4 tabs, KPI+chart, verify/suspend/tier actions
- [ ] **Task 6 — admin FlashSaleAdminPage + CampaignsPage**: flash sale create+manage, campaigns CRUD + toggle

### Nhóm dự phòng (nếu còn token)

- [ ] **Task 7 — buyer-web OrderDetailPage**: tracking timeline, per-item review, re-order, dispute banner
- [ ] **Task 8 — seller NewProductPage**: multi-image + variants + shipping (tương tự EditProductPage)
- [ ] **Task 9 — admin BIDashboardPage + AffiliateManagementPage**: revenue charts, conversion funnel, affiliate payout
