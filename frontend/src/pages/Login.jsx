import { useState, useEffect } from "react";
import { FaBookOpen, FaEye, FaEyeSlash, FaExclamationTriangle } from "react-icons/fa";
import api from "../api/axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForceLogin, setShowForceLogin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "logged_out") {
      setInfoMessage("This account has been logged out because a new user logged in on another device. Use your main account.");
    }
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setInfoMessage("");
    setLoading(true);
    try {
      const res = await api.post("/users/login", { email: email.trim(), password });
      if (res.data.success) {
        localStorage.setItem("lms_token", res.data.token);
        const userObj = { ...res.data.user, mustChangePassword: res.data.mustChangePassword };
        localStorage.setItem("lms_user", JSON.stringify(userObj));
        if (res.data.mustChangePassword) {
          window.location.href = "/change-password";
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.code === "ALREADY_LOGGED_IN") {
        setShowForceLogin(true);
      } else {
        setError(err.response?.data?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogin = async () => {
    setError("");
    setInfoMessage("");
    setLoading(true);
    setShowForceLogin(false);
    try {
      const res = await api.post("/users/login", { email: email.trim(), password, forceLogin: true });
      if (res.data.success) {
        localStorage.setItem("lms_token", res.data.token);
        const userObj = { ...res.data.user, mustChangePassword: res.data.mustChangePassword };
        localStorage.setItem("lms_user", JSON.stringify(userObj));
        if (res.data.mustChangePassword) {
          window.location.href = "/change-password";
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
        maxWidth: "420px",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          padding: "36px 32px 28px",
          textAlign: "center",
        }}>
          <div style={{
            width: "52px", height: "52px",
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            borderRadius: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", margin: "0 auto 16px",
            boxShadow: "0 8px 20px rgba(59,130,246,0.4)",
            color: "white"
          }}>
            <FaBookOpen />
          </div>
          <h1 style={{ color: "white", fontSize: "22px", fontWeight: 700, margin: 0 }}>
            Library Management
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}>
            Sign in to continue
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "32px" }}>
          {infoMessage && (
            <div style={{
              background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: "8px", padding: "12px 16px",
              color: "#1d4ed8", fontSize: "14px", marginBottom: "20px",
            }}>
              {infoMessage}
            </div>
          )}

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "8px", padding: "12px 16px",
              color: "#dc2626", fontSize: "14px", marginBottom: "20px",
            }}>
              {error}
            </div>
          )}


          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div className="form-group">
              <label>Email Address or Username</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin or admin@admin.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ paddingRight: "44px", width: "100%" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", fontSize: "16px",
                    color: "#94a3b8", padding: "0",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "15px", marginTop: "4px" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", marginTop: "24px" }}>
            Library Management System · Admin Portal
          </p>
        </div>
        {showForceLogin && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: "20px"
          }}>
            <div style={{
              background: "white", borderRadius: "16px", padding: "32px",
              maxWidth: "400px", width: "100%", textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <FaExclamationTriangle style={{ fontSize: "40px", color: "#f59e0b" }} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", marginBottom: "12px" }}>
                Active Session Detected
              </h3>
              <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: 1.5, marginBottom: "24px" }}>
                This account is already logged in on another device. Do you want to proceed and log out the other session?
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowForceLogin(false)}
                  style={{
                    flex: 1, padding: "10px 16px", borderRadius: "8px",
                    border: "1px solid #d1d5db", background: "white",
                    color: "#374151", fontWeight: 500, cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleForceLogin}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "10px 16px", borderRadius: "8px",
                    border: "none", background: "#3b82f6",
                    color: "white", fontWeight: 500, cursor: "pointer"
                  }}
                >
                  {loading ? "Logging in..." : "Yes, log in"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
