/**
 * CẤU HÌNH HỆ THỐNG XOO ENGLISH (Phiên Bản Tốc Độ Cao Firebase)
 * Vùng dành riêng cho Developer / Người quản trị
 */

const CONFIG = {
    // Mật khẩu để mở khóa các tính năng Quản Trị Viên (như Báo cáo tài chính)
    ADMIN_PASS: "23071996",

    // URL Kết nối tới cơ sở dữ liệu Firebase Realtime
    FIREBASE_URL: "https://xooenglishapp-default-rtdb.firebaseio.com",

    // Mã khóa bảo mật (Hầm chứa dữ liệu ẩn)
    DB_VAULT: "Xoo_Secret_Vault_2026",

    // --- CẤU HÌNH BẢO MẬT LỚP 2 (RECAPTCHA V3) ---
    // Mã này bạn sẽ lấy từ Firebase Console -> App Check
    RECAPTCHA_SITE_KEY: "DANG_CHO_NHAP_KEY_RECAPTCHA"
};

// Khởi tạo thư viện Firebase SDK
if (typeof firebase !== 'undefined') {
    firebase.initializeApp({
        databaseURL: CONFIG.FIREBASE_URL
    });

    // Kích hoạt Lớp 2: App Check (Xác minh trình duyệt thực, chặn Bot)
    if (CONFIG.RECAPTCHA_SITE_KEY !== "DANG_CHO_NHAP_KEY_RECAPTCHA") {
        const appCheck = firebase.appCheck();
        appCheck.activate(CONFIG.RECAPTCHA_SITE_KEY, true);
    }
    
    // Biến db dùng để gọi các tính năng đọc/ghi toàn cục
    window.db = firebase.database();
}
