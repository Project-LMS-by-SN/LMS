import { Link } from "react-router-dom";
import { FaStar, FaBullseye, FaCheckCircle, FaTimes, FaShieldAlt, FaUsers, FaArrowRight, FaWhatsapp, FaCalendarCheck, FaHeart } from "react-icons/fa";

export default function AboutUs() {
  return (
    <div style={{ paddingBottom: "80px" }}>
      {/* Hero Banner (White with radial blue wash) */}
      <section style={{
        padding: "70px 0 50px",
        textAlign: "center",
        background: "radial-gradient(circle at 50% 0%, #eff6ff 0%, #ffffff 80%)",
        borderBottom: "1px solid var(--border-subtle)"
      }}>
        <div className="container" style={{ maxWidth: "880px" }}>
          <div className="badge-green" style={{ marginBottom: "18px" }}>
            <FaStar /> Our Journey & Mission
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", lineHeight: 1.15, marginBottom: "20px", color: "#0f172a" }}>
            Making Study Libraries <span className="gradient-blue">100% Digital Across India</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6, marginBottom: "36px" }}>
            LMS by Study Guru empowers 100+ private study spaces, self-study libraries, and reading halls 
            to replace paper chaos with seamless multi-shift automation, instant QR attendance, and automated fee collections.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
            <Link to="/demo" className="btn-primary">
              <FaCalendarCheck /> Book Free Onboarding Demo
            </Link>
            <a
              href="https://wa.me/919142025447?text=Hi%20Software%20Native%20team,%20I%20want%20to%20know%20more%20about%20your%20company%20and%20LMS."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              <FaWhatsapp /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar (White surface with colored numbers) */}
      <section style={{ padding: "36px 0", background: "#ffffff", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
            textAlign: "center"
          }}>
            <div>
              <div style={{ fontSize: "2.6rem", fontWeight: "900", color: "#2563eb" }}>100+</div>
              <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: "700", marginTop: "4px" }}>
                Active Study Libraries
              </div>
            </div>
            <div>
              <div style={{ fontSize: "2.6rem", fontWeight: "900", color: "#10b981" }}>5,000+</div>
              <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: "700", marginTop: "4px" }}>
                Students
              </div>
            </div>
            <div>
              <div style={{ fontSize: "2.6rem", fontWeight: "900", color: "#f59e0b" }}>28+ States</div>
              <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: "700", marginTop: "4px" }}>
                Pan-India Coverage
              </div>
            </div>
            <div>
              <div style={{ fontSize: "2.6rem", fontWeight: "900", color: "#ef4444" }}>99.9%</div>
              <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: "700", marginTop: "4px" }}>
                Cloud Uptime SLA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story & What We Do */}
      <section className="section-padding" style={{ background: "#f8fafc" }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: "48px",
            alignItems: "center"
          }} className="about-grid-story">
            <div>
              <div className="badge-blue" style={{ marginBottom: "14px" }}>
                <FaBullseye /> Why We Built LMS
              </div>
              <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", marginBottom: "18px", color: "#0f172a" }}>
                Built Specially for the Indian Self-Study Space Revolution
              </h2>
              <p style={{ color: "#475569", fontSize: "0.98rem", lineHeight: 1.7, marginBottom: "16px" }}>
                Over the last five years, thousands of private study libraries and reading halls have opened across Mukherjee Nagar, Gopalpura, Kota, Prayagraj, and Patna to serve millions of ambitious students preparing for civil services, medical, engineering, and competitive examinations.
              </p>
              <p style={{ color: "#475569", fontSize: "0.98rem", lineHeight: 1.7, marginBottom: "16px" }}>
                However, library owners were forced to manage complex operations with crude notebooks: overlapping morning and evening shift bookings, manual fee tracking, lost attendance records, and uncomfortable confrontations over unpaid fees.
              </p>
              <p style={{ color: "#475569", fontSize: "0.98rem", lineHeight: 1.7 }}>
                <strong>LMS by Study Guru</strong> was engineered from the ground up to solve these exact pains: an automated interactive seat engine, lightning-fast QR attendance, and automated WhatsApp payment reminders that protect your revenue.
              </p>
            </div>

            <div className="white-card" style={{ padding: "36px", borderTop: "4px solid #2563eb" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "20px", color: "#0f172a" }}>
                Our 4 Architectural Foundations
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ display: "flex", gap: "14px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.98rem", fontWeight: "800", color: "#1e3a8a", marginBottom: "4px" }}>Shift-First Seat Map</h4>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
                      Zero double-booking guarantee between Morning, Afternoon, Evening, and Night shifts.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "14px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.98rem", fontWeight: "800", color: "#065f46", marginBottom: "4px" }}>WhatsApp Native Integration</h4>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
                      Automated due date alerts, digital admission ID cards, and receipts sent straight to student WhatsApp.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "14px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fffbeb", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.98rem", fontWeight: "800", color: "#92400e", marginBottom: "4px" }}>Dual Attendance Kiosk</h4>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
                      Staff check-in desk plus standalone public tablet kiosk for sub-second student QR check-in.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "14px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", flexShrink: 0 }}>
                    4
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.98rem", fontWeight: "800", color: "#991b1b", marginBottom: "4px" }}>Single-Device Iron Security</h4>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
                      Hardware session locks and RBAC roles prevent unauthorized access or credential leak by desk staff.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Manual Register vs LMS Cloud */}
      <section className="section-padding" style={{ background: "#ffffff" }}>
        <div className="container" style={{ maxWidth: "1000px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", marginBottom: "12px", color: "#0f172a" }}>
              Traditional Physical Register vs. LMS by Study Guru
            </h2>
            <p style={{ color: "#475569", fontSize: "1rem" }}>
              See why hundreds of libraries make the switch every month
            </p>
          </div>

          <div className="white-card" style={{ padding: "0", overflow: "hidden", border: "1.5px solid var(--border-medium)" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              padding: "20px 24px",
              background: "#f1f5f9",
              fontWeight: "800",
              fontSize: "0.95rem",
              borderBottom: "1px solid var(--border-medium)"
            }}>
              <div style={{ color: "#0f172a" }}>Operational Challenge</div>
              <div style={{ color: "#dc2626" }}>Manual Registers</div>
              <div style={{ color: "#059669" }}>LMS by Study Guru</div>
            </div>

            {[
              {
                feature: "Multi-Shift Seat Allocation",
                manual: "High risk of double booking across shifts",
                lms: "Automated conflict-free seat matrix"
              },
              {
                feature: "Fee Expiry & Due Followups",
                manual: "Daily manual book checking; uncomfortable fights",
                lms: "Automated polite WhatsApp reminders 3 days ahead"
              },
              {
                feature: "Student Admission Onboarding",
                manual: "15 mins paper forms; lost photos & manual files",
                lms: "Self QR scan; instant digital ID card in 30s"
              },
              {
                feature: "Daily Attendance Logging",
                manual: "Long queue; fake proxy entries in notebook",
                lms: "Sub-second QR Kiosk with live head count"
              },
              {
                feature: "Cashier Desk & Financials",
                manual: "Cash discrepancy; lost paper receipt books",
                lms: "Cashier desk (/collect-fee) with QR GST invoices"
              },
              {
                feature: "Branch Management",
                manual: "Must physically visit branch to audit revenue",
                lms: "Multi-branch cloud console with real-time sync"
              }
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1fr",
                  padding: "18px 24px",
                  fontSize: "0.88rem",
                  borderBottom: i < 5 ? "1px solid var(--border-subtle)" : "none",
                  alignItems: "center",
                  background: i % 2 === 0 ? "#ffffff" : "#f8fafc"
                }}
              >
                <div style={{ fontWeight: "800", color: "#0f172a" }}>
                  {row.feature}
                </div>
                <div style={{ color: "#dc2626", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
                  <FaTimes style={{ color: "#ef4444", flexShrink: 0 }} />
                  <span>{row.manual}</span>
                </div>
                <div style={{ color: "#059669", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
                  <FaCheckCircle style={{ color: "#10b981", flexShrink: 0 }} />
                  <span>{row.lms}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="section-padding" style={{ background: "#f8fafc" }}>
        <div className="container" style={{ maxWidth: "850px", textAlign: "center" }}>
          <div className="white-card" style={{ padding: "48px 32px", borderTop: "4px solid #10b981" }}>
            <h2 style={{ fontSize: "2.2rem", fontWeight: "900", marginBottom: "16px", color: "#0f172a" }}>
              Ready to Upgrade Your Library?
            </h2>
            <p style={{ color: "#475569", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "32px" }}>
              Join 100+ study libraries across India. Get started with a personalized demo and setup walkthrough.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
              <Link to="/register" className="btn-primary" style={{ padding: "14px 28px" }}>
                Register Your Library
              </Link>
              <a
                href="https://wa.me/919142025447?text=Hi%20Software%20Native,%20I%20am%20ready%20to%20set%20up%20LMS%20in%20my%20library."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
                style={{ padding: "14px 28px" }}
              >
                <FaWhatsapp /> WhatsApp Us Directly
              </a>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 800px) {
          .about-grid-story {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
