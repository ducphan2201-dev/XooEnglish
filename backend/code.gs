var FIREBASE_URL = "https://xooenglishapp-default-rtdb.firebaseio.com/Xoo_Secret_Vault_2026";

// ----------------------------------------------------
// TÍNH NĂNG 1: TẠO MENU TIỆN ÍCH CHO ADMIN VÀ GẮN TRIGGER
// ----------------------------------------------------
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🔥 XooEnglish Sync')
      .addItem('📥 Tải dữ liệu Firebase đè lên GSheet (Backup)', 'syncFirebaseToGSheet')
      .addItem('📤 Đẩy toàn bộ GSheet lên Firebase (Làm mới)', 'pushInitialDataToFirebase')
      .addToUi();
}

// ----------------------------------------------------
// HÀM CHUẨN HOÁ: Chuyển Date object thành chuỗi YYYY-MM-DD
// Google Sheets serialize cột Date là JS Date object.
// JSON.stringify sẽ biến nó thành chuỗi ISO dài (VD: "2026-04-10T00:00:00.000Z")
// khiến App so sánh ngày bị lệch. Hàm này chuẩn hoá 1 lần trước khi gửi Firebase.
// ----------------------------------------------------
function normalizeDataForFirebase(data) {
  if (!data || data.length === 0) return data;
  var result = [];
  for (var i = 0; i < data.length; i++) {
    if (!data[i]) continue; // bỏ null
    var row = [];
    for (var j = 0; j < data[i].length; j++) {
      var cell = data[i][j];
      if (cell instanceof Date) {
        // Chuyển Date object thành YYYY-MM-DD thuần tuý
        var yyyy = cell.getFullYear();
        var mm = String(cell.getMonth() + 1).padStart(2, '0');
        var dd = String(cell.getDate()).padStart(2, '0');
        row.push(yyyy + '-' + mm + '-' + dd);
      } else {
        row.push(cell);
      }
    }
    result.push(row);
  }
  return result;
}

// ----------------------------------------------------
// TÍNH NĂNG 2: PHẢN XẠ KHI ADMIN SỬA TAY TRÊN GSHEET (Cập nhật Tức Thời Toàn Bộ)
// ----------------------------------------------------
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();
  
  var nodeName = "";
  if (sheetName === "Cau_Hinh_Tai_Chinh" || sheetName === "Lich_Su_Diem_Danh" || sheetName === "Lich_Su_Thu_Chi_Thang") {
      nodeName = sheetName;
  } else {
      var firstSheetName = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].getName();
      if (sheetName === firstSheetName) nodeName = "Main";
  }
  
  if (nodeName === "") return; 
  
  // Đọc toàn bộ bảng thay vì 1 dòng để CHỐNG lệch Index do Xóa/Thêm/Sort
  var rawData = sheet.getDataRange().getValues();
  // Chuẩn hoá Date object → chuỗi YYYY-MM-DD trước khi gửi Firebase
  var data = normalizeDataForFirebase(rawData);
  
  var options = {
    method: "put", 
    contentType: "application/json",
    payload: JSON.stringify(data)
  };
  
  var url = FIREBASE_URL + "/" + nodeName + "/.json";
  
  try {
     UrlFetchApp.fetch(url, options);
  } catch(err) {
     Logger.log("Lỗi đồng bộ toàn mảng: " + err);
  }
}

// ----------------------------------------------------
// TÍNH NĂNG 3: CRONJOB CHẠY NGẦM ĐỒNG BỘ TỪ FIREBASE XUỐNG GSHEET (10 LẦN/NGÀY)
// ----------------------------------------------------
function syncFirebaseToGSheet() {
  var url = FIREBASE_URL + "/.json";
  try {
    var response = UrlFetchApp.fetch(url);
    var db = JSON.parse(response.getContentText());
    if (!db) return;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (db.Main) writeToSheet(ss.getSheets()[0], db.Main);
    
    if (db.Lich_Su_Diem_Danh) {
        var sh = ss.getSheetByName("Lich_Su_Diem_Danh") || ss.insertSheet("Lich_Su_Diem_Danh");
        writeToSheet(sh, db.Lich_Su_Diem_Danh);
    }
    if (db.Cau_Hinh_Tai_Chinh) {
        var sh = ss.getSheetByName("Cau_Hinh_Tai_Chinh") || ss.insertSheet("Cau_Hinh_Tai_Chinh");
        writeToSheet(sh, db.Cau_Hinh_Tai_Chinh);
    }
    if (db.Lich_Su_Thu_Chi_Thang) {
        var sh = ss.getSheetByName("Lich_Su_Thu_Chi_Thang") || ss.insertSheet("Lich_Su_Thu_Chi_Thang");
        writeToSheet(sh, db.Lich_Su_Thu_Chi_Thang);
    }
    
    // Gửi thông báo nhỏ góc màn hình cho vui mắt
    ss.toast('Đã rà soát & đồng bộ thành công dữ liệu từ Firebase!', 'Thành công', 3);
  } catch(e) {
    Logger.log("Lỗi tải sao lưu: " + e);
  }
}

// ---- Hàm phụ trợ đúc mảng dán vào Sheet siêu tốc ----
function writeToSheet(sheet, dataArr) {
  var cleanData = [];
  var maxCols = 0;
  
  // Lọc bỏ null (vì cấu trúc array ở Firebase có thể sinh ra phần tử null nếu xoá mảng)
  for (var i = 0; i < dataArr.length; i++) {
    if (dataArr[i]) {
       cleanData.push(dataArr[i]);
       if (dataArr[i].length > maxCols) maxCols = dataArr[i].length;
    }
  }
  
  if (cleanData.length === 0) {
      sheet.clear();
      return; 
  }
  
  // Chuẩn hoá lấp đầy ô trống để chống lệch cấu trúc khi setValues
  for (var j = 0; j < cleanData.length; j++) {
      while (cleanData[j].length < maxCols) { cleanData[j].push(""); }
  }

  sheet.clear();
  sheet.getRange(1, 1, cleanData.length, maxCols).setValues(cleanData);
}

// ----------------------------------------------------
// TÍNH NĂNG ĐẨY MỒI TỪ SHEET LÊN FIREBASE (DO ADMIN CLICK BẰNG TAY)
// ----------------------------------------------------
function pushInitialDataToFirebase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var db = {};
  
  var sheet = ss.getSheets()[0]; 
  db["Main"] = normalizeDataForFirebase(sheet.getDataRange().getValues());
  
  var historySheet = ss.getSheetByName("Lich_Su_Diem_Danh");
  if(historySheet) db["Lich_Su_Diem_Danh"] = normalizeDataForFirebase(historySheet.getDataRange().getValues());
  
  var cauHinhSheet = ss.getSheetByName("Cau_Hinh_Tai_Chinh");
  if(cauHinhSheet) db["Cau_Hinh_Tai_Chinh"] = normalizeDataForFirebase(cauHinhSheet.getDataRange().getValues());
  
  var thuChiSheet = ss.getSheetByName("Lich_Su_Thu_Chi_Thang");
  if(thuChiSheet) db["Lich_Su_Thu_Chi_Thang"] = normalizeDataForFirebase(thuChiSheet.getDataRange().getValues());
  
  var options = {
    method: "put",
    contentType: "application/json",
    payload: JSON.stringify(db)
  };
  
  UrlFetchApp.fetch(FIREBASE_URL + "/.json", options);
  ss.toast('Đã ghi đè toàn bộ thông tin Spreadsheet thành Firebase Database!', 'Cập nhật gốc', 5);
}
