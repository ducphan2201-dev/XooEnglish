document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    loadData();
});

function initTheme() {
    const savedTheme = localStorage.getItem('xooTheme');
    if (savedTheme === 'baby-blue') {
        document.documentElement.setAttribute('data-theme', 'baby-blue');
        const btn = document.getElementById('btnThemeToggle');
        if (btn) btn.innerText = '🎨 Giao diện Gốc';
    }
}

function toggleTheme() {
    const isBabyBlue = document.documentElement.getAttribute('data-theme') === 'baby-blue';
    const btn = document.getElementById('btnThemeToggle');
    if (isBabyBlue) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('xooTheme', 'default');
        if (btn) btn.innerText = '✨ Màu Baby Blue';
    } else {
        document.documentElement.setAttribute('data-theme', 'baby-blue');
        localStorage.setItem('xooTheme', 'baby-blue');
        if (btn) btn.innerText = '🎨 Giao diện Gốc';
    }
}


function toggleAdmin() {
    if (sessionStorage.getItem('isAdmin') === 'true') {
        if(confirm("Bạn có muốn đăng xuất quyền Quản Trị Viên không?")) {
            sessionStorage.removeItem('isAdmin');
            applyAdminRules();
        }
        return;
    }
    const pass = prompt("Nhập mật khẩu Quản Trị Viên:\n(Vui lòng xem trong file config.js)");
    const correctPass = typeof CONFIG !== 'undefined' && CONFIG.ADMIN_PASS ? CONFIG.ADMIN_PASS : "";
    if (pass !== null && pass === correctPass) {
        sessionStorage.setItem('isAdmin', 'true');
        applyAdminRules();
        alert("Đăng nhập quyền Quản trị thành công!");
    } else if (pass !== null) {
        alert("Sai mật khẩu!");
    }
}

function applyAdminRules() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) {
        btnAdmin.innerHTML = isAdmin ? "🔓 Thoát Quản Trị" : "🔒 Quản Trị Viên";
        btnAdmin.style.background = isAdmin ? "var(--primary)" : "";
        btnAdmin.style.color = isAdmin ? "#fff" : "";
        btnAdmin.style.borderColor = isAdmin ? "var(--primary)" : "var(--border)";
    }
    const adminEls = document.querySelectorAll('.admin-only');
    adminEls.forEach(el => {
        el.style.display = isAdmin ? 'inline-block' : 'none';
    });
}

let globalData = [];

// KHAI BÁO DỮ LIỆU DEMO GIẢ LẬP
const demoData = [
    { Ten_Lop: "IELTS 6.5 Nâng Cao", Ten_Hoc_Vien: "Nguyễn Văn A", Loai_The: "20", So_Ngay_Vang: "0", The_Con_Lai: "10" },
    { Ten_Lop: "IELTS 6.5 Nâng Cao", Ten_Hoc_Vien: "Trần Thị B", Loai_The: "20", So_Ngay_Vang: "2", The_Con_Lai: "0" }, 
    { Ten_Lop: "Giao Tiếp Phản Xạ", Ten_Hoc_Vien: "Phạm D", Loai_The: "10", So_Ngay_Vang: "0", The_Con_Lai: "1" },
    { Ten_Lop: "Giao Tiếp Phản Xạ", Ten_Hoc_Vien: "Hoàng E", Loai_The: "20", So_Ngay_Vang: "5", The_Con_Lai: "15" },
];

function showLoader(msg = "Đang đồng bộ chớp nhoáng...") { document.getElementById("loader").style.display = "block"; const txtEl = document.querySelector("#loader .loader-wrapper div:nth-child(2)"); if(txtEl) txtEl.innerText = msg; }
function hideLoader() { document.getElementById("loader").style.display = "none"; }

