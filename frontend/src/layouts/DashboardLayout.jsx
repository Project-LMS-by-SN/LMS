import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import api from "../api/axios";

import NotificationBell from "../components/NotificationBell";
import ExpiryModal from "../components/ExpiryModal";
import { useTheme } from "../context/ThemeContext";

import {
  FaBars,
  FaTimes,
  FaHome,
  FaUsers,
  FaChair,
  FaClipboardCheck,
  FaUserPlus,
  FaFileAlt,
  FaClock,
  FaMoneyCheckAlt,
  FaWallet,
  FaReceipt,
  FaChartBar,
  FaCreditCard,
  FaCog,
  FaUser,
  FaSignOutAlt,
  FaPhoneAlt,
  FaSyncAlt,
  FaHeadset,
  FaExclamationTriangle
} from "react-icons/fa";

const DashboardLayout = () => {
  const { darkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profileRef = useRef(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 250);
  };

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); }
    catch { return {}; }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const updated = JSON.parse(localStorage.getItem("lms_user") || "{}");
        setUser(updated);
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const fetchLatestProfile = async () => {
      try {
        const token = localStorage.getItem("lms_token");
        if (!token) return;
        const res = await api.get("/users/profile");
        if (res.data && res.data.success && res.data.data) {
          const currentLocal = (() => {
            try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); }
            catch { return {}; }
          })();
          const merged = { ...currentLocal, ...res.data.data };
          localStorage.setItem("lms_user", JSON.stringify(merged));
          setUser(merged);
        }
      } catch (err) {
        console.error("Failed to sync profile in DashboardLayout:", err);
      }
    };
    fetchLatestProfile();

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const getRolePrefix = () => {
    if (!user || !user.role) return "";
    const roleSegment = user.role.toLowerCase();
    const nameSegment = (user.name || "user").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `/${roleSegment}/${nameSegment}`;
  };
  const prefix = getRolePrefix();

  const getDaysRemaining = () => {
    if (!user.subscriptionExpiry) return null;
    const expiry = new Date(user.subscriptionExpiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };
  const daysLeft = getDaysRemaining();
  const isExpired = user.subscriptionTier !== "FREE" && daysLeft !== null && daysLeft <= 0;

  const location = useLocation();
  const operationalPaths = [
    "students", "seats", "attendance", "admission", "collect-fee",
    "payments", "expenses", "shifts", "fee-plans", "reports"
  ];
  const isCurrentRouteLocked = isExpired && operationalPaths.some(p => {
    const parts = location.pathname.toLowerCase().split("/").filter(Boolean);
    return parts.includes(p);
  });

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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


  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const formatExpiryDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getTierName = (tier) => {
    const map = { FREE: "Free", BASIC: "Basic", PRO: "Pro", ENTERPRISE: "Enterprise", STARTER: "Free", PRO_100: "Basic", PRO_200: "Pro" };
    return map[tier] || "Free";
  };

  const formattedExpiry = formatExpiryDate(user.subscriptionExpiry);

  const getLibraryInitials = (name) => {
    if (!name) return "LM";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="admin-layout">
      <ExpiryModal />
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
            <div className="brand-avatar">{getLibraryInitials(user.library_name)}</div>
            <div className="brand-info" style={{ overflow: "hidden" }}>
              <span className="brand-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                {user.library_name || "Library System"}
              </span>
              {user.library_code && (
                <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, fontFamily: "monospace", letterSpacing: "0.5px", display: "block" }}>
                  {user.library_code}
                </span>
              )}
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <nav className="sidebar-menu">
          <div className="sidebar-category">Main Dashboard</div>
          <NavLink to={`${prefix}/dashboard`} onClick={() => setIsSidebarOpen(false)}>
            <FaHome style={{ fontSize: "16px", minWidth: "18px" }} /> Overview
          </NavLink>

          {isExpired ? (
            <span className="sidebar-disabled-link" style={{ color: '#cbd5e1', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', margin: '2px 0', borderRadius: '8px', opacity: 0.6, textDecoration: 'none', pointerEvents: 'none' }}>
              <FaUsers style={{ fontSize: "16px", minWidth: "18px" }} /> Students <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Expired</span>
            </span>
          ) : (
            <NavLink
              to={`${prefix}/students`}
              onClick={() => {
                setIsSidebarOpen(false);
                window.dispatchEvent(new Event("reset-students-view"));
              }}
            >
              <FaUsers style={{ fontSize: "16px", minWidth: "18px" }} /> Students
            </NavLink>
          )}

          {isExpired ? (
            <span className="sidebar-disabled-link" style={{ color: '#cbd5e1', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', margin: '2px 0', borderRadius: '8px', opacity: 0.6, textDecoration: 'none', pointerEvents: 'none' }}>
              <FaChair style={{ fontSize: "16px", minWidth: "18px" }} /> Seat Layout <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Expired</span>
            </span>
          ) : (
            <NavLink to={`${prefix}/seats`} onClick={() => setIsSidebarOpen(false)}>
              <FaChair style={{ fontSize: "16px", minWidth: "18px" }} /> Seat Layout
            </NavLink>
          )}

          <div className="sidebar-category">Operations</div>
          {isExpired ? (
            <>
              <span className="sidebar-disabled-link" style={{ color: '#cbd5e1', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', margin: '2px 0', borderRadius: '8px', opacity: 0.6, pointerEvents: 'none' }}>
                <FaClipboardCheck style={{ fontSize: "16px", minWidth: "18px" }} /> Attendance <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Expired</span>
              </span>
              <span className="sidebar-disabled-link" style={{ color: '#cbd5e1', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', margin: '2px 0', borderRadius: '8px', opacity: 0.6, pointerEvents: 'none' }}>
                <FaUserPlus style={{ fontSize: "16px", minWidth: "18px" }} /> Admission <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Expired</span>
              </span>
              <span className="sidebar-disabled-link" style={{ color: '#cbd5e1', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', margin: '2px 0', borderRadius: '8px', opacity: 0.6, pointerEvents: 'none' }}>
                <FaCreditCard style={{ fontSize: "16px", minWidth: "18px" }} /> Collect Fee <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Expired</span>
              </span>
            </>
          ) : (
            <>
              <NavLink to={`${prefix}/attendance`} onClick={() => setIsSidebarOpen(false)}>
                <FaClipboardCheck style={{ fontSize: "16px", minWidth: "18px" }} /> Attendance
              </NavLink>
              <NavLink to={`${prefix}/admission`} onClick={() => setIsSidebarOpen(false)}>
                <FaUserPlus style={{ fontSize: "16px", minWidth: "18px" }} /> Admission
              </NavLink>
              <NavLink to={`${prefix}/collect-fee`} onClick={() => setIsSidebarOpen(false)}>
                <FaCreditCard style={{ fontSize: "16px", minWidth: "18px" }} /> Collect Fee
              </NavLink>
            </>
          )}

          {user.role === "OWNER" && (
            isExpired ? (
              <>
                <span className="sidebar-disabled-link" style={{ color: '#cbd5e1', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', margin: '2px 0', borderRadius: '8px', opacity: 0.6, pointerEvents: 'none' }}>
                  <FaFileAlt style={{ fontSize: "16px", minWidth: "18px" }} /> Student Reports <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Expired</span>
                </span>
              </>
            ) : (
              <NavLink to={`${prefix}/reports`} end onClick={() => setIsSidebarOpen(false)}>
                <FaFileAlt style={{ fontSize: "16px", minWidth: "18px" }} /> Student Reports
              </NavLink>
            )
          )}

          {user.role === "OWNER" && (
            isExpired ? (
              <>
                <div className="sidebar-category">Admin Manage</div>
                <span className="sidebar-disabled-link" style={{ color: '#cbd5e1', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', margin: '2px 0', borderRadius: '8px', opacity: 0.6, pointerEvents: 'none' }}>
                  <FaClock style={{ fontSize: "16px", minWidth: "18px" }} /> Shifts <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Expired</span>
                </span>
                <span className="sidebar-disabled-link" style={{ color: '#cbd5e1', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', margin: '2px 0', borderRadius: '8px', opacity: 0.6, pointerEvents: 'none' }}>
                  <FaMoneyCheckAlt style={{ fontSize: "16px", minWidth: "18px" }} /> Fee Plan <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Expired</span>
                </span>
              </>
            ) : (
              <>
                <div className="sidebar-category">Admin Manage</div>
                <NavLink to={`${prefix}/shifts`} onClick={() => setIsSidebarOpen(false)}>
                  <FaClock style={{ fontSize: "16px", minWidth: "18px" }} /> Shifts
                </NavLink>
                <NavLink to={`${prefix}/fee-plans`} onClick={() => setIsSidebarOpen(false)}>
                  <FaMoneyCheckAlt style={{ fontSize: "16px", minWidth: "18px" }} /> Fee Plan
                </NavLink>
              </>
            )
          )}

          <div className="sidebar-category">Finances</div>
          {isExpired ? (
            <span className="sidebar-disabled-link" style={{ color: '#cbd5e1', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', margin: '2px 0', borderRadius: '8px', opacity: 0.6, pointerEvents: 'none' }}>
              <FaWallet style={{ fontSize: "16px", minWidth: "18px" }} /> Payments <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Expired</span>
            </span>
          ) : (
            <NavLink to={`${prefix}/payments`} onClick={() => setIsSidebarOpen(false)}>
              <FaWallet style={{ fontSize: "16px", minWidth: "18px" }} /> Payments
            </NavLink>
          )}

          {user.role === "OWNER" && (
            isExpired ? (
              <span className="sidebar-disabled-link" style={{ color: '#cbd5e1', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', margin: '2px 0', borderRadius: '8px', opacity: 0.6, pointerEvents: 'none' }}>
                <FaReceipt style={{ fontSize: "16px", minWidth: "18px" }} /> Expenses <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Expired</span>
              </span>
            ) : (
              <NavLink to={`${prefix}/expenses`} onClick={() => setIsSidebarOpen(false)}>
                <FaReceipt style={{ fontSize: "16px", minWidth: "18px" }} /> Expenses
              </NavLink>
            )
          )}

          {user.role === "OWNER" && (
            isExpired ? (
              <span className="sidebar-disabled-link" style={{ color: '#cbd5e1', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'not-allowed', margin: '2px 0', borderRadius: '8px', opacity: 0.6, pointerEvents: 'none' }}>
                <FaChartBar style={{ fontSize: "16px", minWidth: "18px" }} /> Financial Reports <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>Expired</span>
              </span>
            ) : (
              <NavLink to={`${prefix}/reports/revenue`} end onClick={() => setIsSidebarOpen(false)}>
                <FaChartBar style={{ fontSize: "16px", minWidth: "18px" }} /> Financial Reports
              </NavLink>
            )
          )}

          <div className="sidebar-category">System</div>
          {user.role !== "STAFF" && (
            <NavLink to={`${prefix}/subscription`} onClick={() => setIsSidebarOpen(false)}>
              <FaCreditCard style={{ fontSize: "16px", minWidth: "18px" }} /> Subscription
              {isExpired && (
                <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 700 }}>Expired</span>
              )}
              {!isExpired && daysLeft !== null && (
                <span style={{ fontSize: '10px', background: daysLeft <= 7 ? '#fffbeb' : '#f0fdf4', color: daysLeft <= 7 ? '#d97706' : '#16a34a', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 700 }}>
                  {daysLeft}d left
                </span>
              )}
            </NavLink>
          )}
          <NavLink to={`${prefix}/settings`} onClick={() => setIsSidebarOpen(false)}>
            <FaCog style={{ fontSize: "16px", minWidth: "18px" }} /> Settings
          </NavLink>
          <NavLink to={`${prefix}/support`} onClick={() => setIsSidebarOpen(false)}>
            <FaHeadset style={{ fontSize: "16px", minWidth: "18px" }} /> Support & Notification
          </NavLink>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              color: "#ef4444",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
              marginTop: "8px",
              transition: "all 0.2s"
            }}
          >
            <FaSignOutAlt style={{ fontSize: "16px", minWidth: "18px" }} /> Logout
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <button className="mobile-toggle" onClick={() => setIsSidebarOpen(true)} title="Open Menu" aria-label="Open Menu">
              <FaBars />
            </button>
            <div className="topbar-title-wrap topbar-desktop-only" style={{ minWidth: 0, overflow: "hidden" }}>
              <span className="topbar-mobile-brand">
                {user.library_name || "Library"}
              </span>
              <p className="topbar-date">{today}</p>
            </div>
          </div>

          <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Subscription Status Chip in Topbar Header */}
            {user.subscriptionTier && user.subscriptionTier !== "FREE" ? (
              <div className="topbar-subscription-chip" style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: isExpired
                  ? (darkMode ? "rgba(239,68,68,0.15)" : "rgba(220,38,38,0.08)")
                  : (darkMode ? "rgba(16,185,129,0.15)" : "rgba(16,163,74,0.08)"),
                border: `1px solid ${isExpired
                  ? (darkMode ? "rgba(239,68,68,0.3)" : "rgba(220,38,38,0.25)")
                  : (darkMode ? "rgba(16,185,129,0.3)" : "rgba(16,163,74,0.25)")}`,
                padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                color: isExpired ? "#ef4444" : (darkMode ? "#4ade80" : "#16a34a")
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <strong>{getTierName(user.subscriptionTier)} Plan</strong>
                </span>
                <span className="topbar-chip-dot" style={{ color: darkMode ? "#64748b" : "#94a3b8" }}>•</span>
                <span className="topbar-chip-expiry" style={{ color: darkMode ? "#cbd5e1" : "#475569" }}>Expires: <strong>{formattedExpiry}</strong></span>
                <span style={{
                  background: isExpired ? "#ef4444" : daysLeft <= 7 ? "#f59e0b" : "#10b981",
                  color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700
                }}>
                  {isExpired ? "Expired" : `${daysLeft}d left`}
                </span>
              </div>
            ) : (
              <div className="topbar-subscription-chip" style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: darkMode ? "rgba(16,185,129,0.12)" : "#f0fdf4",
                border: darkMode ? "1px solid rgba(16,185,129,0.3)" : "1px solid #bbf7d0",
                padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                color: darkMode ? "#4ade80" : "#16a34a"
              }}>
                <span><strong>Free Plan</strong></span>
                <span className="topbar-chip-dot">•</span>
                <span style={{
                  background: "#10b981",
                  color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700
                }}>
                  Forever Free
                </span>
              </div>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              className="topbar-refresh-btn"
              onClick={handleRefresh}
              title="Refresh Page"
              aria-label="Refresh Page"
            >
              <FaSyncAlt
                style={{
                  transition: "transform 0.5s ease",
                  transform: isRefreshing ? "rotate(360deg)" : "rotate(0deg)",
                }}
              />
            </button>

            <NotificationBell />
            <div className="profile-container" style={{ position: "relative" }} ref={profileRef}>
              <div
                className="profile-box"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <FaUser style={{ fontSize: "15px", color: "#475569" }} />
              </div>
              {isProfileDropdownOpen && (
                <div className="profile-dropdown" style={{ minWidth: "220px", padding: "8px 0" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", marginBottom: "4px" }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>{user.name || (user.role === "STAFF" ? "Staff Member" : "Admin")}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{user.email || ""}</div>
                    {user.subscriptionTier && (
                      <div style={{
                        marginTop: "8px", padding: "8px", borderRadius: "8px",
                        background: isExpired ? "#fef2f2" : "#f0fdf4",
                        border: `1px solid ${isExpired ? "#fecaca" : "#bbf7d0"}`,
                        fontSize: "11px"
                      }}>
                        <div style={{ fontWeight: 700, color: isExpired ? "#dc2626" : "#16a34a", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.library_name || "Libraryly Main Branch"}</span>
                          {user.library_code && (
                            <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: "rgba(0,0,0,0.06)", fontFamily: "monospace", letterSpacing: "0.5px", flexShrink: 0 }}>
                              {user.library_code}
                            </span>
                          )}
                        </div>
                        <div style={{ color: "#475569", marginTop: "2px" }}>
                          Expires: <strong>{formattedExpiry}</strong>
                        </div>
                        <div style={{ color: isExpired ? "#dc2626" : "#16a34a", fontWeight: 600, marginTop: "2px" }}>
                          Remaining: {isExpired ? "Expired" : `${daysLeft} days left`}
                        </div>
                      </div>
                    )}
                  </div>
                  <NavLink
                    to={`${prefix}/profile`}
                    onClick={() => { setIsProfileDropdownOpen(false); setIsSidebarOpen(false); }}
                    className="profile-dropdown-item"
                    style={{ display: "flex", alignItems: "center", gap: "10px" }}
                  >
                    <FaUser style={{ fontSize: "14px" }} /> Profile Page
                  </NavLink>
                  {user.role !== "STAFF" && (
                    <NavLink
                      to={`${prefix}/settings`}
                      onClick={() => { setIsProfileDropdownOpen(false); setIsSidebarOpen(false); }}
                      className="profile-dropdown-item"
                      style={{ display: "flex", alignItems: "center", gap: "10px" }}
                    >
                      <FaCog style={{ fontSize: "14px" }} /> Settings
                    </NavLink>
                  )}
                  {user.role !== "STAFF" && (
                    <NavLink
                      to={`${prefix}/subscription`}
                      onClick={() => { setIsProfileDropdownOpen(false); setIsSidebarOpen(false); }}
                      className="profile-dropdown-item"
                      style={{ display: "flex", alignItems: "center", gap: "10px" }}
                    >
                      <FaCreditCard style={{ fontSize: "14px" }} /> Subscription
                    </NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="profile-dropdown-item logout-btn"
                    style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}
                  >
                    <FaSignOutAlt style={{ fontSize: "14px" }} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {isCurrentRouteLocked ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            padding: "40px 20px",
            textAlign: "center"
          }}>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              marginBottom: "18px",
              boxShadow: "0 10px 25px -5px rgba(220, 38, 38, 0.2)"
            }}>
              <FaExclamationTriangle />
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: darkMode ? "#f87171" : "#991b1b", marginBottom: "8px" }}>
              Subscription Expired
            </h2>
            <p style={{
              fontSize: "14px",
              color: darkMode ? "#cbd5e1" : "#475569",
              maxWidth: "500px",
              lineHeight: 1.6,
              marginBottom: "24px"
            }}>
              {user.role === "STAFF"
                ? "Your library's subscription has expired. All operations and management modules are temporarily locked. Please contact your library administrator or owner to renew the subscription."
                : "Your subscription plan has expired. To access this module and resume library operations, please renew your subscription."
              }
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              {user.role !== "STAFF" && (
                <Link
                  to={`${prefix}/subscription`}
                  style={{
                    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                    color: "#fff",
                    padding: "10px 24px",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "14px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)"
                  }}
                >
                  <FaCreditCard /> Renew Subscription
                </Link>
              )}
              <Link
                to={`${prefix}/dashboard`}
                style={{
                  background: darkMode ? "#334155" : "#f1f5f9",
                  color: darkMode ? "#f1f5f9" : "#334155",
                  padding: "10px 22px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <FaHome /> Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {/* Modern Mobile Bottom Navigation Bar (Hidden on Desktop via CSS) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <NavLink
          to={`${prefix}/dashboard`}
          className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "active" : ""}`}
        >
          <FaHome className="bottom-nav-icon" />
          <span>Home</span>
        </NavLink>
        {isExpired ? (
          <span className="mobile-bottom-nav-item disabled" style={{ opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" }} title="Subscription Expired">
            <FaUsers className="bottom-nav-icon" />
            <span>Students</span>
          </span>
        ) : (
          <NavLink
            to={`${prefix}/students`}
            onClick={() => {
              window.dispatchEvent(new Event("reset-students-view"));
            }}
            className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <FaUsers className="bottom-nav-icon" />
            <span>Students</span>
          </NavLink>
        )}
        {isExpired ? (
          <span className="mobile-bottom-nav-item disabled" style={{ opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" }} title="Subscription Expired">
            <FaChair className="bottom-nav-icon" />
            <span>Seats</span>
          </span>
        ) : (
          <NavLink
            to={`${prefix}/seats`}
            className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <FaChair className="bottom-nav-icon" />
            <span>Seats</span>
          </NavLink>
        )}
        {isExpired ? (
          <span className="mobile-bottom-nav-item disabled" style={{ opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" }} title="Subscription Expired">
            <FaClipboardCheck className="bottom-nav-icon" />
            <span>Attendance</span>
          </span>
        ) : (
          <NavLink
            to={`${prefix}/attendance`}
            className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <FaClipboardCheck className="bottom-nav-icon" />
            <span>Attendance</span>
          </NavLink>
        )}
        {isExpired ? (
          <span className="mobile-bottom-nav-item disabled" style={{ opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" }} title="Subscription Expired">
            <FaMoneyCheckAlt className="bottom-nav-icon" />
            <span>Collect Fee</span>
          </span>
        ) : (
          <NavLink
            to={`${prefix}/collect-fee`}
            className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "active" : ""}`}
            title="Collect Fee"
          >
            <FaMoneyCheckAlt className="bottom-nav-icon" />
            <span>Collect Fee</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
};

export default DashboardLayout;