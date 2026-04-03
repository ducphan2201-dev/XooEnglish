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

async function loadData(forceLoader = false) {
    const url = (typeof CONFIG !== 'undefined' && CONFIG.API_URL ? CONFIG.API_URL : "").trim();
    const loader = document.getElementById("loader");
    const container = document.getElementById("classContainer");
    
    if(!url) {
        loader.style.display = "block";
        container.innerHTML = "";
        setTimeout(() => {
            globalData = demoData;
            renderClasses(globalData, true);
            loader.style.display = "none";
        }, 600);
        return;
    }

    // 1. Phục hồi dữ liệu tức thì từ Bộ nhớ đệm (Cache)
    const cachedString = localStorage.getItem('xoo_cache_data');
    if (cachedString && !forceLoader) {
        try {
            globalData = JSON.parse(cachedString);
            if (globalData && globalData.length > 0) {
               renderClasses(globalData, false);
            }
        } catch(e) { console.error(e); }
    } else if (forceLoader || !cachedString) {
        loader.style.display = "block";
        if (!cachedString) container.innerHTML = "";
    }

    // 2. Tải ngầm luồng phiên bản mới nhất từ Cloud
    try {
        const response = await fetch(url + "?t=" + new Date().getTime()); 
        const result = await response.json();
        
        if(result.status === 'success') {
            const newString = JSON.stringify(result.data);
            if(result.data.length === 0) {
               if(!cachedString || cachedString !== "[]") {
                   container.innerHTML = "<p style='color: #64748b; text-align: center; width: 100%; grid-column: 1/-1'>Chưa có học viên nào. Hãy bấm Khai báo Học Viên Mới!</p>";
               }
               localStorage.setItem('xoo_cache_data', "[]");
               globalData = [];
            } else {
               // Render lại mượt mà NẾU như CSDL trên mây có thay đổi so với Cache
               if (newString !== cachedString) {
                   globalData = result.data;
                   localStorage.setItem('xoo_cache_data', newString);
                   renderClasses(globalData, false);
               }
            }
        } else {
            console.error("Lỗi GSheet:", result.message);
            if (!cachedString) {
                alert("Lỗi GSheet: " + result.message);
                renderClasses(demoData, true); 
            }
        }
    } catch (err) {
        console.error("Lỗi Mạng:", err);
        if(!cachedString) {
            alert("Chưa kết nối CSDL thành công. Đang xem Dữ Liệu Demo Ảo.");
            renderClasses(demoData, true);
        }
    } finally {
        if(loader) loader.style.display = "none";
    }
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
    if(isDemo) {
        alert("Demo Mode: Nút ĐIỂM DANH xử lý hoàn hảo! (Nhưng dữ liệu ảo sẽ không bị trừ trên Gsheet gốc).");
        return;
    }

    const url = (typeof CONFIG !== 'undefined' && CONFIG.API_URL ? CONFIG.API_URL : "").trim();
    if(!url) return;

    const dateInput = document.getElementById("date_" + className);
    const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    
    const parts = selectedDate.split('-');
    const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : selectedDate;

    const checkboxes = document.querySelectorAll(`input.absent-cb[data-class="${className}"]:checked`);
    const absentStudents = Array.from(checkboxes).map(cb => cb.value);

    const confirmMsg = absentStudents.length > 0 
        ? `Xác nhận ĐIỂM DANH Lớp [${className}] ngày ${displayDate}?\n\nDanh sách BẢO LƯU THẺ (${absentStudents.length} bạn giữ nguyên):\n👉 ${absentStudents.join(', ')}\n\n(Tất cả bạn CÓ MẶT còn lại TỰ ĐỘNG BỊ TRỪ 1 BUỔI!`
        : `Xác nhận ĐIỂM DANH Lớp [${className}] ngày ${displayDate}?\n\nTẤT CẢ HỌC VIÊN ĐỀU CÓ MẶT! 🥳\n(Hệ thống tự động trừ 1 buổi vào thẻ của Toàn lớp)`;

    if(!confirm(confirmMsg)) return;


    const loader = document.getElementById("loader");
    loader.style.display = "block";

    const payload = {
        action: "start_session",
        className: className,
        absences: absentStudents,
        date: selectedDate
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        const result = await response.json();
        
        if(result.status === 'success') {
            alert("✅ THÀNH CÔNG: " + result.message);
            applyFastUpdate(result);
        } else {
            alert("Gặp lỗi Cập nhật Excel: " + result.message);
        }
    } catch (err) {
        alert("Lỗi kết nối từ phía Máy của bạn tới server Google: " + err.message);
    } finally {
        loader.style.display = "none";
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
    const url = (typeof CONFIG !== 'undefined' && CONFIG.API_URL ? CONFIG.API_URL : "").trim();
    if(!url) return alert("Demo Mode: Tính năng Gia hạn cần kết nối với Google Sheets thật.");

    const className = document.getElementById("renewClassName").value;
    const studentName = document.getElementById("renewStudentName").innerText;
    const cardVal = document.getElementById("inpRenewCard").value;
    
    const btn = document.getElementById("btnSubmitRenew");
    btn.innerText = "Đang Đồng Bộ...";
    btn.disabled = true;
    
    const loader = document.getElementById("loader");
    if(loader) loader.style.display = "block";

    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({ 
                action: "renew_card", 
                className: className, 
                studentName: studentName, 
                addAmount: cardVal, 
                newCardType: cardVal 
            }),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        const result = await response.json();
        if(result.status === 'success') {
            alert("✅ " + result.message);
            closeRenewModal();
            applyFastUpdate(result);
        } else {
            alert("Lỗi GSheet: " + result.message);
        }
    } catch(err) {
        alert("Lỗi Mạng: " + err.message);
    } finally {
        if(loader) loader.style.display = "none";
        btn.innerText = "💳 Nạp Thẻ Nhập Hệ Thống";
        btn.disabled = false;
    }
}

