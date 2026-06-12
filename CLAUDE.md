# CLAUDE.md — Hướng dẫn cho Claude Agent làm việc trên repo này

## Quy tắc bắt buộc khi bắt đầu session mới

### 1. Đọc trạng thái trước khi làm
```bash
git fetch origin
git log --oneline origin/main -10          # commits gần nhất trên main
git branch -r | grep claude/              # branch WIP nào đang tồn tại?
cat HANDOFF.md 2>/dev/null || echo "No handoff"
cat PROGRESS.md 2>/dev/null || echo "No progress"
```

### 2. Tạo branch đúng cách
- **Nếu có branch `claude/xxx` chưa merge** → tạo branch mới TỪ branch đó, không phải từ main
- **Nếu không có WIP** → tạo từ main mới nhất

### 3. Push sớm, push thường xuyên
Commit và push sau mỗi module hoàn chỉnh (không đợi xong tất cả):
```bash
git add <files>
git commit -m "feat: hoàn thành [ModuleName]"
git push origin <branch>
```

### 4. Khi sắp hết token hoặc dừng giữa chừng
Bắt buộc làm trước khi dừng:
```bash
# 1. Commit WIP
git add -A
git commit -m "wip: [tên agent] dừng tại [module đang làm]"
git push origin <branch>

# 2. Cập nhật HANDOFF.md
```

Nội dung `HANDOFF.md` phải có:
- Đã hoàn thành gì (kèm commit hash)
- Đang làm dở gì (file nào, đến đâu)
- Chưa làm gì (để agent tiếp theo biết)
- Các file "hot" đang sửa dở (app.ts, App.tsx...)

## Files hay bị conflict — chỉ 1 agent sửa tại một thời điểm
- `backend/src/app.ts` — import và route registration
- `frontend/admin-console/src/App.tsx`
- `frontend/seller-center/src/App.tsx`
- `frontend/buyer-web/src/App.tsx`
- `PROGRESS.md`, `TIEN_DO_TRIEN_KHAI.md`, `HANDOFF.md`

## Thứ tự merge khi có nhiều branch
1. Branch làm **trước** merge vào main trước
2. Branch làm **sau** rebase lên main mới, resolve conflict, rồi mới merge
3. Khi resolve conflict: giữ branch trước làm base, chỉ bổ sung những gì unique của branch sau

## Lý do quy tắc này tồn tại
Đã xảy ra: Agent 1 đạt token limit chưa push → Agent 2 không biết → implement lại 76 files theo cách khác → phải rebase thủ công mất nhiều thời gian.
