import { useEffect, useState, useRef } from "react";
import { FaBell, FaCheckDouble } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(getReadNotificationIds);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/dashboard/notifications");
      setNotifications(res.data.data || []);
      setReadIds(getReadNotificationIds());
    } catch (err) {
      console.log("Notification fetch error:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 10 seconds to detect new notifications proactively
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markNotificationAsRead = (id) => {
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

  const markAllAsRead = (e) => {
    if (e) e.stopPropagation();
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

  const handleItemClick = (n) => {
    setOpen(false);
    // Mark as read: red mark is removed, but notification remains visible in list for 48 hrs
    markNotificationAsRead(n.id);

    if (n.type === "ADMISSION_REQUEST") {
      const reqId = n.raw_id || String(n.id).replace("admission-", "");
      navigate(`/admission?request_id=${reqId}`);
    } else if (n.type === "INACTIVE_STUDENT") {
      navigate(`/students?search=${encodeURIComponent(n.student_code)}`);
    } else if (n.type === "LIBRARY_PLAN") {
      navigate("/subscription");
    } else if (n.type === "LOGIN_ALERT") {
      // Dismisses red mark
    } else if (n.student_code) {
      navigate(`/students?search=${encodeURIComponent(n.student_code)}`);
    }
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <div className="notification-bell" ref={ref}>
      <div className="bell-icon" onClick={() => setOpen(!open)}>
        <FaBell />
        {unreadCount > 0 && (
          <span className="badge-count">{unreadCount}</span>
        )}
      </div>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Notifications ({notifications.length})</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#3b82f6",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 6px"
                }}
              >
                <FaCheckDouble style={{ fontSize: "10px" }} /> Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications in last 48h</div>
          ) : (
            notifications.map((n) => {
              const isRead = readIds.includes(n.id);
              return (
                <div
                  className="notif-item"
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    cursor: "pointer",
                    opacity: isRead ? 0.7 : 1,
                    background: isRead ? "transparent" : "rgba(239, 68, 68, 0.04)",
                    borderLeft: n.type === "ADMISSION_REQUEST"
                      ? "4px solid #3b82f6"
                      : n.type === "INACTIVE_STUDENT"
                      ? "4px solid #ef4444"
                      : n.type === "LIBRARY_PLAN"
                      ? "4px solid #8b5cf6"
                      : n.type === "LOGIN_ALERT"
                      ? "4px solid #f59e0b"
                      : "4px solid #64748b",
                    padding: "10px 12px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    transition: "all 0.2s"
                  }}
                >
                  {n.type === "ADMISSION_REQUEST" ? (
                    <>
                      <div className="notif-name" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {!isRead && (
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                          )}
                          <span style={{ fontWeight: isRead ? 500 : 700 }}>{n.full_name}</span>
                        </div>
                        <span style={{ fontSize: "9px", background: "#3b82f6", color: "#fff", padding: "2px 6px", borderRadius: "8px", fontWeight: 700, textTransform: "uppercase" }}>Request</span>
                      </div>
                      <div className="notif-meta" style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
                        <span>{n.mobile} · Click to review & admit</span>
                        {n.created_at && <span>{formatTimeAgo(n.created_at)}</span>}
                      </div>
                    </>
                  ) : n.type === "INACTIVE_STUDENT" ? (
                    <>
                      <div className="notif-name" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {!isRead && (
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                          )}
                          <span style={{ fontWeight: isRead ? 500 : 700 }}>{n.full_name}</span>
                        </div>
                        <span style={{ fontSize: "9px", background: "#ef4444", color: "#fff", padding: "2px 6px", borderRadius: "8px", fontWeight: 700, textTransform: "uppercase" }}>Inactive</span>
                      </div>
                      <div className="notif-meta" style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
                        <span>{n.student_code} · Moved to Inactive section (unpaid)</span>
                        {n.created_at && <span>{formatTimeAgo(n.created_at)}</span>}
                      </div>
                    </>
                  ) : n.type === "LIBRARY_PLAN" ? (
                    <>
                      <div className="notif-name" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {!isRead && (
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                          )}
                          <span style={{ fontWeight: isRead ? 500 : 700 }}>Library Subscription</span>
                        </div>
                        <span style={{ fontSize: "9px", background: "#8b5cf6", color: "#fff", padding: "2px 6px", borderRadius: "8px", fontWeight: 700, textTransform: "uppercase" }}>Plan</span>
                      </div>
                      <div className="notif-meta" style={{ fontSize: "11px", color: "#a78bfa", marginTop: "4px" }}>
                        {n.message}
                      </div>
                    </>
                  ) : n.type === "LOGIN_ALERT" ? (
                    <>
                      <div className="notif-name" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {!isRead && (
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                          )}
                          <span style={{ fontWeight: isRead ? 500 : 700 }}>Security Alert</span>
                        </div>
                        <span style={{ fontSize: "9px", background: "#f59e0b", color: "#000", padding: "2px 6px", borderRadius: "8px", fontWeight: 700, textTransform: "uppercase" }}>Security</span>
                      </div>
                      <div className="notif-meta" style={{ fontSize: "11px", color: "#f87171", marginTop: "4px", lineHeight: "1.4" }}>
                        {n.message}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="notif-name" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {!isRead && (
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                          )}
                          <span style={{ fontWeight: isRead ? 500 : 700 }}>{n.full_name || "Notification"}</span>
                        </div>
                      </div>
                      <div className="notif-meta" style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                        {n.message || n.student_code}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
