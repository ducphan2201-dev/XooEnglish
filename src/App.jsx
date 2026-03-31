import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("XOO_API_URL") || "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    // Tự tải Data nếu URL đã lưu ở lần truy cập trước
    if (apiUrl) loadData();
  }, []); // Run once on mount

  const loadData = async () => {
    if (!apiUrl.trim()) {
      alert("Vui lòng nhập Link API (Web App URL) Google Sheets!");
      return;
    }
    localStorage.setItem("XOO_API_URL", apiUrl);
    setLoading(true);
    try {
      const response = await fetch(apiUrl + "?t=" + new Date().getTime());
      const result = await response.json();
      if (result.status === 'success') {
        setData(result.data);
      } else {
        alert("Lỗi tải dữ liệu: " + (result.message || "Unknown error"));
      }
    } catch (err) {
      alert("Không thể kết nối với Web App API của GSheet. Bạn đã Deploy đúng Link chưa?\nLỗi chi tiết: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>XooEnglish Dashboard</h1>
        <p className="subtitle">Hệ thống Điểm danh 1-Chạm & Tự động báo hết tiền học phí</p>
      </header>

      <div className="setup-card">
        <h3>Cấu trúc Cơ sở dữ liệu (Google Sheets API) 🚀</h3>
        <p className="text-muted">Nhập Web App URL (Sau khi bạn đã Deploy Code.gs lên Sheets) vào thanh dưới đây để kết nối với bảng tính vĩnh viễn.</p>
        <div className="input-group">
          <input 
            type="text" 
            value={apiUrl} 
            onChange={e => setApiUrl(e.target.value)} 
            placeholder="https://script.google.com/macros/s/.../exec" 
          />
          <button className="btn-primary" onClick={loadData}>Tải Dữ Liệu Lớp</button>
        </div>
      </div>

      {loading && <div className="loader"></div>}

      <div className="class-grid">
         {(!loading && data.length === 0) && (
            <p className="empty-state">Chưa có ai trong danh sách hoặc Tải chưa thành công.</p>
         )}
         <ClassList data={data} apiUrl={apiUrl} onRefresh={loadData} />
      </div>
    </div>
  )
}

function ClassList({ data, apiUrl, onRefresh }) {
  const classesMap = {};
  data.forEach(row => {
    const className = row["Ten_Lop"];
    if (!className) return; 
    if (!classesMap[className]) classesMap[className] = [];
    classesMap[className].push(row);
  });

  return Object.entries(classesMap).map(([className, students]) => (
    <ClassCard key={className} className={className} students={students} apiUrl={apiUrl} onRefresh={onRefresh} />
  ));
}

function ClassCard({ className, students, apiUrl, onRefresh }) {
  const [absences, setAbsences] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  const handleToggle = (studentName) => {
    const newAbsences = new Set(absences);
    if (newAbsences.has(studentName)) newAbsences.delete(studentName);
    else newAbsences.add(studentName);
    setAbsences(newAbsences);
  };

  const startSession = async () => {
    const absentArr = Array.from(absences);
    const msg = absentArr.length > 0 
      ? `XÁC NHẬN ĐIỂM DANH HOÀN TẤT LỚP ${className}?\nDanh sách vắng MẶT (${absentArr.length} bạn):\n👉 ${absentArr.join(', ')}\n(Các bạn CÓ MẶT còn lại sẽ TỰ ĐỘNG BỊ TRỪ -1 THẺ HỌC!`
      : `XÁC NHẬN ĐIỂM DANH LỚP ${className} HÔM NAY?\nTẤT CẢ các em đều CÓ MẶT! 🥳\n(App sẽ gửi lệnh Trừ tự động 1 buổi vào thẻ của Nguyên cả lớp)`;

    if (!confirm(msg)) return;

    setSubmitting(true);
    const payload = {
      action: "start_session",
      className: className,
      absences: absentArr
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" } // Bypass preflight
      });
      const result = await response.json();
      if (result.status === 'success') {
        alert(result.message);
        setAbsences(new Set()); 
        onRefresh(); 
      } else {
        alert("Xảy ra lỗi Cập nhật trên Gsheet: " + result.message);
      }
    } catch (err) {
      alert("Mất kết nối với Google: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="class-card">
      <div className="class-header">
        <div>📚 {className}</div>
        <div className="student-count">Sĩ số: {students.length}</div>
      </div>
      <div className="student-list">
        {students.map((std, i) => {
          let remain = std["The_Con_Lai"];
          const cardType = std["Loai_The"] || "0";
          if (remain === "" || remain === undefined) remain = cardType;
          remain = parseInt(remain);
          
          const isExpired = remain <= 0;
          const abs = std["So_Ngay_Vang"] || "0";

          return (
            <div key={i} className={`student-item ${isExpired ? 'expired' : ''}`}>
              <div className="student-info">
                <h4>{std["Ten_Hoc_Vien"]}</h4>
                <div className="student-stats">
                  <span className={`tag ${isExpired ? 'tag-danger' : 'tag-blue'}`}>Thẻ: {cardType}b</span>
                  <span style={{marginLeft: 8}}>Đã vắng: <b>{abs}</b> | Còn: <b style={{color: isExpired ? 'var(--danger)' : 'var(--primary)', fontSize: '1.1rem'}}>{remain}</b></span>
                  {isExpired && <div className="alert-text">⚠️ Hết buổi: Học viên cần đóng thêm tiền mua thẻ!</div>}
                </div>
              </div>
              <label className="absence-toggle" title="Nếu học viên này nghỉ, TICK CHỌN để được Bảo Lưu thẻ!">
                Báo Vắng?
                <input 
                  type="checkbox" 
                  checked={absences.has(std["Ten_Hoc_Vien"])}
                  onChange={() => handleToggle(std["Ten_Hoc_Vien"])}
                />
              </label>
            </div>
          )
        })}
      </div>
      <div className="card-footer">
        <button className="btn-danger" onClick={startSession} disabled={submitting}>
          {submitting ? "Đang xử lý trừ thẻ trên Excel..." : "BẤM ĐIỂM DANH LỚP HÔM NAY"}
        </button>
      </div>
    </div>
  )
}

export default App
