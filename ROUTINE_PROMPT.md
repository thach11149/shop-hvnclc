# ROUTINE PROMPT — Copy toàn bộ file này khi tạo Claude Routine

> File này được cập nhật mỗi ngày trước khi chạy routine.
> Xem lịch sử kế hoạch tại thư mục `plans/`.

---

Repo: https://github.com/thach11149/shop-hvnclc

## BƯỚC 1 — Đọc trạng thái trước khi làm bất cứ thứ gì

```bash
git fetch origin
git log --oneline origin/claude/pensive-cerf-w35shf -10
git branch -r | grep -E "claude/|wip/"
git show origin/claude/pensive-cerf-w35shf:HANDOFF.md
git show origin/claude/pensive-cerf-w35shf:PROGRESS.md
```

## BƯỚC 2 — Đọc kế hoạch hôm nay

Đọc `plans/TODAY.md` để biết tóm tắt.
Đọc `plans/2026-06-15-p2.md` để biết yêu cầu chức năng cụ thể của từng task.
Đọc `PROGRESS.md` — những gì đã ✅ thì bỏ qua hoàn toàn.

## BƯỚC 3 — Tạo branch

Branch mới nhất là `claude/pensive-cerf-w35shf` (chứa code tất cả agents trước). Tạo từ đó:

```bash
git checkout -b claude/<tên-mới> origin/claude/pensive-cerf-w35shf
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

## NHIỆM VỤ HÔM NAY — 2026-06-15 (bản 2)

> Chi tiết yêu cầu chức năng từng task: xem `plans/2026-06-15-p2.md`

### Nhóm chính (bắt buộc)

- [ ] **Task 1 — buyer CampaignPage + NotificationsPage**: campaign cards countdown/claim, notifications tabs + mark-all-read
- [ ] **Task 2 — buyer PaymentMethodsPage + ReviewsPage**: liên kết ví/set default, buyer reviews + edit/delete
- [ ] **Task 3 — seller StaffsPage + QnAManagementPage**: invite staff + roles, Q&A reply + filter unanswered
- [ ] **Task 4 — seller FreeshippingPage + PayoutPage**: freeship rules CRUD, payout request + history + bank accounts
- [ ] **Task 5 — seller ReviewManagementPage + InventoryAlertPage**: reply reviews + rating chart, alert KPI + threshold
- [ ] **Task 6 — admin EmailTemplatesPage + PaymentConfigPage + OperationsReportPage**: template editor + send test, gateway toggle + keys, SLA metrics + fulfillment chart

### Nhóm dự phòng (nếu còn token)

- [ ] **Task 7 — seller ShopDecorationPage**: banner slider, featured products, announcement bar, theme color
- [ ] **Task 8 — buyer AIShoppingAssistantPage + TrackingPage**: chat UI + product cards, tracking timeline steps
- [ ] **Task 9 — admin AdsManagementPage + WarehousesPage**: ads approve/pause/filter, warehouse CRUD