async function submitForm(e) {
    e.preventDefault();
    const url = (typeof CONFIG !== 'undefined' && CONFIG.API_URL ? CONFIG.API_URL : "").trim();
    
    const className = document.getElementById("inpClass").value.trim();
    const name = document.getElementById("inpName").value.trim();
    const date = document.getElementById("inpDate").value;
    const card = document.getElementById("inpCard").value;
    
    // Nếu chưa có CSDL thật -> Ghi vào mảng Ảo (Demo)
    if(!url) {
        demoData.push({
            Ten_Lop: className, 
            Ten_Hoc_Vien: name, 
            Ngay_Bat_Dau: date,
            Loai_The: card, 
            So_Ngay_Vang: "0", 
            The_Con_Lai: card
        });
        alert("[Bản Demo] Đã tạo thành công Học Viên Mới!");
        closeModal();
        document.getElementById("addForm").reset();
        loadData(true);
        return;
    }

    const btn = document.getElementById("btnSubmitForm");
    btn.innerText = "Đang Tự Động Ghi Vào Excel...";
    btn.disabled = true;
    
    const loader = document.getElementById("loader");
    if(loader) loader.style.display = "block";
    
    const payload = {
        action: "add_student",
        className: className,
        studentName: name,
        cardType: card,
        startDate: date
    };
    
    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        const result = await response.json();
        if(result.status === 'success') {
            alert("✅ " + result.message);
            closeModal();
            document.getElementById("addForm").reset();
            applyFastUpdate(result);
        } else {
            alert("Lỗi Lưu từ GSheet: " + result.message);
        }
    } catch(err) {
        alert("Lỗi Đường truyền: " + err.message);
    } finally {
        if(loader) loader.style.display = "none";
        btn.innerText = "Hoàn Tất Khai Báo";
        btn.disabled = false;
    }
}

// ==== LOGIC LỊCH SỬ ĐIỂM DANH ====

function closeHistoryModal() {
    document.getElementById("historyModal").style.display = "none";
}

