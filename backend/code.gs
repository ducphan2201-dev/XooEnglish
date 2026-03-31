function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var rows = data.slice(1);
  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, idx) {
      obj[header] = row[idx];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: result
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var payload = JSON.parse(e.postData.contents);
  var action = payload.action; 

  // ----- TÍNH NĂNG 1: ĐIỂM DANH -----
  if (action === "start_session") {
    var className = payload.className;
    var absences = payload.absences || []; 
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    
    var colClass = headers.indexOf("Ten_Lop");
    var colName = headers.indexOf("Ten_Hoc_Vien");
    var colCardType = headers.indexOf("Loai_The");
    var colAbsences = headers.indexOf("So_Ngay_Vang");
    var colRemaining = headers.indexOf("The_Con_Lai");
    
    if(colClass === -1 || colName === -1 || colCardType === -1) {
       return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Thiếu định dạng cột chuẩn trên Gsheet!' })).setMimeType(ContentService.MimeType.JSON);
    }

    var updatedRows = 0;
    for (var i = 1; i < data.length; i++) {
      if (data[i][colClass] === className) {
        var studentName = data[i][colName];
        
        // Neu vang mat -> Cong vao SO_NGAY_VANG va KHONG tru The Con Lai ở buổi này
        if (absences.indexOf(studentName) !== -1) {
          var currentAbsence = parseInt(data[i][colAbsences]) || 0;
          sheet.getRange(i + 1, colAbsences + 1).setValue(currentAbsence + 1);
        } else {
          // Neu CO MAT -> Tru vao the con lai
          var remaining = parseInt(data[i][colRemaining] !== "" ? data[i][colRemaining] : data[i][colCardType]);
          var newRemaining = remaining - 1;
          sheet.getRange(i + 1, colRemaining + 1).setValue(newRemaining);
          updatedRows++;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Đã điểm danh cho Lớp ' + className,
      updated_rows: updatedRows
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ----- TÍNH NĂNG 2: THÊM HỌC VIÊN MỚI -----
  if (action === "add_student") {
    var headers = sheet.getDataRange().getValues()[0] || [];
    if(headers.length === 0) {
      // Khởi tạo cột tự động nếu sheet trống hoàn toàn
       headers = ["Ten_Lop", "Ten_Hoc_Vien", "Ngay_Bat_Dau", "Loai_The", "So_Ngay_Vang", "The_Con_Lai"];
       sheet.appendRow(headers);
    }

    var newRowArr = new Array(headers.length);
    for (var i = 0; i < newRowArr.length; i++) {
      newRowArr[i] = ""; // default empty
    }

    var colClass = headers.indexOf("Ten_Lop");
    var colName = headers.indexOf("Ten_Hoc_Vien");
    var colStartDate = headers.indexOf("Ngay_Bat_Dau");
    var colCardType = headers.indexOf("Loai_The");
    var colAbsences = headers.indexOf("So_Ngay_Vang");
    var colRemaining = headers.indexOf("The_Con_Lai");

    // Điền dữ liệu POST vào đúng thứ tự mảng Headers
    if(colClass !== -1) newRowArr[colClass] = payload.className;
    if(colName !== -1) newRowArr[colName] = payload.studentName;
    if(colStartDate !== -1) newRowArr[colStartDate] = payload.startDate;
    if(colCardType !== -1) newRowArr[colCardType] = payload.cardType;
    if(colAbsences !== -1) newRowArr[colAbsences] = 0; // Vắng 0 buổi ban đầu
    if(colRemaining !== -1) newRowArr[colRemaining] = payload.cardType; // Mới mua nên số buổi còn lại = nguyên gốc
    
    // Đẩy xuống dòng trống dưới cùng
    sheet.appendRow(newRowArr);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Đã Thêm học viên '+ payload.studentName +' vào Excel!'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Trick xử lý CORS pre-flight cho Fetch DOM
function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  return ContentService.createTextOutput("").setHeaders(headers);
}
