import { useState } from "react";
import api from "../api/axios";
import { FaLock, FaSignOutAlt, FaShieldAlt, FaEye, FaEyeSlash } from "react-icons/fa";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (newPassword !== confirmPassword) {
      setMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      setMsg({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }
    if (!/\d/.test(newPassword)) {
      setMsg({ type: "error", text: "New password must contain at least one number" });
      return;
    }
    if (newPassword === oldPassword) {
      setMsg({ type: "error", text: "New password must be different from current password" });
      return;
    }

    setLoading(true);
    try {
      const res = await api.put("/users/change-password", { oldPassword, newPassword });
      if (res.data.success) {
        setMsg({ type: "success", text: "Password changed successfully! Redirecting..." });
        
        // Update user storage
        const userStr = localStorage.getItem("lms_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.mustChangePassword = false;
          localStorage.setItem("lms_user", JSON.stringify(user));
        }

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/users/logout");
    } catch (err) {
      console.error("Logout API error:", err);
    }
    localStorage.removeItem("lms_token");
    localStorage.removeItem("lms_user");
    window.location.href = "/login";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "440px",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          padding: "36px 32px 28px",
          textAlign: "center",
          position: "relative"
        }}>
          <div style={{
            width: "52px", height: "52px",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            borderRadius: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", margin: "0 auto 16px",
            boxShadow: "0 8px 20px rgba(245,158,11,0.4)",
            color: "white",
          }}><FaShieldAlt /></div>
          <h1 style={{ color: "white", fontSize: "22px", fontWeight: 700, margin: 0 }}>
            Change Password
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}>
            Forced Password Update Required
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "32px" }}>
          <div style={{
            background: "#fffbeb", border: "1px solid #fef3c7",
            borderRadius: "8px", padding: "12px 16px",
            color: "#b45309", fontSize: "13.5px", marginBottom: "20px",
            lineHeight: 1.5, display: "flex", alignItems: "center", gap: "6px"
          }}>
            <FaShieldAlt style={{ color: "#d97706", flexShrink: 0 }} /> <span><strong>Security Notice:</strong> You are logging in with a default password. You must change your password before you can proceed to the dashboard.</span>
          </div>

          {msg && (
            <div style={{
              background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              borderRadius: "8px", padding: "12px 16px",
              color: msg.type === "success" ? "#15803d" : "#dc2626",
              fontSize: "14px", marginBottom: "20px",
            }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div className="form-group">
              <label>Current / Default Password</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  autoFocus
                  style={{ width: "100%", paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", fontSize: "16px",
                    color: "#94a3b8", padding: "0",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  title={showOldPassword ? "Hide password" : "Show password"}
                >
                  {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>New Password</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters & at least 1 number"
                  required
                  minLength={8}
                  style={{ width: "100%", paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", fontSize: "16px",
                    color: "#94a3b8", padding: "0",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  style={{ width: "100%", paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", fontSize: "16px",
                    color: "#94a3b8", padding: "0",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
                style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "15px" }}
              >
                {loading ? "Updating Password..." : "Update Password"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={handleLogout}
                style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "15px", gap: "8px" }}
              >
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
