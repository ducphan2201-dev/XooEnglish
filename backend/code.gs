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
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // Đợi tối đa 15 giây nếu có người dùng khác đang ghi data
    
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

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // ----- TÍNH NĂNG 1: ĐIỂM DANH -----
    if (action === "start_session") {
      var className = payload.className;
      var absences = payload.absences || []; 
      var attendanceDate = normalizeDateStr(payload.date || new Date());
      
      // BƯỚC 0: Kiếm Tra Cổng Kiểm Soát (Khóa chốt 1 lần/ngày)
      var checkHistorySheet = ss.getSheetByName("Lich_Su_Diem_Danh");
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
      
      var range = sheet.getDataRange();
      var data = range.getValues();
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
      var hasChanges = false;

      for (var i = 1; i < data.length; i++) {
        if (data[i][colClass] === className) {
          var studentName = data[i][colName];
          
          // Neu vang mat 
          if (absences.indexOf(studentName) !== -1) {
            absentList.push(studentName);
            var currentAbsence = parseInt(data[i][colAbsences]) || 0;
            data[i][colAbsences] = currentAbsence + 1; // Sử dụng mảng array siêu tốc
            hasChanges = true;
          } else {
            presentList.push(studentName);
            // Neu CO MAT -> Tru vao the con lai
            var oldRemainingVal = data[i][colRemaining] !== "" ? data[i][colRemaining] : data[i][colCardType];
            
            if (!isNaN(oldRemainingVal) && oldRemainingVal.toString().trim() !== "") {
              var remaining = parseInt(oldRemainingVal);
              if (remaining > 0) {
                  var newRemaining = remaining - 1;
                  data[i][colRemaining] = newRemaining; // Ghi vào RAM trực tiếp
                  hasChanges = true;
              }
            }
            updatedRows++;
          }
        }
      }

      // Xả hết toàn bộ mọi thay đổi xuống Database đúng 1 Lần, siêu mượt và không giật lag
      if (hasChanges) {
          range.setValues(data);
      }

      // --- Ghi vào Lịch sử Điểm danh ---
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
        updated_rows: updatedRows,
        updatedData: formatDataForClient(data)
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ----- TÍNH NĂNG 1B: TRỪ THẺ LẺ / KHẮC PHỤC ĐI MUỘN -----
    if (action === "deduct_individual") {
      var className = payload.className;
      var studentName = payload.studentName;
      var attendanceDate = normalizeDateStr(payload.date || new Date());

      var historySheet = ss.getSheetByName("Lich_Su_Diem_Danh");
      var hasLateArrivalFix = false;
      var historyRange = null;
      var historyDataObj = null;
      var historyChanged = false;
      
      // BƯỚC 1: XÁC ĐỊNH XEM CÓ LÀ ĐI MUỘN KHÔNG? (Có lịch sử Vắng)
      if (historySheet) {
         historyRange = historySheet.getDataRange();
         historyDataObj = historyRange.getValues();
         for (var j = 1; j < historyDataObj.length; j++) {
             if (normalizeDateStr(historyDataObj[j][0]) === attendanceDate && String(historyDataObj[j][1]).trim() === String(className).trim()) {
                 var presentStr = String(historyDataObj[j][2]);
                 var absentStr = String(historyDataObj[j][3]);
                 
                 if (absentStr.indexOf(studentName) !== -1) {
                     // TÌM THẤY VẮNG! BẮT ĐẦU XÓA VẮNG VÀ ĐẨY SANG CỘT CÓ MẶT
                     var absentList = absentStr.split(",").map(function(s) { return s.trim(); });
                     absentList = absentList.filter(function(name) { return name !== studentName; });
                     var newAbsentStr = absentList.length > 0 ? absentList.join(", ") : "Không có ai";
                     historyDataObj[j][3] = newAbsentStr; // Cap nhat tren RAM

                     var presentList = presentStr === "Không có ai" ? [] : presentStr.split(",").map(function(s) { return s.trim(); });
                     if (presentList.indexOf(studentName) === -1) {
                         presentList.push(studentName);
                     }
                     var newPresentStr = presentList.join(", ");
                     historyDataObj[j][2] = newPresentStr; // Cap nhat tren RAM
                     
                     historyChanged = true;
                     hasLateArrivalFix = true;
                 }
                 break; 
             }
         }
         
         if(historyChanged) {
             historyRange.setValues(historyDataObj); // Ghi 1 nhát toàn bảng Lịch sử
         }
      }

      // BƯỚC 2: TRỪ THẺ VÀ GIẢM TỘI VẮNG NẾU ĐI MUỘN
      var range = sheet.getDataRange();
      var data = range.getValues();
      var rawHeaders = data[0] || [];
      var headers = rawHeaders.map(function(h) { return String(h).trim(); });
      
      var colClass = headers.indexOf("Ten_Lop");
      var colName = headers.indexOf("Ten_Hoc_Vien");
      var colCardType = headers.indexOf("Loai_The");
      var colRemaining = headers.indexOf("The_Con_Lai");
      var colAbsences = headers.indexOf("So_Ngay_Vang");

      var foundAndDeducted = false;
      var dataChanged = false;

      for (var i = 1; i < data.length; i++) {
          if (data[i][colClass] === className && data[i][colName] === studentName) {
              
              var oldRemainingVal = data[i][colRemaining] !== "" ? data[i][colRemaining] : data[i][colCardType];
              if (!isNaN(oldRemainingVal) && oldRemainingVal.toString().trim() !== "") {
                  var remaining = parseInt(oldRemainingVal);
                  if(remaining > 0) {
                      data[i][colRemaining] = remaining - 1; // Sửa ngay trên mảng
                      foundAndDeducted = true;
                      dataChanged = true;
                  }
              }

              // Nếu là đi muộn, Gạch tội vắng
              if (hasLateArrivalFix) {
                  var currentAbsence = parseInt(data[i][colAbsences]) || 0;
                  if (currentAbsence > 0) {
                       data[i][colAbsences] = currentAbsence - 1;
                       dataChanged = true;
                  }
              }
              break;
          }
      }

      if (dataChanged) {
         range.setValues(data); // Đập nguyên khối vào db
      }

      if (foundAndDeducted) {
          if (!hasLateArrivalFix && historySheet) {
              // Không phải đi muộn => Là học gộp ca! Ghi lịch sử!
              historySheet.appendRow([attendanceDate, className, studentName + " (Học Gộp)", "Không có ai"]);
          }
          var msg = hasLateArrivalFix ? 'Khắc phục Đi Muộn thành công: (Đã trừ 1 Thẻ, Xoá án vắng) cho học viên ' + studentName : 'Đã Trừ Lẻ 1 thẻ (Học gộp ca) cho học viên ' + studentName;
          return ContentService.createTextOutput(JSON.stringify({
              status: 'success',
              message: msg,
              updatedData: formatDataForClient(data)
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
      
      // Khởi tạo cột tự động nếu sheet trống hoàn toàn
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

      if(colClass === -1 || colName === -1 || colCardType === -1) {
         return ContentService.createTextOutput(JSON.stringify({
           status: 'error',
           message: 'Lỗi: Dòng 1 của Sheet KHÔNG CÓ đủ các cột chuẩn.'
         })).setMimeType(ContentService.MimeType.JSON);
      }

      if(colClass !== -1) newRowArr[colClass] = payload.className;
      if(colName !== -1) newRowArr[colName] = payload.studentName;
      if(colStartDate !== -1) newRowArr[colStartDate] = payload.startDate;
      if(colCardType !== -1) newRowArr[colCardType] = payload.cardType;
      if(colAbsences !== -1) newRowArr[colAbsences] = 0;
      if(colRemaining !== -1) newRowArr[colRemaining] = payload.cardType;
      
      // Đẩy xuống dòng trống dưới cùng
      sheet.appendRow(newRowArr);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Đã Thêm học viên '+ payload.studentName +' vào Excel!',
        updatedData: formatDataForClient(sheet.getDataRange().getValues())
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ----- TÍNH NĂNG 3: GIA HẠN THẺ HỌC PHÍ -----
    if (action === "renew_card") {
      var className = payload.className;
      var studentName = payload.studentName;
      var addAmount = payload.addAmount;
      var newCardType = payload.newCardType;

      var range = sheet.getDataRange();
      var data = range.getValues();
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
             data[i][colRemaining] = "Theo khóa"; // Sửa trong RAM
             if(colCardType !== -1) data[i][colCardType] = "Theo khóa";
          } else {
             var currentLeft = (!isNaN(oldRemaining) && oldRemaining.toString().trim() !== "") ? parseInt(oldRemaining) : 0;
             var toAdd = parseInt(addAmount) || 0;
             data[i][colRemaining] = currentLeft + toAdd; // Sửa trong RAM
             if(colCardType !== -1) data[i][colCardType] = newCardType;
          }
          renewed = true;
          break; // Stop after first match
        }
      }
      
      if(renewed) {
        range.setValues(data); // Đập nguyên mảng cập nhật 1 lần
        return ContentService.createTextOutput(JSON.stringify({ 
             status: 'success', 
             message: 'Nạp/Gia Hạn thành công thẻ mới cho ' + studentName, 
             updatedData: formatDataForClient(data) 
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Lỗi: Không khớp tên hoặc lớp.' })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    // ----- TÍNH NĂNG 4: FINANCE DASHBOARD -----
    if (action === "get_finance_dashboard") {
      var cauHinhSheet = ss.getSheetByName("Cau_Hinh_Tai_Chinh");
      if (!cauHinhSheet) {
          cauHinhSheet = ss.insertSheet("Cau_Hinh_Tai_Chinh");
          cauHinhSheet.appendRow(["Ten_Lop", "Gia_Tien_Buoi"]);
      }
      var thuChiSheet = ss.getSheetByName("Lich_Su_Thu_Chi_Thang");
      if (!thuChiSheet) {
          thuChiSheet = ss.insertSheet("Lich_Su_Thu_Chi_Thang");
          thuChiSheet.appendRow(["Thang_Nam", "Tong_Tien_Thu", "Tong_Chi_Phi"]);
      }

      var monthParam = payload.month || ""; // yyyy-MM
      
      var classPrices = {};
      var cauHinhData = cauHinhSheet.getDataRange().getValues();
      for (var i = 1; i < cauHinhData.length; i++) {
         classPrices[String(cauHinhData[i][0]).trim()] = parseFloat(cauHinhData[i][1]) || 0;
      }

      var monthCost = 0;
      var thuChiData = thuChiSheet.getDataRange().getValues();
      for (var i = 1; i < thuChiData.length; i++) {
         var t = String(thuChiData[i][0]).trim();
         var chi = parseFloat(thuChiData[i][2]) || 0;
         if (monthParam && t === monthParam) {
             monthCost = chi;
         }
      }

      // Count sessions
      var historySheet = ss.getSheetByName("Lich_Su_Diem_Danh");
      var historyData = historySheet ? historySheet.getDataRange().getValues() : [];
      
      var sessionsPerClassLifetime = {};
      var sessionsPerClassMonth = {};
      var totalSessionsMonth = 0;
      
      for (var i = 1; i < historyData.length; i++) {
         var dStr = normalizeDateStr(historyData[i][0]); // yyyy-MM-dd
         var cName = String(historyData[i][1]).trim();
         
         if (!sessionsPerClassLifetime[cName]) sessionsPerClassLifetime[cName] = 0;
         sessionsPerClassLifetime[cName]++;
         
         if (monthParam && dStr.indexOf(monthParam) === 0) {
             if (!sessionsPerClassMonth[cName]) sessionsPerClassMonth[cName] = 0;
             sessionsPerClassMonth[cName]++;
             totalSessionsMonth++;
         }
      }

      var costPerSessionGlobally = totalSessionsMonth > 0 ? (monthCost / totalSessionsMonth) : 0;

      // Class list from main Sheet
      var range = sheet.getDataRange();
      var data = range.getValues();
      var headers = (data[0] || []).map(function(h) { return String(h).trim(); });
      var colClass = headers.indexOf("Ten_Lop");
      
      var mainClasses = {};
      var classStudentCount = {};
      if (colClass !== -1) {
          for(var i=1; i<data.length; i++) {
              var c = String(data[i][colClass]).trim();
              if (c) {
                 if (!mainClasses[c]) {
                     mainClasses[c] = true;
                     classStudentCount[c] = 0;
                 }
                 classStudentCount[c]++;
              }
          }
      }
      
      var sessionStats = [];
      var lifetimeRealized = 0;
      var monthGathered = 0;
      var lifetimeGathered = 0;

      Object.keys(classPrices).forEach(function(c) {
          if (!mainClasses[c]) {
              mainClasses[c] = true;
              classStudentCount[c] = 0; // Class in config but no students currently
          }
      });

      Object.keys(mainClasses).forEach(function(c) {
          var pricePerStudent = classPrices[c] || 0;
          var studentCount = classStudentCount[c] || 0;
          var pricePerSessionForClass = pricePerStudent * studentCount;
          
          var taughtMonth = sessionsPerClassMonth[c] || 0;
          var taughtLife = sessionsPerClassLifetime[c] || 0;
          
          monthGathered += (taughtMonth * pricePerSessionForClass);
          lifetimeRealized += (taughtLife * pricePerSessionForClass);
          sessionStats.push({
             "class_name": c,
             "price_per_session": pricePerSessionForClass,
             "revenue_session": pricePerSessionForClass,
             "cost_session": costPerSessionGlobally,
             "profit_session": pricePerSessionForClass - costPerSessionGlobally,
             "sessions_taught_month": taughtMonth,
             "sessions_taught_lifetime": taughtLife,
             "student_count": studentCount,
             "price_per_student": pricePerStudent
          });
      });
      
      lifetimeGathered = lifetimeRealized;

      var lifetimeDeferred = Math.max(0, lifetimeGathered - lifetimeRealized);

      var totalClassPrices = 0;
      var classCountForPrice = 0;
      Object.keys(classPrices).forEach(function(k) {
         if(classPrices[k] > 0) { totalClassPrices += classPrices[k]; classCountForPrice++; }
      });
      var averagePrice = classCountForPrice > 0 ? (totalClassPrices / classCountForPrice) : 0;
      var lifetimeSessionsSold = averagePrice > 0 ? (lifetimeGathered / averagePrice) : 0;
      var lifetimeSessionsTaughtTotal = 0;
      Object.keys(sessionsPerClassLifetime).forEach(function(k) { lifetimeSessionsTaughtTotal += sessionsPerClassLifetime[k]; });
      
      var dashboardData = {
          session: sessionStats,
          month: {
             month_id: monthParam,
             revenue: monthGathered,
             cost: monthCost,
             profit: monthGathered - monthCost,
             total_sessions_month: totalSessionsMonth
          },
          lifetime: {
             gathered: lifetimeGathered,
             realized: lifetimeRealized,
             deferred: lifetimeDeferred,
             sessions_sold: Math.round(lifetimeSessionsSold),
             sessions_taught: lifetimeSessionsTaughtTotal,
             sessions_owed: Math.max(0, Math.round(lifetimeSessionsSold) - lifetimeSessionsTaughtTotal)
          }
      };

      return ContentService.createTextOutput(JSON.stringify({ 
         status: 'success', 
         data: dashboardData 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "update_finance_inputs") {
      var monthParam = payload.month;
      
      if(payload.class_prices) {
         var cauHinhSheet = ss.getSheetByName("Cau_Hinh_Tai_Chinh");
         if (!cauHinhSheet) { cauHinhSheet = ss.insertSheet("Cau_Hinh_Tai_Chinh"); cauHinhSheet.appendRow(["Ten_Lop", "Gia_Tien_Buoi"]); }
         
         var cauHinhData = cauHinhSheet.getDataRange().getValues();
         var existing = {};
         for (var i = 1; i < cauHinhData.length; i++) {
             existing[String(cauHinhData[i][0]).trim()] = i;
         }
         
         Object.keys(payload.class_prices).forEach(function(cName) {
             var price = parseFloat(payload.class_prices[cName]) || 0;
             if (existing[cName]) {
                 cauHinhData[existing[cName]][1] = price;
             } else {
                 cauHinhData.push([cName, price]);
                 existing[cName] = cauHinhData.length - 1;
             }
         });
         cauHinhSheet.getRange(1, 1, cauHinhData.length, 2).setValues(cauHinhData);
      }
      
      if(monthParam && (payload.gathered !== undefined || payload.cost !== undefined)) {
         var thuChiSheet = ss.getSheetByName("Lich_Su_Thu_Chi_Thang");
         if (!thuChiSheet) { thuChiSheet = ss.insertSheet("Lich_Su_Thu_Chi_Thang"); thuChiSheet.appendRow(["Thang_Nam", "Tong_Tien_Thu", "Tong_Chi_Phi"]); }
         
         var thuChiData = thuChiSheet.getDataRange().getValues();
         var foundIdx = -1;
         for (var i = 1; i < thuChiData.length; i++) {
             if(String(thuChiData[i][0]).trim() === monthParam) {
                 foundIdx = i; break;
             }
         }
         
         var newThu = parseFloat(payload.gathered) || 0;
         var newChi = parseFloat(payload.cost) || 0;
         if (foundIdx !== -1) {
             thuChiData[foundIdx][1] = newThu;
             thuChiData[foundIdx][2] = newChi;
         } else {
             thuChiData.push([monthParam, newThu, newChi]);
         }
         thuChiSheet.getRange(1, 1, thuChiData.length, 3).setValues(thuChiData);
      }

      return ContentService.createTextOutput(JSON.stringify({ 
         status: 'success', 
         message: 'Đã lưu cấu hình tài chính thành công!'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
     return ContentService.createTextOutput(JSON.stringify({
       status: 'error',
       message: 'Lỗi xử lý Data: ' + error.toString()
     })).setMimeType(ContentService.MimeType.JSON);
  } finally {
     lock.releaseLock();
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

function formatDataForClient(dataArr) {
    if(!dataArr || dataArr.length <= 1) return [];
    var headers = dataArr[0].map(function(h) { return String(h).trim(); });
    var rows = dataArr.slice(1);
    return rows.map(function(row) {
        var obj = {};
        headers.forEach(function(header, idx) {
            obj[header] = row[idx];
        });
        return obj;
    });
}

