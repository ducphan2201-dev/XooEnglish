document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    loadData();
});

function initTheme() {
    const savedTheme = localStorage.getItem('xooTheme');
    if (savedTheme === 'baby-blue') {
        document.documentElement.setAttribute('data-theme', 'baby-blue');
        const btn = document.getElementById('btnThemeToggle');
        if (btn) btn.innerText = 'ðŸŽ¨ Giao diá»‡n Gá»‘c';
    }
}

function toggleTheme() {
    const isBabyBlue = document.documentElement.getAttribute('data-theme') === 'baby-blue';
    const btn = document.getElementById('btnThemeToggle');
    if (isBabyBlue) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('xooTheme', 'default');
        if (btn) btn.innerText = 'âœ¨ MÃ u Baby Blue';
    } else {
        document.documentElement.setAttribute('data-theme', 'baby-blue');
        localStorage.setItem('xooTheme', 'baby-blue');
        if (btn) btn.innerText = 'ðŸŽ¨ Giao diá»‡n Gá»‘c';
    }
}

let globalData = [];

// KHAI BÃO Dá»® LIá»†U DEMO GIáº¢ Láº¬P
const demoData = [
    { Ten_Lop: "IELTS 6.5 NÃ¢ng Cao", Ten_Hoc_Vien: "Nguyá»…n VÄƒn A", Loai_The: "20", So_Ngay_Vang: "0", The_Con_Lai: "10" },
    { Ten_Lop: "IELTS 6.5 NÃ¢ng Cao", Ten_Hoc_Vien: "Tráº§n Thá»‹ B", Loai_The: "20", So_Ngay_Vang: "2", The_Con_Lai: "0" }, 
    { Ten_Lop: "Giao Tiáº¿p Pháº£n Xáº¡", Ten_Hoc_Vien: "Pháº¡m D", Loai_The: "10", So_Ngay_Vang: "0", The_Con_Lai: "1" },
    { Ten_Lop: "Giao Tiáº¿p Pháº£n Xáº¡", Ten_Hoc_Vien: "HoÃ ng E", Loai_The: "20", So_Ngay_Vang: "5", The_Con_Lai: "15" },
];

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

    // 1. Phá»¥c há»“i dá»¯ liá»‡u tá»©c thÃ¬ tá»« Bá»™ nhá»› Ä‘á»‡m (Cache)
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

    // 2. Táº£i ngáº§m luá»“ng phiÃªn báº£n má»›i nháº¥t tá»« Cloud
    try {
        const response = await fetch(url + "?t=" + new Date().getTime()); 
        const result = await response.json();
        
        if(result.status === 'success') {
            const newString = JSON.stringify(result.data);
            if(result.data.length === 0) {
               if(!cachedString || cachedString !== "[]") {
                   container.innerHTML = "<p style='color: #64748b; text-align: center; width: 100%; grid-column: 1/-1'>ChÆ°a cÃ³ há»c viÃªn nÃ o. HÃ£y báº¥m Khai bÃ¡o Há»c ViÃªn Má»›i!</p>";
               }
               localStorage.setItem('xoo_cache_data', "[]");
               globalData = [];
            } else {
               // Render láº¡i mÆ°á»£t mÃ  Náº¾U nhÆ° CSDL trÃªn mÃ¢y cÃ³ thay Ä‘á»•i so vá»›i Cache
               if (newString !== cachedString) {
                   globalData = result.data;
                   localStorage.setItem('xoo_cache_data', newString);
                   renderClasses(globalData, false);
               }
            }
        } else {
            console.error("Lá»—i GSheet:", result.message);
            if (!cachedString) {
                alert("Lá»—i GSheet: " + result.message);
                renderClasses(demoData, true); 
            }
        }
    } catch (err) {
        console.error("Lá»—i Máº¡ng:", err);
        if(!cachedString) {
            alert("ChÆ°a káº¿t ná»‘i CSDL thÃ nh cÃ´ng. Äang xem Dá»¯ Liá»‡u Demo áº¢o.");
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
        const randomLeaf = Math.floor(Math.random() * 4) + 1; // Chá»n lÃ¡ tá»« 1 tá»›i 4
        classCard.className = `class-card leaf-pos-${randomLeaf}`;
        classCard.style.animationDelay = `${delayIndex * 0.08}s`; // Animation má»c láº§n lÆ°á»£t
        delayIndex++;
        
        let html = `
            <div class="class-header">
                ðŸ“š ${className}
                <span>SÄ© sá»‘: <b>${students.length}</b></span>
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
            
            const cardLabel = (!isNaN(cardType) && String(cardType).trim() !== "") ? cardType + " Buá»•i" : cardType;
            const absences = std["So_Ngay_Vang"] || "0";
            
            html += `
                <div class="student-item ${isExpired ? 'expired' : ''}">
                    <div class="student-info">
                        <h4>${std["Ten_Hoc_Vien"]}</h4>
                        <div class="student-stats">
                            <span class="tag ${isExpired ? 'tag-danger' : 'tag-blue'}">Tháº» ${cardLabel}</span>
                            <span style="display:flex; margin-top:5px; align-items: center; justify-content: space-between; width: 100%; gap: 5px; flex-wrap: wrap;">
                                <span>ÄÃ£ váº¯ng: <b>${absences}</b> | CÃ²n: <b style="${isExpired ? 'color: var(--danger); font-size: 1.25rem; font-weight: 900;' : 'color: #0369a1; font-size: 1.25rem; font-weight: 900;'}">${remainDisplay}</b></span>
                                <span>
                                    <button class="btn-renew btn-deduct" onclick="deductIndividual('${std["Ten_Hoc_Vien"]}', '${className}')">âž– Trá»« Láº»</button>
                                    <button class="btn-renew" onclick="openRenewModal('${std["Ten_Hoc_Vien"]}', '${className}')">ðŸ”„ Gia Háº¡n</button>
                                </span>
                            </span>
                            ${isExpired ? '<div style="color:#b91c1c; font-size:0.8rem; margin-top:5px; font-weight:700;">âš ï¸ Cáº§n Mua Tháº» Má»›i!</div>' : ''}
                        </div>
                    </div>
                    <label class="absence-toggle" title="Náº¿u há»c viÃªn nÃ y nghá»‰, TICK CHá»ŒN Ä‘á»ƒ báº£o lÆ°u.">
                        Váº¯ng?
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
                   <button class="btn-renew" style="float:none; margin:0;" onclick="openHistoryModal('${className}')">â³ Xem Lá»‹ch Sá»­ Lá»›p</button>
                   <input type="date" id="date_${className}" value="${new Date().toISOString().split('T')[0]}" style="padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border); outline: none; font-family: inherit; font-size: 0.9rem; font-weight: 600; color: #475569;" title="Chá»n ngÃ y Ä‘iá»ƒm danh (BÃ¹)">
                </div>
                <button class="btn-danger" id="btn_attend_${className}" onclick="startSession('${className}', ${isDemo})">
                    Báº¤M CHá»T ÄIá»‚M DANH
                </button>
            </div>
        `;

        classCard.innerHTML = html;
        container.appendChild(classCard);
    }
}

async function startSession(className, isDemo) {
    if(isDemo) {
        alert("Demo Mode: NÃºt ÄIá»‚M DANH xá»­ lÃ½ hoÃ n háº£o! (NhÆ°ng dá»¯ liá»‡u áº£o sáº½ khÃ´ng bá»‹ trá»« trÃªn Gsheet gá»‘c).");
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
        ? `XÃ¡c nháº­n ÄIá»‚M DANH Lá»›p [${className}] ngÃ y ${displayDate}?\n\nDanh sÃ¡ch Báº¢O LÆ¯U THáºº (${absentStudents.length} báº¡n giá»¯ nguyÃªn):\nðŸ‘‰ ${absentStudents.join(', ')}\n\n(Táº¥t cáº£ báº¡n CÃ“ Máº¶T cÃ²n láº¡i Tá»° Äá»˜NG Bá»Š TRá»ª 1 BUá»”I!`
        : `XÃ¡c nháº­n ÄIá»‚M DANH Lá»›p [${className}] ngÃ y ${displayDate}?\n\nTáº¤T Cáº¢ Há»ŒC VIÃŠN Äá»€U CÃ“ Máº¶T! ðŸ¥³\n(Há»‡ thá»‘ng tá»± Ä‘á»™ng trá»« 1 buá»•i vÃ o tháº» cá»§a ToÃ n lá»›p)`;

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
        const result = await fetchGAS(url, payload);
        
        if(result.status === 'success') {
            alert("âœ… THÃ€NH CÃ”NG: " + result.message);
            applyFastUpdate(result);
        } else {
            alert("Gáº·p lá»—i Cáº­p nháº­t Excel: " + result.message);
        }
    } catch (err) {
        alert("Lá»—i káº¿t ná»‘i tá»« phÃ­a MÃ¡y cá»§a báº¡n tá»›i server Google: " + err.message);
    } finally {
        loader.style.display = "none";
    }
}

// ----------------------------------------------------
// LOGIC MODAL KHAI BÃO Há»ŒC VIÃŠN
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

// ---- LOGIC MODAL GIA Háº N THáºº ----
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
    if(!url) return alert("Demo Mode: TÃ­nh nÄƒng Gia háº¡n cáº§n káº¿t ná»‘i vá»›i Google Sheets tháº­t.");

    const className = document.getElementById("renewClassName").value;
    const studentName = document.getElementById("renewStudentName").innerText;
    const cardVal = document.getElementById("inpRenewCard").value;
    
    const btn = document.getElementById("btnSubmitRenew");
    btn.innerText = "Äang Äá»“ng Bá»™...";
    btn.disabled = true;
    
    const loader = document.getElementById("loader");
    if(loader) loader.style.display = "block";

    try {
        const result = await fetchGAS(url, { action: "renew_card", className: className, studentName: studentName, addAmount: cardVal, newCardType: cardVal });
        if(result.status === 'success') {
            alert("âœ… " + result.message);
            closeRenewModal();
            applyFastUpdate(result);
        } else {
            alert("Lá»—i GSheet: " + result.message);
        }
    } catch(err) {
        alert("Lá»—i Máº¡ng: " + err.message);
    } finally {
        if(loader) loader.style.display = "none";
        btn.innerText = "ðŸ’³ Náº¡p Tháº» Nháº­p Há»‡ Thá»‘ng";
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
    
    // Náº¿u chÆ°a cÃ³ CSDL tháº­t -> Ghi vÃ o máº£ng áº¢o (Demo)
    if(!url) {
        demoData.push({
            Ten_Lop: className, 
            Ten_Hoc_Vien: name, 
            Ngay_Bat_Dau: date,
            Loai_The: card, 
            So_Ngay_Vang: "0", 
            The_Con_Lai: card
        });
        alert("[Báº£n Demo] ÄÃ£ táº¡o thÃ nh cÃ´ng Há»c ViÃªn Má»›i!");
        closeModal();
        document.getElementById("addForm").reset();
        loadData(true);
        return;
    }

    const btn = document.getElementById("btnSubmitForm");
    btn.innerText = "Äang Tá»± Äá»™ng Ghi VÃ o Excel...";
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
        const result = await fetchGAS(url, payload);
        if(result.status === 'success') {
            alert("âœ… " + result.message);
            closeModal();
            document.getElementById("addForm").reset();
            applyFastUpdate(result);
        } else {
            alert("Lá»—i LÆ°u tá»« GSheet: " + result.message);
        }
    } catch(err) {
        alert("Lá»—i ÄÆ°á»ng truyá»n: " + err.message);
    } finally {
        if(loader) loader.style.display = "none";
        btn.innerText = "HoÃ n Táº¥t Khai BÃ¡o";
        btn.disabled = false;
    }
}

// ==== LOGIC Lá»ŠCH Sá»¬ ÄIá»‚M DANH ====

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
        document.getElementById("historyLoading").innerText = "Cháº¿ Ä‘á»™ Demo: KhÃ´ng cÃ³ mÃ¡y chá»§ cung cáº¥p lá»‹ch sá»­.";
        return;
    }

    try {
        const result = await fetchGAS(url, { action: "get_history", className: className });
        document.getElementById("historyLoading").style.display = "none";
        
        if (result.status === 'success') {
            const data = result.data || [];
            if(data.length === 0) {
                 tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 25px; color: #64748b; font-style:italic;">Lá»›p nÃ y chÆ°a cÃ³ buá»•i Lá»‹ch sá»­ Ä‘iá»ƒm danh nÃ o!</td></tr>`;
                 return;
            }
            data.forEach(item => {
                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid var(--border)";
                
                // Äá»“ng bá»™ hiá»ƒn thá»‹ chá»¯ báº¥t cháº¥p dá»¯ liá»‡u cÅ© trong Excel
                let displayAbsent = item.absent;
                if (displayAbsent === "Äi há»c Ä‘á»§" || displayAbsent === "KhÃ´ng cÃ³") displayAbsent = "KhÃ´ng cÃ³ ai";

                // TrÃ¡nh tÃ¬nh tráº¡ng ngÃ¡o mÃ u
                const presentColor = item.present === "KhÃ´ng cÃ³ ai" ? "#64748b" : "#059669";
                const absentColor = displayAbsent === "KhÃ´ng cÃ³ ai" ? "#059669" : "#dc2626";
                const absentWeight = displayAbsent === "KhÃ´ng cÃ³ ai" ? "600" : "700";

                tr.innerHTML = `
                   <td style="padding: 12px 10px; font-weight: 700;">${item.date}</td>
                   <td style="padding: 12px 10px; color: ${presentColor}; font-weight: 600;">${item.present}</td>
                   <td style="padding: 12px 10px; color: ${absentColor}; font-weight: ${absentWeight}; margin-left:1px;">${displayAbsent}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            document.getElementById("historyLoading").style.display = "block";
            document.getElementById("historyLoading").innerText = "Lá»—i: " + result.message;
        }
    } catch(err) {
        document.getElementById("historyLoading").style.display = "block";
        document.getElementById("historyLoading").innerHTML = `<span style="color:red">Lá»—i: ${err.message}</span>`;
        console.error("GET_HISTORY_ERROR:", err);
    }
}

window.deductIndividual = async function(studentName, className) {
    if (!confirm(`Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xá»­ lÃ½ chá»©c nÄƒng [THÃŠM 1 CA / XOÃ Váº®NG] cho há»c viÃªn ${studentName} trong ngÃ y hÃ´m nay khÃ´ng?\n\n(Há»‡ thá»‘ng sáº½ tá»± nháº­n diá»‡n: Náº¿u lá»¡ Ä‘Ã¡nh váº¯ng sáº½ Trá»« Tháº» + XoÃ¡ Váº¯ng. Náº¿u cÃ³ máº·t sáºµn sáº½ Trá»« Tháº» + TÄƒng 1 Ca)`)) return;

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
        alert("TÃ­nh nÄƒng Cáº¥n Trá»« Láº» chá»‰ hoáº¡t Ä‘á»™ng khi cÃ³ káº¿t ná»‘i API tháº­t!");
        return;
    }

    const loader = document.getElementById("loader");
    loader.style.display = "block";

    try {
        const result = await fetchGAS(url, { action: "deduct_individual", className: className, studentName: studentName, date: selectedDate });
        
        if(result.status === 'success') {
            alert("âœ… ThÃ nh cÃ´ng: " + result.message);
            applyFastUpdate(result);
        } else {
            alert("âŒ Lá»—i Server: " + result.message);
        }
    } catch(err) {
        alert("âŒ Lá»—i Máº¡ng: " + err.message);
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

async function fetchGAS(url, payload, retries = 3) {
    if(!url) return null;
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const rawText = await response.text();
        try {
            return JSON.parse(rawText);
        } catch(e) {
            if (retries > 0) {
                console.warn('[Auto-Retry] Máy ch? Google ph?n h?i HTML, dang th? l?i...', retries);
                await new Promise(r => setTimeout(r, 1500));
                return await fetchGAS(url, payload, retries - 1);
            } throw new Error('Google Server Error');
        }
    } catch(err) {
        if (retries > 0) {
            console.warn('[Auto-Retry] L?i k?t n?i, dang th? l?i...', retries);
            await new Promise(r => setTimeout(r, 1500));
            return await fetchGAS(url, payload, retries - 1);
        } throw err;
    }
}


