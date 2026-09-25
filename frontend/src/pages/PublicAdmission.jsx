import { FaExclamationTriangle, FaBookOpen } from "react-icons/fa";

const PublicAdmission = () => {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 16px", color: "#fff",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        background: "rgba(30, 41, 59, 0.95)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "24px",
        padding: "40px 24px", width: "100%", maxWidth: "480px", textAlign: "center",
        boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
      }}>
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
        }}>
          <FaExclamationTriangle style={{ fontSize: "40px", color: "#f59e0b" }} />
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "12px", color: "#fff" }}>
          QR Code Admission Disabled
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
          Online QR Code registration is currently disabled by the library administration.
          <br /><br />
          Please visit the library reception desk directly to complete your admission process.
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.05)",
          padding: "10px 16px", borderRadius: "12px", fontSize: "13px", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <FaBookOpen style={{ color: "#38bdf8" }} /> Library Management System
        </div>
      </div>
    </div>
  );
};

export default PublicAdmission;
