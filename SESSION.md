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
- Hoàn tất rà soát và commit các chỉnh sửa mới nhất để tiếp tục dự án XooEnglish.