async function openHistoryModal(className) {
    document.getElementById("historyClassName").innerText = className;
    const tbody = document.getElementById("historyBody");
    tbody.innerHTML = "";
    document.getElementById("historyLoading").style.display = "block";
    document.getElementById("historyModal").style.display = "flex";

    const url = (typeof CONFIG !== 'undefined' && CONFIG.API_URL ? CONFIG.API_URL : "").trim();
    if(!url) {
        document.getElementById("historyLoading").innerText = "Chế độ Demo: Không có máy chủ cung cấp lịch sử.";
        return;
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({ action: "get_history", className: className }),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        const result = await response.json();
        document.getElementById("historyLoading").style.display = "none";
        
        if (result.status === 'success') {
            const data = result.data || [];
            if(data.length === 0) {
                 tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 25px; color: #64748b; font-style:italic;">Lớp này chưa có buổi Lịch sử điểm danh nào!</td></tr>`;
                 return;
            }
            data.forEach(item => {
                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid var(--border)";
                
                // Đồng bộ hiển thị chữ bất chấp dữ liệu cũ trong Excel
                let displayAbsent = item.absent;
                if (displayAbsent === "Đi học đủ" || displayAbsent === "Không có") displayAbsent = "Không có ai";

                // Tránh tình trạng ngáo màu
                const presentColor = item.present === "Không có ai" ? "#64748b" : "#059669";
                const absentColor = displayAbsent === "Không có ai" ? "#059669" : "#dc2626";
                const absentWeight = displayAbsent === "Không có ai" ? "600" : "700";

                tr.innerHTML = `
                   <td style="padding: 12px 10px; font-weight: 700;">${item.date}</td>
                   <td style="padding: 12px 10px; color: ${presentColor}; font-weight: 600;">${item.present}</td>
                   <td style="padding: 12px 10px; color: ${absentColor}; font-weight: ${absentWeight}; margin-left:1px;">${displayAbsent}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            document.getElementById("historyLoading").style.display = "block";
            document.getElementById("historyLoading").innerText = "Lỗi: " + result.message;
        }
    } catch(err) {
        document.getElementById("historyLoading").style.display = "block";
        document.getElementById("historyLoading").innerHTML = `<span style="color:red">Lỗi: ${err.message}</span>`;
        console.error("GET_HISTORY_ERROR:", err);
    }
}

window.deductIndividual = async function(studentName, className) {
    if (!confirm(`Bạn có chắc chắn muốn xử lý chức năng [THÊM 1 CA / XOÁ VẮNG] cho học viên ${studentName} trong ngày hôm nay không?\n\n(Hệ thống sẽ tự nhận diện: Nếu lỡ đánh vắng sẽ Trừ Thẻ + Xoá Vắng. Nếu có mặt sẵn sẽ Trừ Thẻ + Tăng 1 Ca)`)) return;

    const url = (typeof CONFIG !== 'undefined' && CONFIG.API_URL ? CONFIG.API_URL : "").trim();

    const dateInp = document.getElementById(`date-${className.replace(/\\s+/g, '')}`);
    let selectedDate = dateInp ? dateInp.value : "";
    if(!selectedDate) {
        const today = new Date();
        selectedDate = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
    } else {
        const parts = selectedDate.split("-");
        selectedDate = parseInt(parts[2]) + "/" + parseInt(parts[1]) + "/" + parts[0];
    }
    if(!url) {
        alert("Tính năng Cấn Trừ Lẻ chỉ hoạt động khi có kết nối API thật!");
        return;
    }

    const loader = document.getElementById("loader");
    loader.style.display = "block";

    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({ action: "deduct_individual", className: className, studentName: studentName, date: selectedDate }),
            headers: {"Content-Type": "text/plain;charset=utf-8"}
        });
        const result = await response.json();
        
        if(result.status === 'success') {
            alert("✅ Thành công: " + result.message);
            applyFastUpdate(result);
        } else {
            alert("❌ Lỗi Server: " + result.message);
        }
    } catch(err) {
        alert("❌ Lỗi Mạng: " + err.message);
        console.error("DEDUCT_INDIVIDUAL_ERROR:", err);
    } finally {
        loader.style.display = "none";
    }
}

function applyFastUpdate(result) {
    if (result.updatedData) {
        globalData = result.updatedData;
        localStorage.setItem('xoo_cache_data', JSON.stringify(globalData));
        renderClasses(globalData, false);
    } else {
        loadData(false);
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

async function loadFinanceData(monthParam) {
    const url = (typeof CONFIG !== 'undefined' && CONFIG.API_URL ? CONFIG.API_URL : "").trim();
    if(!url) {
        document.getElementById("financeLoading").innerText = "Chế độ Demo: Chưa kết nối máy chủ để xem tài chính.";
        return;
    }

    if (window.localRawFinance) {
        document.getElementById("financeLoading").style.display = "none";
        document.getElementById("financeDashboardContent").style.display = "block";
        const d = calculateFinanceDashboard(monthParam, window.localRawFinance);
        renderFinanceDashboard(d);
        window.lastFinanceData = d;
        return; // Zero network latency!
    }

    document.getElementById("financeLoading").style.display = "block";
    document.getElementById("financeDashboardContent").style.display = "none";

    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({ action: "get_finance_dashboard", month: monthParam }),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            document.getElementById("financeLoading").style.display = "none";
            document.getElementById("financeDashboardContent").style.display = "block";
            window.localRawFinance = result.data;
            const d = calculateFinanceDashboard(monthParam, window.localRawFinance);
            renderFinanceDashboard(d);
            window.lastFinanceData = d;
        } else {
            document.getElementById("financeLoading").innerText = "Lỗi: " + result.message;
        }
    } catch(err) {
        document.getElementById("financeLoading").innerHTML = `<span style="color:red">Lỗi mạng: ${err.message}</span>`;
    }
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
    const url = (typeof CONFIG !== 'undefined' && CONFIG.API_URL ? CONFIG.API_URL : "").trim();
    if(!url) return alert("Demo Mode: Tính năng lưu tài chính cần kết nối máy chủ thật.");

    const monthSelected = document.getElementById("finMonth").value; // yyyy-MM
    let gatheredEl = document.getElementById("finGathered");
    let costEl = document.getElementById("finCost");
    
    let cost = costEl ? costEl.value : undefined;

    const classPrices = {};
    document.querySelectorAll(".class-price-input").forEach(inp => {
        classPrices[inp.getAttribute("data-class")] = inp.value;
    });

    const btn = document.getElementById("btnSubmitFinance");
    btn.innerText = "Đang Lưu...";
    btn.disabled = true;

    try {
        const payload = {
            action: "update_finance_inputs",
            month: monthSelected,
            cost: cost ? parseFloat(cost) : undefined,
            class_prices: classPrices
        };

        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert("✅ " + result.message);
            switchFinanceTab('report');
            loadFinanceData(monthSelected);
            if (gatheredEl) gatheredEl.value = "";
            if (costEl) costEl.value = "";
            let usdEl = document.getElementById("finCostUSD");
            if (usdEl) usdEl.value = "";
        } else {
            alert("Lỗi GSheet: " + result.message);
        }
    } catch(err) {
        alert("Lỗi Mạng: " + err.message);
    } finally {
        btn.innerText = "💾 Lưu Cấu Hình Tài Chính";
        btn.disabled = false;
    }
}
