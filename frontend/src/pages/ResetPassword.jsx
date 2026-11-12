import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import api from "../api/axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [verifying, setVerifying] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState(
    token ? "" : "Reset session token is missing. Please verify your 6-digit OTP first."
  );
  const [accountEmail, setAccountEmail] = useState(emailParam);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    api
      .get("/users/reset-password", { params: { token }, noCache: true })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success && res.data?.valid) {
          setTokenValid(true);
          setTokenError("");
          if (res.data.email) {
            setAccountEmail(res.data.email);
          }
        } else {
          setTokenValid(false);
          setTokenError(res.data?.message || "This reset session is invalid or has expired.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setTokenValid(false);
        setTokenError(err.response?.data?.message || "This reset session is invalid or has expired.");
      })
      .finally(() => {
        if (!cancelled) {
          setVerifying(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (password.length < 8) {
      setMsg({ type: "error", text: "Password must be at least 8 characters long." });
      return;
    }
    if (!/\d/.test(password)) {
      setMsg({ type: "error", text: "Password must contain at least one number." });
      return;
    }
    if (password !== confirmPassword) {
      setMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/users/reset-password", {
        token,
        password,
      });

      if (res.data?.success) {
        api.clearCache();
        localStorage.removeItem("lms_token");
        localStorage.removeItem("lms_user");
        setMsg({
          type: "success",
          text: "Password updated successfully! Redirecting to login...",
        });
        setTimeout(() => {
          navigate("/login?reset=success", { replace: true });
        }, 1200);
      } else {
        setMsg({ type: "error", text: res.data?.message || "Failed to update password." });
      }
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to reset password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasMinLength = password.length >= 8;
  const hasDigit = /\d/.test(password);

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
        }}>
          <div style={{
            width: "52px", height: "52px",
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            borderRadius: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", margin: "0 auto 16px",
            boxShadow: "0 8px 20px rgba(59,130,246,0.4)",
            color: "white",
          }}>
            <FaLock />
          </div>
          <h1 style={{ color: "white", fontSize: "22px", fontWeight: 700, margin: 0 }}>
            Set New Password
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}>
            Create a strong password for your account
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "32px" }}>
          {verifying ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#64748b", fontSize: "14px" }}>
              Verifying reset session...
            </div>
          ) : !tokenValid ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "16px",
                color: "#dc2626",
                fontSize: "14px",
                marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}>
                <FaExclamationCircle style={{ fontSize: "26px" }} />
                <span>{tokenError || "Reset session has expired or is invalid."}</span>
              </div>

              <Link
                to="/forgot-password"
                className="primary-btn"
                style={{ width: "100%", justifyContent: "center", textDecoration: "none", padding: "12px" }}
              >
                Request New 6-Digit OTP
              </Link>
            </div>
          ) : (
            <>
              {accountEmail && (
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  color: "#334155",
                  fontSize: "13.5px",
                  marginBottom: "18px",
                }}>
                  Account: <strong>{accountEmail}</strong>
                </div>
              )}

              {msg && (
                <div style={{
                  background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                  borderRadius: "8px",
                  padding: "12px 16px",
                  color: msg.type === "success" ? "#15803d" : "#dc2626",
                  fontSize: "14px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  {msg.type === "success" && <FaCheckCircle style={{ flexShrink: 0 }} />}
                  <span>{msg.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div className="form-group">
                  <label>New Password</label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters & at least 1 number"
                      required
                      minLength={8}
                      autoFocus
                      style={{ width: "100%", paddingRight: "42px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute", right: "12px", top: "50%",
                        transform: "translateY(-50%)", background: "none",
                        border: "none", cursor: "pointer", fontSize: "16px",
                        color: "#94a3b8", padding: "0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
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
                      placeholder="Re-enter your new password"
                      required
                      style={{ width: "100%", paddingRight: "42px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: "absolute", right: "12px", top: "50%",
                        transform: "translateY(-50%)", background: "none",
                        border: "none", cursor: "pointer", fontSize: "16px",
                        color: "#94a3b8", padding: "0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div style={{
                  background: "#f8fafc",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "12.5px",
                  color: "#64748b",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}>
                  <span style={{ color: hasMinLength ? "#15803d" : "#64748b" }}>
                    {hasMinLength ? "✓" : "•"} At least 8 characters
                  </span>
                  <span style={{ color: hasDigit ? "#15803d" : "#64748b" }}>
                    {hasDigit ? "✓" : "•"} At least 1 number (0-9)
                  </span>
                </div>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                  style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "15px" }}
                >
                  {loading ? "Saving Password..." : "Save New Password"}
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#475569",
                fontSize: "13.5px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <FaArrowLeft style={{ fontSize: "12px" }} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

