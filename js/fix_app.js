const fs = require('fs');
const path = require('path');

const filePath = path.join('g:', 'My Drive', 'CODEAPP', 'XooEnglish', 'js', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Thay thế loadData và thêm prepareGlobalData
const oldLoadDataStart = content.indexOf('async function loadData');
const oldLoadDataEnd = content.indexOf('function renderClasses');
if (oldLoadDataStart !== -1 && oldLoadDataEnd !== -1) {
    const newLoadData = `function prepareGlobalData() {
    if (!window.fbData || !window.fbData.Main) return [];
    const mainData = window.fbData.Main;
    if (mainData.length <= 1) return [];
    
    const headers = mainData[0].map(h => String(h).trim());
    const validRows = [];
    
    for (let i = 1; i < mainData.length; i++) {
        if (!mainData[i]) continue;
        let obj = {};
        headers.forEach((h, idx) => {
             obj[h] = mainData[i][idx] !== undefined ? mainData[i][idx] : "";
        });
        validRows.push(obj);
    }
    return validRows;
}

function loadData(forceLoader = false) {
    if (!forceLoader) showLoader("Đang đồng bộ chớp nhoáng...");

    if (typeof db === 'undefined') {
        alert("Lỗi: Không tìm thấy Firebase. Hãy tải trang lại.");
        return;
    }

    db.ref('/').on('value', snapshot => {
        const val = snapshot.val();
        if (!val) {
            globalData = [];
            renderClasses([], false);
            hideLoader();
            return;
        }

        window.fbData = val;
        globalData = prepareGlobalData();
        renderClasses(globalData, false);

        if (document.getElementById("financeModal").style.display === "flex") {
            const m = document.getElementById("finMonth").value;
            loadFinanceData(m);
        }
        hideLoader();
    }, error => {
        console.error("Firebase Error: ", error);
        alert("Mất kết nối với cơ sở dữ liệu!");
        hideLoader();
    });
}

`;
    content = content.substring(0, oldLoadDataStart) + newLoadData + content.substring(oldLoadDataEnd);
}

// 2. Thay thế startSession
const startSessionStart = content.indexOf('async function startSession');
const startSessionEnd = content.indexOf('// ----------------------------------------------------', startSessionStart);
if (startSessionStart !== -1 && startSessionEnd !== -1) {
    const newStartSession = `async function startSession(className, isDemo) {
    if (isDemo) return alert("Demo Mode!");

    const dateInput = document.getElementById("date_" + className);
    const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const parts = selectedDate.split('-');
    const displayDate = parts.length === 3 ? \`\${parts[2]}/\${parts[1]}/\${parts[0]}\` : selectedDate;

    const checkboxes = document.querySelectorAll(\`input.absent-cb[data-class="\${className}"]:checked\`);
    const absentStudents = Array.from(checkboxes).map(cb => cb.value);

    const confirmMsg = absentStudents.length > 0 
        ? \`Xác nhận ĐIỂM DANH Lớp [\${className}] ngày \${displayDate}?\\n\\nDanh sách BẢO LƯU THẺ (\${absentStudents.length} bạn giữ nguyên):\\n👉 \${absentStudents.join(', ')}\\n\\n(Tất cả bạn CÓ MẶT còn lại TỰ ĐỘNG BỊ TRỪ 1 BUỔI!\`
        : \`Xác nhận ĐIỂM DANH Lớp [\${className}] ngày \${displayDate}?\\n\\nTẤT CẢ HỌC VIÊN ĐỀU CÓ MẶT! 🥳\\n(Hệ thống tự động trừ 1 buổi vào thẻ của Toàn lớp)\`;

    let histArr = window.fbData?.Lich_Su_Diem_Danh || [];
    for (let i = 1; i < histArr.length; i++) {
        if (!histArr[i]) continue;
        if (String(histArr[i][0]).trim() === selectedDate && String(histArr[i][1]).trim() === className) {
             alert(\`Lớp \${className} đã được chốt trong ngày \${displayDate}. Nếu có học viên đến muộn, hãy nhấn nút "➖ Trừ Lẻ".\`);
             return;
        }
    }

    if (!confirm(confirmMsg)) return;
    showLoader("Đang ghi Firebase...");

    let mainArr = window.fbData.Main || [];
    let headers = mainArr[0] ? mainArr[0].map(h => String(h).trim()) : [];
    let colClass = headers.indexOf("Ten_Lop");
    let colName = headers.indexOf("Ten_Hoc_Vien");
    let colCardType = headers.indexOf("Loai_The");
    let colAbsences = headers.indexOf("So_Ngay_Vang");
    let colRemaining = headers.indexOf("The_Con_Lai");

    let presentList = [];
    let absentListFinal = [];

    for (let i = 1; i < mainArr.length; i++) {
        if (!mainArr[i]) continue;
        if (mainArr[i][colClass] === className) {
            let sName = mainArr[i][colName];
            if (absentStudents.includes(sName)) {
                absentListFinal.push(sName);
                mainArr[i][colAbsences] = (parseInt(mainArr[i][colAbsences]) || 0) + 1;
            } else {
                presentList.push(sName);
                let oldR = mainArr[i][colRemaining];
                if (oldR === "" || oldR === undefined) oldR = mainArr[i][colCardType];
                if (!isNaN(oldR) && String(oldR).trim() !== "") {
                    let r = parseInt(oldR);
                    if (r > 0) mainArr[i][colRemaining] = r - 1;
                }
            }
        }
    }

    if (histArr.length === 0) histArr.push(["Ngay_Diem_Danh", "Ten_Lop", "Hoc_Vien_Co_Mat", "Hoc_Vien_Vang"]);
    histArr.push([
        selectedDate, 
        className, 
        presentList.length > 0 ? presentList.join(", ") : "Không có ai", 
        absentListFinal.length > 0 ? absentListFinal.join(", ") : "Không có ai"
    ]);

    try {
        await db.ref().update({
             '/Main': mainArr,
             '/Lich_Su_Diem_Danh': histArr
        });
        alert(\`✅ Đã chốt thành công ngày \${displayDate}\`);
    } catch(err) {
        alert("Lỗi lưu lên Firebase: " + err.message);
    } finally {
        //hideLoader();
    }
}

`;
    content = content.substring(0, startSessionStart) + newStartSession + content.substring(startSessionEnd);
}

// 3. Thay thế submitRenewForm
const renewStart = content.indexOf('async function submitRenewForm');
const renewEnd = content.indexOf('async function submitForm');
if (renewStart !== -1 && renewEnd !== -1) {
    const newRenew = `async function submitRenewForm(e) {
    e.preventDefault();
    const className = document.getElementById("renewClassName").value;
    const studentName = document.getElementById("renewStudentName").innerText;
    const cardVal = document.getElementById("inpRenewCard").value;
    
    const btn = document.getElementById("btnSubmitRenew");
    btn.innerText = "Đang Đồng Bộ...";
    btn.disabled = true;

    let mainArr = window.fbData?.Main || [];
    let headers = mainArr[0] ? mainArr[0].map(h => String(h).trim()) : [];
    let colClass = headers.indexOf("Ten_Lop");
    let colName = headers.indexOf("Ten_Hoc_Vien");
    let colCardType = headers.indexOf("Loai_The");
    let colRemaining = headers.indexOf("The_Con_Lai");

    let renewed = false;
    for (let i = 1; i < mainArr.length; i++) {
        if (!mainArr[i]) continue;
        if (mainArr[i][colClass] === className && mainArr[i][colName] === studentName) {
            let oldR = mainArr[i][colRemaining];
            if (oldR === "" || oldR === undefined) oldR = mainArr[i][colCardType];
            
            if (cardVal === "Theo khóa") {
                mainArr[i][colRemaining] = "Theo khóa";
                mainArr[i][colCardType] = "Theo khóa";
            } else {
                let currentLeft = (!isNaN(oldR) && String(oldR).trim() !== "") ? parseInt(oldR) : 0;
                let toAdd = parseInt(cardVal) || 0;
                mainArr[i][colRemaining] = currentLeft + toAdd;
                mainArr[i][colCardType] = cardVal;
            }
            renewed = true;
            break;
        }
    }

    if (renewed) {
         try {
             await db.ref('/Main').set(mainArr);
             alert("✅ Nạp thành công cho " + studentName);
             closeRenewModal();
         } catch(err) {
             alert("Lỗi: " + err.message);
         }
    }
    btn.innerText = "💳 Nạp Thẻ Gian Hạn";
    btn.disabled = false;
}

`;
    content = content.substring(0, renewStart) + newRenew + content.substring(renewEnd);
}

// 4. Thay thế submitForm
const formStart = content.indexOf('async function submitForm');
const formEnd = content.indexOf('// ==== LOGIC LỊCH SỬ ĐIỂM DANH ====');
if (formStart !== -1 && formEnd !== -1) {
    const newForm = `async function submitForm(e) {
    e.preventDefault();
    const className = document.getElementById("inpClass").value.trim();
    const name = document.getElementById("inpName").value.trim();
    const date = document.getElementById("inpDate").value;
    const card = document.getElementById("inpCard").value;
    
    const btn = document.getElementById("btnSubmitForm");
    btn.innerText = "Đang Ghi...";
    btn.disabled = true;
    
    let mainArr = window.fbData?.Main || [];
    if(mainArr.length === 0) {
        mainArr.push(["Ten_Lop", "Ten_Hoc_Vien", "Ngay_Bat_Dau", "Loai_The", "So_Ngay_Vang", "The_Con_Lai"]);
    }
    
    let headers = mainArr[0].map(h => String(h).trim());
    let newRow = new Array(headers.length).fill("");
    if(headers.indexOf("Ten_Lop") !== -1) newRow[headers.indexOf("Ten_Lop")] = className;
    if(headers.indexOf("Ten_Hoc_Vien") !== -1) newRow[headers.indexOf("Ten_Hoc_Vien")] = name;
    if(headers.indexOf("Ngay_Bat_Dau") !== -1) newRow[headers.indexOf("Ngay_Bat_Dau")] = date;
    if(headers.indexOf("Loai_The") !== -1) newRow[headers.indexOf("Loai_The")] = card;
    if(headers.indexOf("So_Ngay_Vang") !== -1) newRow[headers.indexOf("So_Ngay_Vang")] = 0;
    if(headers.indexOf("The_Con_Lai") !== -1) newRow[headers.indexOf("The_Con_Lai")] = card;

    mainArr.push(newRow);

    try {
        await db.ref('/Main').set(mainArr);
        alert("✅ Khai báo thành công!");
        closeModal();
        document.getElementById("addForm").reset();
    } catch(err) {
        alert("Lỗi Lưu: " + err.message);
    } finally {
        btn.innerText = "Hoàn Tất Khai Báo";
        btn.disabled = false;
    }
}

`;
    content = content.substring(0, formStart) + newForm + content.substring(formEnd);
}

// 5. Thay thế openHistoryModal đến hết applyFastUpdate
const histStart = content.indexOf('async function openHistoryModal');
const histEnd = content.indexOf('// ==== LOGIC QUẢN LÝ TÀI CHÍNH ====');
if (histStart !== -1 && histEnd !== -1) {
    const newHist = `function openHistoryModal(className) {
    document.getElementById("historyClassName").innerText = className;
    const tbody = document.getElementById("historyBody");
    tbody.innerHTML = "";
    document.getElementById("historyLoading").style.display = "none";
    document.getElementById("historyModal").style.display = "flex";

    const histArr = window.fbData?.Lich_Su_Diem_Danh || [];
    if (histArr.length <= 1) {
         tbody.innerHTML = \`<tr><td colspan="3" style="text-align:center; padding: 25px; color: #64748b; font-style:italic;">Lớp này chưa có buổi Lịch sử điểm danh nào!</td></tr>\`;
         return;
    }

    let headers = histArr[0].map(h => String(h).trim());
    let colDate = headers.indexOf("Ngay_Diem_Danh");
    let colClass = headers.indexOf("Ten_Lop");
    let colPres = headers.indexOf("Hoc_Vien_Co_Mat");
    let colAbs = headers.indexOf("Hoc_Vien_Vang");

    let foundAny = false;
    for (let i = histArr.length - 1; i >= 1; i--) {
        if (!histArr[i]) continue;
        if (histArr[i][colClass] === className) {
             foundAny = true;
             const tr = document.createElement("tr");
             tr.style.borderBottom = "1px solid var(--border)";
             
             let dt = histArr[i][colDate] || "";
             let pres = histArr[i][colPres] || "";
             let abs = histArr[i][colAbs] || "";

             if (abs === "Đi học đủ" || abs === "Không có") abs = "Không có ai";
             
             const presentColor = pres === "Không có ai" ? "#64748b" : "#059669";
             const absentColor = abs === "Không có ai" ? "#059669" : "#dc2626";
             const absentWeight = abs === "Không có ai" ? "600" : "700";

             tr.innerHTML = \`
                <td style="padding: 12px 10px; font-weight: 700;">\${dt}</td>
                <td style="padding: 12px 10px; color: \${presentColor}; font-weight: 600;">\${pres}</td>
                <td style="padding: 12px 10px; color: \${absentColor}; font-weight: \${absentWeight}; margin-left:1px;">\${abs}</td>
             \`;
             tbody.appendChild(tr);
        }
    }
    if(!foundAny) tbody.innerHTML = \`<tr><td colspan="3" style="text-align:center; padding: 25px; color: #64748b; font-style:italic;">Chưa có lịch sử khớp.</td></tr>\`;
}

window.deductIndividual = async function(studentName, className) {
    if (!confirm(\`Xử lý [THÊM 1 CA / XOÁ VẮNG] cho \${studentName} ngày hôm nay?\`)) return;

    const dateInp = document.getElementById(\`date_\${className}\`);
    let selectedDate = dateInp ? dateInp.value : new Date().toISOString().split('T')[0];

    let histArr = window.fbData?.Lich_Su_Diem_Danh || [];
    let mainArr = window.fbData?.Main || [];
    
    let hasLateArrivalFix = false;
    let histHeaders = histArr[0] ? histArr[0].map(h => String(h).trim()) : [];
    let hDate = histHeaders.indexOf("Ngay_Diem_Danh");
    let hClass = histHeaders.indexOf("Ten_Lop");
    let hPres = histHeaders.indexOf("Hoc_Vien_Co_Mat");
    let hAbs = histHeaders.indexOf("Hoc_Vien_Vang");

    for (let j = 1; j < histArr.length; j++) {
         if (!histArr[j]) continue;
         if (histArr[j][hDate] === selectedDate && histArr[j][hClass] === className) {
             let presStr = String(histArr[j][hPres]);
             let absStr = String(histArr[j][hAbs]);
             
             if (absStr.includes(studentName)) {
                 let abList = absStr.split(",").map(x => x.trim()).filter(x => x !== studentName);
                 histArr[j][hAbs] = abList.length > 0 ? abList.join(", ") : "Không có ai";
                 
                 let prList = presStr === "Không có ai" ? [] : presStr.split(",").map(x => x.trim());
                 if (!prList.includes(studentName)) prList.push(studentName);
                 histArr[j][hPres] = prList.join(", ");
                 hasLateArrivalFix = true;
             }
             break;
         }
    }

    let headers = mainArr[0] ? mainArr[0].map(h => String(h).trim()) : [];
    let colClass = headers.indexOf("Ten_Lop");
    let colName = headers.indexOf("Ten_Hoc_Vien");
    let colCardType = headers.indexOf("Loai_The");
    let colRemaining = headers.indexOf("The_Con_Lai");
    let colAbsences = headers.indexOf("So_Ngay_Vang");

    let deducted = false;
    for (let i = 1; i < mainArr.length; i++) {
        if (!mainArr[i]) continue;
        if (mainArr[i][colClass] === className && mainArr[i][colName] === studentName) {
             let oldR = mainArr[i][colRemaining];
             if (oldR === "" || oldR === undefined) oldR = mainArr[i][colCardType];
             if (!isNaN(oldR) && String(oldR).trim() !== "") {
                 let rem = parseInt(oldR);
                 if (rem > 0) { mainArr[i][colRemaining] = rem - 1; deducted = true; }
             }
             if (hasLateArrivalFix) {
                 let ab = parseInt(mainArr[i][colAbsences]) || 0;
                 if (ab > 0) mainArr[i][colAbsences] = ab - 1;
             }
             break;
        }
    }

    if (!deducted) return alert("Học viên đã hết thẻ, không thể trừ.");

    if (!hasLateArrivalFix) {
         if (histArr.length === 0) histArr.push(["Ngay_Diem_Danh", "Ten_Lop", "Hoc_Vien_Co_Mat", "Hoc_Vien_Vang"]);
         histArr.push([selectedDate, className, studentName + " (Học Gộp)", "Không có ai"]);
    }

    try {
        await db.ref().update({'/Main': mainArr, '/Lich_Su_Diem_Danh': histArr});
        alert(hasLateArrivalFix ? \`Đã xoá án vắng và trừ thẻ cho \${studentName}.\` : \`Đã trừ thẻ bù ngày cho \${studentName}.\`);
    } catch(err) {
        alert("Lỗi DB: " + err.message);
    }
}

`;
    content = content.substring(0, histStart) + newHist + content.substring(histEnd);
}

// 6. Thay thế loadFinanceData & submitFinanceConfig
const financeLoadStart = content.indexOf('async function loadFinanceData');
const financeLoadEnd = content.indexOf('function formatVND');
if (financeLoadStart !== -1 && financeLoadEnd !== -1) {
    const newFinanceLoad = `function loadFinanceData(monthParam) {
    document.getElementById("financeLoading").style.display = "none";
    document.getElementById("financeDashboardContent").style.display = "block";
    
    if(!window.fbData) return;

    const rawData = {
        config: window.fbData.Cau_Hinh_Tai_Chinh || [["Ten_Lop", "Gia_Tien_Buoi"]],
        cost: window.fbData.Lich_Su_Thu_Chi_Thang || [["Thang_Nam", "Tong_Tien_Thu", "Tong_Chi_Phi"]],
        history: window.fbData.Lich_Su_Diem_Danh || [["Ngay", "Lop", "H", "V"]],
        main: window.fbData.Main || []
    };

    const d = calculateFinanceDashboard(monthParam, rawData);
    window.lastFinanceData = d;
    renderFinanceDashboard(d);
}

`;
    content = content.substring(0, financeLoadStart) + newFinanceLoad + content.substring(financeLoadEnd);
}

const financeSubmitStart = content.indexOf('async function submitFinanceConfig');
if (financeSubmitStart !== -1) {
    const newFinanceSubmit = `async function submitFinanceConfig(e) {
    e.preventDefault();
    const monthSelected = document.getElementById("finMonth").value; 
    let costEl = document.getElementById("finCost");
    let cost = costEl ? costEl.value : undefined;

    const btn = document.getElementById("btnSubmitFinance");
    btn.innerText = "Đang Lưu Firebase...";
    btn.disabled = true;

    let cauHinhData = window.fbData?.Cau_Hinh_Tai_Chinh || [];
    if(cauHinhData.length === 0) cauHinhData.push(["Ten_Lop", "Gia_Tien_Buoi"]);
    
    const classPricesToSave = {};
    document.querySelectorAll(".class-price-input").forEach(inp => {
        classPricesToSave[inp.getAttribute("data-class")] = inp.value;
    });

    Object.keys(classPricesToSave).forEach(cName => {
        let price = parseFloat(classPricesToSave[cName]) || 0;
        let found = false;
        for(let i=1; i<cauHinhData.length; i++) {
             if(cauHinhData[i] && String(cauHinhData[i][0]).trim() === cName) {
                 cauHinhData[i][1] = price;
                 found = true; break;
             }
        }
        if(!found) cauHinhData.push([cName, price]);
    });

    let thuChiData = window.fbData?.Lich_Su_Thu_Chi_Thang || [];
    if(thuChiData.length === 0) thuChiData.push(["Thang_Nam", "Tong_Tien_Thu", "Tong_Chi_Phi"]);
    
    if(monthSelected && cost !== undefined) {
         let newChi = parseFloat(cost) || 0;
         let found = false;
         for(let i=1; i<thuChiData.length; i++) {
             if(thuChiData[i] && String(thuChiData[i][0]).trim() === monthSelected) {
                  thuChiData[i][2] = newChi;
                  found = true; break;
             }
         }
         if(!found) thuChiData.push([monthSelected, 0, newChi]);
    }

    try {
        await db.ref().update({
            '/Cau_Hinh_Tai_Chinh': cauHinhData,
            '/Lich_Su_Thu_Chi_Thang': thuChiData
        });
        alert("✅ Đã chốt lưu báo cáo tài chính.");
        switchFinanceTab('report');
        if (costEl) costEl.value = "";
        let usdEl = document.getElementById("finCostUSD");
        if (usdEl) usdEl.value = "";
    } catch(err) {
        alert("Lỗi Ghi: " + err.message);
    } finally {
        btn.innerText = "💾 Lưu Cấu Hình Tài Chính";
        btn.disabled = false;
    }
}
`;
    content = content.substring(0, financeSubmitStart) + newFinanceSubmit;
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Rewrite completed successfully.");
