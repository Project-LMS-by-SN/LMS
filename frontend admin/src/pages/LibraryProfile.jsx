import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBuilding,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaLock,
  FaCreditCard,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaUsers,
  FaSearch,
  FaUserCheck,
  FaUserClock,
  FaShieldAlt,
  FaCheck,
  FaExternalLinkAlt,
  FaInfoCircle
} from "react-icons/fa";
import { useAdminData } from "../context/AdminDataContext";

const LibraryProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, calculateDaysLeft, toggleLibraryStatus } = useAdminData();

  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("ALL"); // ALL, ACTIVE, INACTIVE

  // Find the target library
  const library = useMemo(() => {
    return data.libraries.find((l) => l.id === id || l.code.toLowerCase() === (id || "").toLowerCase());
  }, [data.libraries, id]);

  // Find students enrolled specifically in this library
  const libraryStudents = useMemo(() => {
    if (!library) return [];
    return data.students.filter((s) => s.library_id === library.id);
  }, [data.students, library]);

  // Filtered students for table view
  const filteredStudents = useMemo(() => {
    return libraryStudents.filter((student) => {
      if (studentStatusFilter !== "ALL" && student.status !== studentStatusFilter) {
        return false;
      }
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const matchName = student.name?.toLowerCase().includes(q);
        const matchPhone = student.phone?.includes(q);
        const matchEmail = student.email?.toLowerCase().includes(q);
        const matchSeat = student.seat_number?.toLowerCase().includes(q);
        const matchShift = student.shift_name?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchSeat && !matchShift) {
          return false;
        }
      }
      return true;
    });
  }, [libraryStudents, studentStatusFilter, studentSearch]);

  if (!library) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "48px 24px",
          textAlign: "center",
          border: "1px solid var(--border-subtle)",
          maxWidth: "600px",
          margin: "40px auto",
        }}
      >
        <FaBuilding style={{ fontSize: "40px", color: "#94a3b8", marginBottom: "16px" }} />
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
          Library Not Found
        </h3>
        <p style={{ fontSize: "13.5px", color: "#64748b", margin: "8px 0 20px 0" }}>
          The requested library profile identifier could not be located in the platform registry.
        </p>
        <Link
          to="/libraries"
          style={{
            padding: "9px 18px",
            borderRadius: "6px",
            backgroundColor: "#1d4ed8",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FaArrowLeft /> Return to Libraries Directory
        </Link>
      </div>
    );
  }

  // Calculated metrics
  const activeStudentsCount = libraryStudents.filter((s) => s.status === "ACTIVE").length;
  const inactiveStudentsCount = libraryStudents.filter((s) => s.status === "INACTIVE").length;
  const deletedStudentsCount = libraryStudents.filter((s) => s.status === "DELETED").length;
  const quotaLimit = Number(library.active_students_limit) || 100;
  const remainingSlots = Math.max(0, quotaLimit - activeStudentsCount);
  const utilizationPercent = Math.min(100, Math.round((activeStudentsCount / quotaLimit) * 100));

  const daysLeft = calculateDaysLeft(library.subscription_expiry);
  const isExpired = daysLeft <= 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 15;
  const isActive = library.status === "ACTIVE";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px", width: "100%", paddingBottom: "30px" }}>
      {/* Top Breadcrumb & Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => navigate("/libraries")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <FaArrowLeft style={{ fontSize: "11px" }} /> Back to Libraries
          </button>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
            Library Profile & Tracking
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <a
            href={`https://wa.me/91${library.phone}`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "7px 13px",
              borderRadius: "6px",
              backgroundColor: "#25D366",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: "700",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaWhatsapp style={{ fontSize: "14px" }} /> WhatsApp Owner
          </a>

          <a
            href={`tel:${library.phone}`}
            style={{
              padding: "7px 13px",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#1e293b",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaPhoneAlt style={{ fontSize: "11px", color: "#1d4ed8" }} /> Call
          </a>

          <button
            onClick={() => toggleLibraryStatus(library.id)}
            style={{
              padding: "7px 13px",
              borderRadius: "6px",
              backgroundColor: isActive ? "#fee2e2" : "#d1fae5",
              color: isActive ? "#dc2626" : "#065f46",
              border: `1px solid ${isActive ? "#fecaca" : "#a7f3d0"}`,
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {isActive ? "Suspend Access" : "Activate Access"}
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          padding: "22px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "16px", minWidth: 0 }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              border: "1px solid #dbeafe",
              flexShrink: 0,
            }}
          >
            <FaBuilding />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                {library.name}
              </h2>
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: "800",
                  fontSize: "12px",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                }}
              >
                {library.code}
              </span>
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: "14px",
                  fontSize: "11px",
                  fontWeight: "700",
                  backgroundColor: isActive ? "#d1fae5" : "#fee2e2",
                  color: isActive ? "#065f46" : "#991b1b",
                }}
              >
                ● {library.status}
              </span>
            </div>

            {/* Quick Contact Line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                marginTop: "8px",
                fontSize: "12.5px",
                color: "#475569",
              }}
            >
              <span>
                Owner: <strong>{library.owner_name}</strong>
              </span>
              <span>•</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <FaPhoneAlt style={{ fontSize: "10px", color: "#2563eb" }} /> {library.phone}
              </span>
              <span>•</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <FaEnvelope style={{ fontSize: "10px", color: "#64748b" }} /> {library.email}
              </span>
              <span>•</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <FaMapMarkerAlt style={{ fontSize: "10px", color: "#059669" }} /> {library.city} ({library.address})
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Mini Badges */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
              border: "1px solid var(--border-subtle)",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
              Registered On
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
              {library.created_at || "2024-05-10"}
            </div>
          </div>

          <div
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: "10.5px", color: "#1d4ed8", fontWeight: "600", textTransform: "uppercase" }}>
              Current Tier
            </div>
            <div style={{ fontSize: "13px", fontWeight: "800", color: "#1e40af", marginTop: "2px" }}>
              {library.subscription_tier}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: Libraries Subscription & Expiry Tracker (LOCKED / READ ONLY)   */}
      {/* ========================================================================= */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: isExpired
            ? "1px solid #fca5a5"
            : isExpiringSoon
            ? "1px solid #fde68a"
            : "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          padding: "22px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "14px",
          }}
        >
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
              <FaCreditCard />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Libraries Subscription & Expiry Tracker
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Live subscription status, automated Razorpay billing verification, and renewal countdown.
              </p>
            </div>
          </div>

          {/* Locked Badge - Shows NO manual edits because payment is verified via Razorpay */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "700",
              color: "#475569",
            }}
            title="Plan tier & expiry are locked for manual changes. Automated payment confirmation via Razorpay."
          >
            <FaLock style={{ color: "#d97706", fontSize: "10px" }} />
            <span>Plan Locked • Managed via Razorpay Auto-Confirmation</span>
          </div>
        </div>

        {/* Razorpay Auto-Verification Info Note */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            fontSize: "12px",
            color: "#475569",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <FaShieldAlt style={{ fontSize: "16px", color: "#059669", flexShrink: 0 }} />
          <span>
            <strong>Payment Confirmation Notice:</strong> Is section me plan tier ya expiry date manual edit karne ka option band rakha gaya hai kyunki subscription auto-renew aur plan tier verification seedhe <strong>Razorpay Payment Gateway Webhooks</strong> ke through verify hoti hai.
          </span>
        </div>

        {/* Subscription Detail Columns Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Card 1: Current Plan Tier Info (Show only) */}
          <div
            style={{
              padding: "16px 18px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #bfdbfe",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#1d4ed8", letterSpacing: "0.5px" }}>
                Active Plan Tier
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                {library.subscription_tier}
              </div>
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                Billing Cycle: <strong>{library.subscription_cycle || "Monthly"}</strong>
              </div>
            </div>

            <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #e2e8f0", fontSize: "11.5px", color: "#64748b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Seats Constraint:</span>
                <span style={{ fontWeight: "700", color: "#059669" }}>Unlimited (No Seat Limit)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Plan Quota Limit:</span>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>{library.active_students_limit} Active Students</span>
              </div>
            </div>
          </div>

          {/* Card 2: Expiry & Countdown Tracking (Show only) */}
          <div
            style={{
              padding: "16px 18px",
              borderRadius: "10px",
              backgroundColor: isExpired ? "#fef2f2" : isExpiringSoon ? "#fffbeb" : "#f8fafc",
              border: isExpired
                ? "1px solid #fecaca"
                : isExpiringSoon
                ? "1px solid #fde68a"
                : "1px solid #a7f3d0",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  color: isExpired ? "#dc2626" : isExpiringSoon ? "#d97706" : "#059669",
                  letterSpacing: "0.5px",
                }}
              >
                Subscription Expiry Tracking
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: isExpired ? "#dc2626" : isExpiringSoon ? "#b45309" : "#065f46",
                  marginTop: "4px",
                }}
              >
                {isExpired ? "Subscription Expired" : `${daysLeft} Days Remaining`}
              </div>
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                Expiry Date: <strong>{library.subscription_expiry}</strong>
              </div>
            </div>

            <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #e2e8f0", fontSize: "11.5px", color: "#64748b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Start Date:</span>
                <span style={{ fontWeight: "600", color: "#0f172a" }}>{library.subscription_start || "2025-01-01"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Health Status:</span>
                <span
                  style={{
                    fontWeight: "700",
                    color: isExpired ? "#dc2626" : isExpiringSoon ? "#d97706" : "#059669",
                  }}
                >
                  ● {isExpired ? "EXPIRED" : isExpiringSoon ? "EXPIRING SOON" : "ACTIVE & HEALTHY"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Razorpay Payment Verification Specs */}
          <div
            style={{
              padding: "16px 18px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#475569", letterSpacing: "0.5px" }}>
                  Razorpay Gateway Sync
                </span>
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: "800",
                    backgroundColor: library.razorpay_status === "VERIFIED" ? "#ecfdf5" : "#fee2e2",
                    color: library.razorpay_status === "VERIFIED" ? "#065f46" : "#991b1b",
                    border: `1px solid ${library.razorpay_status === "VERIFIED" ? "#a7f3d0" : "#fca5a5"}`,
                  }}
                >
                  ✓ {library.razorpay_status || "VERIFIED"}
                </span>
              </div>

              <div style={{ marginTop: "8px", fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div>
                  <span style={{ color: "#64748b" }}>Subscription ID: </span>
                  <code style={{ fontFamily: "monospace", fontWeight: "700", color: "#1e40af" }}>
                    {library.razorpay_sub_id || "sub_Rzp910284729"}
                  </code>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Last Payment ID: </span>
                  <code style={{ fontFamily: "monospace", fontWeight: "700", color: "#065f46" }}>
                    {library.razorpay_payment_id || "pay_Op982347102"}
                  </code>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #e2e8f0", fontSize: "11.5px", color: "#64748b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Amount Paid:</span>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>
                  ₹{(library.last_amount_paid || (library.subscription_tier === "STARTER" ? 499 : 999)).toLocaleString("en-IN")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Auto-Debit:</span>
                <span style={{ fontWeight: "700", color: library.auto_debit !== false ? "#059669" : "#dc2626" }}>
                  {library.auto_debit !== false ? "Active (Auto-Renew on Due)" : "Disabled / Manual"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: Active Students: Library-Wise Quota & Tracking                */}
      {/* ========================================================================= */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          padding: "22px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "17px",
              }}
            >
              <FaUsers />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Active Students: Library-Wise Quota & Tracking
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Real-time active student tracking and quota utilization exclusively for {library.name}.
              </p>
            </div>
          </div>

          <div
            style={{
              padding: "4px 10px",
              borderRadius: "14px",
              fontSize: "11.5px",
              fontWeight: "700",
              backgroundColor: utilizationPercent > 90 ? "#fee2e2" : "#ecfdf5",
              color: utilizationPercent > 90 ? "#dc2626" : "#059669",
              border: `1px solid ${utilizationPercent > 90 ? "#fecaca" : "#a7f3d0"}`,
            }}
          >
            {utilizationPercent}% Quota Utilized
          </div>
        </div>

        {/* 4 Quota Metric Tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {/* Active Students */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "8px",
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#065f46" }}>
              Active Students
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#065f46", marginTop: "3px" }}>
              {activeStudentsCount}
            </div>
            <div style={{ fontSize: "11px", color: "#047857", marginTop: "2px" }}>
              Currently attending library
            </div>
          </div>

          {/* Quota Limit */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "8px",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#1e40af" }}>
              Student Quota Limit
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#1d4ed8", marginTop: "3px" }}>
              {quotaLimit}
            </div>
            <div style={{ fontSize: "11px", color: "#2563eb", marginTop: "2px" }}>
              Allocated under {library.subscription_tier}
            </div>
          </div>

          {/* Remaining Slots */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#475569" }}>
              Available Slots
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginTop: "3px" }}>
              {remainingSlots}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              Can admit without tier upgrade
            </div>
          </div>

          {/* Inactive / Paused */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "8px",
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#92400e" }}>
              Inactive / Paused
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#d97706", marginTop: "3px" }}>
              {inactiveStudentsCount}
            </div>
            <div style={{ fontSize: "11px", color: "#b45309", marginTop: "2px" }}>
              Fee overdue / membership paused
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div style={{ backgroundColor: "#f8fafc", padding: "14px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>
            <span>Active Student Utilization: <strong>{activeStudentsCount} / {quotaLimit} Students</strong></span>
            <span><strong>{utilizationPercent}%</strong> capacity filled</span>
          </div>
          <div style={{ width: "100%", height: "10px", backgroundColor: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
            <div
              style={{
                width: `${utilizationPercent}%`,
                height: "100%",
                backgroundColor: utilizationPercent > 90 ? "#dc2626" : utilizationPercent > 70 ? "#d97706" : "#059669",
                borderRadius: "5px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Enrolled Students Filter & Search Toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Students Enrolled in this Library ({libraryStudents.length})
            </h4>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", minWidth: "220px" }}>
              <FaSearch
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  fontSize: "11.5px",
                }}
              />
              <input
                type="text"
                placeholder="Search students, shift, seat..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 30px",
                  fontSize: "12px",
                }}
              />
            </div>

            {/* Filter */}
            <select
              value={studentStatusFilter}
              onChange={(e) => setStudentStatusFilter(e.target.value)}
              style={{ padding: "6px 10px", fontSize: "12px", fontWeight: "600" }}
            >
              <option value="ALL">All Status ({libraryStudents.length})</option>
              <option value="ACTIVE">Active Only ({activeStudentsCount})</option>
              <option value="INACTIVE">Inactive Only ({inactiveStudentsCount})</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div
          style={{
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            overflow: "hidden",
            width: "100%",
          }}
        >
          {filteredStudents.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "#64748b" }}>
              <FaUsers style={{ fontSize: "28px", opacity: 0.3, color: "#059669", marginBottom: "8px" }} />
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "600" }}>
                No students match the current filter in this library.
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid var(--border-subtle)",
                    color: "#64748b",
                    fontSize: "10.5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <th style={{ padding: "9px 12px", width: "26%" }}>Student Name & Contact</th>
                  <th style={{ padding: "9px 12px", width: "20%" }}>Shift & Desk</th>
                  <th style={{ padding: "9px 12px", width: "20%" }}>Plan Enrolled</th>
                  <th style={{ padding: "9px 12px", width: "18%" }}>Validity & Fee</th>
                  <th style={{ padding: "9px 12px", width: "16%", textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((stu) => {
                  const isStuActive = stu.status === "ACTIVE";

                  return (
                    <tr
                      key={stu.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "12.5px" }}>
                          {stu.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          📞 {stu.phone} • {stu.email}
                        </div>
                      </td>

                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ fontWeight: "600", color: "#334155" }}>
                          {stu.shift_name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Desk: <strong style={{ color: "#0f172a" }}>{stu.seat_number || "Open Desk"}</strong>
                        </div>
                      </td>

                      <td style={{ padding: "9px 12px" }}>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor: "#eff6ff",
                            color: "#1d4ed8",
                            fontWeight: "600",
                            fontSize: "11px",
                            display: "inline-block",
                          }}
                        >
                          {stu.plan_name}
                        </span>
                        <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px" }}>
                          Admitted: {stu.admission_date}
                        </div>
                      </td>

                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ fontWeight: "600", color: "#0f172a" }}>
                          Valid till: {stu.validity_end}
                        </div>
                        <div style={{ marginTop: "2px" }}>
                          <span
                            style={{
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "700",
                              backgroundColor: stu.fee_status === "PAID" ? "#ecfdf5" : "#fee2e2",
                              color: stu.fee_status === "PAID" ? "#065f46" : "#991b1b",
                            }}
                          >
                            {stu.fee_status}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "9px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "10.5px",
                            fontWeight: "700",
                            backgroundColor: isStuActive ? "#d1fae5" : "#fee2e2",
                            color: isStuActive ? "#065f46" : "#991b1b",
                            display: "inline-block",
                          }}
                        >
                          ● {stu.status}
                        </span>
                        {stu.inactive_reason && (
                          <div style={{ fontSize: "9.5px", color: "#64748b", marginTop: "2px" }}>
                            {stu.inactive_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryProfile;
