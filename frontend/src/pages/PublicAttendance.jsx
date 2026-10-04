import { useState, useEffect } from "react";
import { FaClock, FaCheckCircle, FaSignOutAlt, FaSignInAlt, FaUserCheck, FaExclamationTriangle, FaTimes, FaSpinner, FaBuilding } from "react-icons/fa";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";

const PublicAttendance = () => {
  const { timeFormat } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studentCodeOrMobile, setStudentCodeOrMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(5);

  const [branchInfo, setBranchInfo] = useState(null);
  const [branchLoading, setBranchLoading] = useState(true);
  const [branchError, setBranchError] = useState("");

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch branch info on load to verify token and display library name
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    const branchId = searchParams.get("branchId");

    if (!token && !branchId) {
      setBranchError("Invalid or missing attendance link. Please scan the official QR code at your library entrance.");
      setBranchLoading(false);
      return;
    }

    const fetchInfo = async () => {
      try {
        setBranchLoading(true);
        setBranchError("");
        const query = token ? `token=${encodeURIComponent(token)}` : `branchId=${encodeURIComponent(branchId)}`;
        const res = await api.get(`/attendance/branch-info?${query}`);
        if (res.data?.success) {
          setBranchInfo(res.data.data);
        } else {
          setBranchError(res.data?.message || "Invalid attendance QR code.");
        }
      } catch (err) {
        setBranchError(err.response?.data?.message || "Invalid or expired attendance QR code link.");
      } finally {
        setBranchLoading(false);
      }
    };

    fetchInfo();
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
      const token = searchParams.get("token");
      const branchId = searchParams.get("branchId");

      const payload = {
        studentCodeOrMobile: studentCodeOrMobile.trim(),
      };
      if (token) {
        payload.token = token.trim();
      } else if (branchId) {
        payload.branchId = parseInt(branchId);
      } else {
        payload.branchId = 1;
      }

      const res = await api.post("/attendance/public-checkin", payload);

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)",
        padding: "20px 14px",
        color: "#fff",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
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

      <div
        className="att-card"
        style={{
          background: "rgba(30, 41, 59, 0.92)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          padding: "36px 24px",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        {branchLoading ? (
          <div style={{ padding: "40px 0" }}>
            <FaSpinner style={{ animation: "spin 1s linear infinite", fontSize: "32px", color: "#38bdf8" }} />
            <p style={{ marginTop: "14px", color: "#94a3b8", fontSize: "14px" }}>Verifying library gate token...</p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : branchError ? (
          <div style={{ padding: "20px 8px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <FaExclamationTriangle style={{ fontSize: "32px", color: "#ef4444" }} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 10px 0", color: "#fff" }}>
              Invalid Attendance QR Code
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>
              {branchError}
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "10px 16px",
                borderRadius: "12px",
                fontSize: "13px",
                color: "#cbd5e1",
              }}
            >
              <FaBuilding style={{ color: "#38bdf8" }} /> Please scan the official QR code at your library entrance
            </div>
          </div>
        ) : (
          <>
            {/* Header Icon & Live Clock */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  marginBottom: "12px",
                  boxShadow: "0 10px 24px rgba(16, 185, 129, 0.3)",
                }}
              >
                <FaUserCheck style={{ fontSize: "26px", color: "#fff" }} />
              </div>

              <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 4px 0", color: "#f8fafc" }}>
                {branchInfo?.name || "Library Gate Attendance"}
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
                Scan to instantly Check In or Check Out
              </p>
            </div>

            {/* Clock Box */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <div className="att-time" style={{ fontSize: "36px", fontWeight: 900, color: "#34d399", letterSpacing: "1px" }}>
                {formattedTime}
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginTop: "4px" }}>
                {formattedDate}
              </div>
            </div>

            {/* Result Alert */}
            {result && (
              <div
                style={{
                  background: result.action === "CHECK_IN" ? "rgba(16, 185, 129, 0.15)" : result.action === "CHECK_OUT" ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                  border: `2px solid ${result.action === "CHECK_IN" ? "#10b981" : result.action === "CHECK_OUT" ? "#f59e0b" : "#3b82f6"}`,
                  borderRadius: "18px",
                  padding: "22px 18px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: result.action === "CHECK_IN" ? "#10b981" : result.action === "CHECK_OUT" ? "#f59e0b" : "#3b82f6",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    margin: "0 auto 14px",
                  }}
                >
                  {result.action === "CHECK_IN" ? <FaSignInAlt /> : result.action === "CHECK_OUT" ? <FaSignOutAlt /> : <FaCheckCircle />}
                </div>

                <h3 style={{ fontSize: "19px", fontWeight: 800, margin: "0 0 6px 0", color: "#fff" }}>
                  {result.message}
                </h3>

                <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.5", margin: "6px 0 12px 0" }}>
                  {result.subMessage}
                </p>

                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94a3b8", background: "rgba(0,0,0,0.25)", padding: "4px 12px", borderRadius: "20px" }}>
                  <FaClock /> Closing in {countdown}s...
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMsg && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5",
                  padding: "14px",
                  borderRadius: "14px",
                  marginBottom: "20px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <FaExclamationTriangle /> {errorMsg}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleMarkAttendance}>
              <div style={{ marginBottom: "18px" }}>
                <input
                  type="text"
                  className="att-input"
                  placeholder="Student Code / Mobile Number"
                  value={studentCodeOrMobile}
                  onChange={(e) => setStudentCodeOrMobile(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#fff",
                  fontSize: "17px",
                  fontWeight: 800,
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: "0 10px 24px rgba(16, 185, 129, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? (
                  <>
                    <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> Mark Attendance
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicAttendance;
