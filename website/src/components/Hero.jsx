import { Link } from "react-router-dom";
import { 
  FaPlay, 
  FaCalendarCheck, 
  FaWhatsapp, 
  FaUsers, 
  FaUserCheck, 
  FaUserTimes, 
  FaClock, 
  FaClipboardCheck, 
  FaUserPlus, 
  FaChair, 
  FaBell, 
  FaSyncAlt, 
  FaWifi, 
  FaBatteryFull, 
  FaBolt, 
  FaLock, 
  FaUser, 
  FaCreditCard,
  FaFileAlt,
  FaMoneyBillWave,
  FaThLarge,
  FaExclamationTriangle,
  FaQrcode
} from "react-icons/fa";

export default function Hero({ onOpenDemo }) {
  return (
    <section style={{
      position: "relative",
      padding: "70px 0 50px",
      background: "radial-gradient(circle at 50% 0%, #eff6ff 0%, #ffffff 80%)",
      borderBottom: "1px solid var(--border-subtle)"
    }}>
      <div className="container" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Top Announcement Pill */}
        <div style={{ display: "inline-flex", marginBottom: "20px" }} className="badge-green">
          <span className="pulse-dot-green"></span>
          <span>India's #1 Cloud Platform for Multi-Shift Study Libraries & Reading Halls</span>
        </div>

        {/* Hero Title with Blue, Green and Dark tones */}
        <h1 style={{
          fontSize: "clamp(2.4rem, 5vw, 4.3rem)",
          lineHeight: 1.15,
          fontWeight: 900,
          maxWidth: "1050px",
          margin: "0 auto 20px",
          color: "#0f172a"
        }}>
          Automate Your Study Library With{" "}
          <span className="gradient-blue">Smart Digital Solutions</span>
        </h1>

        {/* Hero Subtitle */}
        <p style={{
          fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)",
          color: "#475569",
          maxWidth: "840px",
          margin: "0 auto 36px",
          lineHeight: 1.6
        }}>
          Replace messy paper registers. Manage up to  1,000+ students,Make Attendance with QR, multi-shift timings, student admissions, 
          cashier fee collections, and automated WhatsApp dues reminders with zero server lag.
        </p>

        {/* Action Buttons: Blue, Green, Red accents */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          flexWrap: "wrap",
          marginBottom: "20px"
        }}>
          <Link
            to="/register"
            className="btn-primary"
            style={{ fontSize: "1.02rem", padding: "15px 30px" }}
          >
            <FaUserPlus /> Register Your Library - Free
          </Link>

          <Link
            to="/features"
            className="btn-green"
            style={{ fontSize: "1.02rem", padding: "15px 28px" }}
          >
            <FaPlay style={{ fontSize: "11px" }} /> Explore Features
          </Link>

          <a
            href="https://wa.me/919142025447?text=Hi%20Software%20Native,%20I%20am%20interested%20in%20LMS%20for%20my%20library."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
            style={{ fontSize: "1.02rem", padding: "15px 28px" }}
          >
            <FaWhatsapp style={{ fontSize: "18px" }} /> WhatsApp Support
          </a>
        </div>

        {/* Special Launch Offer Pill */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%)",
          border: "1.5px solid #86efac",
          padding: "8px 20px",
          borderRadius: "9999px",
          fontSize: "0.88rem",
          fontWeight: "800",
          color: "#065f46",
          marginBottom: "46px",
          boxShadow: "0 4px 14px rgba(16, 185, 129, 0.15)"
        }}>
          <span>🎉 Special Launch Offer:</span>
          <span style={{ color: "#2563eb", fontWeight: "900" }}>First Three Months Pro Subscription Free *</span>
        </div>

        {/* Key Trust Stats Bar in White & Colored Badges */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "18px",
          maxWidth: "1050px",
          margin: "0 auto 54px"
        }}>
          <div className="white-card" style={{ padding: "22px 16px", textAlign: "center", borderTop: "4px solid #2563eb" }}>
            <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "#2563eb", marginBottom: "4px" }}>
              100+
            </div>
            <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: "700" }}>
              Active Study Libraries
            </div>
          </div>

          <div className="white-card" style={{ padding: "22px 16px", textAlign: "center", borderTop: "4px solid #10b981" }}>
            <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "#10b981", marginBottom: "4px" }}>
              5,000+
            </div>
            <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: "700" }}>
              Students
            </div>
          </div>

          <div className="white-card" style={{ padding: "22px 16px", textAlign: "center", borderTop: "4px solid #f59e0b" }}>
            <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "#f59e0b", marginBottom: "4px" }}>
              28+ States
            </div>
            <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: "700" }}>
              Covered Across India
            </div>
          </div>

          <div className="white-card" style={{ padding: "22px 16px", textAlign: "center", borderTop: "4px solid #ef4444" }}>
            <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "#ef4444", marginBottom: "4px" }}>
              99.9%
            </div>
            <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: "700" }}>
              Uptime SLA Guaranteed
            </div>
          </div>
        </div>

        {/* =========================================================================
            REALISTIC LAPTOP & MOBILE SCREEN DEVICE SHOWCASE
            ========================================================================= */}
        <div className="device-showcase-container">
          
          {/* LAPTOP MOCKUP FRAME */}
          <div className="laptop-mockup">
            <div className="laptop-screen-bezel">
              
              {/* Laptop Top Camera & Bezel */}
              <div className="laptop-camera-bar">
                <div className="laptop-camera-dot"></div>
              </div>

              {/* Laptop Browser Header Bar */}
              <div className="laptop-browser-bar">
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }}></span>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                </div>

                <div style={{
                  background: "#ffffff",
                  padding: "4px 16px",
                  borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.72rem",
                  color: "#475569",
                  fontWeight: "600"
                }}>
                  <FaLock style={{ color: "#10b981", fontSize: "10px" }} />
                  <span>lms.studyguru.in/dashboard</span>
                  <span style={{ color: "#94a3b8", fontSize: "0.68rem" }}>• SSL Secure</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.7rem", color: "#059669", fontWeight: "700" }}>
                  <span className="pulse-dot-green"></span>
                  <span className="desktop-only-badge">Live System</span>
                </div>
              </div>

              {/* REALISTIC LMS DASHBOARD INSIDE LAPTOP SCREEN */}
              <div style={{ display: "flex", textAlign: "left", background: "#f8fafc", minHeight: "450px" }}>
                
                {/* Left LMS Sidebar */}
                <div className="laptop-sidebar" style={{
                  width: "180px",
                  background: "#ffffff",
                  borderRight: "1px solid #e2e8f0",
                  padding: "16px 12px",
                  flexShrink: 0
                }}>
                  {/* Library Brand / Profile */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                    <div style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: "900",
                      boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)"
                    }}>
                      ML
                    </div>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#0f172a", lineHeight: 1.2 }}>
                        My Library
                      </div>
                      <div style={{ fontSize: "0.66rem", color: "#94a3b8", fontWeight: "600" }}>
                        MI 354862
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Nav Items */}
                  <div>
                    <div style={{ fontSize: "0.62rem", fontWeight: "800", color: "#94a3b8", letterSpacing: "0.05em", marginBottom: "6px" }}>
                      MAIN DASHBOARD
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 10px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      marginBottom: "4px",
                      borderRight: "3px solid #2563eb"
                    }}>
                      <FaThLarge style={{ fontSize: "11px" }} /> Overview
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", color: "#64748b", fontSize: "0.75rem", fontWeight: "600", marginBottom: "4px" }}>
                      <FaUsers style={{ fontSize: "11px" }} /> Students
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", color: "#64748b", fontSize: "0.75rem", fontWeight: "600", marginBottom: "14px" }}>
                      <FaChair style={{ fontSize: "11px" }} /> Seat Layout
                    </div>

                    <div style={{ fontSize: "0.62rem", fontWeight: "800", color: "#94a3b8", letterSpacing: "0.05em", marginBottom: "6px" }}>
                      OPERATIONS
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 10px", color: "#64748b", fontSize: "0.73rem", fontWeight: "600" }}>
                      <FaClipboardCheck style={{ fontSize: "11px" }} /> Attendance
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 10px", color: "#64748b", fontSize: "0.73rem", fontWeight: "600" }}>
                      <FaUserPlus style={{ fontSize: "11px" }} /> Admission
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 10px", color: "#64748b", fontSize: "0.73rem", fontWeight: "600" }}>
                      <FaCreditCard style={{ fontSize: "11px" }} /> Collect Fee
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 10px", color: "#64748b", fontSize: "0.73rem", fontWeight: "600", marginBottom: "14px" }}>
                      <FaFileAlt style={{ fontSize: "11px" }} /> Student Reports
                    </div>

                    <div style={{ fontSize: "0.62rem", fontWeight: "800", color: "#94a3b8", letterSpacing: "0.05em", marginBottom: "6px" }}>
                      ADMIN MANAGE
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 10px", color: "#64748b", fontSize: "0.73rem", fontWeight: "600" }}>
                      <FaClock style={{ fontSize: "11px" }} /> Shifts
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 10px", color: "#64748b", fontSize: "0.73rem", fontWeight: "600" }}>
                      <FaCreditCard style={{ fontSize: "11px" }} /> Fee Plan
                    </div>
                  </div>
                </div>

                {/* Right Dashboard Body */}
                <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden" }}>
                  
                  {/* Top Header: Date & Plan Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: "600" }}>
                      Saturday, 24 October 2026
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        padding: "3px 8px",
                        borderRadius: "20px",
                        fontSize: "0.7rem",
                        color: "#065f46",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        Pro Plan • Expires: 22 Dec 2026
                        <span style={{ background: "#10b981", color: "#ffffff", padding: "1px 5px", borderRadius: "10px", fontSize: "0.65rem" }}>
                          59d left
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#ffffff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "10px" }}>
                          <FaSyncAlt />
                        </span>
                        <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#ffffff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "10px" }}>
                          <FaBell />
                        </span>
                        <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", fontSize: "11px" }}>
                          <FaUser />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Welcome Banner */}
                  <div style={{
                    background: "linear-gradient(135deg, #f5f3ff 0%, #eef2ff 60%, #eff6ff 100%)",
                    border: "1px solid #e0e7ff",
                    borderRadius: "14px",
                    padding: "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "14px"
                  }}>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: "900", color: "#1e1b4b" }}>
                        Welcome back, My Library
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#6366f1", fontWeight: "600", marginTop: "2px" }}>
                        Sat, 24 Oct 2026 | 11:56:56 AM
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={{
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer"
                      }}>
                        <FaClipboardCheck /> Mark Attendance
                      </button>
                      <button style={{
                        background: "#1d4ed8",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer"
                      }}>
                        <FaUserPlus /> Add Student
                      </button>
                    </div>
                  </div>

                  {/* 6 Real Metric Summary Cards */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                    marginBottom: "14px"
                  }}>
                    {/* Card 1 */}
                    <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#4f46e5", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                        <FaUsers />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: "700" }}>TOTAL MEMBERS</div>
                        <div style={{ fontSize: "1.15rem", fontWeight: "900", color: "#0f172a" }}>6</div>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#10b981", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                        <FaUserCheck />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: "700" }}>ACTIVE MEMBERS</div>
                        <div style={{ fontSize: "1.15rem", fontWeight: "900", color: "#059669" }}>6 / 6</div>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f59e0b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                        <FaExclamationTriangle />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.58rem", color: "#64748b", fontWeight: "700" }}>SUSPENDED (UNPAID &gt; 7D)</div>
                        <div style={{ fontSize: "1.15rem", fontWeight: "900", color: "#0f172a" }}>0</div>
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#ef4444", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                        <FaUserTimes />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.58rem", color: "#64748b", fontWeight: "700" }}>INACTIVE (UNPAID &gt; 20D)</div>
                        <div style={{ fontSize: "1.15rem", fontWeight: "900", color: "#0f172a" }}>0</div>
                      </div>
                    </div>

                    {/* Card 5 */}
                    <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#ea580c", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                        <FaClock />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: "700" }}>EXPIRE SOON (7 DAYS)</div>
                        <div style={{ fontSize: "1.15rem", fontWeight: "900", color: "#ea580c" }}>0</div>
                      </div>
                    </div>

                    {/* Card 6 */}
                    <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#8b5cf6", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                        <FaClipboardCheck />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: "700" }}>TODAY'S ATTENDANCE</div>
                        <div style={{ fontSize: "1.15rem", fontWeight: "900", color: "#0f172a" }}>0</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Row */}
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <FaBolt style={{ color: "#f59e0b" }} /> Quick Actions
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                      <div style={{ background: "#ffffff", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#f3e8ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", marginBottom: "6px" }}>
                          <FaUsers />
                        </div>
                        <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0f172a" }}>Students</div>
                        <div style={{ fontSize: "0.62rem", color: "#64748b" }}>View members</div>
                      </div>

                      <div style={{ background: "#ffffff", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", marginBottom: "6px" }}>
                          <FaUserPlus />
                        </div>
                        <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0f172a" }}>Add Student</div>
                        <div style={{ fontSize: "0.62rem", color: "#64748b" }}>Register member</div>
                      </div>

                      <div style={{ background: "#ffffff", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", marginBottom: "6px" }}>
                          <FaChair />
                        </div>
                        <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0f172a" }}>Seat Layout</div>
                        <div style={{ fontSize: "0.62rem", color: "#64748b" }}>Customize floor</div>
                      </div>

                      <div style={{ background: "#ffffff", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#dcfce7", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", marginBottom: "6px" }}>
                          <FaMoneyBillWave />
                        </div>
                        <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0f172a" }}>Collect Fees</div>
                        <div style={{ fontSize: "0.62rem", color: "#64748b" }}>Make payment</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Laptop Base Stand / Chassis */}
            <div className="laptop-base-chassis">
              <div className="laptop-base-notch"></div>
            </div>
          </div>

          {/* =========================================================================
              MOBILE PHONE SCREEN MOCKUP (FLOATING OVERLAY)
              ========================================================================= */}
          <div className="mobile-mockup-wrapper">
            <div className="mobile-phone-frame">
              
              {/* Dynamic Island Notch */}
              <div className="mobile-dynamic-island">
                <div className="mobile-camera-lens"></div>
              </div>

              {/* Mobile Status Bar */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 16px 2px",
                fontSize: "0.68rem",
                fontWeight: "700",
                color: "#0f172a"
              }}>
                <span>9:41</span>
                <div style={{ display: "flex", gap: "5px", alignItems: "center", fontSize: "10px" }}>
                  <FaWifi />
                  <FaBatteryFull style={{ fontSize: "12px" }} />
                </div>
              </div>

              {/* Mobile App Header */}
              <div style={{
                padding: "8px 14px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: "900"
                  }}>
                    ML
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "0.76rem", fontWeight: "800", color: "#0f172a", lineHeight: 1.1 }}>
                      My Library
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.6rem", color: "#059669", fontWeight: "700" }}>
                      <span className="pulse-dot-green" style={{ width: "5px", height: "5px" }}></span> Live Shift
                    </div>
                  </div>
                </div>

                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#475569" }}>
                  <FaBell />
                </div>
              </div>

              {/* Mobile App Content */}
              <div style={{ padding: "12px 14px", textAlign: "left", background: "#f8fafc" }}>
                
                {/* Active Shift Card */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  marginBottom: "10px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: "800", color: "#0f172a" }}>
                      Morning Shift
                    </span>
                    <span style={{ fontSize: "0.62rem", background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                      06:00 AM - 12:00 PM
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>
                    <span>Live Occupancy</span>
                    <span style={{ color: "#2563eb", fontWeight: "800" }}>84 / 100 Seats</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ width: "84%", height: "100%", background: "linear-gradient(90deg, #2563eb, #10b981)", borderRadius: "10px" }}></div>
                  </div>
                </div>

                {/* 10 Interactive Live Seats Grid (Mini Map) */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "10px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: "800", color: "#0f172a" }}>Live Seat Grid</span>
                    <div style={{ display: "flex", gap: "6px", fontSize: "0.6rem", fontWeight: "700" }}>
                      <span style={{ color: "#2563eb" }}>● Full</span>
                      <span style={{ color: "#10b981" }}>● Free</span>
                    </div>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "5px"
                  }}>
                    {["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5"].map((seat, idx) => {
                      const isFree = idx === 3 || idx === 8;
                      return (
                        <div
                          key={seat}
                          style={{
                            height: "22px",
                            borderRadius: "5px",
                            background: isFree ? "#dcfce7" : "#dbeafe",
                            border: `1px solid ${isFree ? "#86efac" : "#bfdbfe"}`,
                            color: isFree ? "#059669" : "#1d4ed8",
                            fontSize: "0.58rem",
                            fontWeight: "800",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          {seat}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Student Check-in Event Toast */}
                <div style={{
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px"
                }}>
                  <span className="pulse-dot-green" style={{ width: "6px", height: "6px" }}></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.66rem", fontWeight: "800", color: "#065f46" }}>
                      Aryan V. • Seat B-04
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "#047857" }}>
                      Instant QR Entry Logged
                    </div>
                  </div>
                  <FaQrcode style={{ color: "#059669", fontSize: "14px" }} />
                </div>

                {/* Mobile Quick Action Button */}
                <button style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: "0.7rem",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
                }}>
                  <FaQrcode /> Scan QR Attendance
                </button>

              </div>

              {/* Mobile Bottom Tab Bar */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                padding: "8px 0 10px",
                background: "#ffffff",
                borderTop: "1px solid #f1f5f9",
                textAlign: "center"
              }}>
                <div style={{ color: "#2563eb", fontSize: "0.6rem", fontWeight: "800", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <FaThLarge style={{ fontSize: "11px" }} /> Home
                </div>
                <div style={{ color: "#94a3b8", fontSize: "0.6rem", fontWeight: "600", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <FaChair style={{ fontSize: "11px" }} /> Seats
                </div>
                <div style={{ color: "#94a3b8", fontSize: "0.6rem", fontWeight: "600", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <FaQrcode style={{ fontSize: "11px" }} /> Scan
                </div>
                <div style={{ color: "#94a3b8", fontSize: "0.6rem", fontWeight: "600", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <FaUsers style={{ fontSize: "11px" }} /> Students
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