function prepareGlobalData() {
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

    if (typeof db === 'undefined' || typeof firebase === 'undefined') {
        alert("Lỗi: Không tìm thấy Firebase. Hãy tải trang lại.");
        return;
    }

    db.ref('/' + (CONFIG.DB_VAULT || '')).on('value', snapshot => {
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

function renderClasses(data, isDemo = false) {
    const container = document.getElementById("classContainer");
    container.innerHTML = "";
    
    const classesMap = {};
    data.forEach(row => {
        const className = row["Ten_Lop"];
        if(!className) return; 
        if(!classesMap[className]) classesMap[className] = [];
        classesMap[className].push(row);
    });

    let delayIndex = 0;
    for(const [className, students] of Object.entries(classesMap)) {
        const classCard = document.createElement('div');
        const randomLeaf = Math.floor(Math.random() * 4) + 1; // Chọn lá từ 1 tới 4
        classCard.className = `class-card leaf-pos-${randomLeaf}`;
        classCard.style.animationDelay = `${delayIndex * 0.08}s`; // Animation mọc lần lượt
        delayIndex++;
        
        let html = `
            <div class="class-header">
                📚 ${className}
                <span>Sĩ số: <b>${students.length}</b></span>
            </div>
            <div class="student-list" id="list-${className.replace(/\s+/g, '')}">
        `;

        students.forEach(std => {
            let remain = std["The_Con_Lai"];
            const cardType = std["Loai_The"] || "0";
            if (remain === "" || remain === undefined) remain = cardType;
            
            let isExpired = false;
            let remainDisplay = remain;
            
            if(!isNaN(remain) && String(remain).trim() !== "") {
                remainDisplay = parseInt(remain);
                isExpired = remainDisplay <= 0;
            }
            
            const cardLabel = (!isNaN(cardType) && String(cardType).trim() !== "") ? cardType + " Buổi" : cardType;
            const absences = std["So_Ngay_Vang"] || "0";
            
            html += `
                <div class="student-item ${isExpired ? 'expired' : ''}">
                    <div class="student-info">
                        <h4>${std["Ten_Hoc_Vien"]}</h4>
                        <div class="student-stats">
                            <span class="tag ${isExpired ? 'tag-danger' : 'tag-blue'}">Thẻ ${cardLabel}</span>
                            <span style="display:flex; margin-top:5px; align-items: center; justify-content: space-between; width: 100%; gap: 5px; flex-wrap: wrap;">
                                <span>Đã vắng: <b>${absences}</b> | Còn: <b style="${isExpired ? 'color: var(--danger); font-size: 1.25rem; font-weight: 900;' : 'color: #0369a1; font-size: 1.25rem; font-weight: 900;'}">${remainDisplay}</b></span>
                                <span>
                                    <button class="btn-renew btn-deduct" onclick="deductIndividual('${std["Ten_Hoc_Vien"]}', '${className}')">➖ Trừ Lẻ</button>
                                    <button class="btn-renew" onclick="openRenewModal('${std["Ten_Hoc_Vien"]}', '${className}')">🔄 Gia Hạn</button>
                                </span>
                            </span>
                            ${isExpired ? '<div style="color:#b91c1c; font-size:0.8rem; margin-top:5px; font-weight:700;">⚠️ Cần Mua Thẻ Mới!</div>' : ''}
                        </div>
                    </div>
                    <label class="absence-toggle" title="Nếu học viên này nghỉ, TICK CHỌN để bảo lưu.">
                        Vắng?
                        <input type="checkbox" class="absent-cb" data-class="${className}" value="${std["Ten_Hoc_Vien"]}">
                    </label>
                </div>
            `;
        });

        html += `
            </div>
            </div>
            <div class="card-footer" style="display:flex; flex-direction:column; gap: 12px;">
                <div style="display:flex; justify-content: space-between; align-items:center;">
                   <button class="btn-renew" style="float:none; margin:0;" onclick="openHistoryModal('${className}')">⏳ Xem Lịch Sử Lớp</button>
                   <input type="date" id="date_${className}" value="${new Date().toISOString().split('T')[0]}" style="padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border); outline: none; font-family: inherit; font-size: 0.9rem; font-weight: 600; color: #475569;" title="Chọn ngày điểm danh (Bù)">
                </div>
                <button class="btn-danger" id="btn_attend_${className}" onclick="startSession('${className}', ${isDemo})">
                    BẤM CHỐT ĐIỂM DANH
                </button>
            </div>
        `;

        classCard.innerHTML = html;
        container.appendChild(classCard);
    }
}

async function startSession(className, isDemo) {
    if (isDemo) return alert("Demo Mode!");

    const dateInput = document.getElementById("date_" + className);
    const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const parts = selectedDate.split('-');
    const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : selectedDate;

    const checkboxes = document.querySelectorAll(`input.absent-cb[data-class="${className}"]:checked`);
    const absentStudents = Array.from(checkboxes).map(cb => cb.value);

    const confirmMsg = absentStudents.length > 0 
        ? `Xác nhận ĐIỂM DANH Lớp [${className}] ngày ${displayDate}?\n\nDanh sách BẢO LƯU THẺ (${absentStudents.length} bạn giữ nguyên):\n👉 ${absentStudents.join(', ')}\n\n(Tất cả bạn CÓ MẶT còn lại TỰ ĐỘNG BỊ TRỪ 1 BUỔI!`
        : `Xác nhận ĐIỂM DANH Lớp [${className}] ngày ${displayDate}?\n\nTẤT CẢ HỌC VIÊN ĐỀU CÓ MẶT! 🥳\n(Hệ thống tự động trừ 1 buổi vào thẻ của Toàn lớp)`;

    let histArr = window.fbData?.Lich_Su_Diem_Danh || [];
    let normClass = String(className || "").trim().toLowerCase();
    for (let i = 1; i < histArr.length; i++) {
        if (!histArr[i]) continue;
        let rowDate = String(histArr[i][0] || "").trim();
        let rowClass = String(histArr[i][1] || "").trim().toLowerCase();
        if (rowDate === selectedDate && (rowClass === normClass || histArr[i][1] === className)) {
             alert(`Lớp ${className} đã được chốt trong ngày ${displayDate}. Nếu có học viên đến muộn, hãy nhấn nút "➖ Trừ Lẻ".`);
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
        await db.ref('/' + (CONFIG.DB_VAULT || '')).update({
             '/Main': mainArr,
             '/Lich_Su_Diem_Danh': histArr
        });
        alert(`✅ Đã chốt thành công ngày ${displayDate}`);
    } catch(err) {
        alert("Lỗi lưu lên Firebase: " + err.message);
    } finally {
        hideLoader();
    }
}

// ----------------------------------------------------
// LOGIC MODAL KHAI BÁO HỌC VIÊN
// ----------------------------------------------------
function openModal() {
    document.getElementById("addModal").style.display = "flex";
}
function closeModal() {
    document.getElementById("addModal").style.display = "none";
}
function openHDSD() {
    document.getElementById("hdsdModal").style.display = "flex";
}
function closeHDSD() {
    document.getElementById("hdsdModal").style.display = "none";
}

// ---- LOGIC MODAL GIA HẠN THẺ ----
function openRenewModal(studentName, className) {
    document.getElementById("renewStudentName").innerText = studentName;
    document.getElementById("renewClassName").value = className;
    document.getElementById("renewModal").style.display = "flex";
}
function closeRenewModal() {
    document.getElementById("renewModal").style.display = "none";
}

async function submitRenewForm(e) {
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
             await db.ref('/' + (CONFIG.DB_VAULT || '') + '/Main').set(mainArr);
             alert("✅ Nạp thành công cho " + studentName);
             closeRenewModal();
         } catch(err) {
             alert("Lỗi: " + err.message);
         }
    }
    btn.innerText = "💳 Nạp Thẻ Gian Hạn";
    btn.disabled = false;
}

async function submitForm(e) {
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
        await db.ref('/' + (CONFIG.DB_VAULT || '') + '/Main').set(mainArr);
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

// ==== LOGIC LỊCH SỬ ĐIỂM DANH ====

function closeHistoryModal() {
    document.getElementById("historyModal").style.display = "none";
}

function openHistoryModal(className) {
    document.getElementById("historyClassName").innerText = className;
    const tbody = document.getElementById("historyBody");
    tbody.innerHTML = "";
    document.getElementById("historyLoading").style.display = "none";
    document.getElementById("historyModal").style.display = "flex";

    const histArr = window.fbData?.Lich_Su_Diem_Danh || [];
    if (histArr.length <= 1) {
         tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 25px; color: #64748b; font-style:italic;">Lớp này chưa có buổi Lịch sử điểm danh nào!</td></tr>`;
         return;
    }

    let headers = histArr[0].map(h => String(h).trim());
    let colDate = headers.indexOf("Ngay_Diem_Danh");
    if (colDate === -1) colDate = 0;
    let colClass = headers.indexOf("Ten_Lop");
    if (colClass === -1) colClass = 1;
    let colPres = headers.indexOf("Hoc_Vien_Co_Mat");
    if (colPres === -1) colPres = 2;
    let colAbs = headers.indexOf("Hoc_Vien_Vang");
    if (colAbs === -1) colAbs = 3;

    let foundAny = false;
    let targetClass = String(className || "").trim().toLowerCase();
    for (let i = histArr.length - 1; i >= 1; i--) {
        if (!histArr[i]) continue;
        let rowClass = String(histArr[i][colClass] || "").trim().toLowerCase();
        if (rowClass === targetClass || histArr[i][colClass] === className) {
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

             tr.innerHTML = `
                <td style="padding: 12px 10px; font-weight: 700;">${dt}</td>
                <td style="padding: 12px 10px; color: ${presentColor}; font-weight: 600;">${pres}</td>
                <td style="padding: 12px 10px; color: ${absentColor}; font-weight: ${absentWeight}; margin-left:1px;">${abs}</td>
             `;
             tbody.appendChild(tr);
        }
    }
    if(!foundAny) tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 25px; color: #64748b; font-style:italic;">Chưa có lịch sử khớp.</td></tr>`;
}

window.deductIndividual = async function(studentName, className) {
    if (!confirm(`Xử lý [THÊM 1 CA / XOÁ VẮNG] cho ${studentName} ngày hôm nay?`)) return;

    const dateInp = document.getElementById(`date_${className}`);
    let selectedDate = dateInp ? dateInp.value : new Date().toISOString().split('T')[0];

    let histArr = window.fbData?.Lich_Su_Diem_Danh || [];
    let mainArr = window.fbData?.Main || [];
    
    let hasLateArrivalFix = false;
    let histHeaders = histArr[0] ? histArr[0].map(h => String(h).trim()) : [];
    let hDate = histHeaders.indexOf("Ngay_Diem_Danh");
    if (hDate === -1) hDate = 0;
    let hClass = histHeaders.indexOf("Ten_Lop");
    if (hClass === -1) hClass = 1;
    let hPres = histHeaders.indexOf("Hoc_Vien_Co_Mat");
    if (hPres === -1) hPres = 2;
    let hAbs = histHeaders.indexOf("Hoc_Vien_Vang");
    if (hAbs === -1) hAbs = 3;

    let targetClassNorm = String(className || "").trim().toLowerCase();
    for (let j = 1; j < histArr.length; j++) {
         if (!histArr[j]) continue;
         let rowD = String(histArr[j][hDate] || "").trim();
         let rowC = String(histArr[j][hClass] || "").trim().toLowerCase();
         if (rowD === String(selectedDate).trim() && (rowC === targetClassNorm || histArr[j][hClass] === className)) {
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
        await db.ref('/' + (CONFIG.DB_VAULT || '')).update({'/Main': mainArr, '/Lich_Su_Diem_Danh': histArr});
        alert(hasLateArrivalFix ? `Đã xoá án vắng và trừ thẻ cho ${studentName}.` : `Đã trừ thẻ bù ngày cho ${studentName}.`);
    } catch(err) {
        alert("Lỗi DB: " + err.message);
    }
}

// ==== LOGIC QUẢN LÝ TÀI CHÍNH ====
function openFinanceModal() {
    document.getElementById("financeModal").style.display = "flex";
    // Set default month to current month
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const defaultMonth = `${yyyy}-${mm}`;
    document.getElementById("finMonth").value = defaultMonth;
    let reportPicker = document.getElementById("reportMonthPicker");
    if(reportPicker) reportPicker.value = defaultMonth;
    
    // Switch to report tab
    switchFinanceTab('report');
    
    // Fetch data
    loadFinanceData(defaultMonth);
}

function changeReportMonth() {
    let newMonth = document.getElementById("reportMonthPicker").value;
    if (newMonth) {
        document.getElementById("finMonth").value = newMonth; // Sync to input tab
        loadFinanceData(newMonth); // Fetch new dashboard data immediately
    }
}

function closeFinanceModal() {
    document.getElementById("financeModal").style.display = "none";
}

function switchFinanceTab(tab) {
    document.querySelectorAll('.finance-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.finance-panel').forEach(el => el.classList.remove('active'));
    
    if (tab === 'report') {
        document.querySelector('.finance-tab:nth-child(1)').classList.add('active');
        document.getElementById('financePanelReport').classList.add('active');
    } else {
        document.querySelector('.finance-tab:nth-child(2)').classList.add('active');
        document.getElementById('financePanelInput').classList.add('active');
        renderPriceConfigInputs();
        fetchUSDRate(); // Fetch USD rate when opening input tab
    }
}

async function fetchUSDRate(force = false) {
    const rateEl = document.getElementById('finRate');
    const dateEl = document.getElementById('finPayDate');
    
    // Set default date to today if empty
    if (!dateEl.value) {
        dateEl.valueAsDate = new Date();
    }
    
    if (rateEl.value && !force) return; // already fetched
    
    rateEl.placeholder = "Đang tải...";
    rateEl.value = "";
    
    try {
        let dateStr = dateEl.value; // YYYY-MM-DD
        
        let url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateStr}/v1/currencies/usd.json`;
        let res = await fetch(url);
        
        // If exact date fails (API sync issue), fallback to latest
        if (!res.ok) {
            url = `https://latest.currency-api.pages.dev/v1/currencies/usd.json`;
            res = await fetch(url);
        }
        
        const data = await res.json();
        const baseRate = data.usd.vnd;
        
        const estimatedVPBankRate = Math.round(baseRate * 1.03); 
        rateEl.value = estimatedVPBankRate;
        calcVND();
    } catch(err) {
        console.error("Lỗi lấy tỷ giá lịch sử: ", err);
        try {
            const fbRes = await fetch('https://open.er-api.com/v6/latest/USD');
            const fbData = await fbRes.json();
            rateEl.value = Math.round(fbData.rates.VND * 1.03);
            calcVND();
        } catch(e) {
            rateEl.value = 26500;
            calcVND();
        }
    }
}

function calcVND() {
    const usd = parseFloat(document.getElementById('finCostUSD').value) || 0;
    const rate = parseFloat(document.getElementById('finRate').value) || 0;
    if (usd > 0 && rate > 0) {
        document.getElementById('finCost').value = Math.round(usd * rate);
    }
}

window.localRawFinance = window.localRawFinance || null;

function calculateFinanceDashboard(monthParam, rawData) {
    const cauHinhData = rawData.config || [];
    const thuChiData = rawData.cost || [];
    const historyData = rawData.history || [];
    const mainData = rawData.main || [];

    const classPrices = {};
    for (let i = 1; i < cauHinhData.length; i++) {
        classPrices[String(cauHinhData[i][0]).trim()] = parseFloat(cauHinhData[i][1]) || 0;
    }

    let monthCost = 0;
    for (let i = 1; i < thuChiData.length; i++) {
        const t = String(thuChiData[i][0]).trim();
        const chi = parseFloat(thuChiData[i][2]) || 0;
        if (monthParam && t === monthParam) {
            monthCost = chi;
        }
    }

    const sessionsPerClassLifetime = {};
    const sessionsPerClassMonth = {};
    let totalSessionsMonth = 0;

    for (let i = 1; i < historyData.length; i++) {
        let dStr = historyData[i][0];
        if (typeof dStr === 'string' && dStr.includes('T')) {
            const tempD = new Date(dStr);
            dStr = `${tempD.getFullYear()}-${String(tempD.getMonth()+1).padStart(2,'0')}-${String(tempD.getDate()).padStart(2,'0')}`;
        }
        const cName = String(historyData[i][1]).trim();
        
        if (!sessionsPerClassLifetime[cName]) sessionsPerClassLifetime[cName] = 0;
        sessionsPerClassLifetime[cName]++;
        
        if (monthParam && typeof dStr === 'string' && dStr.indexOf(monthParam) === 0) {
            if (!sessionsPerClassMonth[cName]) sessionsPerClassMonth[cName] = 0;
            sessionsPerClassMonth[cName]++;
            totalSessionsMonth++;
        }
    }

    const costPerSessionGlobally = totalSessionsMonth > 0 ? (monthCost / totalSessionsMonth) : 0;

    const headers = (mainData[0] || []).map(h => String(h).trim());
    const colClass = headers.indexOf("Ten_Lop");
    const colRemaining = headers.indexOf("The_Con_Lai");
    const colCardType = headers.indexOf("Loai_The");

    const mainClasses = {};
    const classStudentCount = {};
    const classRemainingSessions = {};
    if (colClass !== -1) {
        for(let i=1; i<mainData.length; i++) {
            const c = String(mainData[i][colClass]).trim();
            if (c) {
                if (!mainClasses[c]) {
                    mainClasses[c] = true;
                    classStudentCount[c] = 0;
                    classRemainingSessions[c] = 0;
                }
                classStudentCount[c]++;
                
                let rem = mainData[i][colRemaining];
                if(rem === "" || rem === undefined || rem === null) {
                    rem = parseInt(mainData[i][colCardType]) || 0;
                } else {
                    rem = parseInt(rem) || 0;
                }
                classRemainingSessions[c] += rem;
            }
        }
    }

    const sessionStats = [];
    let lifetimeRealized = 0;
    let monthGathered = 0;
    let lifetimeDeferred = 0;

    Object.keys(classPrices).forEach(c => {
        if (!mainClasses[c]) {
            mainClasses[c] = true;
            classStudentCount[c] = 0;
            classRemainingSessions[c] = 0;
        }
    });

    Object.keys(mainClasses).forEach(c => {
        const pricePerStudent = classPrices[c] || 0;
        const studentCount = classStudentCount[c] || 0;
        const pricePerSessionForClass = pricePerStudent * studentCount;
        
        const taughtMonth = sessionsPerClassMonth[c] || 0;
        const taughtLife = sessionsPerClassLifetime[c] || 0;
        
        monthGathered += (taughtMonth * pricePerSessionForClass);
        lifetimeRealized += (taughtLife * pricePerSessionForClass);
        lifetimeDeferred += (classRemainingSessions[c] || 0) * pricePerStudent;
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

    const lifetimeGathered = lifetimeRealized + lifetimeDeferred;

    let totalClassPrices = 0;
    let classCountForPrice = 0;
    Object.keys(classPrices).forEach(k => {
        if(classPrices[k] > 0) { totalClassPrices += classPrices[k]; classCountForPrice++; }
    });
    const averagePrice = classCountForPrice > 0 ? (totalClassPrices / classCountForPrice) : 0;
    const lifetimeSessionsSold = averagePrice > 0 ? (lifetimeGathered / averagePrice) : 0;
    let lifetimeSessionsTaughtTotal = 0;
    Object.keys(sessionsPerClassLifetime).forEach(k => { lifetimeSessionsTaughtTotal += sessionsPerClassLifetime[k]; });

    return {
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
}

function loadFinanceData(monthParam) {
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

function formatVND(num) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

function renderFinanceDashboard(data) {
    const lf = data.lifetime || {};
    document.getElementById("lfGathered").innerText = formatVND(lf.gathered || 0);
    document.getElementById("lfRealized").innerText = formatVND(lf.realized || 0);
    document.getElementById("lfDeferred").innerText = formatVND(lf.deferred || 0);
    document.getElementById("lfSold").innerText = lf.sessions_sold || 0;
    document.getElementById("lfTaught").innerText = lf.sessions_taught || 0;
    document.getElementById("lfOwed").innerText = lf.sessions_owed || 0;

    const mo = data.month || {};
    document.getElementById("monthTitleLabel").innerText = `(${mo.month_id})`;
    document.getElementById("moRev").innerText = formatVND(mo.revenue || 0);
    document.getElementById("moCost").innerText = formatVND(mo.cost || 0);
    document.getElementById("moProfit").innerText = formatVND(mo.profit || 0);
    document.getElementById("moSessions").innerText = mo.total_sessions_month || 0;

    const tbody = document.getElementById("sessionStatsBody");
    tbody.innerHTML = "";
    if (data.session && data.session.length > 0) {
        data.session.forEach(s => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><b>${s.class_name}</b></td>
                <td style="color:#059669">${formatVND(s.price_per_session)}</td>
                <td style="color:#dc2626">${formatVND(s.cost_session)}</td>
                <td style="color:#4f46e5; font-weight:700">${formatVND(s.profit_session)}</td>
                <td>${s.sessions_taught_month} buổi</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có dữ liệu lớp học</td></tr>`;
    }
}

function renderPriceConfigInputs() {
    const container = document.getElementById("priceConfigContainer");
    if (!window.lastFinanceData || !window.lastFinanceData.session) {
        container.innerHTML = `<div style="color: #64748b; font-size:0.9rem;">Đang tải danh sách lớp, vui lòng đợi...</div>`;
        return;
    }
    
    const classes = window.lastFinanceData.session;
    if (classes.length === 0) {
        container.innerHTML = `<div style="color: #64748b; font-size:0.9rem;">Chưa có lớp nào trong hệ thống.</div>`;
        return;
    }

    let html = "";
    classes.forEach(c => {
        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-weight:600; font-size:0.9rem;">${c.class_name}</div>
            <input type="number" class="class-price-input" data-class="${c.class_name}" value="${c.price_per_student || 0}" style="width: 150px; padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px;" placeholder="Giá/1 HS/buổi">
        </div>`;
    });
    container.innerHTML = html;
}

async function submitFinanceConfig(e) {
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
        await db.ref('/' + (CONFIG.DB_VAULT || '')).update({
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
