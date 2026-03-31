document.addEventListener("DOMContentLoaded", () => {
    const savedUrl = localStorage.getItem("XOO_API_URL");
    const apiUrlInput = document.getElementById("apiUrl");
    if(savedUrl) apiUrlInput.value = savedUrl;
    
    loadData();
});

let globalData = [];

// KHAI BÁO DỮ LIỆU DEMO GIẢ LẬP
const demoData = [
    { Ten_Lop: "IELTS 6.5 Nâng Cao", Ten_Hoc_Vien: "Nguyễn Văn A", Loai_The: "20", So_Ngay_Vang: "0", The_Con_Lai: "10" },
    { Ten_Lop: "IELTS 6.5 Nâng Cao", Ten_Hoc_Vien: "Trần Thị B", Loai_The: "20", So_Ngay_Vang: "2", The_Con_Lai: "0" }, 
    { Ten_Lop: "Giao Tiếp Phản Xạ", Ten_Hoc_Vien: "Phạm D", Loai_The: "10", So_Ngay_Vang: "0", The_Con_Lai: "1" },
    { Ten_Lop: "Giao Tiếp Phản Xạ", Ten_Hoc_Vien: "Hoàng E", Loai_The: "20", So_Ngay_Vang: "5", The_Con_Lai: "15" },
];

async function loadData() {
    const url = document.getElementById("apiUrl").value.trim();
    const loader = document.getElementById("loader");
    const container = document.getElementById("classContainer");
    
    loader.style.display = "block";
    container.innerHTML = "";

    if(!url) {
        setTimeout(() => {
            globalData = demoData;
            renderClasses(globalData, true);
            loader.style.display = "none";
        }, 600);
        return;
    }

    localStorage.setItem("XOO_API_URL", url);

    try {
        const response = await fetch(url + "?t=" + new Date().getTime()); 
        const result = await response.json();
        
        if(result.status === 'success') {
            globalData = result.data;
            if(globalData.length === 0) {
               container.innerHTML = "<p style='color: #64748b; text-align: center; width: 100%; grid-column: 1/-1'>Chưa có học viên nào. Hãy bấm Khai báo Học Viên Mới!</p>";
            } else {
               renderClasses(globalData, false);
            }
        } else {
            alert("Lỗi GSheet: " + result.message);
            renderClasses(demoData, true); 
        }
    } catch (err) {
        alert("Chưa kết nối CSDL thành công. Đang xem Dữ Liệu Demo Ảo.");
        renderClasses(demoData, true);
    } finally {
        loader.style.display = "none";
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

    for(const [className, students] of Object.entries(classesMap)) {
        const classCard = document.createElement('div');
        classCard.className = 'class-card';
        
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
            remain = parseInt(remain);
            
            const isExpired = remain <= 0;
            const absences = std["So_Ngay_Vang"] || "0";
            
            html += `
                <div class="student-item ${isExpired ? 'expired' : ''}">
                    <div class="student-info">
                        <h4>${std["Ten_Hoc_Vien"]}</h4>
                        <div class="student-stats">
                            <span class="tag ${isExpired ? 'tag-danger' : 'tag-blue'}">Thẻ ${cardType} Buổi</span>
                            <span style="display:inline-block; margin-top:5px;">
                                Đã vắng: <b>${absences}</b> | Còn: <b style="${isExpired ? 'color: var(--danger); font-size:1.1rem' : 'color: var(--primary); font-size:1.1rem'}">${remain}</b>
                            </span>
                            ${isExpired ? '<div style="color:#b91c1c; font-size:0.8rem; margin-top:5px; font-weight:700;">⚠️ Cần Mua Thẻ Mới (Gia hạn)!</div>' : ''}
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
            <div class="card-footer">
                <button class="btn-danger" onclick="startSession('${className}', ${isDemo})">
                    BẤM ĐIỂM DANH LỚP HÔM NAY
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

    const url = document.getElementById("apiUrl").value.trim();
    if(!url) return;

    const checkboxes = document.querySelectorAll(`input.absent-cb[data-class="${className}"]:checked`);
    const absentStudents = Array.from(checkboxes).map(cb => cb.value);

    const confirmMsg = absentStudents.length > 0 
        ? `Xác nhận ĐIỂM DANH Lớp [${className}] hôm nay?\n\nDanh sách BẢO LƯU THẺ (${absentStudents.length} bạn giữ nguyên):\n👉 ${absentStudents.join(', ')}\n\n(Tất cả bạn CÓ MẶT còn lại TỰ ĐỘNG BỊ TRỪ 1 BUỔI!`
        : `Xác nhận ĐIỂM DANH Lớp [${className}] hôm nay?\n\nTẤT CẢ HỌC VIÊN ĐỀU CÓ MẶT! 🥳\n(Hệ thống tự động trừ 1 buổi vào thẻ của Toàn lớp)`;

    if(!confirm(confirmMsg)) return;

    const loader = document.getElementById("loader");
    loader.style.display = "block";

    const payload = {
        action: "start_session",
        className: className,
        absences: absentStudents
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
            loadData();
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

async function submitForm(e) {
    e.preventDefault();
    const url = document.getElementById("apiUrl").value.trim();
    
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
        loadData();
        return;
    }

    const btn = document.getElementById("btnSubmitForm");
    btn.innerText = "Đang Tự Động Ghi Vào Excel...";
    btn.disabled = true;
    
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
            loadData(); // Tải lại để hiện lên Giao diện
        } else {
            alert("Lỗi Lưu từ GSheet: " + result.message);
        }
    } catch(err) {
        alert("Lỗi Đường truyền: " + err.message);
    } finally {
        btn.innerText = "Hoàn Tất Khai Báo";
        btn.disabled = false;
    }
}
