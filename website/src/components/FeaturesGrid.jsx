import { Link } from "react-router-dom";
import { FaTh, FaQrcode, FaCashRegister, FaUserPlus, FaChartLine, FaShieldAlt, FaCheck, FaArrowRight } from "react-icons/fa";

const features = [
  {
    icon: <FaTh />,
    color: "#2563eb",
    bg: "#eff6ff",
    borderTop: "#2563eb",
    title: "10-Column Multi-Shift Seat Engine",
    desc: "Interactive visual matrix separating Morning, Afternoon, Evening, Night, and 24-Hour shifts. Completely eliminates double-booking and seating conflicts.",
    highlights: ["10-column interactive floor plan", "Shift timing validation", "1-click seat reassignments"],
    pageLink: "/shifts-seats"
  },
  {
    icon: <FaQrcode />,
    color: "#10b981",
    bg: "#ecfdf5",
    borderTop: "#10b981",
    title: "Dual Attendance & Fast QR Kiosk",
    desc: "Includes both an in-system staff check-in desk and a standalone Public Kiosk screen (/public-attendance). Students scan and log entry in under 1 second.",
    highlights: ["Standalone Public QR Kiosk", "Live In-Library headcount", "Auto-timeout security screen"],
    pageLink: "/features"
  },
  {
    icon: <FaCashRegister />,
    color: "#059669",
    bg: "#f0fdf4",
    borderTop: "#059669",
    title: "Cashier Fee Desk & Validity Alerts",
    desc: "Speed up counter fee collections with our dedicated cashier desk (/collect-fee). Create custom fee plans and send automated WhatsApp expiry reminders.",
    highlights: ["Dedicated /collect-fee cashier portal", "Automated WhatsApp expiry reminders", "Instant PDF receipts with QR verification"],
    pageLink: "/features"
  },
  {
    icon: <FaUserPlus />,
    color: "#2563eb",
    bg: "#eff6ff",
    borderTop: "#2563eb",
    title: "Counter QR Student Self-Admission",
    desc: "Place a QR sticker on your reception desk. Walk-in students scan, select their preferred shift, and register from their phone for instant 1-click approval.",
    highlights: ["Public counter admission portal", "Instant digital ID card generation", "Zero paperwork registration"],
    pageLink: "/features"
  },
  {
    icon: <FaChartLine />,
    color: "#f59e0b",
    bg: "#fffbeb",
    borderTop: "#f59e0b",
    title: "Expense Tracker & Financial Analytics",
    desc: "Track daily counter cash collection, monthly seat revenues, and operational expenses (rent, electricity, internet, AC) with exportable GST statements.",
    highlights: ["Daily cash closing calculator", "Operational expense tracking", "Monthly profit & revenue analytics"],
    pageLink: "/features"
  },
  {
    icon: <FaShieldAlt />,
    color: "#ef4444",
    bg: "#fef2f2",
    borderTop: "#ef4444",
    title: "Single-Device Lock & Multi-Branch",
    desc: "Role-based access control (Owner & Staff) with strict single-device concurrent session enforcement, failed login lockouts, and multi-branch management.",
    highlights: ["Single-device session enforcement", "Dynamic URL prefix routing", "Multi-branch cloud isolation"],
    pageLink: "/features"
  }
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="section-padding" style={{ background: "#ffffff", borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="container">
        {/* Section Heading */}
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 54px" }}>
          <div className="badge-blue" style={{ marginBottom: "14px" }}>
            <span>Everything Your Study Library Needs</span>
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", marginBottom: "16px", color: "#0f172a" }}>
            Purpose-Built for Indian Reading Rooms & Study Libraries
          </h2>
          <p style={{ color: "#475569", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Generic school software does not fit multi-shift study libraries. 
            LMS is designed specifically for student reading halls, civil service preparation hubs, and library chains.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "28px"
        }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="white-card"
              style={{
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderTop: `4px solid ${f.borderTop}`
              }}
            >
              <div>
                <div style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "14px",
                  background: f.bg,
                  color: f.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  marginBottom: "20px"
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "12px", color: "#0f172a" }}>
                  {f.title}
                </h3>
                <p style={{ color: "#475569", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "20px" }}>
                  {f.desc}
                </p>

                {/* Bullet Points */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                  {f.highlights.map((h, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#1e293b" }}>
                      <span style={{ color: "#10b981", display: "flex", fontSize: "13px" }}><FaCheck /></span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to={f.pageLink}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.88rem",
                  fontWeight: "800",
                  color: f.color,
                  padding: "6px 0",
                  transition: "gap 0.2s"
                }}
              >
                <span>Learn More in Dedicated Module</span>
                <FaArrowRight style={{ fontSize: "11px" }} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
