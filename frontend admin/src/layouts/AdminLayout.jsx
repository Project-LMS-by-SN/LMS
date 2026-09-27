import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FaShieldAlt,
  FaBuilding,
  FaUserCheck,
  FaUsers,
  FaEdit,
  FaTag,
  FaSyncAlt,
  FaCheckCircle,
  FaBell
} from "react-icons/fa";
import { useAdminData } from "../context/AdminDataContext";

const AdminLayout = () => {
  const { stats, resetDemoData, toastMsg } = useAdminData();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Overview", icon: FaShieldAlt },
    { path: "/libraries", label: "Libraries", icon: FaBuilding, badge: stats.totalLibs },
    { path: "/quota", label: "Active Quota", icon: FaUserCheck },
    { path: "/students", label: "Students", icon: FaUsers, badge: stats.totalStudents },
    { path: "/fee-plans", label: "Fee Plans", icon: FaEdit },
    { path: "/coupons", label: "Coupons", icon: FaTag, badge: stats.activeCoupons },
    { path: "/notifications", label: "Notifications", icon: FaBell, badge: stats.unreadNotifs },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "var(--bg-main)" }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            right: "20px",
            zIndex: 99999,
            backgroundColor: "#059669",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -3px rgba(5, 150, 105, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "600",
            fontSize: "13px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <FaCheckCircle style={{ fontSize: "15px" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sleek Left Sidebar - Static 100vh */}
      <aside
        style={{
          width: "220px",
          backgroundColor: "#ffffff",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          height: "100vh",
          boxShadow: "1px 0 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#1d4ed8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(29, 78, 216, 0.25)",
              flexShrink: 0,
            }}
          >
            <FaShieldAlt style={{ fontSize: "16px" }} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>
              LMS Admin
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#059669",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "10.5px", color: "#059669", fontWeight: "600", whiteSpace: "nowrap" }}>
                Super Admin
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: "3px", flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "4px 8px 6px 8px", fontSize: "10.5px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.5px" }}>
            Modules
          </div>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: isActive ? "700" : "500",
                  backgroundColor: isActive ? "#eff6ff" : "transparent",
                  color: isActive ? "#1d4ed8" : "#475569",
                  borderLeft: isActive ? "3px solid #1d4ed8" : "3px solid transparent",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                  <Icon style={{ fontSize: "14px", color: isActive ? "#1d4ed8" : "#64748b" }} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: "700",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      backgroundColor: isActive ? "#dbeafe" : "#f1f5f9",
                      color: isActive ? "#1e40af" : "#64748b",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-subtle)", backgroundColor: "#fafafa", flexShrink: 0 }}>
          <button
            onClick={resetDemoData}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              color: "#64748b",
              fontSize: "11.5px",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <FaSyncAlt style={{ fontSize: "11px" }} /> Reset Demo
          </button>
        </div>
      </aside>

      {/* Main Content Area - Fixed height with Static Navbar and internal scrolling */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", minWidth: 0, overflow: "hidden" }}>
        {/* Top Navbar - 100% STATIC, DOES NOT MOVE ON SCROLL */}
        <header
          style={{
            height: "54px",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            flexShrink: 0,
            zIndex: 50,
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
              Section:
            </span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#1d4ed8",
                backgroundColor: "#eff6ff",
                padding: "3px 9px",
                borderRadius: "4px",
                whiteSpace: "nowrap",
              }}
            >
              {navItems.find((n) => n.path === location.pathname)?.label || "Dashboard"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <NavLink
              to="/notifications"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                backgroundColor: location.pathname === "/notifications" ? "#eff6ff" : "#f8fafc",
                color: location.pathname === "/notifications" ? "#1d4ed8" : "#64748b",
                border: "1px solid #e2e8f0",
                textDecoration: "none",
                cursor: "pointer",
              }}
              title="Notifications & Request Desk"
            >
              <FaBell style={{ fontSize: "14px" }} />
              {stats.unreadNotifs > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-3px",
                    right: "-3px",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    fontSize: "9px",
                    fontWeight: "800",
                    borderRadius: "10px",
                    minWidth: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                    border: "2px solid #ffffff",
                  }}
                >
                  {stats.unreadNotifs}
                </span>
              )}
            </NavLink>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11.5px",
                color: "#059669",
                backgroundColor: "#ecfdf5",
                border: "1px solid #d1fae5",
                padding: "4px 10px",
                borderRadius: "16px",
                fontWeight: "600",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  backgroundColor: "#059669",
                  display: "inline-block",
                }}
              />
              Active Session • Super Admin
            </div>
          </div>
        </header>

        {/* Page Content Body - Scrolls smoothly inside the frame while Navbar remains strictly static */}
        <main style={{ padding: "18px 22px", flex: 1, width: "100%", overflowY: "auto", overflowX: "hidden" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
