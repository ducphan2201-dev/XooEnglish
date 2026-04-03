/**
 * CẤU HÌNH HỆ THỐNG XOO ENGLISH (Phiên Bản Tốc Độ Cao Firebase)
 * Vùng dành riêng cho Developer / Người quản trị
 */

const CONFIG = {
    // Mật khẩu để mở khóa các tính năng Quản Trị Viên (như Báo cáo tài chính)
    ADMIN_PASS: "23071996",

    // URL Kết nối tới cơ sở dữ liệu Firebase Realtime
    FIREBASE_URL: "https://xooenglishapp-default-rtdb.firebaseio.com"
};

// Khởi tạo thư viện Firebase SDK
if (typeof firebase !== 'undefined') {
    firebase.initializeApp({
        databaseURL: CONFIG.FIREBASE_URL
    });
    // Biến db dùng để gọi các tính năng đọc/ghi toàn cục
    window.db = firebase.database();
}
