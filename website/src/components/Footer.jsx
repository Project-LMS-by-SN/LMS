import { Link } from "react-router-dom";
import { FaPhoneAlt, FaEnvelope, FaWhatsapp, FaMapMarkerAlt, FaHeart, FaCalendarCheck } from "react-icons/fa";

export default function Footer({ onOpenDemo }) {
  return (
    <footer style={{
      background: "#ffffff",
      borderTop: "1px solid var(--border-subtle)",
      padding: "60px 0 30px",
      position: "relative"
    }}>
      <div className="container">
        {/* Top Pre-Footer CTA Bar (White card with Blue & Green buttons) */}
        <div className="white-card" style={{
          padding: "36px",
          marginBottom: "54px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "24px",
          background: "linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%)",
          border: "1.5px solid #bfdbfe"
        }}>
          <div>
            <span className="badge-red" style={{ marginBottom: "8px" }}>
              ✨ Instant Setup in 30 Mins
            </span>
            <h3 style={{ fontSize: "1.65rem", fontWeight: "900", color: "#0f172a", marginBottom: "6px" }}>
              Ready to Upgrade Your Library to 100% Cloud?
            </h3>
            <p style={{ color: "#475569", fontSize: "0.98rem" }}>
              Join 100+ study spaces across India. Start your 7-day free trial today without any credit card.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link to="/demo" className="btn-primary">
              <FaCalendarCheck /> Book Free Live Demo
            </Link>
            <a
              href="https://wa.me/919142025447?text=Hi%20Software%20Native,%20I%20want%20to%20set%20up%20LMS%20in%20my%20library."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              <FaWhatsapp /> Quick WhatsApp
            </a>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "36px",
          marginBottom: "48px"
        }}>
          {/* Column 1: Brand & Bio */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                color: "#ffffff"
              }}>
                📚
              </div>
              <span style={{ fontSize: "1.25rem", fontWeight: "900", color: "#0f172a" }}>
                LMS <span style={{ color: "#2563eb" }}>Cloud</span>
              </span>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "16px" }}>
              India's leading study space operating platform. Eliminating register chaos with multi-shift seat allocation, QR kiosks, and automated payment tracking.
            </p>
            <div style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: "700" }}>
              Software Native Technologies Pvt. Ltd.
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "800", marginBottom: "16px", color: "#0f172a" }}>
              Dedicated Modules
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem", color: "#475569" }}>
              <Link to="/shifts-seats">10-Column Multi-Shift Matrix</Link>
              <Link to="/features">Standalone Public QR Kiosk</Link>
              <Link to="/features">Cashier Fee Desk (/collect-fee)</Link>
              <Link to="/features">Counter QR Student Registration</Link>
              <Link to="/features">Expense Tracker & GST Invoices</Link>
              <Link to="/features">Single-Device Active Session Lock</Link>
            </div>
          </div>

          {/* Column 3: Quick Navigation */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "800", marginBottom: "16px", color: "#0f172a" }}>
              Quick Navigation
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem", color: "#475569" }}>
              <Link to="/">Home</Link>
              <Link to="/features">Features Overview</Link>
              <Link to="/shifts-seats">Live Shift & Seat Map</Link>
              <Link to="/pricing">Plans & Pricing</Link>
              <Link to="/about-us">About Us (Our Journey)</Link>
              <Link to="/contact-us">Contact Us & Support</Link>
              <Link to="/demo">Book 1-on-1 Walkthrough</Link>
              <a href="http://localhost:5173/login" target="_blank" rel="noopener noreferrer">Owner Login Portal</a>
            </div>
          </div>

          {/* Column 4: Contact & Support Hotline */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "800", marginBottom: "16px", color: "#0f172a" }}>
              Support Hotline
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem", color: "#475569" }}>
              <a href="tel:+919142025447" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563eb", fontWeight: "700" }}>
                <FaPhoneAlt /> +91 9142025447
              </a>
              <a href="https://wa.me/919142025447" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontWeight: "700" }}>
                <FaWhatsapp style={{ fontSize: "16px" }} /> +91 9142025447 (WhatsApp)
              </a>
              <a href="mailto:contactsoftwarenative@gmail.com" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaEnvelope /> contactsoftwarenative@gmail.com
              </a>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.82rem", lineHeight: 1.5, color: "#64748b" }}>
                <FaMapMarkerAlt style={{ marginTop: "3px", flexShrink: 0, color: "#ef4444" }} />
                <span>Serving libraries in Delhi NCR, Jaipur, Kota, Patna, Lucknow, Pune, Indore & 28+ states</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div style={{
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "0.82rem",
          color: "#64748b"
        }}>
          <div>
            © 2026 Software Native . All rights reserved.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>Made with</span>
            <FaHeart style={{ color: "#ef4444" }} />
            <span>in India for Study Libraries</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
