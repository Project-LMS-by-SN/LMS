import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { FaMoon, FaSun, FaLock, FaTrash, FaShieldAlt, FaInfoCircle, FaUsers, FaCalendarAlt, FaExclamationTriangle, FaClock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const Settings = () => {
  const { darkMode, toggleDarkMode, timeFormat, toggleTimeFormat } = useTheme();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeStudents, setActiveStudents] = useState(0);

  // Staff management states
  const [staff, setStaff] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [staffMsg, setStaffMsg] = useState(null);
  const [staffLoading, setStaffLoading] = useState(false);

  // Staff password change states
  const [changePwStaff, setChangePwStaff] = useState(null); // staff object being changed
  const [staffNewPw, setStaffNewPw] = useState("");
  const [staffPwLoading, setStaffPwLoading] = useState(false);
  const [staffPwMsg, setStaffPwMsg] = useState(null);

  const initialUser = (() => {
    try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); }
    catch { return {}; }
  })();
  const [profile, setProfile] = useState(initialUser);
  const pendingTier = profile.pendingTier;
  const pendingExpiryDays = profile.pendingExpiryDays;

  const [actLoading, setActLoading] = useState(false);
  const [showActivateConfirmModal, setShowActivateConfirmModal] = useState(false);

  const handleActivatePendingPlan = async () => {
    setActLoading(true);
    try {
      const res = await api.post("/users/activate-pending-plan");
      if (res.data.success) {
        alert(res.data.message || "Plan activated successfully!");
        const existing = JSON.parse(localStorage.getItem("lms_user") || "{}");
        const merged = { ...existing, subscriptionTier: res.data.subscriptionTier, subscriptionExpiry: res.data.subscriptionExpiry, pendingTier: null, pendingExpiryDays: null };
        setProfile(merged);
        localStorage.setItem("lms_user", JSON.stringify(merged));
        window.location.reload();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to activate plan.");
    } finally {
      setActLoading(false);
      setShowActivateConfirmModal(false);
    }
  };

  useEffect(() => {
    const fetchStatsAndProfile = async () => {
      try {
        const statsRes = await api.get("/dashboard/stats");
        setActiveStudents(statsRes.data.data.active_students);
      } catch (err) {
        console.error("Failed to load stats in settings:", err);
      }
      try {
        const profileRes = await api.get("/users/profile");
        const existing = JSON.parse(localStorage.getItem("lms_user") || "{}");
        const merged = { ...existing, ...profileRes.data.data };
        setProfile(merged);
        localStorage.setItem("lms_user", JSON.stringify(merged));

        // Fetch staff list if owner
        if (profileRes.data.data.role === "OWNER") {
          try {
            const staffRes = await api.get("/users/staff");
            if (staffRes.data.success) {
              setStaff(staffRes.data.data);
            }
          } catch (err) {
            console.error("Failed to fetch staff:", err);
          }
        }
      } catch (err) {
        console.error("Failed to load profile in settings:", err);
      }
    };
    fetchStatsAndProfile();
  }, []);

  const currentTier = profile.subscriptionTier || "FREE";
  const subscriptionExpiry = profile.subscriptionExpiry;

  const getTierDetails = (tier) => {
    if (tier === "STARTER") {
      return { name: "Starter", studentLimit: 150, staffLimit: 1, monthlyPrice: 150 };
    }
    if (tier === "PRO_100") {
      return { name: "Basic", studentLimit: 250, staffLimit: 2, monthlyPrice: 200 };
    }
    if (tier === "PRO_200") {
      return { name: "Pro", studentLimit: 500, staffLimit: 5, monthlyPrice: 300 };
    }
    if (tier === "ENTERPRISE") {
      return { name: "Enterprise", studentLimit: 999999, staffLimit: 999999, monthlyPrice: 400 };
    }
    return { name: "Free", studentLimit: 0, staffLimit: 0, monthlyPrice: 0 };
  };

  const { name: tierName, studentLimit, staffLimit, monthlyPrice } = getTierDetails(currentTier);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getDaysLeft = () => {
    if (!subscriptionExpiry) return null;
    const exp = new Date(subscriptionExpiry);
    const now = new Date();
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysLeft();
  const isExpired = daysLeft !== null && daysLeft <= 0;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }
    if (!/\d/.test(newPassword)) {
      setPwMsg({ type: "error", text: "Password must contain at least one number" });
      return;
    }
    if (newPassword === oldPassword) {
      setPwMsg({ type: "error", text: "New password must be different from current password" });
      return;
    }
    setPwLoading(true);
    try {
      await api.put("/users/change-password", { oldPassword, newPassword });
      setPwMsg({ type: "success", text: "Password changed successfully!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setPwLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffMsg(null);
    if (!newStaffPassword || newStaffPassword.length < 8) {
      setStaffMsg({ type: "error", text: "Staff password must be at least 8 characters" });
      return;
    }
    if (!/\d/.test(newStaffPassword)) {
      setStaffMsg({ type: "error", text: "Staff password must contain at least one number" });
      return;
    }
    setStaffLoading(true);
    try {
      const res = await api.post("/users/staff", {
        name: newStaffName,
        email: newStaffEmail,
        password: newStaffPassword
      });
      if (res.data.success) {
        setStaffMsg({ type: "success", text: "Staff member created successfully!" });
        setStaff(prev => [...prev, res.data.data]);
        setNewStaffName("");
        setNewStaffEmail("");
        setNewStaffPassword("");
        setShowAddStaff(false);
      }
    } catch (err) {
      setStaffMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to create staff member"
      });
    } finally {
      setStaffLoading(false);
    }
  };

  const resetStaffForm = () => {
    setNewStaffName("");
    setNewStaffEmail("");
    setNewStaffPassword("");
    setShowAddStaff(false);
  };

  const toggleStaffForm = () => {
    if (showAddStaff) {
      resetStaffForm();
    } else {
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPassword("");
      setShowAddStaff(true);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    try {
      const res = await api.delete(`/users/staff/${staffId}`);
      if (res.data.success) {
        setStaff(prev => prev.filter(s => s.id !== staffId));
        setStaffMsg({ type: "success", text: "Staff member deleted successfully." });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete staff member");
    }
  };

  const handleChangeStaffPassword = async (e) => {
    e.preventDefault();
    if (!staffNewPw || staffNewPw.length < 8) {
      setStaffPwMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (!/\d/.test(staffNewPw)) {
      setStaffPwMsg({ type: "error", text: "Password must contain at least one number." });
      return;
    }
    setStaffPwLoading(true);
    setStaffPwMsg(null);
    try {
      const res = await api.put(`/users/staff/${changePwStaff.id}/password`, { newPassword: staffNewPw });
      if (res.data.success) {
        setStaffPwMsg({ type: "success", text: `Password changed for ${changePwStaff.name}.` });
        setStaffNewPw("");
        setTimeout(() => { setChangePwStaff(null); setStaffPwMsg(null); }, 1500);
      }
    } catch (err) {
      setStaffPwMsg({ type: "error", text: err.response?.data?.message || "Failed to change password." });
    } finally {
      setStaffPwLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteMsg(null);
    setDeleteLoading(true);
    try {
      await api.delete("/users/account", { data: { password: deletePassword } });
      localStorage.removeItem("lms_token");
      localStorage.removeItem("lms_user");
      window.location.href = "/login";
    } catch (err) {
      setDeleteMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to delete account",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Dynamic Theme Colors
  const textPrimary = darkMode ? "#f8fafc" : "#1e293b";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const cardBorder = darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0";

  const msgStyle = (type) => ({
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
    background: type === "success" ? (darkMode ? "rgba(16,185,129,0.15)" : "#f0fdf4") : (darkMode ? "rgba(239,68,68,0.15)" : "#fef2f2"),
    border: `1px solid ${type === "success" ? (darkMode ? "#10b981" : "#bbf7d0") : (darkMode ? "#ef4444" : "#fecaca")}`,
    color: type === "success" ? (darkMode ? "#34d399" : "#15803d") : (darkMode ? "#fca5a5" : "#dc2626"),
  });

  const iconBox = (gradient) => ({
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: gradient,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "white",
    flexShrink: 0,
  });

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <h1 style={{ color: textPrimary }}>Settings</h1>
          <p style={{ color: textSecondary }}>{today}</p>
        </div>
      </div>

      {/* Dark Mode */}
      <div className="form-card" style={{ borderColor: cardBorder }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={iconBox("linear-gradient(135deg,#6366f1,#4f46e5)")}>
            {darkMode ? <FaMoon /> : <FaSun />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "16px", color: textPrimary }}>Dark Mode (Beta)</div>
            <div style={{ fontSize: "13px", color: textSecondary, marginTop: "2px" }}>Toggle between light and dark appearance</div>
          </div>
          <button
            onClick={toggleDarkMode}
            style={{
              width: "52px",
              height: "28px",
              borderRadius: "14px",
              background: darkMode ? "#3b82f6" : "#e2e8f0",
              border: "none",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.25s",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "white",
                position: "absolute",
                top: "4px",
                left: darkMode ? "28px" : "4px",
                transition: "left 0.25s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>
      </div>

      {/* Time Format */}
      <div className="form-card" style={{ borderColor: cardBorder }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={iconBox("linear-gradient(135deg,#0ea5e9,#0284c7)")}>
            <FaClock />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "16px", color: textPrimary }}>Time Format</div>
            <div style={{ fontSize: "13px", color: textSecondary, marginTop: "2px" }}>Choose between 12-hour (AM/PM) and 24-hour time display</div>
          </div>
          <button
            type="button"
            onClick={toggleTimeFormat}
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 700,
              borderRadius: "10px",
              background: "#0ea5e9",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(14,165,233,0.3)"
            }}
          >
            {timeFormat === "24hr" ? "24-Hour" : "12-Hour (AM/PM)"}
          </button>
        </div>
      </div>

      {/* Active Subscription Usage */}
      <div className="form-card" style={{ borderColor: cardBorder }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={iconBox("linear-gradient(135deg,#f59e0b,#d97706)")}><FaShieldAlt /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "16px", color: textPrimary }}>Active Subscription</div>
              <div style={{ fontSize: "13px", color: textSecondary }}>Manage your library limits and billing</div>
            </div>
          </div>
          
          {/* Pending Purchased Plan Card */}
          {pendingTier && (
            <div style={{
              background: "linear-gradient(135deg, #fffbe6, #fef3c7)",
              border: "2px solid #f59e0b",
              borderRadius: "14px",
              padding: "16px 20px",
              marginBottom: "16px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px", height: "42px", borderRadius: "10px",
                  background: "#f59e0b", color: "white", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "18px"
                }}>
                  &#9889;
                </div>
                <div>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#d97706", letterSpacing: "1px" }}>
                    Purchased Plan Ready for Activation
                  </div>
                  <h4 style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: 800, color: "#78350f" }}>
                    {pendingTier.replace("_", " ")} ({pendingExpiryDays || 30} Days)
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#92400e" }}>
                    Status: Pending Activation — Waiting for your manual activation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowActivateConfirmModal(true)}
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "white", border: "none", padding: "10px 18px",
                  borderRadius: "10px", fontWeight: 700, fontSize: "13px",
                  cursor: "pointer", boxShadow: "0 4px 10px rgba(245,158,11,0.3)"
                }}
              >
                &#9889; Activate Plan Now
              </button>
            </div>
          )}

          <div style={{ background: darkMode ? "rgba(255,255,255,0.03)" : "#f8fafc", padding: "20px", borderRadius: "16px", border: `1px solid ${cardBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 700, color: "#f59e0b", letterSpacing: "1.2px" }}>Current Plan</span>
                <h3 style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: 800, color: textPrimary }}>{tierName}</h3>
              </div>
              {profile?.role === "OWNER" && (
                <a href="/subscription" style={{
                  background: currentTier === "FREE" || isExpired ? "#f59e0b" : "#3b82f6",
                  color: "#fff", textDecoration: "none", padding: "8px 16px",
                  borderRadius: "10px", fontWeight: 600, fontSize: "13px", transition: "all 0.2s"
                }}>
                  {currentTier === "FREE" ? "Choose Plan" : isExpired ? "Renew Now" : "Renew / Upgrade"}
                </a>
              )}
            </div>

            {subscriptionExpiry && (
              <div style={{
                display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
                padding: "12px 16px", borderRadius: "10px", marginBottom: "16px",
                background: isExpired ? "rgba(220,38,38,0.08)" : daysLeft <= 7 ? "rgba(245,158,11,0.08)" : "rgba(16,163,74,0.08)",
                border: `1px solid ${isExpired ? "rgba(220,38,38,0.2)" : daysLeft <= 7 ? "rgba(245,158,11,0.2)" : "rgba(16,163,74,0.2)"}`,
              }}>
                <FaCalendarAlt style={{ color: isExpired ? "#dc2626" : daysLeft <= 7 ? "#f59e0b" : "#16a34a", fontSize: "16px" }} />
                <div style={{ fontSize: "13px", color: textSecondary }}>
                  <span style={{ fontWeight: 600, color: textPrimary }}>Expires:</span> {formatDate(subscriptionExpiry)}
                </div>
                {daysLeft !== null && (
                  <span style={{
                    fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                    background: isExpired ? "rgba(220,38,38,0.12)" : daysLeft <= 7 ? "rgba(245,158,11,0.12)" : "rgba(16,163,74,0.12)",
                    color: isExpired ? "#dc2626" : daysLeft <= 7 ? "#d97706" : "#16a34a",
                  }}>
                    {isExpired ? "Expired" : `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`}
                  </span>
                )}
              </div>
            )}

            <div style={{ marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: textSecondary, marginBottom: "8px" }}>
                <span>Student limit usage</span>
                <span style={{ fontWeight: "bold", color: textPrimary }}>
                  {currentTier === "ENTERPRISE" ? `${activeStudents} / Unlimited` : `${activeStudents} / ${studentLimit} Students`}
                </span>
              </div>
              <div style={{ width: "100%", height: "8px", background: darkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${studentLimit > 0 ? Math.min((activeStudents / studentLimit) * 100, 100) : 0}%`, height: "100%", background: "linear-gradient(90deg, #f59e0b, #d97706)", borderRadius: "4px" }}></div>
              </div>
            </div>
          </div>
        </div>

      {/* Change Password */}
      {profile.role === "OWNER" && (
        <div className="form-card" style={{ borderColor: cardBorder }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={iconBox("linear-gradient(135deg,#10b981,#059669)")}><FaLock /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "16px", color: textPrimary }}>Change Password</div>
              <div style={{ fontSize: "13px", color: textSecondary }}>Update your admin account password</div>
            </div>
          </div>
          {pwMsg && <div style={msgStyle(pwMsg.type)}>{pwMsg.text}</div>}
          <form onSubmit={handleChangePassword}>
            <div className="student-form" style={{ gridTemplateColumns: "1fr" }}>
              <div className="form-group">
                <label style={{ color: textSecondary }}>Current Password</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    style={{ paddingRight: "40px", width: "100%" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    style={{
                      position: "absolute", right: "12px", top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", fontSize: "16px",
                      color: textSecondary, padding: "0",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    title={showOldPassword ? "Hide password" : "Show password"}
                  >
                    {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label style={{ color: textSecondary }}>New Password</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters & 1 number"
                    required
                    minLength={8}
                    style={{ paddingRight: "40px", width: "100%" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: "absolute", right: "12px", top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", fontSize: "16px",
                      color: textSecondary, padding: "0",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label style={{ color: textSecondary }}>Confirm New Password</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    style={{ paddingRight: "40px", width: "100%" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute", right: "12px", top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", fontSize: "16px",
                      color: textSecondary, padding: "0",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div><button type="submit" className="primary-btn" disabled={pwLoading}>{pwLoading ? "Updating..." : "Update Password"}</button></div>
            </div>
          </form>
        </div>
      )}

      {/* Staff Management — Only visible to OWNER on paid plans */}
      {profile.role === "OWNER" && currentTier !== "FREE" && (
        <div className="form-card" style={{ borderColor: cardBorder }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={iconBox("linear-gradient(135deg,#3b82f6,#1d4ed8)")}><FaUsers /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "16px", color: textPrimary }}>Staff Management</div>
                <div style={{ fontSize: "13px", color: textSecondary }}>
                  Manage staff accounts ({staff.length} / {staffLimit === 999999 ? "Unlimited" : staffLimit} active)
                </div>
              </div>
            </div>
            {/* Always show Add Staff button — backend enforces tier limit */}
            <button className="primary-btn" onClick={toggleStaffForm} style={{ fontSize: "13px", padding: "6px 12px" }}>
              {showAddStaff ? "Close Form" : "Add Staff"}
            </button>
          </div>

          {staffMsg && <div style={msgStyle(staffMsg.type)}>{staffMsg.text}</div>}

          {/* Add Staff Form */}
          {showAddStaff && (
            <form onSubmit={handleCreateStaff} style={{ marginBottom: "24px", padding: "16px", borderRadius: "12px", border: `1px solid ${cardBorder}`, background: darkMode ? "rgba(255,255,255,0.02)" : "#fafafa" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", color: textPrimary }}>Add New Staff Member</h4>
              <div className="student-form" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                <div className="form-group">
                  <label style={{ color: textSecondary }}>Name *</label>
                  <input type="text" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="Full Name" autoComplete="off" required />
                </div>
                <div className="form-group">
                  <label style={{ color: textSecondary }}>Email *</label>
                  <input type="email" value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} placeholder="email@example.com" autoComplete="off" required />
                </div>
                <div className="form-group">
                  <label style={{ color: textSecondary }}>Password *</label>
                  <input type="password" value={newStaffPassword} onChange={e => setNewStaffPassword(e.target.value)} placeholder="Min 8 chars with number" autoComplete="new-password" minLength={8} required />
                </div>
              </div>
              <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
                <button type="submit" className="primary-btn" disabled={staffLoading}>{staffLoading ? "Creating..." : "Save Staff"}</button>
                <button type="button" className="secondary-btn" onClick={resetStaffForm}>Cancel</button>
              </div>
            </form>
          )}

          {/* Staff List Table */}
          {staff.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: textSecondary, border: `1px dashed ${cardBorder}`, borderRadius: "12px" }}>
              No staff members registered. {staffLimit === 0 ? "Upgrade your plan to invite staff." : "Click 'Add Staff' above to invite your first staff member."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${cardBorder}`, textAlign: "left" }}>
                    <th style={{ padding: "10px", color: textPrimary }}>Name</th>
                    <th style={{ padding: "10px", color: textPrimary }}>Email</th>
                    <th style={{ padding: "10px", color: textPrimary }}>Subscription Expiry</th>
                    <th style={{ padding: "10px", color: textPrimary }}>Last Login</th>
                    <th style={{ padding: "10px", color: textPrimary, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(member => {
                    const staffExpDate = member.subscriptionExpiry ? formatDate(member.subscriptionExpiry) : "N/A";
                    const staffDaysLeft = member.subscriptionExpiry ? Math.ceil((new Date(member.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                    <React.Fragment key={member.id}>
                      <tr style={{ borderBottom: changePwStaff?.id === member.id ? "none" : `1px solid ${cardBorder}` }}>
                        <td style={{ padding: "10px", color: textPrimary, fontWeight: 500 }}>{member.name}</td>
                        <td style={{ padding: "10px", color: textSecondary }}>{member.email}</td>
                        <td style={{ padding: "10px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: textPrimary }}>{staffExpDate}</div>
                          {staffDaysLeft !== null && (
                            <span style={{
                              fontSize: "11px", fontWeight: 700,
                              color: staffDaysLeft <= 0 ? "#dc2626" : staffDaysLeft <= 7 ? "#d97706" : "#16a34a"
                            }}>
                              {staffDaysLeft <= 0 ? "Expired" : `${staffDaysLeft}d left`}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px", color: textSecondary }}>{member.lastLogin ? new Date(member.lastLogin).toLocaleString() : "Never"}</td>
                        <td style={{ padding: "10px", textAlign: "right", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => { setChangePwStaff(changePwStaff?.id === member.id ? null : member); setStaffNewPw(""); setStaffPwMsg(null); }}
                            style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "14px", padding: "4px" }}
                            title="Change Password"
                          >
                            <FaLock />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(member.id)}
                            style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "14px", padding: "4px" }}
                            title="Delete Staff"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                      {changePwStaff?.id === member.id && (
                        <tr style={{ borderBottom: `1px solid ${cardBorder}`, background: darkMode ? "rgba(37,99,235,0.07)" : "#eff6ff" }}>
                          <td colSpan={5} style={{ padding: "14px 10px" }}>
                            <form onSubmit={handleChangeStaffPassword} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ color: textSecondary, fontSize: "13px", fontWeight: 600 }}>New password for {member.name}:</span>
                              <input
                                type="password"
                                value={staffNewPw}
                                onChange={e => setStaffNewPw(e.target.value)}
                                placeholder="Min 8 chars & 1 number"
                                required
                                minLength={8}
                                style={{ padding: "6px 10px", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: darkMode ? "#1e293b" : "#fff", color: textPrimary, fontSize: "13px", width: "190px" }}
                              />
                              <button type="submit" className="primary-btn" disabled={staffPwLoading} style={{ padding: "6px 14px", fontSize: "13px" }}>
                                {staffPwLoading ? "Saving..." : "Set Password"}
                              </button>
                              <button type="button" className="secondary-btn" onClick={() => { setChangePwStaff(null); setStaffPwMsg(null); }} style={{ padding: "6px 14px", fontSize: "13px" }}>Cancel</button>
                              {staffPwMsg && <span style={{ fontSize: "13px", color: staffPwMsg.type === "success" ? "#16a34a" : "#dc2626", fontWeight: 500 }}>{staffPwMsg.text}</span>}
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* About */}
      <div className="form-card" style={{ borderColor: cardBorder }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={iconBox("linear-gradient(135deg,#3b82f6,#2563eb)")}><FaInfoCircle /></div>
          <div style={{ fontWeight: 600, fontSize: "16px", color: textPrimary }}>About</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            ["Application", "Library Management System"],
            ["Admin Email", (() => { try { return JSON.parse(localStorage.getItem("lms_user") || "{}")?.email || "—"; } catch { return "—"; } })()],
            ["Role", profile?.role || "OWNER"],
          ].map(([label, val]) => (
            <div key={label} style={{ fontSize: "14px", color: textSecondary }}>
              <span style={{ fontWeight: 600, color: textPrimary }}>{label}:</span> {val}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Account (Owners only) */}
      {profile?.role !== "STAFF" && (
        <div className="form-card" style={{ borderColor: "#fecaca" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={iconBox("linear-gradient(135deg,#ef4444,#dc2626)")}><FaTrash /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "16px", color: "#dc2626" }}>Delete Account</div>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>Permanently delete this admin account — cannot be undone</div>
            </div>
          </div>
          {deleteMsg && <div style={msgStyle("error")}>{deleteMsg.text}</div>}
          {!showDeleteConfirm ? (
            <button className="secondary-btn" style={{ background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }} onClick={() => setShowDeleteConfirm(true)}>
              <FaTrash style={{ marginRight: "6px" }} /> Delete Account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount}>
              <div className="student-form" style={{ gridTemplateColumns: "1fr" }}>
                <div style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "8px", background: "#fff7ed", border: "1px solid #fdba74", color: "#c2410c", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaExclamationTriangle /> Enter your password to confirm permanent deletion.
                </div>
                <div className="form-group">
                  <label style={{ color: textSecondary }}>Confirm Password</label>
                  <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Enter your password" required autoFocus />
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button type="button" className="secondary-btn" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteMsg(null); }}>Cancel</button>
                  <button type="submit" className="primary-btn" style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }} disabled={deleteLoading}>{deleteLoading ? "Deleting..." : "Confirm Delete"}</button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Confirm Plan Activation Modal */}
      {showActivateConfirmModal && pendingTier && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div style={{
            background: darkMode ? "#1e293b" : "white", border: `1px solid ${cardBorder}`, borderRadius: "20px",
            padding: "28px", maxWidth: "440px", width: "100%", textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <FaExclamationTriangle style={{ fontSize: "44px", color: "#f59e0b" }} />
            </div>
            <h3 style={{ fontSize: "19px", fontWeight: 700, color: textPrimary, marginBottom: "12px" }}>
              Confirm Plan Activation
            </h3>
            <p style={{ fontSize: "14px", color: textSecondary, lineHeight: 1.5, marginBottom: "24px" }}>
              Are you sure you want to activate <strong>{pendingTier.replace("_", " ")}</strong> now?
              <br /><br />
              <span style={{ color: "#f59e0b", fontWeight: 600 }}>Notice:</span> Activating this plan will immediately switch your active plan to {pendingTier.replace("_", " ")} for {pendingExpiryDays || 30} days starting today.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setShowActivateConfirmModal(false)}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: "10px",
                  border: `1px solid ${cardBorder}`, background: "transparent",
                  color: textPrimary, fontWeight: 600, cursor: "pointer", fontSize: "14px"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActivatePendingPlan}
                disabled={actLoading}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: "10px",
                  border: "none", background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white", fontWeight: 700, cursor: "pointer", fontSize: "14px"
                }}
              >
                {actLoading ? "Activating..." : "Confirm & Activate Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;