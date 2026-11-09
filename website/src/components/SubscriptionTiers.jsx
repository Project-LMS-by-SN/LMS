import { useState } from "react";
import { FaTable, FaTag } from "react-icons/fa";

const billingCycles = [
  { id: "monthly", label: "Monthly", months: 1, suffix: "per month" },
  { id: "quarterly", label: "Quarterly", months: 3, suffix: "for 3 months" },
  { id: "halfYearly", label: "Half Yearly", months: 6, suffix: "for 6 months" },
  { id: "yearly", label: "Yearly", months: 12, suffix: "for 12 months" }
];

const tiers = [
  {
    name: "Free",
    monthlyPrice: 0,
    studentCapacity: "Up to 50",
    staffCount: "0",
    deviceLimit: "1",
    attendance: "Basic Manual",
    admission: "QR / Manual",
    feeManagement: "Basic",
    support: "Community Support",
    accent: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0"
  },
  {
    name: "Basic",
    monthlyPrice: 150,
    studentCapacity: "Up to 200",
    staffCount: "2",
    deviceLimit: "2",
    attendance: "QR / Manual",
    admission: "QR / Manual",
    feeManagement: "Invoicing & Receipts",
    support: "Standard Email",
    accent: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe"
  },
  {
    name: "Pro",
    monthlyPrice: 250,
    studentCapacity: "Up to 500",
    staffCount: "3",
    deviceLimit: "3",
    attendance: "QR / Manual",
    admission: "QR / Manual",
    feeManagement: "Invoicing & Receipts",
    support: "Priority Email & Chat",
    accent: "#059669",
    bg: "#ecfdf5",
    border: "#10b981",
    popular: true
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    studentCapacity: "Unlimited",
    staffCount: "5",
    deviceLimit: "5",
    attendance: "Advanced Custom Integration",
    admission: "Custom Workflow & Portal",
    feeManagement: "Full ERP & Multi-Branch",
    support: "24/7 Dedicated Account Manager",
    accent: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca"
  }
];

const attributes = [
  { key: "studentCapacity", label: "Student Capacity" },
  { key: "staffCount", label: "Staff Count" },
  { key: "deviceLimit", label: "Device Limit" },
  { key: "attendance", label: "Attendance" },
  { key: "admission", label: "Admission Process" },
  { key: "feeManagement", label: "Fee Management" },
  { key: "support", label: "Support Level" }
];

export default function SubscriptionTiers() {
  const [billingCycle, setBillingCycle] = useState("monthly");

  const activeCycle = billingCycles.find((c) => c.id === billingCycle);

  return (
    <section
      id="subscription-tiers"
      className="section-padding"
      style={{ background: "#ffffff", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", maxWidth: "820px", margin: "0 auto 40px" }}>
          <div className="badge-blue" style={{ marginBottom: "14px" }}>
            <FaTable /> Subscription Tiers &amp; Features
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", marginBottom: "16px", color: "#0f172a" }}>
            Pick the Plan That Fits Your Library
          </h2>
          <p style={{ color: "#475569", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Compare every tier side by side. Plan prices below are multiplied for the selected billing period.
          </p>

          {/* Billing Options */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "center",
              background: "#f1f5f9",
              padding: "6px",
              borderRadius: "16px",
              border: "1px solid var(--border-medium)",
              marginTop: "24px",
              gap: "4px"
            }}
          >
            {billingCycles.map((cycle) => (
              <button
                key={cycle.id}
                onClick={() => setBillingCycle(cycle.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontSize: "0.85rem",
                  fontWeight: "800",
                  background: billingCycle === cycle.id ? "#2563eb" : "transparent",
                  color: billingCycle === cycle.id ? "#ffffff" : "#475569",
                  transition: "all 0.2s"
                }}
              >
                {cycle.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div
          style={{
            overflowX: "auto",
            borderRadius: "18px",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-sm)",
            background: "#ffffff"
          }}
        >
          <table style={{ width: "100%", minWidth: "1020px", borderCollapse: "collapse", fontSize: "0.86rem" }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                {["Subscription Tier", ...attributes.map((a) => a.label), "Plan Price"].map((heading, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "14px 14px",
                      textAlign: i === 0 ? "left" : "center",
                      fontWeight: "800",
                      fontSize: "0.78rem",
                      letterSpacing: "0.02em",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => {
                const total = tier.monthlyPrice === null ? null : tier.monthlyPrice * activeCycle.months;

                return (
                  <tr
                    key={tier.name}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      background: tier.popular ? "#f0fdf4" : "#ffffff"
                    }}
                  >
                    <td style={{ padding: "16px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: tier.accent,
                            flexShrink: 0
                          }}
                        />
                        <span style={{ fontWeight: "900", color: "#0f172a", fontSize: "0.95rem" }}>
                          {tier.name}
                        </span>
                        {tier.popular && (
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: "900",
                              padding: "2px 7px",
                              borderRadius: "9999px",
                              background: "#10b981",
                              color: "#ffffff",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em"
                            }}
                          >
                            Popular
                          </span>
                        )}
                      </div>
                    </td>

                    {attributes.map((attr) => (
                      <td
                        key={attr.key}
                        style={{
                          padding: "16px 14px",
                          textAlign: "center",
                          color: "#334155",
                          lineHeight: 1.45
                        }}
                      >
                        {tier[attr.key]}
                      </td>
                    ))}

                    <td
                      style={{
                        padding: "16px 14px",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        background: tier.bg
                      }}
                    >
                      {total === null ? (
                        <div>
                          <div style={{ fontWeight: "900", color: tier.accent, fontSize: "0.95rem" }}>
                            According to Features
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Custom quote</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: "900", color: tier.accent, fontSize: "1.15rem" }}>
                            ₹{total.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                            {activeCycle.suffix}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Note */}
        <div
          style={{
            marginTop: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            flexWrap: "wrap",
            fontSize: "0.82rem",
            color: "#64748b"
          }}
        >
          <FaTag style={{ color: "#2563eb" }} />
          <span>
            Prices are the monthly plan multiplied by the selected period. GST extra. Enterprise pricing is customised
            as per your required features.
          </span>
        </div>
      </div>
    </section>
  );
}
