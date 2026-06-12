# ROUTINE PROMPT — Dán vào khi tạo Claude Routine mới

> Đây là prompt chuẩn để chạy Claude Agent trên repo này.
> Sao chép toàn bộ phần dưới dấu `---` khi tạo routine.

---

Repo: https://github.com/thach11149/shop-hvnclc

## BƯỚC 1 — Đọc trạng thái trước khi làm bất cứ thứ gì

Chạy các lệnh sau và đọc kết quả kỹ trước khi viết 1 dòng code nào:

```bash
git fetch origin
git log --oneline origin/main -15
git branch -r | grep -E "claude/|wip/"
cat HANDOFF.md 2>/dev/null || echo "No handoff file"
cat PROGRESS.md 2>/dev/null || echo "No progress file"
```

## BƯỚC 2 — Đọc plan triển khai

Các file plan trong thư mục `marketplace_plan_6_md_files/`:
- `01_giai_doan_1_launch_baseline_loi_giao_dich_marketplace.md`
- `02_giai_doan_2_nang_cap_seller_promotion_search_doi_tra.md`
- `03_giai_doan_3_logistics_ads_affiliate_fraud_bi.md`
- `04_giai_doan_4_ai_bigdata_ca_nhan_hoa_tu_dong_hoa.md`
- `05_huong_dan_chung_cho_doi_code_tl_po_tester.md`
- `06_checklist_trien_khai_va_nghiem_thu_code.md`

Đọc `PROGRESS.md` để biết đã làm đến đâu. Những gì đã đánh dấu ✅ thì bỏ qua hoàn toàn — không làm lại.

## BƯỚC 3 — Tạo branch đúng cách

- Nếu có branch `claude/xxx` chưa merge trên remote → tạo branch mới TỪ branch đó, không phải từ main
- Nếu không có WIP branch → tạo từ `origin/main` mới nhất

## BƯỚC 4 — Triển khai

- Tự code, tự xử lý lỗi, tự quyết định — không cần chờ phản hồi
- Commit và push sau mỗi module hoàn thành (không đợi xong tất cả)
- Cập nhật `PROGRESS.md` sau mỗi phần hoàn thành
- Ghi lỗi và cách xử lý vào `ERRORS_AND_SOLUTIONS.md`

## BƯỚC 5 — Khi sắp hết token hoặc cần dừng

Bắt buộc làm trước khi dừng:
1. Commit và push tất cả code hiện tại (kể cả dở dang)
2. Cập nhật `HANDOFF.md` — ghi rõ: đã làm gì (kèm commit hash), đang làm dở gì, chưa làm gì, files nào đang mở
3. Cập nhật `PROGRESS.md`
4. Push lên remote

## BƯỚC 6 — Kết thúc session

Tạo Pull Request từ branch hiện tại vào `main` với mô tả rõ những gì đã làm.
Không tự merge — để owner review và bấm merge trên GitHub.

Đọc `CLAUDE.md` trong repo để biết thêm quy tắc chi tiết và format chuẩn.

---

## Ghi chú khi tùy chỉnh prompt

Nếu muốn chỉ định Agent làm 1 giai đoạn cụ thể, thêm dòng này vào cuối BƯỚC 2:

```
Lần này chỉ làm Giai đoạn X ([tên file]). Các giai đoạn khác bỏ qua dù chưa làm.
```

Nếu muốn Agent tiếp tục từ branch cụ thể:

```
Tạo branch mới từ origin/claude/<tên-branch-cụ-thể>, không phải từ main.
```
