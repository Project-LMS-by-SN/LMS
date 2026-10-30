import { Link } from "react-router-dom";
import FeaturesGrid from "../components/FeaturesGrid";
import RevenueCalculator from "../components/RevenueCalculator";
import { FaLayerGroup, FaCalendarCheck, FaWhatsapp, FaCheckCircle, FaTh, FaQrcode, FaCashRegister, FaUserPlus, FaChartLine, FaShieldAlt } from "react-icons/fa";

export default function FeaturesPage() {
  return (
    <div style={{ paddingBottom: "80px" }}>
      {/* Header Banner */}
      <section style={{
        padding: "70px 0 40px",
        textAlign: "center",
        background: "radial-gradient(circle at 50% 0%, #eff6ff 0%, #ffffff 80%)",
        borderBottom: "1px solid var(--border-subtle)"
      }}>
        <div className="container" style={{ maxWidth: "850px" }}>
          <div className="badge-blue" style={{ marginBottom: "16px" }}>
            <FaLayerGroup /> Comprehensive Architecture Overview
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", lineHeight: 1.15, marginBottom: "18px", color: "#0f172a" }}>
            Engineered for High-Efficiency <span className="gradient-blue">Study Space Operations</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6, marginBottom: "28px" }}>
            Every tool in LMS has been built specifically to eliminate manual paper registers, prevent seat booking disputes, and protect your reading room's cash collections.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link to="/shifts-seats" className="btn-primary">
              <FaTh /> Try Interactive 10-Column Seat Map
            </Link>
            <Link to="/demo" className="btn-green">
              <FaCalendarCheck /> Book 1-on-1 Walkthrough
            </Link>
          </div>
        </div>
      </section>

      {/* Grid of All Features */}
      <FeaturesGrid />

      {/* Deep Dive Breakdown Section with White/Blue/Green/Red Cards */}
      <section className="section-padding" style={{ background: "#f8fafc" }}>
        <div className="container" style={{ maxWidth: "1050px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "2.4rem", fontWeight: "900", color: "#0f172a", marginBottom: "12px" }}>
              Deep Dive into the Core LMS Modules
            </h2>
            <p style={{ color: "#64748b", fontSize: "1.05rem" }}>
              How each component handles your daily library workflow seamlessly
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Deep Dive 1: 10-Column Seat Engine */}
            <div className="white-card" style={{ padding: "36px", borderLeft: "6px solid #2563eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <span className="badge-blue" style={{ marginBottom: "8px" }}>Module #01</span>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#0f172a" }}>10-Column Multi-Shift Allocation Matrix</h3>
                </div>
                <Link to="/shifts-seats" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem", color: "#2563eb", fontWeight: "800" }}>
                  Open Seat Simulator &rarr;
                </Link>
              </div>
              <p style={{ color: "#475569", lineHeight: 1.7, marginBottom: "16px" }}>
                Unlike generic seating tools, our matrix divides your reading hall into Morning (06:00 AM - 12:00 PM), Afternoon (12:00 PM - 05:00 PM), Evening (05:00 PM - 10:00 PM), Night (10:00 PM - 06:00 AM), and 24-Hour full-day plans. A student booking Morning Shift Seat A01 never interferes with an Evening Shift student booking the exact same physical desk.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                <div style={{ background: "#eff6ff", padding: "12px 16px", borderRadius: "10px", color: "#1e40af", fontSize: "0.88rem", fontWeight: "600" }}>
                  ✓ Visual floor plan (Hall A, B, C)
                </div>
                <div style={{ background: "#eff6ff", padding: "12px 16px", borderRadius: "10px", color: "#1e40af", fontSize: "0.88rem", fontWeight: "600" }}>
                  ✓ 1-Click student seat swapping
                </div>
                <div style={{ background: "#eff6ff", padding: "12px 16px", borderRadius: "10px", color: "#1e40af", fontSize: "0.88rem", fontWeight: "600" }}>
                  ✓ Real-time occupancy percentage
                </div>
              </div>
            </div>

            {/* Deep Dive 2: Dual Attendance & QR Kiosk */}
            <div className="white-card" style={{ padding: "36px", borderLeft: "6px solid #10b981" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <span className="badge-green" style={{ marginBottom: "8px" }}>Module #02</span>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#0f172a" }}>Dual Attendance Portals & QR Kiosk</h3>
                </div>
                <span className="badge-green">Sub-Second Check-in</span>
              </div>
              <p style={{ color: "#475569", lineHeight: 1.7, marginBottom: "16px" }}>
                LMS includes two distinct attendance workflows: an in-system check-in panel for reception staff, plus a standalone Public Kiosk (/public-attendance) that can be opened on any cheap Android tablet mounted at your entrance. Students simply flash their personal QR code from their mobile phone to mark check-in or check-out in under 1 second.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                <div style={{ background: "#ecfdf5", padding: "12px 16px", borderRadius: "10px", color: "#065f46", fontSize: "0.88rem", fontWeight: "600" }}>
                  ✓ Live In-Hall student headcount
                </div>
                <div style={{ background: "#ecfdf5", padding: "12px 16px", borderRadius: "10px", color: "#065f46", fontSize: "0.88rem", fontWeight: "600" }}>
                  ✓ Auto-timeout public security screen
                </div>
                <div style={{ background: "#ecfdf5", padding: "12px 16px", borderRadius: "10px", color: "#065f46", fontSize: "0.88rem", fontWeight: "600" }}>
                  ✓ Prevents proxy & fake entry logging
                </div>
              </div>
            </div>

            {/* Deep Dive 3: Cashier Fee Desk & WhatsApp Due Reminders */}
            <div className="white-card" style={{ padding: "36px", borderLeft: "6px solid #ef4444" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <span className="badge-red" style={{ marginBottom: "8px" }}>Module #03</span>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#0f172a" }}>Cashier Fee Desk & Automated WhatsApp Reminders</h3>
                </div>
                <span className="badge-red">Zero Fee Leakage</span>
              </div>
              <p style={{ color: "#475569", lineHeight: 1.7, marginBottom: "16px" }}>
                Collecting fees at the counter is fast and error-free with our dedicated cashier portal (/collect-fee). Staff select the student, pick cash/UPI, and print an official GST receipt with QR verification. 3 days before any subscription lapses, LMS automatically sends a polite WhatsApp fee reminder so students pay before expiry.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                <div style={{ background: "#fef2f2", padding: "12px 16px", borderRadius: "10px", color: "#991b1b", fontSize: "0.88rem", fontWeight: "600" }}>
                  ✓ Dedicated /collect-fee cashier desk
                </div>
                <div style={{ background: "#fef2f2", padding: "12px 16px", borderRadius: "10px", color: "#991b1b", fontSize: "0.88rem", fontWeight: "600" }}>
                  ✓ Automated WhatsApp expiry alerts
                </div>
                <div style={{ background: "#fef2f2", padding: "12px 16px", borderRadius: "10px", color: "#991b1b", fontSize: "0.88rem", fontWeight: "600" }}>
                  ✓ Instant PDF receipts with QR verification
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Calculator Section */}
      <RevenueCalculator />
    </div>
  );
}
