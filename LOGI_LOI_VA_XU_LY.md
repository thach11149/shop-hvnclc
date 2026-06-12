# NHẬT KÝ LỖI VÀ CÁCH XỬ LÝ

> File này ghi lại tất cả lỗi/vấn đề phát sinh trong quá trình triển khai và cách đã xử lý.
> Mục đích: tránh lặp lại lỗi trong các session sau.

---

## FORMAT GHI LỖI

```
### [LỖI-XXX] Tên lỗi ngắn gọn
- **Ngày phát hiện**: YYYY-MM-DD
- **Module/File bị ảnh hưởng**: ...
- **Mô tả lỗi**: ...
- **Nguyên nhân**: ...
- **Cách xử lý**: ...
- **Phòng ngừa**: ...
```

---

## DANH SÁCH LỖI

*(Chưa có lỗi nào được ghi nhận)*

---

## LƯU Ý QUAN TRỌNG CHO SESSION SAU

### Cấu trúc project
- Backend: `backend/` - Node.js + TypeScript + Express + Prisma + PostgreSQL
- Frontend Buyer: `frontend/buyer-web/` - React + Vite + TailwindCSS (port 3000)
- Frontend Seller: `frontend/seller-center/` - React + Vite + TailwindCSS (port 3002)
- Frontend Admin: `frontend/admin-console/` - React + Vite + TailwindCSS
- Schema Prisma: `backend/prisma/schema.prisma` (57KB, rất đầy đủ)

### Branch làm việc
- Branch triển khai: `claude/brave-wozniak-gcc64x`
- KHÔNG push trực tiếp lên `main`

### Patterns code backend
- Mỗi module có: `*.service.ts` và `*.routes.ts`
- Middleware: `authenticate`, `authorize(role1, role2)`, `validateRequest`
- Response: `sendSuccess(res, data, message, statusCode)`
- Event: `publishEvent(eventName, payload)` từ `shared/events/event-publisher`
- AuthRequest type: `req.user.id`, `req.user.shopId`, `req.user.role`

### Patterns code frontend
- React + TypeScript + TailwindCSS
- State management: Zustand store (`src/store/`)
- API calls: `src/api/` directory
- Lazy loading với `lazy(() => import('./pages/PageName'))`
- Protected routes cần `useAuthStore().isAuthenticated`

### Thứ tự ưu tiên triển khai
1. Giai đoạn 1 còn thiếu (buyer order detail, addresses, wishlist)
2. Giai đoạn 2 còn thiếu (seller variants, import, flash sale; admin campaigns; buyer shops, campaigns)
3. Giai đoạn 3 (warehouse, ads, affiliate, dispute, fraud - backend + frontend)
4. Giai đoạn 4 (AI stubs, data pipeline)
