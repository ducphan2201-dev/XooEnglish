# Phiên Làm Việc

## Lịch sử
- **08/04/2026**: Khắc phục lỗi hiển thị Lịch sử lớp (Lịch_Sử_Điểm_Danh). Sửa đổi file `js/app.js` để tự động dọn dẹp khoảng trắng, không phân biệt chữ hoa/thường (trim() & toLowerCase()) và dự phòng trường hợp khách hàng vô tình thay đổi tiêu đề trong Google Sheets (đã fix hàm `openHistoryModal`, `deductIndividual`, và `startSession`).

## Lịch sử (Tiếp)
- **10/04/2026**: 
  - Khôi phục `SESSION.md` do bị ghi đè nhầm từ dự án ghép.
  - Cập nhật hàm Firebase dùng chung `getDbRef()` để gọi DB bảo mật và đồng nhất.
  - Bổ sung logic KHÔNG TRỪ thẻ đối với học viên mang loại thẻ "Theo khóa" thay vì báo lỗi hết thẻ.
  - Sửa lỗi tách chuỗi ngày khi chọn ngày nhận dạng ISO có chứa Timezone T.
  - Fix HTML string injection bug bằng DOM dataset `data-class` & `data-student` khi xử lý điểm danh và xem lịch sử.
  - Dọn sạch codebase (xóa Vite, React boilerplate) để hoàn thiện Vanilla JS + Firebase Hybrid.
  - Bổ sung lại header/nút đóng cho Modal HDSD.

## Công việc hiện tại
- Fix 4 bug nghiêm trọng do đồng bộ GSheet ↔ Firebase:
  1. **Lịch sử điểm danh không mở**: GSheet serialize cột Date thành Date object → Firebase nhận ISO string dài → header bị crash `String(null)`. Fix: thêm `normDateStr()` và guard null-safe cho header map.
  2. **Data GSheet vs App không khớp**: GSheet `onEdit()` gửi Date object qua `JSON.stringify()` → Firebase lưu `"2026-04-10T00:00:00.000Z"` nhưng App so sánh `"2026-04-10"`. Fix: thêm `normalizeDataForFirebase()` chuyển tất cả Date → `YYYY-MM-DD` trước khi gửi.
  3. **Chi phí tháng trước bị mất**: Key tháng trên `Lich_Su_Thu_Chi_Thang` bị GSheet serialize thành ISO date string dài, App lookup `"2026-04"` không khớp `"2026-04-01T..."`. Fix: chuẩn hoá key tháng qua `normDateStr()` + cắt 7 ký tự đầu.
  4. **Thêm 1 buổi trên GSheet nhảy 2 buổi**: Mỗi dòng lịch sử được đếm riêng, nếu trùng ngày+lớp (do onEdit fire nhiều lần hoặc paste trùng) thì đếm gấp đôi. Fix: thêm `Set` dedup theo key `date|className`.
