import React from "react";
import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaTag,
  FaCreditCard,
  FaEdit,
  FaArrowRight,
  FaBell
} from "react-icons/fa";
import { useAdminData } from "../context/AdminDataContext";

const Overview = () => {
  const { stats, libraryMatrix } = useAdminData();

  const kpis = [
    {
      title: "Registered Libraries",
      value: stats.totalLibs,
      sub: `${stats.activeLibs} Active & Verified`,
      color: "#1d4ed8",
      bg: "#eff6ff",
      icon: FaBuilding,
      link: "/libraries",
    },
    {
      title: "Active Students",
      value: stats.activeStudents,
      sub: `Across ${stats.totalLibs} libraries`,
      color: "#059669",
      bg: "#ecfdf5",
      icon: FaUserCheck,
      link: "/students",
    },
    {
      title: "Inactive Students",
      value: stats.inactiveStudents,
      sub: "Membership due / paused",
      color: "#d97706",
      bg: "#fffbeb",
      icon: FaUserClock,
      link: "/students",
    },
    {
      title: "Deleted / Archived",
      value: stats.deletedStudents,
      sub: "Separate archive section",
      color: "#dc2626",
      bg: "#fef2f2",
      icon: FaUserTimes,
      link: "/students",
    },
    {
      title: "Active Coupons",
      value: stats.activeCoupons,
      sub: "Live apply engine ready",
      color: "#059669",
      bg: "#ecfdf5",
      icon: FaTag,
      link: "/coupons",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Welcome Banner */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "24px 28px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
            LMS Platform Super Admin Portal
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13.5px", color: "#64748b" }}>
            Real-time management for all registered libraries, student directories, subscriptions, fee plans, and coupons.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            to="/students"
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
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
            Universal Student Directory <FaArrowRight style={{ fontSize: "11px" }} />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
        }}
      >
        {kpis.map((k, idx) => {
          const Icon = k.icon;
          return (
            <Link
              key={idx}
              to={k.link}
              style={{
                textDecoration: "none",
                backgroundColor: "#ffffff",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  backgroundColor: k.bg,
                  color: k.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  flexShrink: 0,
                }}
              >
                <Icon />
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>
                  {k.title}
                </div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
                  {k.value}
                </div>
                <div style={{ fontSize: "11.5px", color: k.color, fontWeight: "600", marginTop: "2px" }}>
                  {k.sub}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Platform Administration - ROW WISE (Placed above Active Students) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          padding: "22px",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
            Quick Platform Administration
          </h3>
          <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0 0" }}>
            Instant shortcuts to manage platform subscriptions, active student quotas, fee plans, and coupons
          </p>
        </div>

        {/* Action Cards in a ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
          }}
        >
          {/* Card 1: Libraries & Profiles */}
          <Link
            to="/libraries"
            style={{
              padding: "16px 18px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #bfdbfe",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "17px",
                  flexShrink: 0,
                }}
              >
                <FaBuilding />
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", color: "#1e40af" }}>
                  Libraries & Profiles
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                  Profiles, Razorpay sync & quota
                </div>
              </div>
            </div>
            <FaArrowRight style={{ fontSize: "12px", color: "#1d4ed8", flexShrink: 0 }} />
          </Link>

          {/* Card 2: Active Student Quota */}
          <Link
            to="/quota"
            style={{
              padding: "16px 18px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #a7f3d0",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "17px",
                  flexShrink: 0,
                }}
              >
                <FaUserCheck />
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", color: "#065f46" }}>
                  Active Quota
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                  Adjust library limits
                </div>
              </div>
            </div>
            <FaArrowRight style={{ fontSize: "12px", color: "#059669", flexShrink: 0 }} />
          </Link>

          {/* Card 3: Fee Plans */}
          <Link
            to="/fee-plans"
            style={{
              padding: "16px 18px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#f1f5f9",
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "17px",
                  flexShrink: 0,
                }}
              >
                <FaEdit />
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", color: "#1e293b" }}>
                  Fee Plans
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                  Edit pricing & tiers
                </div>
              </div>
            </div>
            <FaArrowRight style={{ fontSize: "12px", color: "#475569", flexShrink: 0 }} />
          </Link>

          {/* Card 4: Coupons */}
          <Link
            to="/coupons"
            style={{
              padding: "16px 18px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #a7f3d0",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "17px",
                  flexShrink: 0,
                }}
              >
                <FaTag />
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", color: "#065f46" }}>
                  Coupons
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                  Create & test promo codes
                </div>
              </div>
            </div>
            <FaArrowRight style={{ fontSize: "12px", color: "#059669", flexShrink: 0 }} />
          </Link>

          {/* Card 5: Notifications & Requests */}
          <Link
            to="/notifications"
            style={{
              padding: "16px 18px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #fed7aa",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#fff7ed",
                  color: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "17px",
                  flexShrink: 0,
                }}
              >
                <FaBell />
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", color: "#c2410c", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Requests Desk</span>
                  {stats.unreadNotifs > 0 && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        backgroundColor: "#dc2626",
                        color: "#ffffff",
                        padding: "1px 6px",
                        borderRadius: "10px",
                      }}
                    >
                      {stats.unreadNotifs}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                  Registrations & support tickets
                </div>
              </div>
            </div>
            <FaArrowRight style={{ fontSize: "12px", color: "#ea580c", flexShrink: 0 }} />
          </Link>
        </div>
      </div>

      {/* Active Students by Library List (Full-Width Card - Below Administration) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          padding: "22px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
              Active Students by Library
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
              Live active student count and enrolled strength across all registered libraries
            </p>
          </div>
          <Link
            to="/students"
            style={{
              fontSize: "12.5px",
              color: "#1d4ed8",
              textDecoration: "none",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Universal Students Directory <FaArrowRight style={{ fontSize: "10.5px" }} />
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {libraryMatrix.map((lib) => (
            <div
              key={lib.id}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <Link
                to={`/libraries/${lib.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 7px",
                    borderRadius: "4px",
                    backgroundColor: "#dbeafe",
                    color: "#1e40af",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {lib.code}
                </span>
                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "13.5px",
                      color: "#0f172a",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#1d4ed8")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#0f172a")}
                  >
                    {lib.name}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                    {lib.city} • Tier: {lib.subscription_tier} • Quota: {lib.active_students_limit}
                  </div>
                </div>
              </Link>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "14px",
                      backgroundColor: "#ecfdf5",
                      border: "1px solid #d1fae5",
                      color: "#065f46",
                      fontWeight: "700",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#059669", display: "inline-block" }} />
                    {lib.active_count} Active Students
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                    Total Enrolled: {lib.total_students} Students
                  </div>
                </div>

                <Link
                  to={`/libraries/${lib.id}`}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "6px",
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "11.5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;
