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

- **06/05/2026**:
  - Khắc phục lỗi không điểm danh được (ghi nhận học gộp hoặc bỏ qua) đối với những học viên đã hết thẻ (The_Con_Lai <= 0).
  - Bỏ điều kiện chặn `> 0` trong các hàm `startSession` (Bấm chốt điểm danh cả lớp) và `deductIndividual` (Trừ lẻ), cho phép số buổi của học viên bị trừ về số âm (ghi nhận nợ buổi).
  - Khi người dùng thực hiện Gia hạn thẻ (`submitRenewForm`), số buổi mới sẽ tự động cấn trừ với số nợ âm cũ (ví dụ: -2 + 10 = 8 buổi) đúng theo yêu cầu của giáo viên.
  - Sửa lỗi UI "chỉ ghi nhận 1 bạn" trong Lịch sử điểm danh: Thay vì bị ẩn đi do hàm deduplicate bỏ qua các bản ghi trùng ngày, hệ thống nay đã gộp chung (merge) tất cả các bản ghi có cùng ngày lại.
  - Khắc phục lỗi `deductIndividual` tạo ra dòng mới trùng ngày trong `Lich_Su_Diem_Danh`. Nay khi "Trừ lẻ", hệ thống sẽ nối trực tiếp tên học viên (kèm chữ "Bổ sung") vào danh sách "Có mặt" của dòng lịch sử đã có sẵn trong ngày đó thay vì đẩy thêm dòng mới.
  - Sửa lỗi ấn "Gia hạn thẻ" bị thất bại ngầm đối với một số học sinh (không cập nhật thẻ thứ 2): Nguyên nhân do Google Sheets có khoảng trắng thừa ở cuối tên học sinh. Đã bổ sung `.trim()` toàn diện trong tất cả các lệnh đối chiếu tên.
  - Ngăn ngừa lỗi Apps Script sập khi Firebase sinh ra "mảng răng cưa" (jagged array) do hàm Gia hạn chỉ đẩy cột bổ sung cho dòng đầu tiên tìm thấy. Nay tất cả các hàng sẽ được đồng bộ cấu trúc cột.
  - Sửa lỗi nghiêm trọng: Điểm danh hoặc Trừ lẻ thành công (có lưu lịch sử) nhưng Số Buổi Còn Lại không bị trừ. Nguyên nhân: Giáo viên có thể đã gõ thêm chữ vào ô số buổi (ví dụ: "10 buổi" hoặc "-2 buổi"), làm hàm `isNaN` đánh giá sai và bỏ qua việc trừ toán học. Đã sửa sang dùng `parseInt` trực tiếp để có thể bóc tách số từ chuỗi một cách an toàn.
  - Sửa lỗi lệch đồng bộ giữa **Số buổi còn lại** và **Lịch sử điểm danh**: 
    - Đã tạo hàm `extractNumberSafe` để bóc tách số liệu an toàn hơn so với `parseInt` thông thường, đảm bảo việc trừ toán học diễn ra trơn tru kể cả khi dữ liệu chứa chuỗi văn bản phức tạp ("Còn 5 buổi", "Nợ 2").
    - Ngăn chặn triệt để tình trạng "trừ thẻ ẩn": Khi bấm "Trừ lẻ", nếu hệ thống phát hiện học viên đã có tên trong danh sách điểm danh hôm nay, hệ thống sẽ hiện cảnh báo và dừng lệnh. Điều này ngăn việc Số buổi còn lại bị trừ lần 2 nhưng Lịch sử điểm danh không ghi nhận thêm.

## Công việc hiện tại
- Đã hoàn tất sửa lỗi đồng bộ giữa số buổi còn lại và lịch sử điểm danh. Đang chờ xác nhận từ khách hàng.
