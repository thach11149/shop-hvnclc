# HƯỚNG DẪN CHUNG CHO ĐỘI CODE, TECHNICAL LEAD, PRODUCT OWNER VÀ TESTER

# PHẦN I. BẢN HƯỚNG DẪN CHUNG CHO ĐỘI CODE

---

## 27. Thông tin người code cần biết trước khi bắt đầu

Trước khi code, đội lập trình phải thống nhất các điểm sau:

```text
1. Đây là marketplace đa nhà bán, không phải website bán hàng một chủ.
2. Mỗi đơn hàng có thể liên quan đến nhiều shop.
3. Nếu giỏ hàng có sản phẩm từ nhiều shop, nên tách thành nhiều sub-order theo shop.
4. Giá, voucher, địa chỉ, thông tin sản phẩm phải lưu snapshot tại thời điểm mua.
5. Tồn kho phải quản lý theo SKU, không quản lý theo product tổng.
6. Dòng tiền seller phải ghi ledger, không lưu một con số tổng đơn giản.
7. Mọi thao tác quan trọng phải có audit log.
8. Mọi sự kiện nghiệp vụ quan trọng phải có event log.
9. API phải version ngay từ đầu.
10. Giao diện buyer, seller, admin nên tách app.
11. Promotion phải thiết kế bằng rule engine, không hard-code từng loại mã.
12. Order status phải là state machine.
13. Không cho cập nhật trạng thái đơn tùy tiện.
14. Database phải dùng migration.
15. Giai đoạn 1 phải để lại dữ liệu cho AI/Big Data giai đoạn 4.
```

---

## 28. Quy tắc code để đảm bảo kế thừa

### 28.1. Không sửa trực tiếp logic cũ nếu có thể mở rộng

Ví dụ:

```text
Sai:
- Sửa thẳng PromotionService cũ để nhét flash sale, combo, freeship.

Đúng:
- Tạo PromotionEngine V2.
- PromotionEngine V2 gọi lại voucher rule cũ như một rule type.
```

### 28.2. Không xóa field hoặc đổi ý nghĩa field đang dùng

Ví dụ:

```text
Sai:
- Đổi order.status = completed thành order.status = delivered.

Đúng:
- Giữ completed.
- Thêm delivered vào state machine.
- Có migration và mapping rõ.
```

### 28.3. Dữ liệu phát sinh phải có source

Ví dụ:

```text
source:
- buyer_web
- seller_center
- admin_console
- mobile_app
- system_job
- import_file
- external_api
- ai_service
```

### 28.4. Dữ liệu tính toán quan trọng phải có snapshot

Áp dụng cho:

```text
- Order item price.
- Product name tại thời điểm mua.
- SKU name tại thời điểm mua.
- Voucher rule tại thời điểm dùng.
- Shipping address.
- Shipping fee.
- Platform fee.
- Seller commission.
```

### 28.5. Service nghiệp vụ phải tách rõ

Không gom toàn bộ logic vào controller.

Ví dụ cấu trúc đúng:

```text
OrderController
  -> OrderApplicationService
      -> OrderDomainService
      -> InventoryService
      -> PaymentService
      -> PromotionService
      -> FinanceService
      -> EventPublisher
```

---

## 29. Chuẩn Definition of Done cho mỗi tính năng

Một tính năng chỉ được xem là xong khi có đủ:

```text
[ ] UI hoàn thành.
[ ] API hoàn thành.
[ ] Database migration hoàn thành.
[ ] Validation hoàn thành.
[ ] Permission/RBAC hoàn thành.
[ ] Audit log nếu có thao tác thay đổi dữ liệu quan trọng.
[ ] Event log nếu là nghiệp vụ quan trọng.
[ ] Unit test.
[ ] Integration test nếu liên quan nhiều module.
[ ] Error handling.
[ ] Loading/empty/error state trên UI.
[ ] Tài liệu API.
[ ] Tài liệu cấu hình nếu có.
[ ] Không làm hỏng test cũ.
```

