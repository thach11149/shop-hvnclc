# CLAUDE.md — Hướng dẫn cho Claude Agent làm việc trên repo này

> **Đọc file này TRƯỚC KHI làm bất cứ thứ gì.**

---

## BƯỚC 1 — Đọc trạng thái hiện tại

Chạy các lệnh này và đọc kết quả kỹ trước khi viết 1 dòng code:

```bash
git fetch origin
git log --oneline origin/main -15
git branch -r | grep -E "claude/|wip/"
cat HANDOFF.md 2>/dev/null || echo "No handoff"
cat PROGRESS.md 2>/dev/null || echo "No progress"
```

---

## BƯỚC 2 — Đọc plan triển khai

Các file plan trong thư mục `marketplace_plan_6_md_files/`:
- `01_giai_doan_1_launch_baseline_loi_giao_dich_marketplace.md`
- `02_giai_doan_2_nang_cap_seller_promotion_search_doi_tra.md`
- `03_giai_doan_3_logistics_ads_affiliate_fraud_bi.md`
- `04_giai_doan_4_ai_bigdata_ca_nhan_hoa_tu_dong_hoa.md`
- `05_huong_dan_chung_cho_doi_code_tl_po_tester.md`
- `06_checklist_trien_khai_va_nghiem_thu_code.md`

**Quy tắc:** Đọc `PROGRESS.md` trước — những gì đã đánh dấu ✅ thì bỏ qua hoàn toàn, không làm lại.

---

## BƯỚC 3 — Tạo branch đúng cách

```bash
git fetch origin
git branch -r | grep -E "claude/|wip/"
```

- **Nếu có branch chưa merge trên remote** → tạo branch mới TỪ branch đó (không phải từ main)
- **Nếu không có WIP** → tạo từ `origin/main` mới nhất

```bash
# Trường hợp có WIP branch
git checkout -b claude/<tên-mới> origin/claude/<branch-cũ>

# Trường hợp không có WIP
git checkout -b claude/<tên-mới> origin/main
```

---

## BƯỚC 4 — Trong khi triển khai

### Tự xử lý — không cần chờ phản hồi
- Tự code, tự debug, tự quyết định
- Khi gặp lỗi: thử tự fix, nếu không fix được thì ghi vào `ERRORS_AND_SOLUTIONS.md` và tiếp tục

### Push sớm, push thường xuyên
Commit và push **sau mỗi module hoàn chỉnh**, không đợi xong tất cả:

```bash
git add <files>
git commit -m "feat: hoàn thành [TênModule]"
git push origin <branch>
```

### Cập nhật PROGRESS.md liên tục
Đánh dấu ✅ ngay khi một phần hoàn thành. Đây là nguồn thông tin chính xác nhất cho agent tiếp theo.

### Ghi lỗi vào ERRORS_AND_SOLUTIONS.md
Format:
```
## [timestamp] Lỗi: [mô tả ngắn]
**Nguyên nhân:** ...
**Cách xử lý:** ...
**Để không bị lại:** ...
```

---

## BƯỚC 5 — Khi sắp hết token hoặc cần dừng giữa chừng

**Bắt buộc làm theo thứ tự này trước khi dừng:**

```bash
# 1. Commit tất cả code hiện tại (kể cả dở)
git add -A
git commit -m "wip: dừng tại [module đang làm] - xem HANDOFF.md"
git push origin <branch>
```

Sau đó cập nhật `HANDOFF.md`:

```markdown
# HANDOFF — [timestamp]

## Đã hoàn thành (kèm commit hash)
- [Module X] — commit abc1234
- [Module Y] — commit def5678

## Đang làm dở
- [Module Z]: đã có file service tại `path/file.ts`, chưa có routes, chưa wire vào app.ts

## Chưa làm (agent tiếp theo cần làm)
- [Module A], [Module B]...

## Files đang mở / sẽ conflict nếu agent khác chạm vào
- `backend/src/app.ts` — đang thêm import dòng X
- `frontend/admin-console/src/App.tsx` — đang thêm route Y
```

```bash
git add HANDOFF.md PROGRESS.md
git commit -m "docs: cập nhật handoff và progress trước khi dừng"
git push origin <branch>
```

---

## BƯỚC 6 — Kết thúc session hoàn chỉnh

Tạo Pull Request vào `main`:
```bash
gh pr create --base main --head <branch> --title "feat: [mô tả]" --body "..."
```

**Không tự merge** — để owner review và bấm merge trên GitHub.

---

## Files hay bị conflict — chỉ 1 agent sửa tại một thời điểm

| File | Lý do |
|---|---|
| `backend/src/app.ts` | Import + route registration tập trung tại đây |
| `frontend/admin-console/src/App.tsx` | Tất cả routes admin |
| `frontend/seller-center/src/App.tsx` | Tất cả routes seller |
| `frontend/buyer-web/src/App.tsx` | Tất cả routes buyer |
| `PROGRESS.md` | Nhiều agent cùng cập nhật |
| `HANDOFF.md` | File bàn giao |

---

## Thứ tự merge khi có nhiều branch song song

1. Branch làm **trước** → merge vào main trước
2. Branch làm **sau** → rebase lên main mới → resolve conflict → merge
3. Khi resolve conflict: **giữ branch trước làm base**, chỉ bổ sung phần unique của branch sau

---

## Lý do file này tồn tại

**Đã xảy ra thực tế:** Agent 1 đạt token limit chưa push → Agent 2 không biết → implement lại 76 files theo 2 cách khác nhau → phải rebase thủ công mất nhiều thời gian và có nguy cơ mất code.
