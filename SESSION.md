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
    - Đã nâng cấp hàm `extractNumberSafe` để nhận diện các từ khóa "nợ", "âm" (ví dụ: "Nợ 2 buổi") và tự động ép thành số âm (-2) để tính toán chuẩn xác, thay vì hiểu sai thành số dương (2) làm hỏng kết quả trừ toán học.
    - Sửa logic kiểm tra trùng lặp trong lệnh "Trừ lẻ": Cấu hình hệ thống quét **toàn bộ** các dòng lịch sử của ngày đó thay vì chỉ check dòng đầu tiên, ngăn việc trừ thẻ đúp do cơ sở dữ liệu có chứa nhiều dòng lịch sử trùng ngày.
    - Chuẩn hóa hàm trừ `So_Ngay_Vang`: Chỉ trừ số ngày vắng khi học viên thực sự bị xóa khỏi danh sách vắng, tránh việc trừ sai cho các học viên được điểm danh bổ sung muộn.
  - Sửa lỗi nghiêm trọng ngầm khi **Gia hạn thẻ** hoặc đẩy Firebase (chỉ cập nhật một bạn, bạn thứ 2 bị lỗi trên Google Sheets):
    - Đã tạo hàm tiện ích `makeRectangular()` để bọc toàn bộ dữ liệu trước khi đẩy lên Firebase (`startSession`, `submitRenewForm`, `submitForm`, `deductIndividual`).
    - Việc chuẩn hóa này đảm bảo mảng 2 chiều không bị "răng cưa" (jagged array) do thừa/thiếu phần tử cột ở cuối mỗi dòng. Khắc phục dứt điểm tình trạng sập (crash) khi Google Apps Script `setValues()` đọc dữ liệu từ Firebase về Google Sheets.

## Công việc hiện tại
- Đã khắc phục và báo cáo chi tiết về lỗi mảng răng cưa khi đồng bộ. Đang đợi người dùng xác nhận và trải nghiệm.

## Resume 06/05/2026
- Status: Resumed XooEnglish and fixed a syntax error in `js/app.js` where the outer `try` block inside `deductIndividual` was missing `catch/finally`.
- Validation: `node --check .\js\app.js` passed.
- Decisions: Kept the change minimal; added an outer fallback error handler and cleanup so `_deductBusy` and loader state are reset if an earlier step fails.
- Files touched: `js/app.js`, `SESSION.md`.
- Next step: User should test the "Tru le / Hoc gop" flow in the browser with real Firebase data.

## Attendance audit 06/05/2026
- Status: Audited the attendance/card deduction flows and fixed mismatch risks between `Lich_Su_Diem_Danh` and `The_Con_Lai`.
- Root cause: Some matching paths still compared class/student names exactly, so trailing spaces in Google Sheets could let history update while the matching `Main` row was skipped. `submitRenewForm` also still used the older `isNaN/parseInt` logic, so debt text could be renewed as `0 + card` instead of `debt + card`.
- Decisions: Added shared `normKey()` matching, reused `extractNumberSafe()` for renewals, and made `extractNumberSafe()` tolerate common mojibake debt keywords from previously corrupted data.
- Validation: `node --check .\js\app.js` passed; Node VM simulations passed for `startSession`, `deductIndividual`, and `submitRenewForm`.
- Files touched: `js/app.js`, `SESSION.md`.
- Next step: Test with production Firebase data: close one class attendance, use "Tru Le" for a late student, renew a student currently showing debt, then compare `Main.The_Con_Lai` with `Lich_Su_Diem_Danh`.

## Full app careful fix 06/05/2026
- Status: Extended the audit without broad refactors. Fixed remaining mismatch/XSS risks in attendance history, finance calculation, checkbox matching, renew matching, and finance class-price rendering.
- Root cause: A few completed flows still had older exact-match or raw `parseInt` paths after the main attendance fix. These could make history, remaining sessions, and finance totals disagree when data had whitespace, debt text, mojibake debt text, or special characters in class names.
- Decisions: Kept fixes local to `js/app.js`; reused `normKey()`, `extractNumberSafe()`, `escapeHtml()`, and `escapeAttr()` instead of adding new architecture.
- Validation: `node --check .\js\app.js` passed; helper tests passed; full Node VM simulations passed for `startSession`, `deductIndividual`, `submitRenewForm`, `openHistoryModal`, and `calculateFinanceDashboard`.
- Files touched: `js/app.js`, `SESSION.md`.
- Next step: Run one browser test on real data before deploying: attendance close, late-student deduct, card renewal from debt, history modal, and finance dashboard totals.

## Production cache fix 06/05/2026
- Status: User reported live console still loading old `app.js` with `Missing catch or finally after try`. Verified GitHub Pages serves the fixed `js/app.js` when requested with a cache-busting query.
- Root cause: `index.html` referenced `js/app.js` without a version, so the browser/CDN could keep the old broken script for up to the GitHub Pages cache window.
- Decisions: Added version query strings to `js/config.js` and `js/app.js`, and added an inline favicon to remove the live `favicon.ico 404` console error.
- Validation: `node --check .\js\app.js` passed.
- Files touched: `index.html`, `SESSION.md`.
- Next step: Push and re-check the live page after GitHub Pages publishes the new `index.html`.
