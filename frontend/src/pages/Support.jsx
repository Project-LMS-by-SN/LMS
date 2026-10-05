import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHeadset,
  FaPhoneAlt,
  FaEnvelope,
  FaWhatsapp,
  FaBell,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaPaperPlane,
  FaShieldAlt,
  FaSyncAlt,
  FaCheckDouble,
  FaQuestionCircle,
  FaArrowRight,
  FaCommentDots
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";

const getReadNotificationIds = () => {
  try {
    return JSON.parse(localStorage.getItem("lms_read_notifications") || "[]");
  } catch {
    return [];
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

const formatDateFormatted = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Support = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  // Contact details
  const SUPPORT_PHONE = "+919142025447";
  const SUPPORT_PHONE_DISPLAY = "+91 9142025447";
  const SUPPORT_GMAIL = "contactsoftwarenative@gmail.com";
  const SECONDARY_EMAIL = "support@dashurl.in";

  // State
  const [copiedType, setCopiedType] = useState(null); // 'phone' | 'email' | 'secondary_email'
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, ALERTS, ADMISSIONS, SYSTEM
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [readIds, setReadIds] = useState(getReadNotificationIds);
  const [activeFaq, setActiveFaq] = useState(null);

  // Form State
  const [ticketForm, setTicketForm] = useState({
    name: "",
    phone: "",
    category: "General Inquiry",
    subject: "",
    message: "",
    priority: "Normal",
  });
  const [ticketStatus, setTicketStatus] = useState(null); // 'idle' | 'success'

  // Prepopulate library & contact info library-wise
  useEffect(() => {
    const loadLibraryDetails = async () => {
      let libName = "";
      let contactNumber = "";

      try {
        const user = JSON.parse(localStorage.getItem("lms_user") || "{}");
        if (user) {
          libName = user.library_name || user.name || "";
          contactNumber = user.contact || user.mobile || user.phone || "";
          if (libName || contactNumber) {
            setTicketForm((prev) => ({
              ...prev,
              name: prev.name || libName,
              phone: prev.phone || contactNumber,
            }));
          }
        }
      } catch {
        // ignore
      }

      // Fetch fresh profile from API to guarantee library-wise accurate details
      try {
        const res = await api.get("/users/profile");
        if (res.data?.success && res.data?.data) {
          const p = res.data.data;
          const freshName = p.library_name || p.name || libName;
          const freshPhone = p.contact || p.mobile || p.phone || contactNumber;
          setTicketForm((prev) => ({
            ...prev,
            name: freshName || prev.name,
            phone: freshPhone || prev.phone,
          }));
        }
      } catch {
        // ignore
      }
    };

    loadLibraryDetails();
  }, []);

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // Fetch real-time notifications for the last 7 days
  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await api.get("/dashboard/notifications?days=7", { noCache: true });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setNotifications(res.data.data);
      }
      setReadIds(getReadNotificationIds());
    } catch (err) {
      console.error("Support page notifications error:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2200);
  };

  const markAllAsRead = () => {
    try {
      const current = getReadNotificationIds();
      const allIds = notifications.map((n) => n.id);
      const updated = Array.from(new Set([...current, ...allIds]));
      localStorage.setItem("lms_read_notifications", JSON.stringify(updated));
      setReadIds(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleAsRead = (id) => {
    try {
      const current = getReadNotificationIds();
      if (!current.includes(id)) {
        const updated = [...current, id];
        localStorage.setItem("lms_read_notifications", JSON.stringify(updated));
        setReadIds(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isWithinLast7Days = (dateStr) => {
    if (!dateStr) return true;
    const t = new Date(dateStr).getTime();
    if (isNaN(t)) return true;
    return (Date.now() - t) <= SEVEN_DAYS_MS;
  };

  // Keep notifications within last 7 days
  const last7DaysNotifications = notifications.filter((n) => isWithinLast7Days(n.created_at));

  // Filter notifications by tab
  const filteredNotifications = last7DaysNotifications.filter((item) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "ADMISSIONS") {
      return item.type === "ADMISSION_REQUEST" || item.type === "NEW_ADMISSION";
    }
    if (activeTab === "ALERTS") {
      return item.type === "INACTIVE_STUDENT" || item.type === "LOGIN_ALERT";
    }
    if (activeTab === "SYSTEM") {
      return item.type === "LIBRARY_PLAN" || !["ADMISSION_REQUEST", "NEW_ADMISSION", "INACTIVE_STUDENT", "LOGIN_ALERT"].includes(item.type);
    }
    return true;
  });

  const unreadCount = last7DaysNotifications.filter((n) => !readIds.includes(n.id)).length;

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketForm.message.trim()) return;

    setTicketStatus("success");
    setTimeout(() => {
      setTicketForm((prev) => ({
        ...prev,
        subject: "",
        message: "",
        category: "General Inquiry",
      }));
      setTicketStatus(null);
    }, 4500);
  };

  const handleSendViaWhatsApp = () => {
    const text = `*New LMS Support Query*%0A*Name:* ${encodeURIComponent(ticketForm.name || "Library Owner")}%0A*Phone:* ${encodeURIComponent(ticketForm.phone || "N/A")}%0A*Category:* ${encodeURIComponent(ticketForm.category)}%0A*Priority:* ${ticketForm.priority}%0A*Message:* ${encodeURIComponent(ticketForm.message || "Hi, I need assistance with LMS.")}`;
    window.open(`https://wa.me/919142025447?text=${text}`, "_blank");
  };

  const handleSendViaGmail = () => {
    const subject = encodeURIComponent(`[${ticketForm.category}] Support Request - ${ticketForm.name || "Library System"}`);
    const body = encodeURIComponent(`Hello LMS Support Team,\n\nName: ${ticketForm.name}\nPhone: ${ticketForm.phone}\nPriority: ${ticketForm.priority}\n\nDescription:\n${ticketForm.message}\n\nThank you!`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_GMAIL}&su=${subject}&body=${body}`, "_blank");
  };

  const faqs = [
    {
      q: "How does the automated student suspension system work?",
      a: "Students who have not paid or renewed their seat subscription for more than 15 days are automatically flagged as Inactive / Disabled. When this occurs, they are blocked from public attendance check-in until fee clearance is completed in the Collect Fee section.",
    },
    {
      q: "How do I upgrade or renew my library software subscription?",
      a: "Go to System > Subscription from the sidebar menu. You can select your desired tier (Starter, Pro, Enterprise), apply any available promotional discount coupons (e.g. PRO1), and complete payment securely via Razorpay UPI, Netbanking, or Cards.",
    },
    {
      q: "Can two students share the same seat in different shifts?",
      a: "Yes! The seat allocation engine supports multi-shift assignment. A seat can be assigned to different students during Morning, Afternoon, Evening, or Night shifts without conflict.",
    },
    {
      q: "How can students check-in using QR code attendance?",
      a: "Each student has a unique student code and QR attendance pass. You can display your library's Public Attendance terminal or let students scan the QR code to record their in-and-out timings seamlessly.",
    },
    {
      q: "What should I do if I need urgent help outside business hours?",
      a: "Our WhatsApp helpline (+91 9142025447) is monitored 24/7 for urgent technical emergencies. You can message directly for immediate resolution.",
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1350px",
        margin: "0 auto",
        minHeight: "100%",
        color: darkMode ? "#f1f5f9" : "#1e293b",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Hero Header */}
      <div
        style={{
          background: darkMode
            ? "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))"
            : "linear-gradient(135deg, #ffffff, #f8fafc)",
          borderRadius: "20px",
          padding: "32px",
          border: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
          boxShadow: darkMode
            ? "0 10px 30px -10px rgba(0,0,0,0.5)"
            : "0 10px 30px -10px rgba(0,0,0,0.06)",
          marginBottom: "28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "220px",
            height: "220px",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", padding: "6px 14px", borderRadius: "30px", fontSize: "12px", fontWeight: 700, marginBottom: "10px", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981", display: "inline-block" }} />
              CALL: MON–SAT (9 AM - 8 PM) · WHATSAPP UPTO 11 PM · EMAIL 24/7
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Support & Help Center
            </h1>
            <p style={{ color: darkMode ? "#94a3b8" : "#64748b", fontSize: "13px", margin: 0, maxWidth: "600px", lineHeight: "1.5" }}>
              Reach out directly to our dedicated support team via Phone Call, WhatsApp, or Gmail, or check your live notifications below.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href={`tel:${SUPPORT_PHONE}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: "#2563eb",
                color: "#ffffff",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              }}
            >
              <FaPhoneAlt /> Call Support
            </a>
            <a
              href={`https://wa.me/919142025447?text=Hello%20LMS%20Support`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: "#16a34a",
                color: "#ffffff",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
              }}
            >
              <FaWhatsapp style={{ fontSize: "15px" }} /> WhatsApp
            </a>
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_GMAIL}&su=${encodeURIComponent("Library Management System Support Request")}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: darkMode ? "rgba(255,255,255,0.08)" : "#ffffff",
                color: darkMode ? "#f1f5f9" : "#1e293b",
                border: darkMode ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              <FaEnvelope style={{ color: "#ea4335" }} /> Open Gmail
            </a>
          </div>
        </div>

        {/* Compact Contact Details Strip (Call, Gmail, WhatsApp) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "14px",
            paddingTop: "18px",
            borderTop: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
          }}
        >
          {/* Call Details */}
          <div
            style={{
              background: darkMode ? "rgba(37, 99, 235, 0.08)" : "#eff6ff",
              border: darkMode ? "1px solid rgba(37, 99, 235, 0.2)" : "1px solid #bfdbfe",
              borderRadius: "12px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
                <FaPhoneAlt /> Call Support (Mon–Sat)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(SUPPORT_PHONE_DISPLAY, "phone")}
                style={{
                  background: copiedType === "phone" ? "#10b981" : (darkMode ? "rgba(255,255,255,0.1)" : "#ffffff"),
                  color: copiedType === "phone" ? "#ffffff" : (darkMode ? "#ffffff" : "#2563eb"),
                  border: darkMode ? "none" : "1px solid #bfdbfe",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {copiedType === "phone" ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
              </button>
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1d4ed8", letterSpacing: "0.3px" }}>
              {SUPPORT_PHONE_DISPLAY}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: darkMode ? "#94a3b8" : "#64748b" }}>
              <span>Mon – Sat: <strong>9 AM – 8 PM</strong> (Sun Closed)</span>
              <a href={`tel:${SUPPORT_PHONE}`} style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
                Call Now →
              </a>
            </div>
          </div>

          {/* Gmail / Email Details */}
          <div
            style={{
              background: darkMode ? "rgba(239, 68, 68, 0.08)" : "#fef2f2",
              border: darkMode ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid #fecaca",
              borderRadius: "12px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#dc2626", textTransform: "uppercase" }}>
                <FaEnvelope /> Official Gmail (24/7)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(SUPPORT_GMAIL, "email")}
                style={{
                  background: copiedType === "email" ? "#10b981" : (darkMode ? "rgba(255,255,255,0.1)" : "#ffffff"),
                  color: copiedType === "email" ? "#ffffff" : (darkMode ? "#ffffff" : "#dc2626"),
                  border: darkMode ? "none" : "1px solid #fecaca",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {copiedType === "email" ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
              </button>
            </div>
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: darkMode ? "#f8fafc" : "#b91c1c",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "0.1px",
              }}
              title={SUPPORT_GMAIL}
            >
              {SUPPORT_GMAIL}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: darkMode ? "#94a3b8" : "#64748b" }}>
              <span>Replies in &lt; 2 hrs · 24/7</span>
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_GMAIL}&su=${encodeURIComponent("Library System Help Request")}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#dc2626", fontWeight: 700, textDecoration: "none" }}
              >
                Compose →
              </a>
            </div>
          </div>

          {/* WhatsApp Details */}
          <div
            style={{
              background: darkMode ? "rgba(22, 163, 74, 0.08)" : "#f0fdf4",
              border: darkMode ? "1px solid rgba(22, 163, 74, 0.2)" : "1px solid #bbf7d0",
              borderRadius: "12px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>
                <FaWhatsapp style={{ fontSize: "14px" }} /> WhatsApp Support
              </span>
              <button
                type="button"
                onClick={() => handleCopy(SUPPORT_PHONE_DISPLAY, "whatsapp")}
                style={{
                  background: copiedType === "whatsapp" ? "#10b981" : (darkMode ? "rgba(255,255,255,0.1)" : "#ffffff"),
                  color: copiedType === "whatsapp" ? "#ffffff" : (darkMode ? "#ffffff" : "#16a34a"),
                  border: darkMode ? "none" : "1px solid #bbf7d0",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {copiedType === "whatsapp" ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
              </button>
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#15803d", letterSpacing: "0.3px" }}>
              {SUPPORT_PHONE_DISPLAY}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: darkMode ? "#94a3b8" : "#64748b" }}>
              <span>Daily: <strong>Upto 11 PM IST</strong> (Fast reply)</span>
              <a
                href={`https://wa.me/919142025447?text=Hello%20LMS%20Support`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none" }}
              >
                Chat Now →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Section: Notifications on Left, Ticket / Form on Right */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "24px",
          marginBottom: "28px",
        }}
      >
        {/* Notification Section */}
        <div
          style={{
            background: darkMode ? "#1e293b" : "#ffffff",
            borderRadius: "16px",
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
            boxShadow: darkMode
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 20px rgba(0,0,0,0.04)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Section Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                <FaBell />
              </div>
              <div>
                <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  Notification Section
                  <span
                    style={{
                      background: darkMode ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FaClock style={{ fontSize: "10px" }} /> Last 7 Days
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {unreadCount} New
                    </span>
                  )}
                </h2>
                <span style={{ fontSize: "12px", color: darkMode ? "#94a3b8" : "#64748b" }}>
                  Real-time admissions, student alerts & updates from the last 7 days
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={fetchNotifications}
                disabled={loadingNotifs}
                style={{
                  background: "transparent",
                  border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
                  color: darkMode ? "#cbd5e1" : "#475569",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title="Refresh notifications"
              >
                <FaSyncAlt className={loadingNotifs ? "fa-spin" : ""} style={{ fontSize: "11px" }} /> Refresh
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    border: "none",
                    color: "#2563eb",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaCheckDouble style={{ fontSize: "11px" }} /> Mark Read
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              padding: "12px 24px",
              background: darkMode ? "rgba(255,255,255,0.02)" : "#f8fafc",
              borderBottom: darkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid #e2e8f0",
              display: "flex",
              gap: "8px",
              overflowX: "auto",
            }}
          >
            {[
              { id: "ALL", label: `All (${last7DaysNotifications.length})` },
              { id: "ADMISSIONS", label: `Admissions (${last7DaysNotifications.filter(n => n.type === "ADMISSION_REQUEST" || n.type === "NEW_ADMISSION").length})` },
              { id: "ALERTS", label: `Alerts & Security (${last7DaysNotifications.filter(n => n.type === "INACTIVE_STUDENT" || n.type === "LOGIN_ALERT").length})` },
              { id: "SYSTEM", label: "System & Plan" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? "#3b82f6" : "transparent",
                  color: activeTab === tab.id ? "#ffffff" : (darkMode ? "#94a3b8" : "#64748b"),
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List Body */}
          <div
            style={{
              padding: "16px 24px",
              flex: 1,
              maxHeight: "520px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {loadingNotifs && notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: darkMode ? "#94a3b8" : "#64748b" }}>
                <FaSyncAlt className="fa-spin" style={{ fontSize: "24px", marginBottom: "8px" }} />
                <p style={{ fontSize: "13px" }}>Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: darkMode ? "#94a3b8" : "#64748b",
                  background: darkMode ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  borderRadius: "12px",
                  border: darkMode ? "1px dashed rgba(255,255,255,0.1)" : "1px dashed #cbd5e1",
                }}
              >
                <FaBell style={{ fontSize: "32px", opacity: 0.3, marginBottom: "8px" }} />
                <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: darkMode ? "#e2e8f0" : "#334155" }}>
                  No pending alerts in this category
                </h4>
                <p style={{ margin: 0, fontSize: "12px" }}>
                  You are all caught up! New student admissions and subscription warnings will appear here automatically.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRead = readIds.includes(notif.id);
                const isAdmission = notif.type === "ADMISSION_REQUEST";
                const isNewAdmission = notif.type === "NEW_ADMISSION";
                const isInactive = notif.type === "INACTIVE_STUDENT";
                const isPlan = notif.type === "LIBRARY_PLAN";
                const isLogin = notif.type === "LOGIN_ALERT";

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markSingleAsRead(notif.id);
                      if (isAdmission) {
                        if (notif.status === "PENDING") {
                          const reqId = notif.raw_id || String(notif.id).replace("admission-", "");
                          navigate(`/admission?request_id=${reqId}`);
                        } else {
                          navigate(`/students?search=${encodeURIComponent(notif.full_name || notif.mobile || "")}`);
                        }
                      } else if (isNewAdmission || isInactive) {
                        navigate(`/students?search=${encodeURIComponent(notif.student_code || notif.full_name || "")}`);
                      } else if (isPlan) {
                        navigate("/subscription");
                      }
                    }}
                    style={{
                      background: isRead
                        ? (darkMode ? "rgba(255,255,255,0.02)" : "#f8fafc")
                        : (darkMode ? "rgba(59, 130, 246, 0.08)" : "#eff6ff"),
                      border: darkMode
                        ? (isRead ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(59, 130, 246, 0.25)")
                        : (isRead ? "1px solid #e2e8f0" : "1px solid #bfdbfe"),
                      borderRadius: "12px",
                      padding: "14px 16px",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {!isRead && (
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#ef4444",
                              boxShadow: "0 0 6px #ef4444",
                              display: "inline-block",
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            background: isNewAdmission
                              ? "#10b981"
                              : isAdmission
                              ? (notif.status === "APPROVED" ? "#10b981" : notif.status === "REJECTED" ? "#ef4444" : "#3b82f6")
                              : isInactive
                              ? "#ef4444"
                              : isPlan
                              ? "#8b5cf6"
                              : isLogin
                              ? "#f59e0b"
                              : "#64748b",
                            color: isLogin ? "#000" : "#fff",
                          }}
                        >
                          {isNewAdmission
                            ? "New Admission"
                            : isAdmission
                            ? (notif.status === "APPROVED" ? "Admission Done" : notif.status === "REJECTED" ? "Rejected" : "Admission Request")
                            : isInactive
                            ? "Overdue / Inactive"
                            : isPlan
                            ? "Subscription"
                            : isLogin
                            ? "Security Alert"
                            : "Notification"}
                        </span>
                        <strong style={{ fontSize: "14px", fontWeight: isRead ? 600 : 750 }}>
                          {notif.full_name || notif.title || "Notification"}
                        </strong>
                      </div>

                      {notif.created_at && (
                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: darkMode ? "#94a3b8" : "#64748b", whiteSpace: "nowrap" }}>
                            {formatTimeAgo(notif.created_at)}
                          </span>
                          <span style={{ fontSize: "10px", color: darkMode ? "#64748b" : "#94a3b8", whiteSpace: "nowrap" }}>
                            {formatDateFormatted(notif.created_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    <p style={{ fontSize: "13px", color: darkMode ? "#cbd5e1" : "#475569", margin: "8px 0", lineHeight: "1.4" }}>
                      {notif.message || (isAdmission && `Applied with phone ${notif.mobile}.`) || notif.student_code}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                      <span style={{ fontSize: "11px", color: darkMode ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                        {notif.student_code ? `ID: ${notif.student_code}` : notif.mobile ? `Ph: ${notif.mobile}` : ""}
                      </span>

                      {/* Action Links: Only show Review & Admit if admission is pending */}
                      {isAdmission && notif.status === "PENDING" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const reqId = notif.raw_id || String(notif.id).replace("admission-", "");
                            navigate(`/admission?request_id=${reqId}`);
                          }}
                          style={{
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          Review & Admit <FaArrowRight style={{ fontSize: "9px" }} />
                        </button>
                      ) : isAdmission && notif.status === "APPROVED" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <FaCheckCircle style={{ fontSize: "12px" }} /> Admission Done
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/students?search=${encodeURIComponent(notif.full_name || notif.mobile || "")}`);
                            }}
                            style={{
                              background: darkMode ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                              color: darkMode ? "#cbd5e1" : "#334155",
                              border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            View Student <FaArrowRight style={{ fontSize: "9px" }} />
                          </button>
                        </div>
                      ) : isNewAdmission ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/students?search=${encodeURIComponent(notif.student_code || notif.full_name || "")}`);
                          }}
                          style={{
                            background: "#10b981",
                            color: "#fff",
                            border: "none",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          View Student <FaArrowRight style={{ fontSize: "9px" }} />
                        </button>
                      ) : isInactive ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/students?search=${encodeURIComponent(notif.student_code || "")}`);
                          }}
                          style={{
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          View Student <FaArrowRight style={{ fontSize: "9px" }} />
                        </button>
                      ) : isPlan ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/subscription");
                          }}
                          style={{
                            background: "#8b5cf6",
                            color: "#fff",
                            border: "none",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          Renew Plan <FaArrowRight style={{ fontSize: "9px" }} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Raise a Support Ticket / Quick Query Form */}
        <div
          style={{
            background: darkMode ? "#1e293b" : "#ffffff",
            borderRadius: "16px",
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
            boxShadow: darkMode
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 20px rgba(0,0,0,0.04)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              <FaHeadset />
            </div>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
                Raise a Support Request
              </h2>
              <span style={{ fontSize: "12px", color: darkMode ? "#94a3b8" : "#64748b" }}>
                Send your issue directly to engineering or forward via WhatsApp / Gmail
              </span>
            </div>
          </div>

          {ticketStatus === "success" && (
            <div
              style={{
                background: "#dcfce7",
                border: "1px solid #86efac",
                color: "#166534",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FaCheckCircle style={{ fontSize: "16px", color: "#16a34a", flexShrink: 0 }} />
              <div>
                <strong>Support query logged!</strong> Our customer success representative will contact you on {ticketForm.phone || "your registered number"} shortly.
              </div>
            </div>
          )}

          <form onSubmit={handleTicketSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: darkMode ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>
                  Your Name / Library
                </label>
                <input
                  type="text"
                  required
                  value={ticketForm.name}
                  onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                  placeholder="e.g. Apex Study Library"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: darkMode ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
                    background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                    color: darkMode ? "#ffffff" : "#1e293b",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: darkMode ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={ticketForm.phone}
                  onChange={(e) => setTicketForm({ ...ticketForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: darkMode ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
                    background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                    color: darkMode ? "#ffffff" : "#1e293b",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: darkMode ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>
                  Issue Category
                </label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: darkMode ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
                    background: darkMode ? "#1e293b" : "#ffffff",
                    color: darkMode ? "#ffffff" : "#1e293b",
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Subscription & Billing">Subscription & Billing</option>
                  <option value="Seat Layout & Shifts">Seat Layout & Shifts</option>
                  <option value="Attendance & QR Code">Attendance & QR Code</option>
                  <option value="Student Admission">Student Admission</option>
                  <option value="Technical Glitch / Bug">Technical Glitch / Bug</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: darkMode ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>
                  Urgency Level
                </label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: darkMode ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
                    background: darkMode ? "#1e293b" : "#ffffff",
                    color: darkMode ? "#ffffff" : "#1e293b",
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: darkMode ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>
                Describe Your Issue or Question
              </label>
              <textarea
                required
                rows={4}
                value={ticketForm.message}
                onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                placeholder="Explain the problem or requirement in detail so our technical team can assist you right away..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: darkMode ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
                  background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                  color: darkMode ? "#ffffff" : "#1e293b",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: "1.5",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "12px 18px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                <FaPaperPlane style={{ fontSize: "12px" }} /> Submit Request
              </button>

              <button
                type="button"
                onClick={handleSendViaWhatsApp}
                style={{
                  padding: "12px 18px",
                  background: "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                title="Send query via WhatsApp"
              >
                <FaWhatsapp style={{ fontSize: "15px" }} /> WhatsApp
              </button>

              <button
                type="button"
                onClick={handleSendViaGmail}
                style={{
                  padding: "12px 18px",
                  background: "#ea4335",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                title="Send query via Gmail"
              >
                <FaEnvelope style={{ fontSize: "13px" }} /> Gmail
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Section */}
      <div
        style={{
          background: darkMode ? "#1e293b" : "#ffffff",
          borderRadius: "16px",
          padding: "28px",
          border: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
          boxShadow: darkMode
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(139, 92, 246, 0.15)",
              color: "#8b5cf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            <FaQuestionCircle />
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Frequently Asked Questions</h2>
            <span style={{ fontSize: "12px", color: darkMode ? "#94a3b8" : "#64748b" }}>
              Quick solutions to the most common questions regarding LMS management
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                style={{
                  border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                  borderRadius: "12px",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    background: isOpen
                      ? (darkMode ? "rgba(59, 130, 246, 0.1)" : "#eff6ff")
                      : (darkMode ? "rgba(255,255,255,0.02)" : "#f8fafc"),
                    border: "none",
                    textAlign: "left",
                    color: darkMode ? "#f8fafc" : "#1e293b",
                    fontSize: "14px",
                    fontWeight: 700,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <FaChevronUp style={{ color: "#3b82f6" }} /> : <FaChevronDown style={{ color: "#94a3b8" }} />}
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: "16px 20px",
                      background: darkMode ? "#1e293b" : "#ffffff",
                      fontSize: "13px",
                      color: darkMode ? "#cbd5e1" : "#475569",
                      lineHeight: "1.6",
                      borderTop: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Support;
