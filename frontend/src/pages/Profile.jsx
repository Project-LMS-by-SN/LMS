import { useEffect, useState } from "react";
import api from "../api/axios";
import { FaUserShield, FaEnvelope, FaUser, FaClock, FaCheckCircle, FaEdit, FaSave, FaTimes, FaPhone, FaMapMarkerAlt, FaBuilding, FaLock, FaKey, FaEye, FaEyeSlash, FaCopy, FaCheck, FaIdCard } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const Profile = () => {
  const { darkMode } = useTheme();
  const textPrimary = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const cardBorder = darkMode ? "#334155" : "#e2e8f0";
  const inputBg = darkMode ? "#0f172a" : "#f8fafc";

  const subBoxBg = profile => profile?.subscriptionTier !== "FREE" ? (darkMode ? "rgba(34,197,94,0.12)" : "#f0fdf4") : (darkMode ? "#1e293b" : "#f8fafc");
  const subBoxBorder = profile => profile?.subscriptionTier !== "FREE" ? (darkMode ? "rgba(34,197,94,0.3)" : "#bbf7d0") : cardBorder;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Edit form state
  const [formData, setFormData] = useState({
    library_name: "",
    name: "",
    email: "",
    contact: "",
    address: "",
  });

  // Change Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [showPwSection, setShowPwSection] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwMsg({ type: "error", text: "All password fields are required" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }
    if (!/\d/.test(newPassword)) {
      setPwMsg({ type: "error", text: "New password must contain at least one number" });
      return;
    }
    if (newPassword === oldPassword) {
      setPwMsg({ type: "error", text: "New password must be different from current password" });
      return;
    }
    setPwLoading(true);
    try {
      const res = await api.put("/users/change-password", { oldPassword, newPassword });
      if (res.data.success) {
        setPwMsg({ type: "success", text: "Password updated successfully!" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setShowPwSection(false), 2500);
      }
    } catch (err) {
      setPwMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password. Please verify current password.",
      });
    } finally {
      setPwLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/profile");
      if (response.data && response.data.success) {
        const data = response.data.data;
        setProfile(data);
        setFormData({
          library_name: data.library_name || "",
          name: data.name || "",
          email: data.email || "",
          contact: data.contact || "",
          address: data.address || "",
        });
      } else {
        setError("Failed to load user profile");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Error fetching profile from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await api.put("/users/profile", formData);
      if (res.data.success) {
        setSaveMsg({ type: "success", text: "Profile details updated successfully!" });
        setProfile(res.data.data);
        setIsEditing(false);

        // Update local storage user details
        const existing = JSON.parse(localStorage.getItem("lms_user") || "{}");
        const updated = {
          ...existing,
          name: res.data.data.name,
          email: res.data.data.email,
          library_name: res.data.data.library_name,
          library_code: res.data.data.library_code,
          contact: res.data.data.contact,
          address: res.data.data.address,
        };
        localStorage.setItem("lms_user", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      setSaveMsg({ type: "error", text: err.response?.data?.message || "Failed to update profile" });
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <p style={{ color: textMuted }}>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="form-card" style={{ maxWidth: "500px", margin: "40px auto", textAlign: "center" }}>
          <p style={{ color: "#dc2626", marginBottom: "16px" }}>{error}</p>
          <button className="primary-btn" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: "60px" }}>
      <div className="page-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>My Profile</h1>
          <p>Manage and view your administrator profile & library details</p>
        </div>
        {!isEditing ? (
          <button
            className="primary-btn"
            onClick={() => setIsEditing(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 18px", fontSize: "14px" }}
          >
            <FaEdit /> Edit Profile
          </button>
        ) : (
          <button
            className="secondary-btn"
            onClick={() => {
              setIsEditing(false);
              setFormData({
                library_name: profile?.library_name || "",
                name: profile?.name || "",
                email: profile?.email || "",
                contact: profile?.contact || "",
                address: profile?.address || "",
              });
            }}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 18px", fontSize: "14px" }}
          >
            <FaTimes /> Cancel Editing
          </button>
        )}
      </div>

      {saveMsg && (
        <div style={{
          maxWidth: "650px", margin: "0 auto 20px", padding: "12px 16px", borderRadius: "10px",
          background: saveMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${saveMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          color: saveMsg.type === "success" ? "#16a34a" : "#dc2626",
          fontWeight: 600, fontSize: "14px"
        }}>
          {saveMsg.text}
        </div>
      )}

      <div className="form-card" style={{ maxWidth: "650px", margin: "0 auto" }}>
        {/* Header Avatar Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px", borderBottom: `1px solid ${cardBorder}`, paddingBottom: "20px" }}>
          <div style={{
            height: "80px",
            width: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
            flexShrink: 0
          }}>
            <FaUser />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "22px", color: textPrimary, margin: 0 }}>{profile?.name || "Admin User"}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", color: "#2563eb", fontWeight: 600 }}>
                {profile?.library_name || "Libraryly Main Branch"}
              </span>
              {profile?.library_code && (
                <span style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  background: darkMode ? "rgba(59,130,246,0.18)" : "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  letterSpacing: "0.5px",
                  fontFamily: "monospace",
                }}>
                  {profile.library_code}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
              <span className="status-badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <FaCheckCircle style={{ fontSize: "10px" }} /> Active Session
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave}>
          <div className="profile-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "18px" }}>
            
            {/* 1. Library Name */}
            <div className="profile-info-group">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: textMuted, marginBottom: "6px" }}>
                <FaBuilding style={{ color: "#3b82f6" }} /> Library Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="library_name"
                  value={formData.library_name}
                  onChange={handleChange}
                  placeholder="Enter library / branch name"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: inputBg, color: textPrimary, fontSize: "14px", outline: "none" }}
                  required
                />
              ) : (
                <div style={{ fontSize: "15px", fontWeight: 600, color: textPrimary }}>{profile?.library_name || "N/A"}</div>
              )}
            </div>

              {/* 2. Library Code (2 Alphabets + 6 Digits Unique & Non-Editable) */}
            <div className="profile-info-group">
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, color: textMuted, marginBottom: "6px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaIdCard style={{ color: "#3b82f6" }} /> Library Code 
                </span>
                <span style={{ fontSize: "11px", color: textMuted, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <FaLock style={{ fontSize: "10px" }} /> 
                </span>
              </label>
              {isEditing ? (
                <div>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      value={profile?.library_code || "MB543210"}
                      readOnly
                      disabled
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        paddingRight: "70px",
                        borderRadius: "8px",
                        border: `1px dashed ${cardBorder}`,
                        background: darkMode ? "rgba(15,23,42,0.6)" : "#f1f5f9",
                        color: textMuted,
                        fontSize: "14px",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        letterSpacing: "0.8px",
                        cursor: "not-allowed",
                      }}
                    />
                    <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: textMuted, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <FaLock style={{ fontSize: "11px" }} /> Fixed
                    </div>
                  </div>
                  <small style={{ color: textMuted, fontSize: "11px", marginTop: "4px", display: "block" }}>
                    🔒 Permanent 8-character unique code (2 alphabets + 6 digits). Cannot be edited.
                  </small>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#2563eb",
                    fontFamily: "monospace",
                    letterSpacing: "0.8px",
                    background: darkMode ? "rgba(37,99,235,0.12)" : "#eff6ff",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: darkMode ? "1px solid rgba(59,130,246,0.3)" : "1px solid #bfdbfe",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <FaLock style={{ fontSize: "11px", color: "#60a5fa" }} title="Unique and Non-editable" />
                    {profile?.library_code || "N/A"}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(profile?.library_code)}
                    style={{
                      background: copiedCode ? "#16a34a" : (darkMode ? "#1e293b" : "#f1f5f9"),
                      color: copiedCode ? "#ffffff" : textPrimary,
                      border: `1px solid ${copiedCode ? "#16a34a" : cardBorder}`,
                      padding: "7px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                    title="Copy Library Code"
                  >
                    {copiedCode ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy Code</>}
                  </button>
                </div>
              )}
            </div>

            {/* 2. Owner Name */}
            <div className="profile-info-group">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: textMuted, marginBottom: "6px" }}>
                <FaUser style={{ color: "#3b82f6" }} /> Owner / Admin Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter owner full name"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: inputBg, color: textPrimary, fontSize: "14px", outline: "none" }}
                  required
                />
              ) : (
                <div style={{ fontSize: "15px", fontWeight: 600, color: textPrimary }}>{profile?.name || "N/A"}</div>
              )}
            </div>

            {/* 3. Email ID (Editable) */}
            <div className="profile-info-group">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: textMuted, marginBottom: "6px" }}>
                <FaEnvelope style={{ color: "#3b82f6" }} /> Email Address (Editable)
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: inputBg, color: textPrimary, fontSize: "14px", outline: "none" }}
                  required
                />
              ) : (
                <div style={{ fontSize: "15px", fontWeight: 600, color: textPrimary }}>{profile?.email || "N/A"}</div>
              )}
            </div>

            {/* 4. Contact / Phone (Editable) */}
            <div className="profile-info-group">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: textMuted, marginBottom: "6px" }}>
                <FaPhone style={{ color: "#3b82f6" }} /> Contact / Phone Number (Editable)
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Enter phone/contact number"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: inputBg, color: textPrimary, fontSize: "14px", outline: "none" }}
                />
              ) : (
                <div style={{ fontSize: "15px", fontWeight: 600, color: textPrimary }}>{profile?.contact || "Not Provided"}</div>
              )}
            </div>

            {/* 5. Address (Editable) */}
            <div className="profile-info-group">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: textMuted, marginBottom: "6px" }}>
                <FaMapMarkerAlt style={{ color: "#3b82f6" }} /> Library Address (Editable)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full library address"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: inputBg, color: textPrimary, fontSize: "14px", outline: "none" }}
                />
              ) : (
                <div style={{ fontSize: "15px", fontWeight: 600, color: textPrimary }}>{profile?.address || "Not Provided"}</div>
              )}
            </div>

            {/* 6. Access Role */}
            <div className="profile-info-group">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: textMuted, marginBottom: "6px" }}>
                <FaUserShield style={{ color: "#3b82f6" }} /> Access Role
              </label>
              <div style={{ fontSize: "14px" }}>
                <span className="status-badge" style={{ background: "rgba(59,130,246,0.15)", color: "#2563eb", fontWeight: 700 }}>
                  {profile?.role || "OWNER"}
                </span>
              </div>
            </div>

            {/* 7. Subscription Details Box */}
            <div className="profile-info-group" style={{
              background: subBoxBg(profile),
              padding: "18px", borderRadius: "12px", border: `1px solid ${subBoxBorder(profile)}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: profile?.subscriptionTier !== "FREE" ? "#16a34a" : textMuted, fontSize: "14px" }}>
                Subscription Details
              </div>
              <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: textMuted }}>Plan Tier</span>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: textPrimary }}>
                    {profile?.subscriptionTier === "PRO_200" || profile?.subscriptionTier === "PRO" ? "Pro Plan" : profile?.subscriptionTier === "PRO_100" ? "Basic Plan" : profile?.subscriptionTier === "STARTER" ? "Starter Plan" : profile?.subscriptionTier === "ENTERPRISE" ? "Enterprise Plan" : "Free Plan"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: textMuted }}>Expire Date</span>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: textPrimary }}>
                    {profile?.subscriptionExpiry ? new Date(profile.subscriptionExpiry).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: textMuted }}>Remaining Days</span>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: (() => {
                    if (!profile?.subscriptionExpiry) return textMuted;
                    const exp = new Date(profile.subscriptionExpiry);
                    const now = new Date();
                    now.setHours(0,0,0,0);
                    exp.setHours(0,0,0,0);
                    const days = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
                    return days <= 0 ? "#dc2626" : days <= 7 ? "#d97706" : "#16a34a";
                  })() }}>
                    {(() => {
                      if (!profile?.subscriptionExpiry) return "Unlimited";
                      const exp = new Date(profile.subscriptionExpiry);
                      const now = new Date();
                      now.setHours(0,0,0,0);
                      exp.setHours(0,0,0,0);
                      const days = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
                      return days <= 0 ? "Expired" : `${days} days remaining`;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* 8. Created On */}
            <div className="profile-info-group">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: textMuted, marginBottom: "6px" }}>
                <FaClock style={{ color: "#3b82f6" }} /> Created On
              </label>
              <div style={{ fontSize: "14px", fontWeight: 600, color: textPrimary }}>
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                }) : "N/A"}
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderTop: `1px solid ${cardBorder}`, paddingTop: "20px" }}>
            {isEditing ? (
              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", fontSize: "14px" }}
              >
                <FaSave /> {saving ? "Saving Changes..." : "Save Profile Changes"}
              </button>
            ) : (
              <div></div>
            )}

            <button
              type="button"
              className="secondary-btn"
              onClick={handleLogout}
              style={{ color: "#dc2626", borderColor: "#fecaca" }}
            >
              Logout
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Security Card */}
      <div className="form-card" style={{ maxWidth: "650px", margin: "24px auto 40px", padding: "24px", border: `1px solid ${cardBorder}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: showPwSection ? "20px" : "0" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: textPrimary, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <FaLock style={{ color: "#eab308" }} /> Password & Security
            </h3>
            <p style={{ fontSize: "13px", color: textMuted, margin: "2px 0 0 0" }}>Update your account password securely</p>
          </div>
          <button
            type="button"
            className={showPwSection ? "secondary-btn" : "primary-btn"}
            onClick={() => {
              setShowPwSection(!showPwSection);
              setPwMsg(null);
              setOldPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            style={{ fontSize: "13px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            {showPwSection ? <FaTimes /> : <FaKey />} {showPwSection ? "Cancel" : "Change Password"}
          </button>
        </div>

        {showPwSection && (
          <form onSubmit={handleChangePassword} style={{ borderTop: `1px solid ${cardBorder}`, paddingTop: "20px" }}>
            {pwMsg && (
              <div style={{
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "13px",
                fontWeight: 600,
                background: pwMsg.type === "success" ? (darkMode ? "rgba(34,197,94,0.15)" : "#f0fdf4") : (darkMode ? "rgba(220,38,38,0.15)" : "#fef2f2"),
                color: pwMsg.type === "success" ? "#16a34a" : "#dc2626",
                border: `1px solid ${pwMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              }}>
                {pwMsg.text}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: textMuted, display: "block", marginBottom: "6px" }}>Current Password</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showOldPw ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    style={{ width: "100%", padding: "10px 40px 10px 12px", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: inputBg, color: textPrimary, fontSize: "14px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPw(!showOldPw)}
                    style={{
                      position: "absolute", right: "12px", top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", fontSize: "15px",
                      color: textMuted, padding: "0",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    title={showOldPw ? "Hide password" : "Show password"}
                  >
                    {showOldPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: textMuted, display: "block", marginBottom: "6px" }}>New Password</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters & 1 number"
                    required
                    minLength={8}
                    style={{ width: "100%", padding: "10px 40px 10px 12px", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: inputBg, color: textPrimary, fontSize: "14px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    style={{
                      position: "absolute", right: "12px", top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", fontSize: "15px",
                      color: textMuted, padding: "0",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    title={showNewPw ? "Hide password" : "Show password"}
                  >
                    {showNewPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: textMuted, display: "block", marginBottom: "6px" }}>Confirm New Password</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    style={{ width: "100%", padding: "10px 40px 10px 12px", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: inputBg, color: textPrimary, fontSize: "14px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    style={{
                      position: "absolute", right: "12px", top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", fontSize: "15px",
                      color: textMuted, padding: "0",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    title={showConfirmPw ? "Hide password" : "Show password"}
                  >
                    {showConfirmPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="primary-btn"
                disabled={pwLoading}
                style={{ padding: "10px 24px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FaLock /> {pwLoading ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
