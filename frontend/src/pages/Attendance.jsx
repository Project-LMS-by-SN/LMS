import { useEffect, useState, useCallback, useRef } from "react";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import { formatTime } from "../utils/timeUtils";
import { FaCreditCard, FaCamera, FaSearch, FaDownload, FaBolt, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import QRCodeLib from "qrcode";
import CustomDatePicker from "../components/CustomDatePicker";

const formatDateLocal = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMinAllowedDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return formatDateLocal(d);
};

const getMaxAllowedDate = () => {
  return formatDateLocal(new Date());
};

const Attendance = () => {
  const searchFormRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [activeCheckIns, setActiveCheckIns] = useState([]);
  const [showActivePanel, setShowActivePanel] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const todayStr = formatDateLocal(new Date());
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDateLocal(d);
  })();

  const [dateMode, setDateMode] = useState("today"); // "today", "yesterday", "custom"
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [attendanceMode, setAttendanceMode] = useState("manual"); // "manual", "qr"
  const [simulatedCode, setSimulatedCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const { darkMode, timeFormat } = useTheme();

  useEffect(() => {
    const baseUrl = window.location.origin;
    const currentUser = (() => { try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); } catch { return {}; } })();
    const currentBranchId = currentUser.branchId || 1;
    const attendanceUrl = `${baseUrl}/public-attendance?branchId=${currentBranchId}`;
    QRCodeLib.toDataURL(attendanceUrl, {
      width: 280,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then((url) => setQrDataUrl(url)).catch(() => {});
  }, []);

  const debounceTimer = useRef(null);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.trim().length < 1) { setSuggestions([]); return; }
    try {
      const res = await api.get(`/students/search?q=${encodeURIComponent(q.trim())}`);
      setSuggestions(res.data.data || []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowSuggestions(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await api.get("/attendance");
      setAttendanceList(res.data.data);
    } catch (err) {
      console.log("Fetch attendance error:", err);
    }
  }, []);

  const fetchActiveCheckIns = useCallback(async () => {
    try {
      const res = await api.get("/attendance/active");
      setActiveCheckIns(res.data.data);
    } catch (err) {
      console.log("Fetch active check-ins error:", err);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchActiveCheckIns();
  }, [fetchAttendance, fetchActiveCheckIns]);

  const filteredAttendanceList = attendanceList.filter((a) => {
    if (!a.attendance_date) return false;
    return a.attendance_date >= startDate && a.attendance_date <= endDate;
  });

  const handleDateModeChange = (mode, customVal = null) => {
    setDateMode(mode);
    if (mode === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (mode === "yesterday") {
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
    } else if (mode === "last30") {
      setStartDate(getMinAllowedDate());
      setEndDate(getMaxAllowedDate());
    } else if (mode === "custom" && customVal) {
      setStartDate(customVal);
      setEndDate(customVal);
    }
  };

  const handleSearch = async (e, queryOverride) => {
    if (e) e.preventDefault();
    const query = queryOverride ?? searchQuery.trim();
    if (!query) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setStudentData(null);
    setSelectedShiftId(null);
    try {
      const res = await api.get(`/attendance/search?q=${encodeURIComponent(query)}`);
      if (!res.data.data) {
        setError("No student found");
        setLoading(false);
        return;
      }
      setStudentData(res.data.data);
      const assignments = res.data.data.assignments || [];
      const todayAtt = res.data.data.todayAttendance || [];
      const activeAtt = todayAtt.find(a => a.check_in_time && !a.check_out_time);
      if (activeAtt) {
        setSelectedShiftId(activeAtt.shift_id);
      } else if (assignments.length === 1) {
        setSelectedShiftId(assignments[0].shift_id);
      } else if (assignments.length > 1) {
        const now = new Date();
        const currMin = now.getHours() * 60 + now.getMinutes();
        const matchingAss = assignments.find(a => {
          const [sh, sm] = (a.start_time || "00:00").split(":").map(Number);
          const [eh, em] = (a.end_time || "00:00").split(":").map(Number);
          const sMin = sh * 60 + sm;
          const eMin = eh * 60 + em;
          const allowedStart = Math.max(0, sMin - 30);
          if (eMin < sMin) {
            return currMin >= allowedStart || currMin <= eMin;
          }
          return currMin >= allowedStart && currMin <= eMin;
        });
        if (matchingAss) {
          setSelectedShiftId(matchingAss.shift_id);
        } else {
          const attendedIds = todayAtt.map(a => a.shift_id);
          const firstUnattended = assignments.find(a => !attendedIds.includes(a.shift_id));
          setSelectedShiftId(firstUnattended ? firstUnattended.shift_id : assignments[0].shift_id);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search student");
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (scannedCode) => {
    if (!scannedCode) return;
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const query = scannedCode.trim();
      const currentUser = (() => { try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); } catch { return {}; } })();
      const currentBranchId = currentUser.branchId || 1;

      const res = await api.post("/attendance/public-checkin", {
        studentCodeOrMobile: query,
        branchId: currentBranchId,
      });

      if (res.data?.success) {
        const fullMsg = res.data.message + (res.data.subMessage ? ` - ${res.data.subMessage}` : "");
        setSuccessMsg(fullMsg);
        fetchAttendance();
        fetchActiveCheckIns();
      } else {
        setError(res.data?.message || "Failed to process attendance");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "QR Code scan failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = "library-attendance-qr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getConsecutiveBlockForShift = (targetShiftId, assignments) => {
    if (!targetShiftId || !assignments || assignments.length === 0) return [];
    
    // Sort assignments by start time
    const sorted = [...assignments].sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    const areConsecutive = (s1, s2) => {
      const [h1, m1] = s1.end_time.split(":").map(Number);
      const [h2, m2] = s2.start_time.split(":").map(Number);
      const end1 = h1 * 60 + m1;
      const start2 = h2 * 60 + m2;
      const gap = start2 - end1;
      return gap >= 0 && gap <= 15;
    };

    const targetIdx = sorted.findIndex(a => a.shift_id === targetShiftId);
    if (targetIdx === -1) return [];

    const target = sorted[targetIdx];
    const block = [target];

    let curr = target;
    for (let i = targetIdx + 1; i < sorted.length; i++) {
      if (areConsecutive(curr, sorted[i])) {
        block.push(sorted[i]);
        curr = sorted[i];
      } else {
        break;
      }
    }

    curr = target;
    for (let i = targetIdx - 1; i >= 0; i--) {
      if (areConsecutive(sorted[i], curr)) {
        block.unshift(sorted[i]);
        curr = sorted[i];
      } else {
        break;
      }
    }

    return block.map(b => b.shift_id);
  };

  const getSelectedAssignment = () => {
    if (!studentData) return null;
    const assignments = studentData.assignments || [];
    if (assignments.length === 1) return assignments[0];
    return assignments.find(a => a.shift_id === selectedShiftId) || null;
  };

  const getTodayForShift = (shiftId) => {
    if (!studentData?.todayAttendance) return null;
    return studentData.todayAttendance.find(a => a.shift_id === shiftId) || null;
  };

  const handleCheckIn = async () => {
    if (!studentData?.student?.id) return;
    const selected = getSelectedAssignment();
    if (!selected) {
      setError("Please select a shift first");
      return;
    }
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.post("/attendance/check-in", {
        student_id: studentData.student.id,
        shift_id: selected.shift_id
      });
      setSuccessMsg(res.data.message);
      const query = searchQuery.trim() || studentData.student.student_code;
      const refreshRes = await api.get(`/attendance/search?q=${encodeURIComponent(query)}`);
      setStudentData(refreshRes.data.data);
      fetchAttendance();
      fetchActiveCheckIns();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    if (!studentData?.student?.id) return;
    const selected = getSelectedAssignment();
    if (!selected) {
      setError("Please select a shift first");
      return;
    }
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.post("/attendance/check-out", {
        student_id: studentData.student.id,
        shift_id: selected.shift_id
      });
      setSuccessMsg(res.data.message);
      const query = searchQuery.trim() || studentData.student.student_code;
      const refreshRes = await api.get(`/attendance/search?q=${encodeURIComponent(query)}`);
      setStudentData(refreshRes.data.data);
      fetchAttendance();
      fetchActiveCheckIns();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to check out");
    }
  };

  const handleCheckoutAllActive = async () => {
    if (activeCheckIns.length === 0) return;
    if (!window.confirm(`Check out / Logout all ${activeCheckIns.length} active students currently in the library?`)) return;
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.post("/attendance/checkout-all");
      setSuccessMsg(res.data.message || `Checked out all active students`);
      fetchAttendance();
      fetchActiveCheckIns();
      if (studentData) {
        const query = searchQuery.trim() || studentData.student.student_code;
        const refreshRes = await api.get(`/attendance/search?q=${encodeURIComponent(query)}`);
        setStudentData(refreshRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to check out active students");
    }
  };

  const handleDirectCheckoutByCode = async (studentCode) => {
    setError("");
    setSuccessMsg("");
    try {
      const searchRes = await api.get(`/attendance/search?q=${encodeURIComponent(studentCode)}`);
      const sData = searchRes.data.data;
      if (!sData) throw new Error("Student not found");
      const activeCheckIn = (sData.todayAttendance || []).find(a => a.check_in_time && !a.check_out_time);
      if (!activeCheckIn) throw new Error("No active check-in found for this student");

      const res = await api.post("/attendance/check-out", {
        student_id: sData.student.id,
        shift_id: activeCheckIn.shift_id
      });
      setSuccessMsg(res.data.message || `Checked out ${sData.student.full_name}`);
      fetchAttendance();
      fetchActiveCheckIns();
      if (studentData && studentData.student.student_code === studentCode) {
        const refreshRes = await api.get(`/attendance/search?q=${encodeURIComponent(studentCode)}`);
        setStudentData(refreshRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to check out student");
    }
  };

  const studentHistory = studentData
    ? filteredAttendanceList.filter(a => a.student_code === studentData.student.student_code)
    : [];

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const cardBg = darkMode ? "#1e293b" : "white";
  const borderColor = darkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const textPrimary = darkMode ? "#f8fafc" : "#0f172a";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <h1>Attendance</h1>
          <p>Redesigned attendance module with QR scanner and fast filters · {today}</p>
        </div>
      </div>

      {/* 1. Date Selector Row */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          onClick={() => handleDateModeChange("today")}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            border: `1px solid ${dateMode === "today" ? "#2563eb" : borderColor}`,
            background: dateMode === "today" ? "#eff6ff" : cardBg,
            color: dateMode === "today" ? "#2563eb" : textSecondary,
            transition: "all 0.2s"
          }}
        >
          Today
        </button>
        <button
          onClick={() => handleDateModeChange("yesterday")}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            border: `1px solid ${dateMode === "yesterday" ? "#2563eb" : borderColor}`,
            background: dateMode === "yesterday" ? "#eff6ff" : cardBg,
            color: dateMode === "yesterday" ? "#2563eb" : textSecondary,
            transition: "all 0.2s"
          }}
        >
          Yesterday
        </button>
        <div style={{ width: "200px" }}>
          <CustomDatePicker
            id="custom-datepicker"
            value={dateMode === "custom" ? startDate : ""}
            min={getMinAllowedDate()}
            max={getMaxAllowedDate()}
            placeholder="Calendar date"
            onChange={(e) => {
              if (e.target.value) {
                handleDateModeChange("custom", e.target.value);
              }
            }}
          />
        </div>

        <span style={{ fontSize: "13px", color: textSecondary, marginLeft: "auto", fontWeight: 500 }}>
          Showing logs for: <strong style={{ color: textPrimary }}>{startDate === endDate ? startDate : `${startDate} to ${endDate}`}</strong> ({filteredAttendanceList.length} logs found)
        </span>
      </div>

      {/* Retention Notice Banner */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 16px",
        borderRadius: "10px",
        background: darkMode ? "rgba(59, 130, 246, 0.1)" : "#eff6ff",
        border: `1px solid ${darkMode ? "rgba(59, 130, 246, 0.2)" : "#bfdbfe"}`,
        color: darkMode ? "#93c5fd" : "#1e40af",
        fontSize: "13px",
        marginBottom: "20px"
      }}>
        <FaBolt style={{ color: "#3b82f6", flexShrink: 0 }} />
        <span>
          <strong>Note:</strong> Attendance records are maintained for <strong>30 days</strong>. Data older than 30 days is automatically cleared.
        </span>
      </div>

      {/* 2. Attendance Mode Tabs */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "20px",
        borderBottom: `1px solid ${borderColor}`,
        paddingBottom: "12px"
      }}>
        <button
          onClick={() => {
            setAttendanceMode("manual");
            setError("");
            setSuccessMsg("");
            setStudentData(null);
          }}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            border: "none",
            background: attendanceMode === "manual" ? "#2563eb" : "transparent",
            color: attendanceMode === "manual" ? "white" : textSecondary,
            transition: "all 0.2s"
          }}
        >
          <FaSearch style={{ marginRight: "6px", verticalAlign: "middle" }} /> Manual Attendance
        </button>
        <button
          onClick={() => {
            setAttendanceMode("qr");
            setError("");
            setSuccessMsg("");
            setStudentData(null);
          }}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            border: "none",
            background: attendanceMode === "qr" ? "#2563eb" : "transparent",
            color: attendanceMode === "qr" ? "white" : textSecondary,
            transition: "all 0.2s"
          }}
        >
          <FaCamera style={{ marginRight: "6px", verticalAlign: "middle" }} /> QR Attendance
        </button>
      </div>

      <div className="attendance-two-panel" style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "250px" }}>
          
          {/* A. Manual Tab Section */}
          {attendanceMode === "manual" && (
            <>
              <div style={{ position: "relative", maxWidth: "500px", marginBottom: "20px" }}>
                <form ref={searchFormRef} onSubmit={(e) => { e.preventDefault(); setShowSuggestions(false); handleSearch(); }}>
                  <div className="search-box">
                    <FaSearch style={{ color: textSecondary, minWidth: "16px" }} />
                    <input
                      type="text"
                      placeholder="Search by name, code (LI00001), or reg number..."
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      autoComplete="off"
                    />
                  </div>
                </form>
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                    background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)", maxHeight: "240px", overflowY: "auto",
                    marginTop: "4px",
                  }}>
                    {suggestions.map((s) => (
                      <div
                        key={s.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const val = s.student_code || s.full_name;
                          setSearchQuery(val);
                          setShowSuggestions(false);
                          handleSearch(null, val);
                        }}
                        style={{
                          padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                          borderBottom: `1px solid ${borderColor}`, fontSize: "14px", color: textPrimary,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? "#334155" : "#f1f5f9"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <div>
                          <span style={{ fontWeight: 600 }}>{s.full_name}</span>
                          <span style={{ fontSize: "12px", color: textSecondary, marginLeft: "8px" }}>{s.student_code}</span>
                        </div>
                        {s.mobile && <span style={{ fontSize: "12px", color: textSecondary }}>{s.mobile}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {loading && <p style={{ color: textSecondary }}>Searching...</p>}
            </>
          )}

          {/* B. QR Tab Section */}
          {attendanceMode === "qr" && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
                background: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: "16px",
                padding: "24px",
                maxWidth: "500px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
              }}>
                <h3 style={{ fontSize: "16px", color: textPrimary, margin: 0, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaCamera style={{ color: "#2563eb" }} /> Library Attendance QR Code
                </h3>
                <p style={{ color: textSecondary, fontSize: "13px", margin: 0, alignSelf: "flex-start" }}>
                  Download and print this QR code for the library entrance. Students can scan this code to check in and out.
                </p>
                
                {/* QR Code Container */}
                <div style={{ padding: "20px", background: "white", border: `2px solid ${borderColor}`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Library Attendance QR Code" style={{ width: "280px", height: "280px", borderRadius: "8px" }} />
                  ) : (
                    <div style={{ width: "280px", height: "280px", display: "flex", alignItems: "center", justifyContent: "center", color: textSecondary }}>Generating QR...</div>
                  )}
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownloadPNG}
                  className="primary-btn"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <FaDownload /> Download QR Code (PNG)
                </button>

                {/* Instant Barcode / QR Scanner Input */}
                <div style={{ width: "100%", borderTop: `1px solid ${borderColor}`, paddingTop: "16px", marginTop: "4px" }}>
                  <form onSubmit={(e) => { e.preventDefault(); handleQRScan(simulatedCode); setSimulatedCode(""); }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: textSecondary, display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <FaBolt style={{ color: "#eab308" }} /> Scan Barcode / Enter Student Code for Instant Check-In/Out:
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="e.g. STD00001"
                        value={simulatedCode}
                        onChange={(e) => setSimulatedCode(e.target.value)}
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: "8px",
                          border: `1px solid ${borderColor}`, background: cardBg, color: textPrimary, fontSize: "14px", outline: "none"
                        }}
                      />
                      <button type="submit" className="primary-btn" disabled={loading} style={{ padding: "8px 16px", fontSize: "13px" }}>
                        {loading ? "Processing..." : "Submit"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="form-card" style={{ borderColor: "#fecaca", background: "#fef2f2", maxWidth: "500px", marginBottom: "20px" }}>
              <p style={{ color: "#dc2626", fontWeight: 500, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <FaExclamationTriangle /> {error}
              </p>
            </div>
          )}

          {successMsg && (
            <div className="form-card" style={{ borderColor: "#bbf7d0", background: "#f0fdf4", maxWidth: "500px", marginBottom: "20px" }}>
              <p style={{ color: "#15803d", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <FaCheckCircle /> {successMsg}
              </p>
            </div>
          )}

          {/* Searched Student Attendance Detail Panel (Manual Mode) */}
          {studentData && (
            <>
              <div className="form-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <h2 style={{ fontSize: "20px", margin: 0, color: textPrimary }}>{studentData.student.full_name}</h2>
                    <p style={{ color: textSecondary, fontSize: "13px", marginTop: "4px" }}>
                      {studentData.student.student_code}
                      {studentData.student.reg_no && <> | {studentData.student.reg_no}</>}
                    </p>
                  </div>
                  <span className={studentData.student.account_status === "ACTIVE" ? "status-badge" : "danger-badge"}>
                    {studentData.student.account_status}
                  </span>
                </div>

                {(studentData.assignments || []).length > 0 ? (
                  <>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                      {(studentData.assignments || []).map((a) => {
                        const consecutiveIds = getConsecutiveBlockForShift(selectedShiftId, studentData.assignments);
                        const isInSelectedBlock = selectedShiftId === a.shift_id || consecutiveIds.includes(a.shift_id);
                        const todayAttendance = getTodayForShift(a.shift_id);
                        return (
                          <div
                            key={a.shift_id}
                            onClick={() => setSelectedShiftId(a.shift_id)}
                            style={{
                              padding: "10px 16px", borderRadius: "8px", cursor: "pointer",
                              border: `2px solid ${isInSelectedBlock ? "#2563eb" : borderColor}`,
                              background: isInSelectedBlock ? "#eff6ff" : cardBg,
                              color: isInSelectedBlock ? "#2563eb" : textPrimary,
                              transition: "all 0.2s", flex: "1 1 auto", minWidth: "150px",
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: "14px" }}>{a.shift_name}</div>
                            <div style={{ fontSize: "12px", color: textSecondary }}>{formatTime(a.start_time, timeFormat)} - {formatTime(a.end_time, timeFormat)}</div>
                            {a.seat_number && <div style={{ fontSize: "12px", color: textSecondary }}>Seat: {a.seat_number}</div>}
                            {todayAttendance && (
                              <div style={{ marginTop: "4px", fontSize: "12px" }}>
                                {todayAttendance.check_in_time && !todayAttendance.check_out_time && <span style={{ color: "#15803d" }}>In at {formatTime(todayAttendance.check_in_time, timeFormat)}</span>}
                                {todayAttendance.check_in_time && todayAttendance.check_out_time && <span style={{ color: "#dc2626" }}>Done ({formatTime(todayAttendance.check_in_time, timeFormat)} - {formatTime(todayAttendance.check_out_time, timeFormat)})</span>}
                              </div>
                            )}
                            {isInSelectedBlock && (
                              <div style={{ marginTop: "4px", fontSize: "11px", color: "#2563eb", fontWeight: 600 }}>
                                {selectedShiftId === a.shift_id ? "Selected" : "Consecutive Block"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      {getSelectedAssignment() && !getTodayForShift(selectedShiftId) && (
                        <button className="primary-btn" onClick={handleCheckIn}>IN</button>
                      )}
                      {getSelectedAssignment() && getTodayForShift(selectedShiftId) && !getTodayForShift(selectedShiftId)?.check_out_time && (
                        <>
                          <div className="profile-info-group">
                            <div className="profile-info-label">Checked In At</div>
                            <div className="profile-info-value" style={{ color: "#15803d" }}>{formatTime(getTodayForShift(selectedShiftId).check_in_time, timeFormat)}</div>
                          </div>
                          <button className="primary-btn" onClick={handleCheckOut} style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>OUT</button>
                        </>
                      )}
                      {getSelectedAssignment() && getTodayForShift(selectedShiftId)?.check_out_time && (
                        <div style={{ display: "flex", gap: "12px" }}>
                          <div className="profile-info-group">
                            <div className="profile-info-label">Checked In</div>
                            <div className="profile-info-value" style={{ color: "#15803d" }}>{formatTime(getTodayForShift(selectedShiftId).check_in_time, timeFormat)}</div>
                          </div>
                          <div className="profile-info-group">
                            <div className="profile-info-label">Checked Out</div>
                            <div className="profile-info-value" style={{ color: "#dc2626" }}>{formatTime(getTodayForShift(selectedShiftId).check_out_time, timeFormat)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p style={{ color: "#dc2626" }}>No active shift assignment found</p>
                )}
              </div>

              {/* Attendance History */}
              <div className="table-card" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                <h3 style={{ marginBottom: "16px", fontSize: "16px", color: textPrimary }}>
                  Attendance History
                  <span style={{ fontSize: "13px", fontWeight: 400, color: textSecondary, marginLeft: "8px" }}>
                    ({startDate} to {endDate})
                  </span>
                </h3>
                <table>
                  <thead>
                    <tr style={{ color: textSecondary }}>
                      <th>Date</th><th>Shift</th><th>Status</th><th>Check In</th><th>Check Out</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: textPrimary }}>
                    {studentHistory.map((a) => (
                      <tr key={a.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                        <td>{a.attendance_date}</td>
                        <td>{a.shift_name}</td>
                        <td><span className={a.status === "PRESENT" ? "status-badge" : "danger-badge"}>{a.status}</span></td>
                        <td>{formatTime(a.check_in_time, timeFormat) || "—"}</td>
                        <td>{formatTime(a.check_out_time, timeFormat) || "—"}</td>
                      </tr>
                    ))}
                    {studentHistory.length === 0 && (
                      <tr><td colSpan={5} className="empty-text" style={{ color: textSecondary }}>No records in this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 3. Global Attendance Log List */}
          {!studentData && (
            <div className="table-card" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
              <h3 style={{ marginBottom: "16px", fontSize: "16px", color: textPrimary }}>
                All Attendance Logs
                <span style={{ fontSize: "13px", fontWeight: 400, color: textSecondary, marginLeft: "8px" }}>
                  ({startDate} to {endDate} · {filteredAttendanceList.length} records)
                </span>
              </h3>
              <table>
                <thead>
                  <tr style={{ color: textSecondary }}>
                    <th>Date</th><th>Name</th><th>Shift</th><th>Status</th><th>In</th><th>Out</th>
                  </tr>
                </thead>
                <tbody style={{ color: textPrimary }}>
                  {filteredAttendanceList.slice(0, 50).map(a => (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <td>{a.attendance_date}</td>
                      <td style={{ fontWeight: 500 }}>{a.full_name}</td>
                      <td>{a.shift_name}</td>
                      <td><span className={a.status === "PRESENT" ? "status-badge" : "danger-badge"}>{a.status}</span></td>
                      <td>{formatTime(a.check_in_time, timeFormat) || "—"}</td>
                      <td>{formatTime(a.check_out_time, timeFormat) || "—"}</td>
                    </tr>
                  ))}
                  {filteredAttendanceList.length === 0 && (
                    <tr><td colSpan={6} className="empty-text" style={{ color: textSecondary }}>No attendance records in this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. Right Panel: Active Members In Library */}
        <div className="attendance-right-panel" style={{ width: "300px", flexShrink: 0 }}>
          <div
            className="form-card"
            style={{ cursor: "pointer", padding: "16px 20px", background: cardBg, border: `1px solid ${borderColor}` }}
            onClick={() => setShowActivePanel(!showActivePanel)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", margin: 0, color: textPrimary }}>In Library</h3>
              <span className="status-badge" style={{ fontSize: "13px" }}>{activeCheckIns.length}</span>
            </div>
          </div>

          {showActivePanel && (
            <div className="form-card" style={{ marginTop: "8px", background: cardBg, border: `1px solid ${borderColor}` }}>
              {activeCheckIns.length === 0 ? (
                <p className="empty-text" style={{ color: textSecondary }}>No students currently in library</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activeCheckIns.map((item, idx) => (
                    <div
                      key={idx}
                      className="profile-info-group"
                      style={{ cursor: "pointer", borderBottom: idx < activeCheckIns.length - 1 ? `1px solid ${borderColor}` : "none", paddingBottom: idx < activeCheckIns.length - 1 ? "10px" : 0 }}
                      onClick={() => {
                        setAttendanceMode("manual");
                        setSearchQuery(item.student_code);
                        setShowActivePanel(false);
                        handleSearch(null, item.student_code);
                      }}
                    >
                      <div className="profile-info-label" style={{ fontSize: "10px" }}>{item.student_code}</div>
                      <div className="profile-info-value" style={{ fontSize: "14px", color: textPrimary }}>{item.full_name}</div>
                      <div style={{ fontSize: "11px", color: "#15803d", marginTop: "2px" }}>In: {formatTime(item.check_in_time, timeFormat)} - {item.shift_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;