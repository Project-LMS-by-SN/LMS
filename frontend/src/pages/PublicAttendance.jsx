import { useState, useEffect } from "react";
import { FaClock, FaCheckCircle, FaSignOutAlt, FaSignInAlt, FaUserCheck, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import { formatTime } from "../utils/timeUtils";

const PublicAttendance = () => {
  const { timeFormat } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studentCodeOrMobile, setStudentCodeOrMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(5);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 5-second countdown & auto close timer when result is displayed
  useEffect(() => {
    let timer;
    if (result) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Attempt auto close window / tab
            try {
              window.close();
            } catch (e) {}
            try {
              window.open("", "_self", "").close();
            } catch (e) {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [result]);

  const handleMarkAttendance = async (e) => {
    if (e) e.preventDefault();
    if (!studentCodeOrMobile || !studentCodeOrMobile.trim()) {
      setErrorMsg("Please enter your Student Code or Mobile Number.");
      return;
    }

    setErrorMsg("");
    setResult(null);
    setSubmitting(true);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const branchIdFromUrl = searchParams.get("branchId") || "1";

      const res = await api.post("/attendance/public-checkin", {
        studentCodeOrMobile: studentCodeOrMobile.trim(),
        branchId: parseInt(branchIdFromUrl),
      });

      if (res.data && res.data.success) {
        setResult(res.data);
        setStudentCodeOrMobile("");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to mark attendance. Please verify details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualClose = () => {
    try {
      window.close();
    } catch (e) {}
    try {
      window.open("", "_self", "").close();
    } catch (e) {}
  };

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 14px", color: "#fff",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      <style>{`
        .att-input {
          width: 100%;
          background: rgba(15, 23, 42, 0.7);
          color: #f8fafc;
          border: 2px solid rgba(59, 130, 246, 0.4);
          border-radius: 16px;
          padding: 16px 18px;
          font-size: 18px;
          font-weight: 600;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
          text-align: center;
          letter-spacing: 0.5px;
        }
        .att-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
          background: rgba(15, 23, 42, 0.9);
        }
        @media (max-width: 480px) {
          .att-card {
            padding: 24px 16px !important;
            border-radius: 20px !important;
          }
          .att-time {
            font-size: 32px !important;
          }
        }
      `}</style>

      <div className="att-card" style={{
        background: "rgba(30, 41, 59, 0.95)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "24px",
        padding: "36px 24px", width: "100%", maxWidth: "520px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        boxSizing: "border-box", textAlign: "center",
      }}>
        
        {/* Header Icon & Live Clock */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "60px", height: "60px", borderRadius: "20px",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", marginBottom: "14px",
            boxShadow: "0 10px 24px rgba(59, 130, 246, 0.4)",
          }}>
            <FaUserCheck style={{ fontSize: "28px", color: "#fff" }} />
          </div>
          
          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px 0", color: "#f8fafc" }}>
            Library Gate Attendance
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
            Enter your Student Code or Mobile Number to Check In / Out
          </p>
        </div>

        {/* Clock Box */}
        <div style={{
          background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px", padding: "16px", marginBottom: "24px",
        }}>
          <div className="att-time" style={{ fontSize: "36px", fontWeight: 900, color: "#60a5fa", letterSpacing: "1px" }}>
            {formattedTime}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginTop: "4px" }}>
            {formattedDate}
          </div>
        </div>

        {/* Success & Thank You Alert Banner with 5s Countdown Auto-Close */}
        {result && (
          <div style={{
            background: result.action === "CHECK_IN" ? "rgba(16, 185, 129, 0.15)" : result.action === "CHECK_OUT" ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
            border: `2px solid ${result.action === "CHECK_IN" ? "#10b981" : result.action === "CHECK_OUT" ? "#f59e0b" : "#3b82f6"}`,
            borderRadius: "18px", padding: "22px 18px", marginBottom: "24px",
            animation: "fadeIn 0.3s ease-in-out",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: result.action === "CHECK_IN" ? "#10b981" : result.action === "CHECK_OUT" ? "#f59e0b" : "#3b82f6",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "26px", margin: "0 auto 14px", boxShadow: "0 6px 16px rgba(0,0,0,0.3)"
            }}>
              {result.action === "CHECK_IN" ? <FaSignInAlt /> : result.action === "CHECK_OUT" ? <FaSignOutAlt /> : <FaCheckCircle />}
            </div>

            <h3 style={{ fontSize: "19px", fontWeight: 800, margin: "0 0 6px 0", color: "#fff" }}>
              {result.message}
            </h3>

            <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.5", margin: "6px 0 12px 0" }}>
              {result.subMessage}
            </p>

            <div style={{
              display: "inline-flex", gap: "14px", background: "rgba(15, 23, 42, 0.6)",
              padding: "8px 16px", borderRadius: "20px", fontSize: "12px", color: "#94a3b8", fontWeight: 600,
              flexWrap: "wrap", justifyContent: "center", marginBottom: "16px"
            }}>
              {result.checkInTime && <span> Check In Time: <strong style={{ color: "#10b981" }}>{formatTime(result.checkInTime, timeFormat)}</strong></span>}
              {result.checkOutTime && <span>Check Out Time: <strong style={{ color: "#f59e0b" }}>{formatTime(result.checkOutTime, timeFormat)}</strong></span>}
            </div>

            {/* Countdown Badge & Manual Close Button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "4px" }}>
              <span style={{ fontSize: "12px", background: "rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: "20px", color: "#60a5fa", fontWeight: 700 }}>
                Closing page in {countdown}s...
              </span>
              <button
                type="button"
                onClick={handleManualClose}
                style={{
                  background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                  borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
                }}
              >
                <FaTimes /> Close Now
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "14px",
            padding: "14px 16px", color: "#fca5a5", fontSize: "14px", marginBottom: "20px", fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}>
            <FaExclamationTriangle /> {errorMsg}
          </div>
        )}

        {/* Input Form */}
        {!result && (
          <form onSubmit={handleMarkAttendance} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <input
                type="text"
                value={studentCodeOrMobile}
                onChange={(e) => setStudentCodeOrMobile(e.target.value)}
                placeholder="e.g. STU001 or 9876543210"
                className="att-input"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff",
                border: "none", borderRadius: "16px", padding: "16px", fontWeight: 800,
                fontSize: "16px", cursor: submitting ? "not-allowed" : "pointer",
                transition: "transform 0.1s, boxShadow 0.2s",
                boxShadow: "0 6px 20px rgba(59, 130, 246, 0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
              }}
            >
              {submitting ? "Processing..." : <><FaClock /> TAP TO CHECK-IN / CHECK-OUT</>}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default PublicAttendance;
