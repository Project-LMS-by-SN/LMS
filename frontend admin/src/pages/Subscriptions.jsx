import React from "react";
import { Link } from "react-router-dom";
import {
  FaCreditCard,
  FaTag,
  FaLock,
  FaEye,
  FaShieldAlt
} from "react-icons/fa";
import { useAdminData } from "../context/AdminDataContext";

const Subscriptions = () => {
  const { data, calculateDaysLeft } = useAdminData();

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
              <FaCreditCard />
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                Libraries Subscription & Expiry Tracker
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                Auto-synchronized with Razorpay Payment Gateway. Manual plan edits are locked to prevent payment reconciliation mismatches.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              fontSize: "11.5px",
              fontWeight: "700",
              color: "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaLock style={{ color: "#d97706", fontSize: "10px" }} />
            <span>Razorpay Auto-Confirmed Mode</span>
          </div>

          <Link
            to="/coupons"
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              backgroundColor: "#059669",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaTag /> Apply Coupon to Library
          </Link>
        </div>
      </div>

      {/* Subscription Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "18px",
        }}
      >
        {data.libraries.map((lib) => {
          const daysLeft = calculateDaysLeft(lib.subscription_expiry);
          const isExpired = daysLeft <= 0;
          const isWarning = daysLeft > 0 && daysLeft <= 15;

          return (
            <div
              key={lib.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: isExpired
                  ? "1px solid #fca5a5"
                  : isWarning
                  ? "1px solid #fde68a"
                  : "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "#dbeafe",
                        color: "#1e40af",
                      }}
                    >
                      {lib.code}
                    </span>
                    <h3 style={{ margin: "6px 0 0 0", fontSize: "15.5px", fontWeight: "700", color: "#0f172a" }}>
                      {lib.name}
                    </h3>
                    <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                      Owner: {lib.owner_name} • {lib.city}
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    {lib.subscription_tier}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "12.5px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Billing Cycle:</span>
                    <strong style={{ color: "#0f172a" }}>{lib.subscription_cycle || "Monthly"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Started On:</span>
                    <span>{lib.subscription_start}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Valid Till (Expiry):</span>
                    <strong style={{ color: isExpired ? "#dc2626" : isWarning ? "#d97706" : "#059669" }}>
                      {lib.subscription_expiry}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "1px solid #e2e8f0",
                      paddingTop: "6px",
                      marginTop: "2px",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Days Remaining:</span>
                    <strong
                      style={{
                        color: isExpired ? "#dc2626" : isWarning ? "#d97706" : "#059669",
                        fontWeight: "800",
                      }}
                    >
                      {isExpired ? "EXPIRED (0 Days)" : `${daysLeft} Days Remaining`}
                    </strong>
                  </div>
                </div>

                {/* Razorpay sync status */}
                <div
                  style={{
                    marginTop: "10px",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    backgroundColor: "#f1f5f9",
                    fontSize: "11px",
                    color: "#475569",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <FaShieldAlt style={{ color: "#059669", fontSize: "11px" }} />
                    <span>Razorpay Auto-Debit:</span>
                  </span>
                  <strong style={{ color: lib.auto_debit !== false ? "#059669" : "#dc2626" }}>
                    {lib.auto_debit !== false ? "✓ Webhook Verified" : "Failed / Suspended"}
                  </strong>
                </div>
              </div>

              {/* View Profile Action Link */}
              <div style={{ marginTop: "14px" }}>
                <Link
                  to={`/libraries/${lib.id}`}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <FaEye style={{ fontSize: "11px" }} /> View Library Profile & Quota Tracking
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Subscriptions;
