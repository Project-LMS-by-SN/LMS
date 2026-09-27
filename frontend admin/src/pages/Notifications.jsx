import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaUserPlus,
  FaHeadset,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheck,
  FaTimes,
  FaPhoneAlt,
  FaEnvelope,
  FaWhatsapp,
  FaSearch,
  FaFilter,
  FaCheckDouble,
  FaBuilding,
  FaTrashAlt,
  FaArrowRight
} from "react-icons/fa";
import { useAdminData } from "../context/AdminDataContext";

const Notifications = () => {
  const {
    data,
    stats,
    markNotificationRead,
    markAllNotificationsRead,
    approveRegistrationRequest,
    rejectRegistrationRequest,
    resolveNotification,
    deleteNotification,
  } = useAdminData();

  const [activeTab, setActiveTab] = useState("ALL"); // ALL, REGISTRATION, SUPPORT, PROBLEM, ALERT
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PENDING_OPEN, COMPLETED
  const [priorityFilter, setPriorityFilter] = useState("ALL"); // ALL, HIGH, MEDIUM, LOW

  const [selectedNotif, setSelectedNotif] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNote, setResolveNote] = useState("");

  const notifications = data.notifications || [];

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Category tab
      if (activeTab !== "ALL" && item.category !== activeTab) return false;

      // Status filter
      if (statusFilter === "PENDING_OPEN") {
        if (item.status !== "PENDING" && item.status !== "OPEN" && item.status !== "INVESTIGATING" && item.status !== "ALERT") {
          return false;
        }
      } else if (statusFilter === "COMPLETED") {
        if (item.status !== "APPROVED" && item.status !== "RESOLVED" && item.status !== "REJECTED") {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== "ALL" && item.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchSender = item.sender_name?.toLowerCase().includes(q);
        const matchOwner = item.owner_name?.toLowerCase().includes(q);
        const matchCity = item.city?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCode = item.library_code?.toLowerCase().includes(q);
        if (!matchTitle && !matchSender && !matchOwner && !matchCity && !matchDesc && !matchCode) {
          return false;
        }
      }

      return true;
    });
  }, [notifications, activeTab, statusFilter, priorityFilter, searchQuery]);

  const handleApprove = (notif) => {
    approveRegistrationRequest(notif.id);
  };

  const handleOpenReject = (notif) => {
    setRejectModal(notif);
    setRejectReason("Documentation or owner verification incomplete.");
  };

  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (!rejectModal) return;
    rejectRegistrationRequest(rejectModal.id, rejectReason);
    setRejectModal(null);
  };

  const handleOpenResolve = (notif) => {
    setResolveModal(notif);
    setResolveNote("Issue resolved and notified to library owner.");
  };

  const handleConfirmResolve = (e) => {
    e.preventDefault();
    if (!resolveModal) return;
    resolveNotification(resolveModal.id, resolveNote);
    setResolveModal(null);
  };

  // Helper for category badge
  const renderCategoryBadge = (category) => {
    switch (category) {
      case "REGISTRATION":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
              whiteSpace: "nowrap",
            }}
          >
            <FaUserPlus style={{ fontSize: "10px" }} /> Registration Request
          </span>
        );
      case "SUPPORT":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: "#ecfdf5",
              color: "#059669",
              border: "1px solid #a7f3d0",
              whiteSpace: "nowrap",
            }}
          >
            <FaHeadset style={{ fontSize: "10px" }} /> Support Query
          </span>
        );
      case "PROBLEM":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca",
              whiteSpace: "nowrap",
            }}
          >
            <FaExclamationTriangle style={{ fontSize: "10px" }} /> Problem / Bug
          </span>
        );
      case "ALERT":
      default:
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: "#fffbeb",
              color: "#d97706",
              border: "1px solid #fde68a",
              whiteSpace: "nowrap",
            }}
          >
            <FaBell style={{ fontSize: "10px" }} /> System Alert
          </span>
        );
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status) => {
    let bg = "#f1f5f9";
    let text = "#475569";

    if (status === "APPROVED" || status === "RESOLVED") {
      bg = "#d1fae5";
      text = "#065f46";
    } else if (status === "PENDING" || status === "OPEN") {
      bg = "#fee2e2";
      text = "#991b1b";
    } else if (status === "INVESTIGATING") {
      bg = "#fef3c7";
      text = "#92400e";
    } else if (status === "REJECTED") {
      bg = "#f1f5f9";
      text = "#64748b";
    }

    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "10.5px",
          fontWeight: "700",
          backgroundColor: bg,
          color: text,
          whiteSpace: "nowrap",
          display: "inline-block",
        }}
      >
        ● {status}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          backgroundColor: "#ffffff",
          padding: "20px 24px",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "17px",
              }}
            >
              <FaBell />
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                Notifications & Request Desk
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                Category-wise desk for Registration Requests, Support Tickets, Technical Problems, and System Alerts.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {stats.unreadNotifs > 0 && (
            <button
              onClick={markAllNotificationsRead}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                backgroundColor: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              <FaCheckDouble style={{ fontSize: "11px", color: "#059669" }} />
              Mark All Read ({stats.unreadNotifs})
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs: Registration Requests, Support, Problem, System Alerts */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "12px",
        }}
      >
        <button
          onClick={() => setActiveTab("ALL")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: activeTab === "ALL" ? "#1d4ed8" : "#ffffff",
            color: activeTab === "ALL" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "12.5px",
            cursor: "pointer",
            boxShadow: activeTab === "ALL" ? "0 2px 6px rgba(29, 78, 216, 0.25)" : "none",
          }}
        >
          <FaBell style={{ fontSize: "11px" }} />
          All Notifications ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab("REGISTRATION")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: activeTab === "REGISTRATION" ? "#1d4ed8" : "#ffffff",
            color: activeTab === "REGISTRATION" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "12.5px",
            cursor: "pointer",
            boxShadow: activeTab === "REGISTRATION" ? "0 2px 6px rgba(29, 78, 216, 0.25)" : "none",
          }}
        >
          <FaUserPlus style={{ fontSize: "11px" }} />
          Registration Requests
          {stats.pendingRegistrations > 0 && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                backgroundColor: activeTab === "REGISTRATION" ? "#ffffff" : "#dc2626",
                color: activeTab === "REGISTRATION" ? "#1d4ed8" : "#ffffff",
                padding: "1px 6px",
                borderRadius: "10px",
              }}
            >
              {stats.pendingRegistrations} New
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("SUPPORT")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: activeTab === "SUPPORT" ? "#059669" : "#ffffff",
            color: activeTab === "SUPPORT" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "12.5px",
            cursor: "pointer",
            boxShadow: activeTab === "SUPPORT" ? "0 2px 6px rgba(5, 150, 105, 0.25)" : "none",
          }}
        >
          <FaHeadset style={{ fontSize: "11px" }} />
          Support Inquiries
          {stats.openSupportTickets > 0 && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                backgroundColor: activeTab === "SUPPORT" ? "#ffffff" : "#059669",
                color: activeTab === "SUPPORT" ? "#059669" : "#ffffff",
                padding: "1px 6px",
                borderRadius: "10px",
              }}
            >
              {stats.openSupportTickets} Open
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("PROBLEM")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: activeTab === "PROBLEM" ? "#dc2626" : "#ffffff",
            color: activeTab === "PROBLEM" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "12.5px",
            cursor: "pointer",
            boxShadow: activeTab === "PROBLEM" ? "0 2px 6px rgba(220, 38, 38, 0.25)" : "none",
          }}
        >
          <FaExclamationTriangle style={{ fontSize: "11px" }} />
          Problems & Issues
          {stats.activeProblems > 0 && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                backgroundColor: activeTab === "PROBLEM" ? "#ffffff" : "#dc2626",
                color: activeTab === "PROBLEM" ? "#dc2626" : "#ffffff",
                padding: "1px 6px",
                borderRadius: "10px",
              }}
            >
              {stats.activeProblems} Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ALERT")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: activeTab === "ALERT" ? "#d97706" : "#ffffff",
            color: activeTab === "ALERT" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "12.5px",
            cursor: "pointer",
            boxShadow: activeTab === "ALERT" ? "0 2px 6px rgba(217, 119, 6, 0.25)" : "none",
          }}
        >
          <FaInfoCircle style={{ fontSize: "11px" }} />
          System Alerts
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          backgroundColor: "#ffffff",
          padding: "14px 18px",
          borderRadius: "10px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <FaSearch
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              fontSize: "12px",
            }}
          />
          <input
            type="text"
            placeholder="Search by library, owner, city, issue details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              fontSize: "12.5px",
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "7px 10px", fontSize: "12px", fontWeight: "600" }}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING_OPEN">Pending / Open</option>
            <option value="COMPLETED">Approved / Resolved</option>
          </select>

          <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginLeft: "6px" }}>Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ padding: "7px 10px", fontSize: "12px", fontWeight: "600" }}
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Notifications List Card - Zero horizontal slider, fits 100% in frame */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#64748b" }}>
            <FaBell style={{ fontSize: "32px", opacity: 0.3, color: "#1d4ed8", marginBottom: "10px" }} />
            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#0f172a" }}>No Notifications Found</h4>
            <p style={{ margin: 0, fontSize: "12.5px" }}>
              No inquiries match your current category and filter criteria.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredNotifications.map((item, idx) => {
              const isUnread = !item.is_read;

              return (
                <div
                  key={item.id}
                  style={{
                    padding: "16px 20px",
                    borderBottom: idx === filteredNotifications.length - 1 ? "none" : "1px solid var(--border-subtle)",
                    backgroundColor: isUnread ? "#f8fafc" : "#ffffff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    transition: "background-color 0.15s ease",
                  }}
                  onClick={() => markNotificationRead(item.id)}
                >
                  {/* Left Column: Category, Title, Sender & Description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                      {renderCategoryBadge(item.category)}
                      {renderStatusBadge(item.status)}

                      {item.priority === "HIGH" && (
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "800",
                            backgroundColor: "#fee2e2",
                            color: "#dc2626",
                            whiteSpace: "nowrap",
                          }}
                        >
                          HIGH PRIORITY
                        </span>
                      )}

                      {isUnread && (
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            backgroundColor: "#1d4ed8",
                            display: "inline-block",
                          }}
                          title="Unread"
                        />
                      )}

                      <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "auto", whiteSpace: "nowrap" }}>
                        {item.created_at}
                      </span>
                    </div>

                    <h4 style={{ fontSize: "14.5px", fontWeight: "700", color: "#0f172a", margin: "4px 0 6px 0" }}>
                      {item.title}
                    </h4>

                    {/* Sender Details */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#475569", flexWrap: "wrap", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>
                        🏢 {item.sender_name}
                      </span>

                      {item.library_code && (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: "700",
                            fontSize: "11px",
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {item.library_code}
                        </span>
                      )}

                      {item.owner_name && (
                        <span>
                          Owner: <strong>{item.owner_name}</strong>
                        </span>
                      )}

                      {item.city && (
                        <span>
                          📍 {item.city}
                        </span>
                      )}
                    </div>

                    <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", lineHeight: "1.4" }}>
                      {item.description}
                    </p>

                    {/* Registration Details Sub-banner if applicable */}
                    {item.category === "REGISTRATION" && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          backgroundColor: "#eff6ff",
                          border: "1px solid #dbeafe",
                          fontSize: "11.5px",
                          display: "flex",
                          gap: "16px",
                          flexWrap: "wrap",
                          color: "#1e40af",
                        }}
                      >
                        <span>Requested Tier: <strong>{item.requested_tier}</strong></span>
                        <span>Active Students Limit: <strong>{item.active_students_limit}</strong></span>
                        <span>Phone: <strong>{item.phone}</strong></span>
                        <span>Email: <strong>{item.email}</strong></span>
                      </div>
                    )}

                    {/* Resolution Note if resolved */}
                    {item.status === "RESOLVED" && item.resolution_note && (
                      <div style={{ marginTop: "6px", fontSize: "11.5px", color: "#065f46", backgroundColor: "#ecfdf5", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                        ✓ {item.resolution_note}
                      </div>
                    )}

                    {/* Rejection Note if rejected */}
                    {item.status === "REJECTED" && item.rejection_reason && (
                      <div style={{ marginTop: "6px", fontSize: "11.5px", color: "#991b1b", backgroundColor: "#fee2e2", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                        ✕ Rejected: {item.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Contextual Action Buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end", flexShrink: 0 }}>
                    {/* Actions for REGISTRATION Requests */}
                    {item.category === "REGISTRATION" && item.status === "PENDING" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(item);
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            backgroundColor: "#059669",
                            color: "#ffffff",
                            border: "none",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <FaCheck style={{ fontSize: "10px" }} /> Approve & Onboard
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReject(item);
                          }}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            backgroundColor: "#f1f5f9",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Actions for SUPPORT Queries */}
                    {item.category === "SUPPORT" && item.status === "OPEN" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <a
                          href={`https://wa.me/91${item.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            backgroundColor: "#25D366",
                            color: "#ffffff",
                            textDecoration: "none",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <FaWhatsapp /> Chat Owner
                        </a>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenResolve(item);
                          }}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            backgroundColor: "#059669",
                            color: "#ffffff",
                            border: "none",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Resolve
                        </button>
                      </div>
                    )}

                    {/* Actions for PROBLEMS */}
                    {item.category === "PROBLEM" && item.status !== "RESOLVED" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenResolve(item);
                          }}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            backgroundColor: "#059669",
                            color: "#ffffff",
                            border: "none",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <FaCheck style={{ fontSize: "10px" }} /> Mark Fixed
                        </button>

                        {item.phone && (
                          <a
                            href={`tel:${item.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              padding: "5px 9px",
                              borderRadius: "6px",
                              backgroundColor: "#f1f5f9",
                              color: "#1d4ed8",
                              border: "1px solid #cbd5e1",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <FaPhoneAlt style={{ fontSize: "9px" }} /> Call
                          </a>
                        )}
                      </div>
                    )}

                    {/* Action for SYSTEM ALERTS */}
                    {item.category === "ALERT" && item.library_code && (
                      <Link
                        to="/subscriptions"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "6px",
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          textDecoration: "none",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Inspect Renewal <FaArrowRight style={{ fontSize: "10px" }} />
                      </Link>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      title="Remove notification"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "4px",
                        fontSize: "11.5px",
                      }}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "22px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
              Reject Registration Request
            </h3>
            <p style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "14px" }}>
              Specify the reason for rejecting <strong>{rejectModal.sender_name}</strong>:
            </p>

            <form onSubmit={handleConfirmReject} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <textarea
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", fontSize: "12.5px" }}
                required
              />

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "7px 16px",
                    borderRadius: "6px",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Ticket Modal */}
      {resolveModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "22px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
              Mark as Resolved
            </h3>
            <p style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "14px" }}>
              Enter resolution summary for <strong>{resolveModal.title}</strong>:
            </p>

            <form onSubmit={handleConfirmResolve} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <textarea
                rows="3"
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", fontSize: "12.5px" }}
                required
              />

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setResolveModal(null)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "7px 16px",
                    borderRadius: "6px",
                    backgroundColor: "#059669",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
