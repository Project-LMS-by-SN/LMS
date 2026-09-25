import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUsers, FaUserCheck, FaChair, FaUserMinus, FaClipboardCheck, FaExclamationTriangle, FaTimes, FaUserPlus, FaRocket, FaCrown, FaBolt, FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt, FaUserShield, FaEdit } from "react-icons/fa";
import api from "../api/axios";
import SeatAvailability from "../components/SeatAvailability";
import { useTheme } from "../context/ThemeContext";
import { formatTime } from "../utils/timeUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  const { darkMode, timeFormat } = useTheme();
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

    api.get("/users/profile").then(res => {
      if (res.data && res.data.success && res.data.data) {
        const currentLocal = JSON.parse(localStorage.getItem("lms_user") || "{}");
        const merged = { ...currentLocal, ...res.data.data };
        localStorage.setItem("lms_user", JSON.stringify(merged));
        setUser(merged);
      }
    }).catch(err => console.log("Profile fetch error in Dashboard:", err));

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const isOwner = user.role === "OWNER";

  const getRolePrefix = () => {
    if (!user || !user.role) return "";
    const roleSegment = user.role.toLowerCase();
    const nameSegment = (user.name || "user").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `/${roleSegment}/${nameSegment}`;
  };
  const prefix = getRolePrefix();

  const getTierLabel = (tier) => {
    const map = { FREE: "Free", STARTER: "Starter", PRO_100: "Basic", PRO_200: "Pro", PRO: "Pro", ENTERPRISE: "Enterprise" };
    return map[tier] || "Free";
  };

  const formatExpiryDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getTierColor = (tier) => {
    const map = { FREE: "#94a3b8", STARTER: "#10b981", PRO_100: "#3b82f6", PRO_200: "#8b5cf6", PRO: "#8b5cf6", ENTERPRISE: "#f59e0b" };
    return map[tier] || "#94a3b8";
  };

  const getDaysRemaining = () => {
    if (!user.subscriptionExpiry) return null;
    const expiry = new Date(user.subscriptionExpiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysLeft = getDaysRemaining();
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

  const [stats, setStats] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [revenueData, setRevenueData] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [metricLoading, setMetricLoading] = useState(false);
  const [metricSearch, setMetricSearch] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLiveDateTime = (date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    let h = date.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12;
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    const timeStr = `${h}:${m}:${s} ${ampm}`;

    return {
      dateText: `${dayName}, ${day} ${monthName} ${year}`,
      timeText: timeStr
    };
  };

  const formatLiveTime = (date) => {
    const { dateText, timeText } = formatLiveDateTime(date);
    return `${dateText} | ${timeText}`;
  };

  const handleMetricCardClick = async (card) => {
    try {
      setMetricLoading(true);
      setSelectedMetric({ label: card.label, key: card.key, students: [] });
      setMetricSearch("");
      
      const res = await api.get(`/dashboard/stats-students?metric=${card.key}`);
      if (res.data.success) {
        setSelectedMetric({
          label: card.label,
          key: card.key,
          students: res.data.data
        });
      }
    } catch (error) {
      console.error("Failed to fetch metric students:", error);
      alert("Failed to load students list.");
      setSelectedMetric(null);
    } finally {
      setMetricLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data.data);
    } catch (error) {
      console.log("Dashboard stats error:", error);
    }
  };

  const fetchRevenue = async (year) => {
    try {
      const res = await api.get(`/dashboard/revenue?year=${year}`);
      setRevenueData(res.data.data);
    } catch (error) {
      console.log("Revenue fetch error:", error);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const res = await api.get("/dashboard/recent-payments?limit=4");
      setRecentPayments(res.data.data);
    } catch (error) {
      console.log("Recent payments fetch error:", error);
    }
  };

  useEffect(() => {
    Promise.all([fetchStats(), fetchRevenue(selectedYear), fetchRecentPayments()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRevenue(selectedYear);
  }, [selectedYear]);

const statsCards = stats ? [
    { icon: <FaUsers />, color: "blue", label: "Total Members", value: stats.total_students, key: "total_students" },
    { icon: <FaUserCheck />, color: "green", label: "Active Members", value: `${stats.active_students || stats.active_validities} / ${stats.total_students}`, key: "active_students" },
    { icon: <FaExclamationTriangle />, color: "amber", label: "Suspended Members (unpaid > 7d)", value: stats.suspended_students !== undefined ? stats.suspended_students : (stats.unpaid_students || 0), key: "suspended" },
    { icon: <FaUserMinus />, color: "red", label: "Inactive Members (unpaid > 20d)", value: stats.inactive_members || 0, key: "inactive" },
    { icon: <FaExclamationTriangle />, color: "orange", label: "Expire Soon (7 days)", value: stats.expiring_soon, key: "expiring_soon" },
    { icon: <FaClipboardCheck />, color: "purple", label: "Today's Attendance", value: stats.today_present, key: "today_present" },
  ] : [];

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 5; y <= currentYear; y++) {
    years.push(y.toString());
  }

  if (loading) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: '#888', fontSize: '18px' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-left">
          <h2 className="welcome-title">Welcome back, {user.library_name || "My Library"}</h2>
          {(() => {
            const { dateText, timeText } = formatLiveDateTime(currentTime);
            return (
              <p style={{
                fontSize: "14px",
                fontWeight: 500,
                margin: "4px 0 0 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontVariantNumeric: "tabular-nums"
              }}>
                <span style={{ color: darkMode ? "#cbd5e1" : "#475569" }}>
                  {dateText}
                </span>
                <span style={{ color: darkMode ? "#64748b" : "#94a3b8" }}>|</span>
                <span style={{
                  color: darkMode ? "#818cf8" : "#4f46e5",
                  fontWeight: 700,
                  letterSpacing: "0.3px"
                }}>
                  {timeText}
                </span>
              </p>
            );
          })()}
        </div>
        <div className="welcome-right welcome-actions" style={{ display: 'flex', gap: '10px' }}>
          <Link to={`${prefix}/attendance`} className="welcome-add-btn" style={{ background: '#2563eb' }}>
            <FaClipboardCheck /> Mark Attendance
          </Link>
          <Link to={`${prefix}/admission`} className="welcome-add-btn">
            <FaUserPlus /> Add Student
          </Link>
        </div>
      </div>

      {/* Expiry Warning Banner */}
      {user.subscriptionTier !== "FREE" && isExpired && (
        <div className="expiry-warning-banner expired mobile-banner-stack" style={{
          background: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          border: darkMode ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              <FaExclamationTriangle />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: darkMode ? '#fca5a5' : '#991b1b', margin: 0 }}>Subscription Expired!</h4>
              <p style={{ fontSize: '13px', color: darkMode ? '#f87171' : '#b91c1c', margin: '2px 0 0 0' }}>Your plan expired on <strong>{formatExpiryDate(user.subscriptionExpiry)}</strong>. Renew now to continue using all features.</p>
            </div>
          </div>
          <Link to={`${prefix}/subscription`} style={{
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s'
          }}>
            Renew Now
          </Link>
        </div>
      )}

      {user.subscriptionTier !== "FREE" && isExpiringSoon && !isExpired && (
        <div className="expiry-warning-banner expiring mobile-banner-stack" style={{
          background: darkMode ? 'rgba(245, 158, 11, 0.15)' : 'linear-gradient(135deg, #fffbeb, #fef3c7)',
          border: darkMode ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #fde68a',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#d97706', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              <FaExclamationTriangle />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: darkMode ? '#fde68a' : '#92400e', margin: 0 }}>Subscription Expiring Soon!</h4>
              <p style={{ fontSize: '13px', color: darkMode ? '#fcd34d' : '#a16207', margin: '2px 0 0 0' }}>Your plan expires on <strong>{formatExpiryDate(user.subscriptionExpiry)}</strong> (<strong>{daysLeft} day{daysLeft > 1 ? 's' : ''} left</strong>). Renew now to avoid interruption.</p>
            </div>
          </div>
          <Link to={`${prefix}/subscription`} style={{
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s'
          }}>
            Renew Now
          </Link>
        </div>
      )}

      <section className="stats-grid dashboard-stats">
        {statsCards.map((card, i) => {
          const isClickable = ["total_students", "active_students", "inactive", "expiring_soon", "today_present", "unpaid"].includes(card.key);
          return (
            <div 
              className="stats-card" 
              key={i}
              onClick={() => isClickable && handleMetricCardClick(card)}
              style={isClickable ? { cursor: 'pointer', transition: 'all 0.2s ease-in-out' } : {}}
              onMouseEnter={(e) => {
                if (isClickable) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (isClickable) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div className={`card-icon ${card.color}`}>{card.icon}</div>
              <div>
                <p>{card.label}</p>
                <h2>{card.value}</h2>
              </div>
            </div>
          );
        })}
      </section>

      {/* Quick Actions - blocked when expired */}
      {!isExpired && (
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaBolt style={{ color: '#eab308', fontSize: '18px' }} /> Quick Actions
        </h3>
        <div className="responsive-grid-4 quick-actions-grid" style={{ display: 'grid', gap: '16px' }}>
          {isOwner && (
            <Link to={`${prefix}/students`} style={{ textDecoration: 'none' }}>
              <div className="quick-action-card" style={{ background: darkMode ? '#1e293b' : '#f8fafc', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: darkMode ? 'rgba(124,58,237,0.2)' : '#ede9fe', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>
                  <FaUsers />
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: darkMode ? '#f8fafc' : '#1e293b', margin: '0 0 4px 0' }}>Students</h4>
                <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>View & manage members</p>
              </div>
            </Link>
          )}
          <Link to={`${prefix}/admission`} style={{ textDecoration: 'none' }}>
            <div className="quick-action-card" style={{ background: darkMode ? '#1e293b' : '#f8fafc', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: darkMode ? 'rgba(37,99,235,0.2)' : '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>
                <FaUserPlus />
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: darkMode ? '#f8fafc' : '#1e293b', margin: '0 0 4px 0' }}>Add Student</h4>
              <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>Register a new member</p>
            </div>
          </Link>
          {isOwner && (
            <Link to={`${prefix}/seats`} style={{ textDecoration: 'none' }}>
              <div className="quick-action-card" style={{ background: darkMode ? '#1e293b' : '#f8fafc', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: darkMode ? 'rgba(217,119,6,0.2)' : '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>
                  <FaChair />
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: darkMode ? '#f8fafc' : '#1e293b', margin: '0 0 4px 0' }}>Seat Layout</h4>
                <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>Allocate & customize layout</p>
              </div>
            </Link>
          )}
          <Link to={`${prefix}/collect-fee`} style={{ textDecoration: 'none' }}>
            <div className="quick-action-card" style={{ background: darkMode ? '#1e293b' : '#f8fafc', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: darkMode ? 'rgba(22,163,74,0.2)' : '#dcfce7', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>
                <FaUserCheck />
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: darkMode ? '#f8fafc' : '#1e293b', margin: '0 0 4px 0' }}>Collect Fees</h4>
              <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>Make payment</p>
            </div>
          </Link>
        </div>
      </div>
      )}

      {isOwner && !isExpired && (
        <div className="chart-container" style={{
          background: darkMode ? '#1e293b' : '#FCFBF9',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
          padding: '24px', borderRadius: '12px', marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div className="revenue-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ color: darkMode ? '#f8fafc' : '#1e293b', fontSize: '18px', margin: 0 }}>Revenue Analysis</h3>
              <Link
                to="/reports/revenue"
                style={{
                  fontSize: '12px',
                  color: '#3b82f6',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: darkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                }}
              >
                Open in Reports →
              </Link>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '8px 14px', borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.15)' : '#d4d4d8'}`,
                background: darkMode ? '#0f172a' : '#f8fafc',
                color: darkMode ? '#f8fafc' : '#0f172a',
                fontWeight: 600, outline: 'none', fontSize: '14px', cursor: 'pointer'
              }}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="revenue-chart-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{
              height: '250px', display: 'flex', gap: '12px',
              borderBottom: `2px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
              paddingBottom: '10px', position: 'relative', minWidth: '400px'
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: 'calc(100% - 10px)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                color: darkMode ? '#94a3b8' : '#94a3b8', fontSize: '12px', paddingBottom: '12px'
              }}>
                <span>₹{maxRevenue.toLocaleString()}</span>
                <span>₹{Math.round(maxRevenue / 2).toLocaleString()}</span>
                <span>₹0</span>
              </div>
              <div className="chart-bars-container" style={{ marginLeft: '60px', display: 'flex', alignItems: 'flex-end', gap: '12px', width: '100%', height: '100%', paddingTop: '28px' }}>
                {revenueData.map((d, i) => {
                  const height = d.revenue > 0 ? Math.max((d.revenue / maxRevenue) * 100, 4) : 4;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', minWidth: '28px' }}>
                      {d.revenue > 0 && (
                        <span style={{
                          fontSize: '11px', fontWeight: 700,
                          color: darkMode ? '#60a5fa' : '#2563eb',
                          whiteSpace: 'nowrap', marginBottom: '4px',
                          background: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
                          border: darkMode ? '1px solid rgba(59, 130, 246, 0.3)' : 'none',
                          padding: '2px 6px', borderRadius: '4px'
                        }}>
                          ₹{Math.round(d.revenue).toLocaleString('en-IN')}
                        </span>
                      )}
                      <div style={{
                        width: '100%', maxWidth: '40px', height: `${height}%`,
                        background: d.revenue > 0 ? 'linear-gradient(180deg, #3b82f6, #2563eb)' : (darkMode ? '#334155' : '#e2e8f0'),
                        borderRadius: '6px 6px 0 0', transition: 'height 0.3s', minHeight: '4px'
                      }} />
                      <span style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '8px', fontWeight: 500 }}>{monthNames[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-bottom-grid responsive-grid-2-1" style={{ display: 'grid', gridTemplateColumns: isOwner && !isExpired ? '2fr 1fr' : '1fr', gap: '24px' }}>
        {isOwner && !isExpired && (
          <div className="table-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#1e293b', fontSize: '18px' }}>Recent Payments</h3>
              <a href="/payments" style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>See all →</a>
            </div>
            <div className="responsive-table-wrap">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr>
                  <td style={{ padding: '12px 0' }} colSpan={4}>No recent payments</td>
                </tr>
              ) : (
                recentPayments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 0' }}>
                      <div style={{ fontWeight: 500 }}>{p.full_name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.student_code}</div>
                    </td>
                    <td style={{ padding: '12px 0', fontWeight: 600 }}>₹{p.amount_received}</td>
                    <td style={{ padding: '12px 0', color: '#64748b', fontSize: '13px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        {p.payment_date ? p.payment_date.split(" ")[0] : ""}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {formatTime(p.payment_date ? p.payment_date.split(" ").slice(1).join(" ") : "", timeFormat)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 0' }}>
                      <span className="status-badge">{p.mode_name}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

        <SeatAvailability onShiftClick={(shift) => setSelectedShift(shift)} />
      </div>

      {selectedShift && (
        <div className="modal-overlay" onClick={() => setSelectedShift(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedShift.shift_name}</h3>
                <p>{formatTime(selectedShift.start_time, timeFormat)} - {formatTime(selectedShift.end_time, timeFormat)}</p>
              </div>
              <FaTimes className="modal-close" onClick={() => setSelectedShift(null)} />
            </div>
            <div className="modal-body">
              <div className="modal-summary">
                <span className="modal-summary-occupied">
                  {selectedShift.occupied_seats} occupied
                </span>
                <span className="modal-summary-sep">·</span>
                <span className="modal-summary-available">
                  {selectedShift.total_seats - selectedShift.occupied_seats} available
                </span>
                <span className="modal-summary-sep">·</span>
                <span>{selectedShift.total_seats} total</span>
              </div>
              <div className="seat-grid">
                {(selectedShift.all_seats || []).map((seat) => {
                  const seatNum = seat.seat_number;
                  const currentAssignment = selectedShift.assignments?.find(
                    (a) => a.seat_number === seatNum
                  );

                  let seatClass = "seat-available";
                  if (seat.is_active === false) seatClass = "seat-inactive";
                  else if (currentAssignment) seatClass = "seat-occupied";

                  return (
                    <div
                      key={seat.id}
                      className={`seat-cell ${seatClass}`}
                      title={currentAssignment ? `${currentAssignment.student_name} (${currentAssignment.student_code})` : "Available"}
                    >
                      <span className="seat-num">{seatNum}</span>
                      {currentAssignment && (
                        <span className="seat-student">{
                          currentAssignment.student_name.length > 10
                            ? currentAssignment.student_name.slice(0, 10) + "…"
                            : currentAssignment.student_name
                        }</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedShift.assignments?.length > 0 && (
                <div className="modal-table-section">
                  <h4>Occupied Seats</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Seat</th>
                        <th>Student</th>
                        <th>Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedShift.assignments.map((a, i) => (
                        <tr key={i}>
                          <td>Seat {a.seat_number}</td>
                          <td>{a.student_name}</td>
                          <td>{a.student_code}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedMetric && (
        <div className="modal-overlay" onClick={() => setSelectedMetric(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '100%' }}>
            <div className="modal-header">
              <div>
                <h3>{selectedMetric.label}</h3>
                <p>{selectedMetric.students.length} Student{selectedMetric.students.length !== 1 ? 's' : ''} found</p>
              </div>
              <FaTimes className="modal-close" onClick={() => setSelectedMetric(null)} />
            </div>
            
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px 24px' }}>
              {metricLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                  <p style={{ color: '#888', fontSize: '15px' }}>Loading students list...</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Search by name, phone or student code..."
                      value={metricSearch}
                      onChange={(e) => setMetricSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d4d4d8',
                        background: '#f8fafc',
                        outline: 'none',
                        fontSize: '14px',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d4d4d8'}
                    />
                  </div>

                  <div className="modal-table-section" style={{ marginTop: 0 }}>
                    {(() => {
                      const filtered = selectedMetric.students.filter(s => 
                        s.full_name?.toLowerCase().includes(metricSearch.toLowerCase()) ||
                        s.student_code?.toLowerCase().includes(metricSearch.toLowerCase()) ||
                        s.mobile?.includes(metricSearch)
                      );

                      if (filtered.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '14px' }}>
                            No students match your search
                          </div>
                        );
                      }

                      return (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                              <th style={{ padding: '10px 8px', color: '#475569', fontSize: '13px', fontWeight: 600 }}>Code</th>
                              <th style={{ padding: '10px 8px', color: '#475569', fontSize: '13px', fontWeight: 600 }}>Name</th>
                              <th style={{ padding: '10px 8px', color: '#475569', fontSize: '13px', fontWeight: 600 }}>Mobile</th>
                              <th style={{ padding: '10px 8px', color: '#475569', fontSize: '13px', fontWeight: 600 }}>Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((s) => (
                              <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '12px 8px', fontWeight: 600, color: '#4f46e5', fontSize: '13px' }}>{s.student_code}</td>
                                <td style={{ padding: '12px 8px' }}>
                                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{s.full_name}</div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Admitted: {s.admission_date}</div>
                                </td>
                                <td style={{ padding: '12px 8px', color: '#475569', fontSize: '13px' }}>{s.mobile}</td>
                                <td style={{ padding: '12px 8px' }}>
                                  {s.access_type ? (
                                    <span className="status-badge" style={{ 
                                      backgroundColor: s.access_type === 'RESERVED' ? '#eff6ff' : '#f0fdf4',
                                      color: s.access_type === 'RESERVED' ? '#2563eb' : '#16a34a',
                                      fontSize: '11px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontWeight: 600
                                    }}>
                                      {s.access_type}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>N/A</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;