---

## 30. Chuẩn viết tài liệu bàn giao cho từng module

Mỗi module cần có file tài liệu riêng:

```text
/docs/modules/auth.md
/docs/modules/catalog.md
/docs/modules/inventory.md
/docs/modules/order.md
/docs/modules/payment.md
/docs/modules/promotion.md
/docs/modules/shipping.md
/docs/modules/finance.md
/docs/modules/seller.md
/docs/modules/admin.md
/docs/modules/analytics.md
/docs/modules/ai.md
```

Mỗi file module cần có:

```text
1. Mục tiêu module.
2. Phạm vi module.
3. Các bảng dữ liệu.
4. Các API.
5. Các event phát sinh.
6. Các permission liên quan.
7. Business rules.
8. State machine nếu có.
9. Test cases.
10. Những điểm cần lưu ý cho giai đoạn sau.
```

---

## 31. Bảng ưu tiên kỹ thuật theo từng giai đoạn

| Giai đoạn | Ưu tiên kỹ thuật số 1 | Không được bỏ qua |
|---|---|---|
| GĐ1 | Lõi giao dịch ổn định | Inventory reservation, order state, ledger, event log |
| GĐ2 | Rule engine và tracking | Promotion V2, return/refund, behavior events |
| GĐ3 | Scale và kiểm soát rủi ro | Service boundary, fraud/risk, BI, ads event |
| GĐ4 | Dữ liệu và AI an toàn | Data quality, feature store, model monitoring, privacy |

---

## 32. Bản tóm tắt cho Technical Lead

Nếu cần chỉ đạo đội code, technical lead có thể dùng nguyên tắc sau:

```text
Giai đoạn 1:
Code thật chắc các module lõi. Đừng ham nhiều tính năng. Phải có order, inventory, payment, promotion, finance, audit, event.

Giai đoạn 2:
Mở rộng seller và marketing. Promotion phải thành rule engine. Bắt đầu tracking hành vi để chuẩn bị dữ liệu.

Giai đoạn 3:
Tách module nặng, xây ads, logistics, fulfillment, affiliate, fraud, BI. Dữ liệu phải đi qua event và warehouse.

Giai đoạn 4:
Không làm AI nếu dữ liệu chưa sạch. AI chỉ được quyết định ở mức gợi ý, các quyết định ảnh hưởng tài chính/tài khoản phải có người xác nhận.
```

---

## 33. Bản tóm tắt cho Product Owner

Product owner cần kiểm soát scope theo nguyên tắc:

```text
Giai đoạn 1:
Mục tiêu là launch được, không phải giống Shopee ngay.

Giai đoạn 2:
Mục tiêu là tăng conversion, tăng seller productivity, tăng hiệu quả khuyến mãi.

Giai đoạn 3:
Mục tiêu là tăng quy mô, tăng doanh thu từ quảng cáo/affiliate, giảm rủi ro vận hành.

Giai đoạn 4:
Mục tiêu là cá nhân hóa, tự động hóa, tối ưu bằng dữ liệu.
```

---

## 34. Bản tóm tắt cho Tester/QA

Tester cần tập trung vào các luồng có rủi ro cao:

```text
1. Đặt hàng khi tồn kho ít.
2. Hai người cùng mua một SKU số lượng cuối.
3. Áp voucher hết lượt.
4. Hủy đơn sau khi đã giữ tồn kho.
5. Hủy đơn sau khi đã thanh toán.
6. Seller cố xem đơn của shop khác.
7. Buyer cố xem đơn của buyer khác.
8. Admin phân quyền thấp cố duyệt seller.
9. Seller sửa giá sau khi buyer đã đặt hàng.
10. Hoàn tiền một phần.
11. Đổi trả sau khi đơn completed.
12. Flash sale hết quota.
13. Affiliate order bị hủy.
14. Ads click trùng.
15. AI gợi ý sản phẩm đã hết hàng.
```

---
