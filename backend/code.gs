function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var rawHeaders = data[0] || [];
  
  var headers = rawHeaders.map(function(h) { return String(h).trim(); });
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

  // Helper function to robustly compare dates regardless of Native Date or String formats
  function normalizeDateStr(d) {
      if (!d) return "";
      if (d instanceof Date) {
          return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      var str = String(d).trim();
      // Handle dd/MM/yyyy or d/M/yyyy
      if (str.indexOf("/") !== -1) {
          var p = str.split("/");
          var day = ("0" + p[0]).slice(-2);
          var month = ("0" + p[1]).slice(-2);
          var year = p[2];
          return year + "-" + month + "-" + day;
      }
      return str; 
  }

  // ----- TÍNH NĂNG 1: ĐIỂM DANH -----
  if (action === "start_session") {
    var className = payload.className;
    var absences = payload.absences || []; 
    var attendanceDate = normalizeDateStr(payload.date || new Date());
    
    // BƯỚC 0: Kiếm Tra Cổng Kiểm Soát (Khóa chốt 1 lần/ngày)
    var testSS = SpreadsheetApp.getActiveSpreadsheet();
    var checkHistorySheet = testSS.getSheetByName("Lich_Su_Diem_Danh");
    if (checkHistorySheet) {
       var hData = checkHistorySheet.getDataRange().getValues();
       for (var j = 1; j < hData.length; j++) {
           if (normalizeDateStr(hData[j][0]) === attendanceDate && String(hData[j][1]).trim() === String(className).trim()) {
               return ContentService.createTextOutput(JSON.stringify({
                   status: 'error',
                   message: 'Vui lòng kiểm tra lại: Lớp ' + className + ' ĐÃ ĐƯỢC CHỐT ĐIỂM DANH trong ngày hôm nay. Nếu có học viên đến muộn, hãy ra ngoài nhấn nút "➖ Trừ Lẻ" tại tên học viên đó để máy chủ tự động khắc phục xóa án Vắng!'
               })).setMimeType(ContentService.MimeType.JSON);
           }
       }
    }
    
    var data = sheet.getDataRange().getValues();
    var rawHeaders = data[0] || [];
    var headers = rawHeaders.map(function(h) { return String(h).trim(); });
    
    var colClass = headers.indexOf("Ten_Lop");
    var colName = headers.indexOf("Ten_Hoc_Vien");
    var colCardType = headers.indexOf("Loai_The");
    var colAbsences = headers.indexOf("So_Ngay_Vang");
    var colRemaining = headers.indexOf("The_Con_Lai");
    
    if(colClass === -1 || colName === -1 || colCardType === -1) {
       return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Thiếu định dạng cột chuẩn trên Gsheet!' })).setMimeType(ContentService.MimeType.JSON);
    }

    var updatedRows = 0;
    var presentList = [];
    var absentList = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][colClass] === className) {
        var studentName = data[i][colName];
        
        // Neu vang mat 
        if (absences.indexOf(studentName) !== -1) {
          absentList.push(studentName);
          var currentAbsence = parseInt(data[i][colAbsences]) || 0;
          sheet.getRange(i + 1, colAbsences + 1).setValue(currentAbsence + 1);
        } else {
          presentList.push(studentName);
          // Neu CO MAT -> Tru vao the con lai
          var oldRemainingVal = data[i][colRemaining] !== "" ? data[i][colRemaining] : data[i][colCardType];
          
          if (!isNaN(oldRemainingVal) && oldRemainingVal.toString().trim() !== "") {
            var remaining = parseInt(oldRemainingVal);
            if (remaining > 0) {
                var newRemaining = remaining - 1;
                sheet.getRange(i + 1, colRemaining + 1).setValue(newRemaining);
            }
          }
          updatedRows++;
        }
      }
    }

    // --- Ghi vào Lịch sử Điểm danh ---
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var historySheet = ss.getSheetByName("Lich_Su_Diem_Danh");
    if (!historySheet) {
        historySheet = ss.insertSheet("Lich_Su_Diem_Danh");
        historySheet.appendRow(["Ngay_Diem_Danh", "Ten_Lop", "Hoc_Vien_Co_Mat", "Hoc_Vien_Vang"]);
    }
    var presentStr = presentList.length > 0 ? presentList.join(", ") : "Không có ai";
    var absentStr = absentList.length > 0 ? absentList.join(", ") : "Không có ai";
    historySheet.appendRow([attendanceDate, className, presentStr, absentStr]);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Đã báo cáo xong sổ điểm danh ngày ' + attendanceDate,
      updated_rows: updatedRows
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ----- TÍNH NĂNG 1B: TRỪ THẺ LẺ / KHẮC PHỤC ĐI MUỘN -----
  if (action === "deduct_individual") {
    var className = payload.className;
    var studentName = payload.studentName;
    var attendanceDate = normalizeDateStr(payload.date || new Date());

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var historySheet = ss.getSheetByName("Lich_Su_Diem_Danh");
    var hasLateArrivalFix = false;
    
    // BƯỚC 1: XÁC ĐỊNH XEM CÓ LÀ ĐI MUỘN KHÔNG? (Có lịch sử Vắng)
    if (historySheet) {
       var hData = historySheet.getDataRange().getValues();
       for (var j = 1; j < hData.length; j++) {
           if (normalizeDateStr(hData[j][0]) === attendanceDate && String(hData[j][1]).trim() === String(className).trim()) {
               var presentStr = String(hData[j][2]);
               var absentStr = String(hData[j][3]);
               
               if (absentStr.indexOf(studentName) !== -1) {
                   // TÌM THẤY VẮNG! BẮT ĐẦU XÓA VẮNG VÀ ĐẨY SANG CÚT CÓ MẶT
                   var absentList = absentStr.split(",").map(function(s) { return s.trim(); });
                   absentList = absentList.filter(function(name) { return name !== studentName; });
                   var newAbsentStr = absentList.length > 0 ? absentList.join(", ") : "Không có ai";
                   historySheet.getRange(j + 1, 4).setValue(newAbsentStr);

                   var presentList = presentStr === "Không có ai" ? [] : presentStr.split(",").map(function(s) { return s.trim(); });
                   if (presentList.indexOf(studentName) === -1) {
                       presentList.push(studentName);
                   }
                   var newPresentStr = presentList.join(", ");
                   historySheet.getRange(j + 1, 3).setValue(newPresentStr);
                   
                   hasLateArrivalFix = true;
               }
               break; 
           }
       }
    }

    // BƯỚC 2: TRỪ THẺ VÀ GIẢM TỘI VẮNG NẾU ĐI MUỘN
    var data = sheet.getDataRange().getValues();
    var rawHeaders = data[0] || [];
    var headers = rawHeaders.map(function(h) { return String(h).trim(); });
    
    var colClass = headers.indexOf("Ten_Lop");
    var colName = headers.indexOf("Ten_Hoc_Vien");
    var colCardType = headers.indexOf("Loai_The");
    var colRemaining = headers.indexOf("The_Con_Lai");
    var colAbsences = headers.indexOf("So_Ngay_Vang");

    var foundAndDeducted = false;
    for (var i = 1; i < data.length; i++) {
        if (data[i][colClass] === className && data[i][colName] === studentName) {
            
            var oldRemainingVal = data[i][colRemaining] !== "" ? data[i][colRemaining] : data[i][colCardType];
            if (!isNaN(oldRemainingVal) && oldRemainingVal.toString().trim() !== "") {
                var remaining = parseInt(oldRemainingVal);
                if(remaining > 0) {
                    sheet.getRange(i + 1, colRemaining + 1).setValue(remaining - 1);
                    foundAndDeducted = true;
                }
            }

            // Nếu là đi muộn, Gạch tội vắng
            if (hasLateArrivalFix) {
                var currentAbsence = parseInt(data[i][colAbsences]) || 0;
                if (currentAbsence > 0) {
                     sheet.getRange(i + 1, colAbsences + 1).setValue(currentAbsence - 1);
                }
            }
            break;
        }
    }

    if (foundAndDeducted) {
        if (!hasLateArrivalFix && historySheet) {
            // Không phải đi muộn => Là học gộp ca! Ghi lịch sử!
            historySheet.appendRow([attendanceDate, className, studentName + " (Học Gộp)", "Không có ai"]);
        }
        var msg = hasLateArrivalFix ? 'Khắc phục Đi Muộn thành công: (Đã trừ 1 Thẻ, Xoá án vắng) cho học viên ' + studentName : 'Đã Trừ Lẻ 1 thẻ (Học gộp ca) cho học viên ' + studentName;
        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            message: msg
        })).setMimeType(ContentService.MimeType.JSON);
    } else {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Không tìm thấy thẻ hợp lệ để trừ cho ' + studentName
        })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // ----- TÍNH NĂNG 1C: XEM LỊCH SỬ ĐIỂM DANH -----
  if (action === "get_history") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var historySheet = ss.getSheetByName("Lich_Su_Diem_Danh");
    if (!historySheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
    }
    var data = historySheet.getDataRange().getValues();
    if(data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var reqClass = payload.className;
    var headers = data[0].map(function(h) { return String(h).trim(); });
    var colDate = headers.indexOf("Ngay_Diem_Danh");
    var colClass = headers.indexOf("Ten_Lop");
    var colPres = headers.indexOf("Hoc_Vien_Co_Mat");
    var colAbs = headers.indexOf("Hoc_Vien_Vang");
    
    var historyList = [];
    // Read backwards to get newest at the top
    for(var i = data.length - 1; i >= 1; i--) {
       if (data[i][colClass] === reqClass) {
          var dObj = data[i][colDate];
          var dStr = dObj;
          if (dObj instanceof Date) {
             dStr = dObj.toLocaleDateString('vi-VN');
          } else if(typeof dStr === 'string' && dStr.indexOf('T') !== -1) {
             dStr = dStr.split('T')[0];
             var p = dStr.split('-');
             if(p.length===3) dStr = p[2] + '/' + p[1] + '/' + p[0];
          }
          historyList.push({
             date: dStr,
             present: data[i][colPres],
             absent: data[i][colAbs]
          });
       }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: historyList
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ----- TÍNH NĂNG 2: THÊM HỌC VIÊN MỚI -----
  if (action === "add_student") {
    var rawHeaders = sheet.getDataRange().getValues()[0] || [];
    
    // Khởi tạo cột tự động nếu sheet trống hoàn toàn (A1 rỗng khi sheet trắng)
    if(rawHeaders.length === 0 || (rawHeaders.length === 1 && String(rawHeaders[0]).trim() === "")) {
       rawHeaders = ["Ten_Lop", "Ten_Hoc_Vien", "Ngay_Bat_Dau", "Loai_The", "So_Ngay_Vang", "The_Con_Lai"];
       sheet.clear();
       sheet.appendRow(rawHeaders);
    }
    
    var headers = rawHeaders.map(function(h) { return String(h).trim(); });

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

    // Kiểm tra nếu tiêu đề cột trên Google Sheet bị sai (do người dùng tự gõ)
    if(colClass === -1 || colName === -1 || colCardType === -1) {
       return ContentService.createTextOutput(JSON.stringify({
         status: 'error',
         message: 'Lỗi: Dòng 1 của Sheet KHÔNG CÓ đủ các cột chuẩn (Ten_Lop, Ten_Hoc_Vien, Loai_The). Vui lòng gõ chính xác không dấu, không khoảng trắng dư!'
       })).setMimeType(ContentService.MimeType.JSON);
    }

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

  // ----- TÍNH NĂNG 3: GIA HẠN THẺ HỌC PHÍ -----
  if (action === "renew_card") {
    var className = payload.className;
    var studentName = payload.studentName;
    var addAmount = payload.addAmount;
    var newCardType = payload.newCardType;

    var data = sheet.getDataRange().getValues();
    var headers = (data[0] || []).map(function(h) { return String(h).trim(); });
    
    var colClass = headers.indexOf("Ten_Lop");
    var colName = headers.indexOf("Ten_Hoc_Vien");
    var colCardType = headers.indexOf("Loai_The");
    var colRemaining = headers.indexOf("The_Con_Lai");
    
    if(colClass === -1 || colName === -1 || colRemaining === -1) {
       return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Thiếu định dạng cột Gsheet!' })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var renewed = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][colClass] === className && data[i][colName] === studentName) {
        var oldRemaining = data[i][colRemaining] !== "" ? data[i][colRemaining] : data[i][colCardType];
        
        if (addAmount === "Theo khóa" || newCardType === "Theo khóa") {
           sheet.getRange(i + 1, colRemaining + 1).setValue("Theo khóa");
           if(colCardType !== -1) sheet.getRange(i + 1, colCardType + 1).setValue("Theo khóa");
        } else {
           var currentLeft = (!isNaN(oldRemaining) && oldRemaining.toString().trim() !== "") ? parseInt(oldRemaining) : 0;
           var toAdd = parseInt(addAmount) || 0;
           sheet.getRange(i + 1, colRemaining + 1).setValue(currentLeft + toAdd);
           if(colCardType !== -1) sheet.getRange(i + 1, colCardType + 1).setValue(newCardType);
        }
        renewed = true;
        break; // Stop after first match
      }
    }
    
    if(renewed) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Nạp/Gia Hạn thành công thẻ mới cho ' + studentName })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Lỗi: Không khớp tên hoặc lớp.' })).setMimeType(ContentService.MimeType.JSON);
    }
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
