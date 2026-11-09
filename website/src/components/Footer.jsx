import { Link } from "react-router-dom";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaHeart,
  FaSignInAlt,
  FaArrowRight
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        background: "linear-gradient(150deg, #0ea5e9 0%, #0284c7 60%, #0369a1 100%)",
        color: "#ffffff",
        borderTop: "4px solid #f97316",
        paddingTop: "56px",
        paddingBottom: "32px",
        boxShadow: "0 -8px 24px rgba(2, 132, 199, 0.15)"
      }}
    >
      <div className="container">
        {/* ========================================================= */}
        {/* MAIN FOOTER COLUMNS (Sky Blue Theme with Orange Accents) */}
        {/* ========================================================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "36px",
            paddingBottom: "44px"
          }}
        >
          {/* Column 1: Brand & Bio */}
          <div style={{ maxWidth: "340px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
                  border: "2px solid #f97316"
                }}
              >
                📚
              </div>
              <span style={{ fontSize: "1.3rem", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.02em" }}>
                LMS <span style={{ color: "#ffedd5", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>by Study Guru</span>
              </span>
            </div>

            {/* Shortened punchy tagline */}
            <p style={{ color: "#f0f9ff", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "18px", fontWeight: "500" }}>
              India's smartest cloud operating system for study libraries & reading halls.
            </p>

            <div style={{ fontSize: "0.8rem", color: "#bae6fd", fontWeight: "500" }}>
              © {new Date().getFullYear()} LMS by Study Guru. All rights reserved.
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h4
              style={{
                fontSize: "0.86rem",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#ffffff",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f97316", display: "inline-block", boxShadow: "0 0 8px #f97316" }}></span>
              Navigation
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "11px", fontSize: "0.92rem", fontWeight: "600" }}>
              <Link
                to="/"
                style={{ color: "#f0f9ff", transition: "all 0.2s" }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#fed7aa";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#f0f9ff";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                Home
              </Link>
              <Link
                to="/features"
                style={{ color: "#f0f9ff", transition: "all 0.2s" }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#fed7aa";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#f0f9ff";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                Features
              </Link>
              <Link
                to="/pricing"
                style={{ color: "#f0f9ff", transition: "all 0.2s" }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#fed7aa";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#f0f9ff";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                Plans & Pricing
              </Link>
              <Link
                to="/about-us"
                style={{ color: "#f0f9ff", transition: "all 0.2s" }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#fed7aa";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#f0f9ff";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                About Us
              </Link>
              <Link
                to="/contact-us"
                style={{ color: "#f0f9ff", transition: "all 0.2s" }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#fed7aa";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#f0f9ff";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                Contact Us
              </Link>
              <Link
                to="/register"
                style={{
                  marginTop: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#f97316",
                  color: "#ffffff",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontWeight: "800",
                  width: "fit-content",
                  boxShadow: "0 4px 12px rgba(249, 115, 22, 0.35)",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#ea580c";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#f97316";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Register Your Library <FaArrowRight style={{ fontSize: "11px" }} />
              </Link>
            </div>
          </div>

          {/* Column 3: Contact & Support */}
          <div>
            <h4
              style={{
                fontSize: "0.86rem",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#ffffff",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f97316", display: "inline-block", boxShadow: "0 0 8px #f97316" }}></span>
              Contact & Support
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "13px", fontSize: "0.92rem", fontWeight: "600" }}>
              <a
                href="tel:+919142025447"
                style={{ display: "flex", alignItems: "center", gap: "10px", color: "#ffffff", transition: "color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#fed7aa")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#ffffff")}
              >
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <FaPhoneAlt style={{ fontSize: "11px", color: "#ffedd5" }} />
                </span>
                +91 9142025447
              </a>
              <a
                href="https://wa.me/919142025447"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "10px", color: "#ffffff", transition: "color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#bbf7d0")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#ffffff")}
              >
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.4)"
                  }}
                >
                  <FaWhatsapp style={{ fontSize: "15px", color: "#ffffff" }} />
                </span>
                +91 9142025447 (WhatsApp)
              </a>
              <a
                href="mailto:contactsoftwarenative@gmail.com"
                style={{ display: "flex", alignItems: "center", gap: "10px", color: "#f0f9ff", transition: "color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#fed7aa")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#f0f9ff")}
              >
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <FaEnvelope style={{ fontSize: "11px", color: "#ffedd5" }} />
                </span>
                contactsoftwarenative@gmail.com
              </a>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: "#e0f2fe", fontSize: "0.84rem", lineHeight: 1.5, marginTop: "2px" }}>
                <FaMapMarkerAlt style={{ color: "#ffedd5", marginTop: "3px", flexShrink: 0, fontSize: "14px" }} />
                <span>Serving study libraries across Delhi NCR, Jaipur, Kota, Patna, Lucknow & 28+ States</span>
              </div>
            </div>
          </div>

          {/* Column 4: Admin Portal Access */}
          <div>
            <h4
              style={{
                fontSize: "0.86rem",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#ffffff",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f97316", display: "inline-block", boxShadow: "0 0 8px #f97316" }}></span>
              Admin Portal
            </h4>
            <p style={{ color: "#f0f9ff", fontSize: "0.84rem", lineHeight: 1.5, marginBottom: "16px", fontWeight: "500" }}>
              Authorized library owners and branch cashiers can log in directly to their dashboard.
            </p>
            <a
              href="https://lms-mu-lac-29.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
                background: "#ffffff",
                color: "#0369a1",
                padding: "11px 20px",
                borderRadius: "10px",
                fontSize: "0.88rem",
                fontWeight: "800",
                border: "2px solid #ffffff",
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.12)",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#f97316";
                e.currentTarget.style.borderColor = "#f97316";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 22px rgba(249, 115, 22, 0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "#ffffff";
                e.currentTarget.style.color = "#0369a1";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.12)";
              }}
            >
              <FaSignInAlt style={{ color: "#f97316" }} /> Admin Login Portal
            </a>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM COPYRIGHT STRIP */}
        {/* ========================================================= */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.22)",
            paddingTop: "22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "0.82rem",
            color: "#e0f2fe",
            fontWeight: "500"
          }}
        >
          <div>
            LMS by Study Guru. All study library operations automated.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>Designed & Developed by</span>
            <a
              href="https://softwarenative.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ffffff", fontWeight: "800", textDecoration: "underline" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#fed7aa")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#ffffff")}
            >
              softwarenative.in
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
