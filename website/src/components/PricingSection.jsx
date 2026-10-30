import { useState } from "react";
import { Link } from "react-router-dom";
import { FaCheck, FaTimes, FaTag, FaShieldAlt, FaRocket, FaCrown, FaHeadset, FaBuilding, FaArrowRight } from "react-icons/fa";

const plans = [
  {
    name: "Starter",
    tagline: "For small study libraries starting out",
    monthlyPrice: 150,
    quarterlyPrice: 420,
    halfYearPrice: 780,
    limit: "Up to 150 Active Students",
    popular: false,
    icon: <FaRocket />,
    accent: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    features: [
      "10-Column Seat Layout Management",
      "Student In-System Check-in/out",
      "Basic Daily Revenue & Due Reports",
      "Manual Admission Desk",
      "Single Branch Isolation",
      "Standard Email & Chat Support"
    ],
    notIncluded: [
      "Automated QR Code Self-Registration",
      "Standalone Public Attendance Kiosk",
      "Multi-Branch Admin Console"
    ]
  },
  {
    name: "Basic",
    tagline: "Most popular for growing study spaces",
    monthlyPrice: 200,
    quarterlyPrice: 540,
    halfYearPrice: 990,
    limit: "Up to 250 Active Students",
    popular: true,
    icon: <FaCrown />,
    accent: "#059669",
    bg: "#ecfdf5",
    border: "#10b981",
    features: [
      "Everything in Starter plan",
      "Up to 250 Active Students",
      "Automated QR Code Self-Registrations",
      "Cashier Fee Desk (/collect-fee)",
      "Advanced Revenue & Expense Analytics",
      "WhatsApp Fee Due Reminder Templates",
      "Priority WhatsApp Customer Support"
    ],
    notIncluded: [
      "Multi-Branch Admin Console"
    ]
  },
  {
    name: "Pro",
    tagline: "For established high-occupancy reading halls",
    monthlyPrice: 300,
    quarterlyPrice: 810,
    halfYearPrice: 1490,
    limit: "Up to 500 Active Students",
    popular: false,
    icon: <FaHeadset />,
    accent: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    features: [
      "Everything in Basic plan",
      "Up to 500 Active Students",
      "Multi-Shift Optimization & Conflict Filter",
      "Standalone Public QR Kiosk Portal",
      "Enhanced Single-Device Session Security",
      "99.9% Uptime Guarantee SLA",
      "Direct 1-on-1 Phone & WhatsApp Hotline"
    ],
    notIncluded: []
  },
  {
    name: "Enterprise",
    tagline: "Complete suite for library chains & franchises",
    monthlyPrice: 400,
    quarterlyPrice: 1080,
    halfYearPrice: 1990,
    limit: "Unlimited Students & Seats",
    popular: false,
    icon: <FaBuilding />,
    accent: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    features: [
      "Everything in Pro plan",
      "Unlimited Students, Seats & Shifts",
      "Multi-Branch Central Administrative Console",
      "Super Admin Consolidated Reporting",
      "Custom Data Migration from Excel/Paper",
      "Dedicated Account Manager",
      "Custom Branding & Receipt Watermarks"
    ],
    notIncluded: []
  }
];

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState("quarterly");

  return (
    <section id="pricing" className="section-padding" style={{ background: "#ffffff", borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 48px" }}>
          <div className="badge-blue" style={{ marginBottom: "14px" }}>
            <FaTag /> 100% Transparent Pricing — Zero Setup Fees
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", marginBottom: "16px", color: "#0f172a" }}>
            Invest Less Than 1 Cup of Chai a Day
          </h2>
          <p style={{ color: "#475569", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Select the plan that fits your current seat count. Upgrade seamlessly as your study hall expands.
          </p>

          {/* Billing Toggle (White & Blue & Green) */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#f1f5f9",
            padding: "6px",
            borderRadius: "16px",
            border: "1px solid var(--border-medium)",
            marginTop: "24px"
          }}>
            <button
              onClick={() => setBillingCycle("monthly")}
              style={{
                padding: "8px 18px",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: "800",
                background: billingCycle === "monthly" ? "#2563eb" : "transparent",
                color: billingCycle === "monthly" ? "#ffffff" : "#475569",
                transition: "all 0.2s"
              }}
            >
              Monthly
            </button>

            <button
              onClick={() => setBillingCycle("quarterly")}
              style={{
                padding: "8px 18px",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: "800",
                background: billingCycle === "quarterly" ? "#2563eb" : "transparent",
                color: billingCycle === "quarterly" ? "#ffffff" : "#475569",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>Quarterly (3 Mo)</span>
              <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "#10b981", color: "#ffffff", borderRadius: "6px", fontWeight: "800" }}>
                Save 10%
              </span>
            </button>

            <button
              onClick={() => setBillingCycle("halfYear")}
              style={{
                padding: "8px 18px",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: "800",
                background: billingCycle === "halfYear" ? "#2563eb" : "transparent",
                color: billingCycle === "halfYear" ? "#ffffff" : "#475569",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>Half-Yearly (6 Mo)</span>
              <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "#ef4444", color: "#ffffff", borderRadius: "6px", fontWeight: "800" }}>
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
          gap: "24px",
          alignItems: "stretch"
        }}>
          {plans.map((p, idx) => {
            const price =
              billingCycle === "monthly"
                ? p.monthlyPrice
                : billingCycle === "quarterly"
                ? Math.round(p.quarterlyPrice / 3)
                : Math.round(p.halfYearPrice / 6);

            const totalBilled =
              billingCycle === "monthly"
                ? `Billed ₹${p.monthlyPrice} monthly`
                : billingCycle === "quarterly"
                ? `Billed ₹${p.quarterlyPrice} every 3 months`
                : `Billed ₹${p.halfYearPrice} every 6 months`;

            return (
              <div
                key={idx}
                className="white-card"
                style={{
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  border: p.popular ? "2.5px solid #10b981" : "1px solid var(--border-subtle)",
                  transform: p.popular ? "scale(1.02)" : "scale(1)",
                  boxShadow: p.popular ? "0 20px 45px rgba(16, 185, 129, 0.18)" : "var(--shadow-sm)"
                }}
              >
                {p.popular && (
                  <div style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: "900",
                    padding: "4px 14px",
                    borderRadius: "9999px",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    MOST POPULAR IN INDIA
                  </div>
                )}

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: p.bg,
                      color: p.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px"
                    }}>
                      {p.icon}
                    </div>
                    <h3 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#0f172a" }}>{p.name}</h3>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "#64748b", minHeight: "36px", marginBottom: "16px" }}>
                    {p.tagline}
                  </p>

                  <div style={{ marginBottom: "6px" }}>
                    <span style={{ fontSize: "2.8rem", fontWeight: "900", color: "#0f172a" }}>
                      ₹{price}
                    </span>
                    <span style={{ fontSize: "0.92rem", color: "#64748b", marginLeft: "4px" }}>
                      / month
                    </span>
                  </div>

                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "20px" }}>
                    {totalBilled} + GST
                  </div>

                  <div style={{
                    padding: "8px 12px",
                    background: p.bg,
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: "800",
                    color: p.accent,
                    marginBottom: "24px",
                    border: `1px solid ${p.border}`
                  }}>
                    ⚡ {p.limit}
                  </div>

                  {/* Feature Checklist */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
                    {p.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem" }}>
                        <FaCheck style={{ color: "#10b981", marginTop: "3px", flexShrink: 0 }} />
                        <span style={{ color: "#1e293b", lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}

                    {p.notIncluded.map((nf, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem", opacity: 0.45 }}>
                        <FaTimes style={{ color: "#ef4444", marginTop: "3px", flexShrink: 0 }} />
                        <span style={{ color: "#64748b", lineHeight: 1.4, textDecoration: "line-through" }}>{nf}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to="/demo"
                  className={p.popular ? "btn-green" : "btn-primary"}
                  style={{ width: "100%", padding: "12px", fontSize: "0.92rem", justifyContent: "center" }}
                >
                  Start 7-Day Free Trial
                </Link>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div style={{
          maxWidth: "850px",
          margin: "48px auto 0",
          textAlign: "center",
          padding: "20px 24px",
          borderRadius: "16px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <FaShieldAlt style={{ color: "#10b981", fontSize: "22px" }} />
          <span style={{ fontSize: "0.92rem", color: "#065f46" }}>
            <strong>Risk-Free Guarantee:</strong> Try with your actual students and seats for 7 days free. Free 1-on-1 WhatsApp onboarding and Excel data setup assistance included.
          </span>
        </div>
      </div>
    </section>
  );
}
