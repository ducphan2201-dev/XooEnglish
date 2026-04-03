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
// TÍNH NĂNG 2: PHẢN XẠ KHI ADMIN SỬA TAY TRÊN GSHEET (Cập nhật Tức Thời)
// ----------------------------------------------------
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();
  
  var nodeName = "";
  if (sheetName === "Cau_Hinh_Tai_Chinh" || sheetName === "Lich_Su_Diem_Danh" || sheetName === "Lich_Su_Thu_Chi_Thang") {
      nodeName = sheetName;
  } else {
      // Xác định nếu đây là sheet học viên (mặc định luôn ở vị trí số 1)
      var firstSheetName = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].getName();
      if (sheetName === firstSheetName) nodeName = "Main";
  }
  
  if (nodeName === "") return; // Chặn nếu admin sửa ở sheet nháp không liên quan
  
  var row = e.range.getRow();
  
  // Đọc lại mảng toàn bộ dữ liệu của DÒNG đang sửa
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  var options = {
    method: "put", // PUT sẽ thay thế toàn bộ dữ liệu của dòng đó ở Firebase
    contentType: "application/json",
    payload: JSON.stringify(rowData)
  };
  
  // Trong Firebase, Array index bắt đầu từ 0 (Tương tự Row 1 trên GSheet = Node 0)
  var fbIndex = row - 1; 
  var url = FIREBASE_URL + "/" + nodeName + "/" + fbIndex + ".json";
  
  try {
     UrlFetchApp.fetch(url, options);
  } catch(err) {
     Logger.log("Lỗi đồng bộ mảng: " + err);
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
  db["Main"] = sheet.getDataRange().getValues();
  
  var historySheet = ss.getSheetByName("Lich_Su_Diem_Danh");
  if(historySheet) db["Lich_Su_Diem_Danh"] = historySheet.getDataRange().getValues();
  
  var cauHinhSheet = ss.getSheetByName("Cau_Hinh_Tai_Chinh");
  if(cauHinhSheet) db["Cau_Hinh_Tai_Chinh"] = cauHinhSheet.getDataRange().getValues();
  
  var thuChiSheet = ss.getSheetByName("Lich_Su_Thu_Chi_Thang");
  if(thuChiSheet) db["Lich_Su_Thu_Chi_Thang"] = thuChiSheet.getDataRange().getValues();
  
  var options = {
    method: "put",
    contentType: "application/json",
    payload: JSON.stringify(db)
  };
  
  UrlFetchApp.fetch(FIREBASE_URL + "/.json", options);
  ss.toast('Đã ghi đè toàn bộ thông tin Spreadsheet thành Firebase Database!', 'Cập nhật gốc', 5);
}
