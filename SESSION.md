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

- **17/04/2026**:
  - Đã fix 4 bug nghiêm trọng do đồng bộ GSheet ↔ Firebase:
    1. **Lịch sử điểm danh không mở**: Thêm `normDateStr()` và guard null-safe cho header map trong `app.js`.
    2. **Data GSheet vs App không khớp**: Thêm `normalizeDataForFirebase()` trong `code.gs` chuyển tất cả Date → `YYYY-MM-DD` trước khi gửi.
    3. **Chi phí tháng trước bị mất**: Chuẩn hoá key tháng qua `normDateStr()` + cắt 7 ký tự đầu trên App.
    4. **Thêm 1 buổi trên GSheet nhảy 2 buổi**: Thêm `Set` dedup theo key `date|className` trong `app.js`.
  - Khắc phục lỗi sai logic "Tổng Buổi Bán" & "Buổi Còn Nợ" trên Dashboard Tài Chính: Thay vì dùng công thức ước tính (Tổng doanh thu / Giá trung bình), nay hệ thống sẽ đếm chính xác trực tiếp bằng cách cộng dồn cột "Loai_The" và "The_Con_Lai" của tất cả học viên trong `Main` sheet.
  - **Bổ sung tính năng theo yêu cầu mới:**
    - Thêm trường dữ liệu `So_The_Da_Mua` vào hệ thống (tự động thêm cột vào Sheet nếu chưa có).
    - Khai báo học viên mới sẽ mặc định "Số thẻ đã mua" là 1.
    - Mỗi khi ấn "Gia hạn thẻ", hệ thống sẽ tự động cộng thêm 1 vào "Số thẻ đã mua" của học viên đó.
    - Hiển thị thông tin "(Đã mua: X thẻ)" ngay cạnh tên học viên ở giao diện lớp học để giáo viên dễ theo dõi.
    - Công thức "Tổng Buổi Bán" được cập nhật thành: `Loại thẻ × Số thẻ đã mua` để đảm bảo độ chính xác tuyệt đối.

## Công việc hiện tại
- Đang chờ yêu cầu tiếp theo từ người dùng.
