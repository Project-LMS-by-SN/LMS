import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaTimes, FaSignInAlt, FaCalendarCheck, FaPhoneAlt, FaWhatsapp } from "react-icons/fa";

export default function Navbar({ onOpenDemo }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Features", path: "/features" },
    { label: "Shifts & Seats", path: "/shifts-seats" },
    { label: "Pricing", path: "/pricing" },
    { label: "About Us", path: "/about-us" },
    { label: "Contact Us", path: "/contact-us" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: scrolled ? "rgba(255, 255, 255, 0.96)" : "#ffffff",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
        boxShadow: scrolled ? "0 4px 20px rgba(0, 0, 0, 0.06)" : "none",
        transition: "all 0.25s ease"
      }}
    >
      {/* Top Mini Hotline Bar (White, Green & Red accents) */}
      <div style={{
        background: "#0f172a",
        color: "#ffffff",
        fontSize: "0.78rem",
        padding: "6px 0",
        fontWeight: "600"
      }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="pulse-dot-green"></span>
            <span>India's Best Library Management System</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <a href="tel:+919142025447" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#93c5fd" }}>
              <FaPhoneAlt style={{ fontSize: "11px" }} /> +91 9142025447
            </a>
            <a
              href="https://wa.me/919142025447?text=Hi%20Software%20Native,%20I%20am%20interested%20in%20LMS%20for%20my%20library."
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "6px", color: "#86efac" }}
            >
              <FaWhatsapp style={{ fontSize: "13px" }} /> WhatsApp Support
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px" }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            color: "#ffffff"
          }}>
            📚
          </div>
          <div>
            <div style={{
              fontSize: "1.25rem",
              fontWeight: "900",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "#0f172a"
            }}>
              LMS <span style={{ color: "#2563eb" }}>Cloud</span>
            </div>
            <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "700", letterSpacing: "0.02em" }}>
              by Software Native
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "24px" }} className="desktop-nav">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  fontSize: "0.92rem",
                  fontWeight: isActive ? "800" : "600",
                  color: isActive ? "#2563eb" : "#334155",
                  position: "relative",
                  padding: "6px 0",
                  transition: "color 0.2s"
                }}
              >
                {item.label}
                {isActive && (
                  <span style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "2.5px",
                    background: "#2563eb",
                    borderRadius: "2px"
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            to="/demo"
            className="btn-green"
            style={{ padding: "9px 18px", fontSize: "0.88rem" }}
          >
            <FaCalendarCheck /> Book Free Demo
          </Link>

          <a
            href="http://localhost:5173/login"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary desktop-login-btn"
            style={{ padding: "9px 18px", fontSize: "0.88rem" }}
          >
            <FaSignInAlt /> Owner Login
          </a>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-hamburger"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              color: "#0f172a",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px"
            }}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            background: "#ffffff",
            borderBottom: "2px solid #2563eb",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.12)"
          }}
        >
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: location.pathname === item.path ? "800" : "600",
                color: location.pathname === item.path ? "#2563eb" : "#0f172a",
                background: location.pathname === item.path ? "#eff6ff" : "transparent"
              }}
            >
              {item.label}
            </Link>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
            <Link
              to="/demo"
              className="btn-green"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <FaCalendarCheck /> Book Free Demo
            </Link>
            <a
              href="http://localhost:5173/login"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <FaSignInAlt /> Owner Login
            </a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 950px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-login-btn {
            display: none !important;
          }
          .mobile-hamburger {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
