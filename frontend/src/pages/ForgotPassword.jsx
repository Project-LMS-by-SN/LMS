import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaEnvelope, FaKey, FaArrowLeft, FaRedo, FaCheckCircle } from "react-icons/fa";
import api from "../api/axios";

const OTP_LENGTH = 6;
const EMPTY_OTP = Array(OTP_LENGTH).fill("");

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [otpDigits, setOtpDigits] = useState(EMPTY_OTP);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step !== "otp") return;
    const focusTimer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 60);
    return () => clearTimeout(focusTimer);
  }, [step]);

  useEffect(() => {
    if (step !== "otp" || resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const cleanEmail = email.trim().toLowerCase();
  const otpValue = otpDigits.join("");

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/users/forgot-password", { email: cleanEmail });
      if (res.data?.success) {
        setStep("otp");
        setOtpDigits(EMPTY_OTP);
        setResendTimer(60);
        setInfoMessage(`A 6-digit OTP has been sent to ${cleanEmail}. Please check your inbox (and spam folder).`);
      } else {
        setError(res.data?.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setError("");
    setInfoMessage("");
    setLoading(true);
    try {
      const res = await api.post("/users/forgot-password", { email: cleanEmail });
      if (res.data?.success) {
        setOtpDigits(EMPTY_OTP);
        setResendTimer(60);
        setInfoMessage(`A new 6-digit OTP has been sent to ${cleanEmail}.`);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 50);
      } else {
        setError(res.data?.message || "Failed to resend OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const applyPastedDigits = (rawText, startIndex = 0) => {
    const digitsOnly = String(rawText || "").replace(/\D/g, "");
    if (!digitsOnly) return;

    const nextDigits = [...otpDigits];
    // When full 6-digit code is pasted or autofilled, fill from index 0 cleanly
    const writeStart = digitsOnly.length >= OTP_LENGTH ? 0 : startIndex;
    let lastFilledIndex = writeStart;

    for (let offset = 0; offset < digitsOnly.length && writeStart + offset < OTP_LENGTH; offset += 1) {
      nextDigits[writeStart + offset] = digitsOnly[offset];
      lastFilledIndex = writeStart + offset;
    }

    setOtpDigits(nextDigits);
    const nextFocusIndex = Math.min(OTP_LENGTH - 1, lastFilledIndex + 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleOtpChange = (index, value) => {
    setError("");
    const digitsOnly = value.replace(/\D/g, "");

    if (digitsOnly.length > 1) {
      applyPastedDigits(digitsOnly, index);
      return;
    }

    const digit = digitsOnly.slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otpDigits[index]) {
        const nextDigits = [...otpDigits];
        nextDigits[index] = "";
        setOtpDigits(nextDigits);
      } else if (index > 0) {
        const nextDigits = [...otpDigits];
        nextDigits[index - 1] = "";
        setOtpDigits(nextDigits);
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handleOtpPaste = (index, e) => {
    const pasted = e.clipboardData?.getData("text");
    if (!pasted) return;
    e.preventDefault();
    setError("");
    applyPastedDigits(pasted, index);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (otpValue.length !== OTP_LENGTH) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/users/verify-reset-otp", {
        email: cleanEmail,
        otp: otpValue,
      });

      if (res.data?.success && res.data?.resetToken) {
        const targetEmail = res.data.email || cleanEmail;
        navigate(
          `/reset-password?token=${encodeURIComponent(res.data.resetToken)}&email=${encodeURIComponent(targetEmail)}`,
          { replace: true }
        );
      } else {
        setError(res.data?.message || "Invalid or expired OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed. Please try again.");
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
            {step === "email" ? <FaEnvelope /> : <FaKey />}
          </div>
          <h1 style={{ color: "white", fontSize: "22px", fontWeight: 700, margin: 0 }}>
            {step === "email" ? "Set / Forgot Password" : "Verify 6-Digit OTP"}
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}>
            {step === "email"
              ? "Enter your email to receive a 6-digit verification OTP"
              : "Enter the 6-digit code sent to your email"}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "32px" }}>
          {infoMessage && (
            <div style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#1d4ed8",
              fontSize: "13.5px",
              marginBottom: "20px",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}>
              <FaCheckCircle style={{ flexShrink: 0, marginTop: "3px" }} />
              <span>{infoMessage}</span>
            </div>
          )}

          {error && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#dc2626",
              fontSize: "14px",
              marginBottom: "20px",
              lineHeight: 1.4,
            }}>
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="form-group">
                <label>Registered Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email (e.g. you@gmail.com)"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
                style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "15px" }}
              >
                {loading ? "Sending OTP..." : "Send 6-Digit OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    Enter 6-Digit OTP
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtpDigits(EMPTY_OTP);
                      setError("");
                      setInfoMessage("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Change Email
                  </button>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: "8px",
                }}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={index === 0 ? 6 : 1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={(e) => handleOtpPaste(index, e)}
                      aria-label={`OTP digit ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "52px",
                        textAlign: "center",
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#0f172a",
                        background: digit ? "#eff6ff" : "#f8fafc",
                        border: `2px solid ${digit ? "#3b82f6" : "#cbd5e1"}`,
                        borderRadius: "10px",
                        outline: "none",
                      }}
                    />
                  ))}
                </div>

                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px", textAlign: "center" }}>
                  OTP expires in 10 minutes
                </p>
              </div>

              <button
                type="submit"
                className="primary-btn"
                disabled={loading || otpValue.length !== OTP_LENGTH}
                style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "15px" }}
              >
                {loading ? "Verifying OTP..." : "Verify OTP & Continue"}
              </button>

              <div style={{ textAlign: "center" }}>
                {resendTimer > 0 ? (
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    Didn&apos;t receive the code? Resend in <strong>{resendTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FaRedo style={{ fontSize: "12px" }} /> Resend 6-Digit OTP
                  </button>
                )}
              </div>
            </form>
          )}

          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
            <Link
              to={localStorage.getItem("lms_token") ? "/dashboard" : "/login"}
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
              <FaArrowLeft style={{ fontSize: "12px" }} /> {localStorage.getItem("lms_token") ? "Back to Dashboard" : "Back to Login"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

