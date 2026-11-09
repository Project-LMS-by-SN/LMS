import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTh,
  FaUserPlus,
  FaQrcode,
  FaCashRegister,
  FaBell,
  FaChartLine,
  FaShieldAlt,
  FaWhatsapp,
  FaCheckCircle,
  FaPrint,
  FaArrowRight,
  FaLock,
  FaPhoneAlt,
  FaExchangeAlt,
  FaDownload,
  FaClock,
  FaUserCheck,
  FaCheck,
  FaBolt
} from "react-icons/fa";

export default function FeatureWorkflowGuide() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "seats",
      stepNumber: "Step 01",
      icon: <FaTh />,
      title: "Multi-Shift Seat Matrix",
      shortTitle: "Seat Allocation Matrix",
      subtitle: "Never Double-Book a Seat Again",
      accentColor: "#2563eb",
      accentBg: "#eff6ff",
      badgeColor: "#1d4ed8",
      explanation: {
        intro: "The biggest challenge in study library management is preventing double-booking and managing multi-shift schedules without confusion.",
        howItWorks: [
          "Interactive Visual Layout: All study desks across Hall A, B, and C appear in a real-time floor plan.",
          "Shift Isolation: Morning (06 AM - 12 PM), Afternoon (12 PM - 05 PM), Evening (05 PM - 10 PM), Night, and 24-Hour plans operate independently.",
          "Color-Coded Status: 🟢 Green = Available, 🔴 Red = Booked, 🟡 Yellow = Expiring Soon, 🔵 Blue = Selected Desk.",
          "1-Click Seat Swap: Transfer any student to a new seat in under 2 seconds without corrupting allocation history."
        ],
        userValue: "Eliminate messy paper register scratch-outs. Instantly see live seat availability at a single glance."
      },
      mockup: {
        url: "lms.softwarenative.in/seats",
        status: "Live Seat Matrix",
        content: (
          <div style={{ padding: "18px", background: "#f8fafc", minHeight: "340px", fontSize: "0.85rem" }}>
            {/* Shift Bar */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" }}>
              <span style={{ fontWeight: "700", color: "#334155", fontSize: "0.8rem" }}>Select Shift:</span>
              <span style={{ background: "#2563eb", color: "#ffffff", padding: "4px 12px", borderRadius: "20px", fontWeight: "700", fontSize: "0.78rem" }}>
                🌅 Morning (06:00 AM - 12:00 PM)
              </span>
              <span style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", padding: "4px 12px", borderRadius: "20px", fontWeight: "600", fontSize: "0.78rem" }}>
                ☀️ Afternoon
              </span>
              <span style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", padding: "4px 12px", borderRadius: "20px", fontWeight: "600", fontSize: "0.78rem" }}>
                🌆 Evening
              </span>
              <span style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", padding: "4px 12px", borderRadius: "20px", fontWeight: "600", fontSize: "0.78rem" }}>
                🌙 24-Hour
              </span>
            </div>

            {/* Metrics & Legend */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", background: "#ffffff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "center", fontSize: "0.76rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#10b981" }}></span> 🟢 Available: <strong>26</strong>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#ef4444" }}></span> 🔴 Booked: <strong>68</strong>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#f59e0b" }}></span> 🟡 Expiring: <strong>6</strong>
                </span>
              </div>
              <div style={{ fontSize: "0.76rem", color: "#0284c7", fontWeight: "700" }}>
                Occupancy: 74% (100 Desks)
              </div>
            </div>

            {/* Seat Grid Simulation */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(10, 1fr)",
              gap: "6px",
              background: "#ffffff",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              marginBottom: "14px"
            }}>
              {[
                { no: "A01", s: "b" }, { no: "A02", s: "b" }, { no: "A03", s: "a" }, { no: "A04", s: "b" }, { no: "A05", s: "sel" },
                { no: "A06", s: "b" }, { no: "A07", s: "a" }, { no: "A08", s: "due" }, { no: "A09", s: "b" }, { no: "A10", s: "a" },
                { no: "B01", s: "b" }, { no: "B02", s: "a" }, { no: "B03", s: "b" }, { no: "B04", s: "b" }, { no: "B05", s: "b" },
                { no: "B06", s: "a" }, { no: "B07", s: "b" }, { no: "B08", s: "a" }, { no: "B09", s: "due" }, { no: "B10", s: "b" }
              ].map((seat) => (
                <div
                  key={seat.no}
                  style={{
                    padding: "7px 2px",
                    textAlign: "center",
                    borderRadius: "6px",
                    fontWeight: "800",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                    background:
                      seat.s === "sel"
                        ? "#0284c7"
                        : seat.s === "b"
                        ? "#fee2e2"
                        : seat.s === "due"
                        ? "#fef3c7"
                        : "#dcfce7",
                    color:
                      seat.s === "sel"
                        ? "#ffffff"
                        : seat.s === "b"
                        ? "#991b1b"
                        : seat.s === "due"
                        ? "#92400e"
                        : "#166534",
                    border:
                      seat.s === "sel"
                        ? "2px solid #0369a1"
                        : seat.s === "b"
                        ? "1px solid #fca5a5"
                        : seat.s === "due"
                        ? "1px solid #fcd34d"
                        : "1px solid #86efac",
                    boxShadow: seat.s === "sel" ? "0 0 10px rgba(2, 132, 199, 0.5)" : "none"
                  }}
                >
                  {seat.no}
                </div>
              ))}
            </div>

            {/* Selected Seat Inspector Card */}
            <div style={{
              background: "#ffffff",
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1.5px solid #0284c7",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px"
            }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700" }}>SELECTED SEAT DETAILS</span>
                <div style={{ fontSize: "0.95rem", fontWeight: "900", color: "#0f172a" }}>
                  Desk A-05 • Rahul Sharma (ID: LMS-104)
                </div>
                <div style={{ fontSize: "0.76rem", color: "#475569" }}>
                  Shift: 06:00 AM - 12:00 PM • Valid till: 28 Nov 2026 • Status: <strong style={{ color: "#16a34a" }}>Active</strong>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ background: "#f1f5f9", color: "#334155", padding: "6px 12px", borderRadius: "6px", fontSize: "0.76rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <FaExchangeAlt /> 1-Click Swap
                </span>
                <span style={{ background: "#0284c7", color: "#ffffff", padding: "6px 12px", borderRadius: "6px", fontSize: "0.76rem", fontWeight: "700" }}>
                  View Profile
                </span>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      id: "admission",
      stepNumber: "Step 02",
      icon: <FaUserPlus />,
      title: "Fast Admission & Digital Student ID Card",
      shortTitle: "Admission & Student ID",
      subtitle: "30-Second Paperless Enrollment",
      accentColor: "#10b981",
      accentBg: "#ecfdf5",
      badgeColor: "#059669",
      explanation: {
        intro: "Student registration is now 10x faster than writing manual entries into paper registers.",
        howItWorks: [
          "Quick Enrollment Form: Enter student name, WhatsApp number, photo, preferred shift, and hall in 30 seconds.",
          "Automatic Seat Mapping: Directly assign any vacant desk from the live floor plan to the newly enrolled student.",
          "Digital Student ID Pass: Automatically generates an official ID card complete with student photo, roll number, seat number, shift timing, and personal QR code.",
          "Instant WhatsApp Delivery: Dispatch the digital student pass directly to the student's WhatsApp number with one click.",
          "Counter QR Self-Admission: Walk-in students can scan your desk QR to self-register, allowing counter staff to verify and approve instantly."
        ],
        userValue: "Zero risk of losing student admission records and 100% paperless student onboarding."
      },
      mockup: {
        url: "lms.softwarenative.in/admission",
        status: "Auto-Generated ID Pass",
        content: (
          <div style={{ padding: "18px", background: "#f8fafc", minHeight: "340px", fontSize: "0.85rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {/* Form Input Preview */}
              <div style={{ background: "#ffffff", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaUserPlus style={{ color: "#10b981" }} /> Student Enrollment Form
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.76rem" }}>
                  <div>
                    <label style={{ color: "#64748b", fontWeight: "600", display: "block", marginBottom: "2px" }}>Full Name</label>
                    <div style={{ background: "#f8fafc", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700", color: "#0f172a" }}>
                      Priya Verma
                    </div>
                  </div>
                  <div>
                    <label style={{ color: "#64748b", fontWeight: "600", display: "block", marginBottom: "2px" }}>WhatsApp Number</label>
                    <div style={{ background: "#f8fafc", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "600", color: "#0f172a" }}>
                      +91 98765 43210
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <label style={{ color: "#64748b", fontWeight: "600", display: "block", marginBottom: "2px" }}>Shift</label>
                      <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700", color: "#2563eb" }}>
                        Morning
                      </div>
                    </div>
                    <div>
                      <label style={{ color: "#64748b", fontWeight: "600", display: "block", marginBottom: "2px" }}>Seat No.</label>
                      <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "800", color: "#059669" }}>
                        Desk B-04
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ color: "#64748b", fontWeight: "600", display: "block", marginBottom: "2px" }}>Subscription Plan</label>
                    <div style={{ background: "#ecfdf5", padding: "6px 10px", borderRadius: "6px", border: "1px solid #a7f3d0", fontWeight: "700", color: "#065f46" }}>
                      3 Months Pass (₹3,200) • Paid
                    </div>
                  </div>
                </div>
              </div>

              {/* Generated Digital Student Pass Card */}
              <div style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                padding: "16px",
                borderRadius: "14px",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.2)",
                border: "1px solid #334155",
                position: "relative"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "8px", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: "900", letterSpacing: "0.03em" }}>APEX STUDY HALL</div>
                    <div style={{ fontSize: "0.62rem", color: "#94a3b8" }}>Digital Student Identity Pass</div>
                  </div>
                  <span style={{ background: "#10b981", color: "#ffffff", fontSize: "0.62rem", padding: "2px 8px", borderRadius: "10px", fontWeight: "800" }}>
                    ACTIVE PASS
                  </span>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    background: "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    border: "2px solid #38bdf8"
                  }}>
                    👩‍🎓
                  </div>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "900", color: "#ffffff" }}>Priya Verma</div>
                    <div style={{ fontSize: "0.72rem", color: "#38bdf8", fontWeight: "700" }}>Roll: LMS-2026-089</div>
                    <div style={{ fontSize: "0.7rem", color: "#cbd5e1" }}>Morning Shift (06:00 AM - 12:00 PM)</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#090d16", padding: "10px", borderRadius: "10px", border: "1px solid #1e293b" }}>
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>ASSIGNED SEAT</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#f97316" }}>B-04</div>
                  </div>
                  {/* Mock QR Code visual */}
                  <div style={{ background: "#ffffff", padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FaQrcode style={{ fontSize: "36px", color: "#0f172a" }} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button style={{ flex: 1, background: "#f97316", color: "#ffffff", border: "none", padding: "6px 0", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <FaPrint /> Print ID
                  </button>
                  <button style={{ flex: 1, background: "#22c55e", color: "#ffffff", border: "none", padding: "6px 0", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <FaWhatsapp /> Send Pass
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      id: "kiosk",
      stepNumber: "Step 03",
      icon: <FaQrcode />,
      title: "Gate Public QR Attendance Kiosk",
      shortTitle: "QR Gate Kiosk",
      subtitle: "1-Second Student Entry & Live Headcount",
      accentColor: "#0284c7",
      accentBg: "#f0f9ff",
      badgeColor: "#0369a1",
      explanation: {
        intro: "Say goodbye to long gate queues, manual paper logbooks, and fake proxy attendance forever.",
        howItWorks: [
          "Mount on Any Tablet: Mount any budget Android tablet or mobile at your library entrance running `/public-attendance`.",
          "Sub-Second QR Scanning: Students flash their physical or digital ID QR code to mark check-in or check-out in under 0.4 seconds.",
          "Instant Visual & Sound Feedback: System beeps and displays a clear welcome badge showing student name, assigned seat, and entry timestamp.",
          "Encrypted Anti-Proxy Verification: Every student QR code is cryptographically validated against active subscription dates and shifts.",
          "Live In-Hall Headcount: Library owners view the exact number of students currently studying inside directly on their mobile dashboard."
        ],
        userValue: "Zero staff needed at the entrance to manage attendance. Completely automated, dispute-proof security."
      },
      mockup: {
        url: "lms.softwarenative.in/public-attendance",
        status: "Kiosk Mode Active",
        content: (
          <div style={{ padding: "18px", background: "#0b1329", color: "#ffffff", minHeight: "340px", fontSize: "0.85rem", borderRadius: "0 0 10px 10px", textAlign: "center" }}>
            {/* Kiosk Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "10px", marginBottom: "16px" }}>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: "900", color: "#38bdf8" }}>APEX LIBRARY GATE KIOSK</span>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Standby Camera Scanner • Fast Mode</div>
              </div>
              <div style={{ background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10b981", color: "#6ee7b7", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span className="pulse-dot-green"></span>
                <span>Live Inside: 78 Students</span>
              </div>
            </div>

            {/* Simulated Camera Viewfinder with Scan Laser */}
            <div style={{
              width: "180px",
              height: "140px",
              margin: "0 auto 16px",
              border: "2px dashed #38bdf8",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              background: "rgba(56, 189, 248, 0.05)",
              boxShadow: "inset 0 0 20px rgba(56, 189, 248, 0.2)"
            }}>
              <div style={{ position: "absolute", top: "50%", left: "10%", right: "10%", height: "2px", background: "#10b981", boxShadow: "0 0 8px #10b981" }}></div>
              <FaQrcode style={{ fontSize: "48px", color: "rgba(255, 255, 255, 0.6)" }} />
              <span style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "6px" }}>Align QR Code Here</span>
            </div>

            {/* Real-time Entry Confirmation Card */}
            <div style={{
              background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
              border: "1.5px solid #34d399",
              padding: "12px 18px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: "420px",
              margin: "0 auto",
              textAlign: "left"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#ffffff", color: "#065f46", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                  <FaCheck />
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#a7f3d0", fontWeight: "700" }}>ACCESS GRANTED • CHECK-IN LOGGED</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "900", color: "#ffffff" }}>Aman Singh (Desk A-12)</div>
                  <div style={{ fontSize: "0.7rem", color: "#ecfdf5" }}>Morning Shift • 10:42 AM • Status: Valid</div>
                </div>
              </div>
              <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.25)", padding: "3px 8px", borderRadius: "6px", fontWeight: "800" }}>
                0.4s Scan
              </span>
            </div>
          </div>
        )
      }
    },
    {
      id: "fee-desk",
      stepNumber: "Step 04",
      icon: <FaCashRegister />,
      title: "Cashier Fee Counter & 1-Click WhatsApp Invoice",
      shortTitle: "Fee Desk & WhatsApp Invoice",
      subtitle: "Instant Receipts & Transparent Billing",
      accentColor: "#ea580c",
      accentBg: "#fff7ed",
      badgeColor: "#c2410c",
      explanation: {
        intro: "Counter fee collection and official billing receipts are now fast, accurate, and dispute-free.",
        howItWorks: [
          "Quick Student Search: Search by student name or seat number to view due balances and plan renewals instantly.",
          "Flexible Payment Modes: Accept counter Cash or generate dynamic UPI QR codes for instant online collection.",
          "Official PDF Tax Receipts: Automatically generates GST-compliant invoices with library branding, invoice number, and verification QR.",
          "1-Click Direct WhatsApp Invoice: Click 'Send WhatsApp' to dispatch the complete PDF invoice and receipt directly to the student's WhatsApp.",
          "Audit-Proof Financial Logging: Every transaction records cashier identity, timestamp, and payment method for complete transparency."
        ],
        userValue: "Students receive instant digital payment receipts, and reception staff save hours of manual bill writing."
      },
      mockup: {
        url: "lms.softwarenative.in/collect-fee",
        status: "Invoice & WhatsApp Ready",
        content: (
          <div style={{ padding: "18px", background: "#f8fafc", minHeight: "340px", fontSize: "0.85rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {/* Fee Counter Terminal */}
              <div style={{ background: "#ffffff", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#0f172a" }}>Billing Summary</span>
                  <span style={{ background: "#dcfce7", color: "#166534", fontSize: "0.7rem", fontWeight: "800", padding: "2px 8px", borderRadius: "4px" }}>
                    PAID IN FULL
                  </span>
                </div>
                <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", marginBottom: "10px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0f172a" }}>Rahul Sharma (Desk A-05)</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Morning Shift (06 AM - 12 PM) • 1 Month Renewal</div>
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "8px", fontSize: "0.76rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                    <span>Plan Base Fee</span>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>₹1,200</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                    <span>Locker / Special Add-on</span>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>₹0</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", fontWeight: "900", color: "#059669", borderTop: "1px dashed #cbd5e1", paddingTop: "6px" }}>
                    <span>Total Received (UPI)</span>
                    <span>₹1,200</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                  <button style={{ flex: 1, background: "#0284c7", color: "#ffffff", border: "none", padding: "7px 0", borderRadius: "6px", fontSize: "0.74rem", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                    <FaDownload /> Download PDF
                  </button>
                  <button style={{ flex: 1, background: "#22c55e", color: "#ffffff", border: "none", padding: "7px 0", borderRadius: "6px", fontSize: "0.74rem", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                    <FaWhatsapp /> Send on WhatsApp
                  </button>
                </div>
              </div>

              {/* Simulated WhatsApp Notification Receipt Screen */}
              <div style={{ background: "#e5ddd5", padding: "14px", borderRadius: "12px", border: "1px solid #d1d5db" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", background: "#075e54", color: "#ffffff", padding: "6px 10px", borderRadius: "6px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>
                    💬
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: "800" }}>Apex Study Library Desk</div>
                    <div style={{ fontSize: "0.62rem", color: "#a7f3d0" }}>Online WhatsApp Dispatcher</div>
                  </div>
                </div>

                <div style={{ background: "#ffffff", padding: "10px", borderRadius: "8px", fontSize: "0.72rem", color: "#1f2937", lineHeight: 1.5, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontWeight: "800", color: "#065f46", marginBottom: "4px" }}>
                    ✅ Payment Received: ₹1,200
                  </div>
                  <div>Dear <strong>Rahul Sharma</strong>,</div>
                  <div style={{ marginTop: "4px" }}>
                    Your subscription for <strong>Seat A-05 (Morning Shift)</strong> has been successfully renewed till <strong>28 Dec 2026</strong>.
                  </div>
                  <div style={{ marginTop: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "6px 8px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "16px" }}>📄</span>
                    <div>
                      <div style={{ fontWeight: "700", color: "#065f46" }}>Invoice_INV-2026-104.pdf</div>
                      <div style={{ fontSize: "0.62rem", color: "#64748b" }}>124 KB • Official Tax Receipt</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", color: "#9ca3af", fontSize: "0.6rem", marginTop: "4px" }}>
                    10:48 AM • Delivered ✓✓
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      id: "due-alerts",
      stepNumber: "Step 05",
      icon: <FaBell />,
      title: "Automated Expiry Alerts & Zero Fee Leakage",
      shortTitle: "Due Reminders & Renewal",
      subtitle: "100% On-Time Fee Collections",
      accentColor: "#f59e0b",
      accentBg: "#fffbeb",
      badgeColor: "#d97706",
      explanation: {
        intro: "Prevent revenue loss caused by students studying past their paid subscription dates unnoticed.",
        howItWorks: [
          "Automated Expiry Radar: LMS flags upcoming expirations with visual amber indicators 3 days prior to plan lapse.",
          "Polite WhatsApp Due Reminders: Automatically dispatch friendly renewal reminder messages with payment links directly to student WhatsApp.",
          "Overdue Seat Protection: Lapsed subscriptions trigger counter alerts so staff can collect dues or reassign the desk.",
          "1-Click Plan Renewal: Easily renew student plans with a single click, instantly updating validity without duplicate records."
        ],
        userValue: "Recovers 15% to 25% of uncollected fees, directly increasing monthly net revenue."
      },
      mockup: {
        url: "lms.softwarenative.in/student-validities",
        status: "Smart Expiry Radar",
        content: (
          <div style={{ padding: "18px", background: "#f8fafc", minHeight: "340px", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <span style={{ fontSize: "0.88rem", fontWeight: "900", color: "#0f172a" }}>Upcoming Seat Expiries</span>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Automated 3-Day Early Warning List</div>
              </div>
              <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "800" }}>
                ⚠️ 8 Memberships Expiring This Week
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { name: "Vikas Patel", seat: "C-02", shift: "Morning", due: "Expires Tomorrow", color: "#d97706", bg: "#fffbeb", border: "#fcd34d", act: "Send WhatsApp Alert" },
                { name: "Neha Gupta", seat: "A-09", shift: "Evening", due: "Expired 1 Day Ago", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", act: "Collect Dues (₹1,000)" },
                { name: "Rohit Kumar", seat: "B-07", shift: "24-Hours", due: "Expires in 3 Days", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", act: "Send Reminder" }
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: item.bg,
                    border: `1px solid ${item.border}`,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.86rem", fontWeight: "800", color: "#0f172a" }}>
                      {item.name} • <span style={{ color: item.color }}>Desk {item.seat}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      {item.shift} Shift • <strong style={{ color: item.color }}>{item.due}</strong>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button style={{
                      background: item.color === "#dc2626" ? "#dc2626" : "#22c55e",
                      color: "#ffffff",
                      border: "none",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}>
                      <FaWhatsapp /> {item.act}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "14px", background: "#ffffff", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.74rem", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>💬</span>
              <span>
                <strong>Sample Auto WhatsApp Text:</strong> "Dear Vikas, your library seat C-02 validity ends tomorrow. Kindly renew at counter or pay online to keep your desk reserved."
              </span>
            </div>
          </div>
        )
      }
    },
    {
      id: "expenses",
      stepNumber: "Step 06",
      icon: <FaChartLine />,
      title: "Daily Expenses, Cash Closing & Net Profit Reports",
      shortTitle: "Expenses & Profit Reports",
      subtitle: "Know Your Real In-Hand Profit Every Month",
      accentColor: "#9333ea",
      accentBg: "#faf5ff",
      badgeColor: "#7e22ce",
      explanation: {
        intro: "Running a profitable study hall requires tracking daily operational costs alongside counter fee collections.",
        howItWorks: [
          "10-Second Expense Entry: Log commercial electricity bills, AC repairs, Wi-Fi fiber recharges, cleaning staff, and RO drinking water in seconds.",
          "Daily Cash Drawer Closing: Reconcile physical counter cash with digital UPI collections in under 1 minute every evening.",
          "Net Profit Analytics: Automatically deducts operating expenses from gross fee revenue to display your exact in-hand net profit.",
          "One-Click Tax & Audit Export: Export comprehensive Excel and PDF statements ready for chartered accountants and tax filing."
        ],
        userValue: "Eliminates counter cash shrinkage and takes the stress out of month-end financial accounting."
      },
      mockup: {
        url: "lms.softwarenative.in/expenses",
        status: "Financial Analytics Engine",
        content: (
          <div style={{ padding: "18px", background: "#f8fafc", minHeight: "340px", fontSize: "0.85rem" }}>
            {/* Top Revenue Tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "14px" }}>
              <div style={{ background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "700" }}>TOTAL FEE REVENUE</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#059669" }}>₹68,400</div>
                <div style={{ fontSize: "0.62rem", color: "#10b981" }}>↑ 18% vs last month</div>
              </div>
              <div style={{ background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "700" }}>TOTAL EXPENSES</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#dc2626" }}>₹14,200</div>
                <div style={{ fontSize: "0.62rem", color: "#64748b" }}>Electricity, Wi-Fi, Water</div>
              </div>
              <div style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", color: "#ffffff", padding: "10px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.68rem", color: "#bae6fd", fontWeight: "700" }}>NET IN-HAND PROFIT</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "900" }}>₹54,200</div>
                <div style={{ fontSize: "0.62rem", color: "#e0f2fe" }}>Pure Library Profit 🚀</div>
              </div>
            </div>

            {/* Expense Breakdown List */}
            <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
                <span>Recent Operational Expenses</span>
                <span style={{ color: "#0284c7", cursor: "pointer" }}>+ Add Expense</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.72rem" }}>
                {[
                  { tag: "⚡ Electricity", title: "Commercial Power Bill (Hall A & B ACs)", amt: "₹7,800", date: "02 Nov", mode: "Online Bank" },
                  { tag: "🌐 Internet", title: "Airtel Xstream 300 Mbps Dual Fiber", amt: "₹1,499", date: "03 Nov", mode: "UPI" },
                  { tag: "❄️ Maintenance", title: "Split AC Chemical Cleaning & Gas Topup", amt: "₹2,500", date: "04 Nov", mode: "Cash" },
                  { tag: "💧 Supplies", title: "20L RO Mineral Water Cans (25 Cans)", amt: "₹1,250", date: "05 Nov", mode: "Cash" }
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "#f8fafc", borderRadius: "6px" }}>
                    <div>
                      <span style={{ fontWeight: "800", color: "#0f172a" }}>{row.tag}:</span> {row.title}
                      <span style={{ color: "#94a3b8", marginLeft: "6px" }}>({row.date})</span>
                    </div>
                    <div style={{ fontWeight: "900", color: "#dc2626" }}>
                      {row.amt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
    }
  ];

  const currentStep = steps[activeStep];

  return (
    <section style={{ padding: "60px 0 80px", background: "#ffffff" }}>
      <div className="container" style={{ maxWidth: "1150px" }}>
        
        {/* Section Header */}
        <div style={{ textAlign: "center", maxWidth: "860px", margin: "0 auto 40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#eff6ff",
              color: "#0284c7",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "800",
              marginBottom: "14px",
              border: "1px solid #bfdbfe"
            }}
          >
            <FaBolt style={{ color: "#f97316" }} /> 100% Practical Workflow Guide
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 3.8vw, 3.2rem)", fontWeight: "900", color: "#0f172a", lineHeight: 1.15, marginBottom: "16px" }}>
            See How LMS by Study Guru <span style={{ color: "#0284c7" }}>Automates Your Study Space</span>
          </h2>
          <p style={{ color: "#475569", fontSize: "1.08rem", lineHeight: 1.6 }}>
            Explore every core function of your study library—seat allocation, student admission, QR attendance kiosk, cashier billing desk, WhatsApp receipts, and financial profit analytics—with interactive live screen previews.
          </p>
        </div>

        {/* Workflow Steps Horizontal Tab Switcher */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "10px",
            marginBottom: "36px"
          }}
        >
          {steps.map((st, idx) => {
            const isSelected = activeStep === idx;
            return (
              <button
                key={st.id}
                onClick={() => setActiveStep(idx)}
                style={{
                  background: isSelected ? "#0284c7" : "#f8fafc",
                  color: isSelected ? "#ffffff" : "#475569",
                  border: isSelected ? "2px solid #0284c7" : "1px solid #e2e8f0",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "0 8px 20px rgba(2, 132, 199, 0.25)" : "none",
                  transform: isSelected ? "translateY(-2px)" : "none"
                }}
              >
                <div style={{ fontSize: "0.7rem", fontWeight: "800", color: isSelected ? "#fed7aa" : "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>
                  {st.stepNumber}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "800", fontSize: "0.85rem", lineHeight: 1.25 }}>
                  <span style={{ fontSize: "14px", color: isSelected ? "#ffffff" : st.accentColor }}>{st.icon}</span>
                  <span>{st.shortTitle}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ACTIVE STEP FEATURE SHOWCASE CARD (SCREEN IMAGE MOCKUP + DETAILED EXPLANATION) */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
            marginBottom: "60px"
          }}
        >
          {/* Card Top Title Bar */}
          <div
            style={{
              padding: "20px 28px",
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: currentStep.accentColor,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem"
                }}
              >
                {currentStep.icon}
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.15)", color: "#fed7aa", padding: "2px 8px", borderRadius: "10px", fontWeight: "800" }}>
                  {currentStep.stepNumber} WORKFLOW
                </span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#ffffff", margin: "4px 0 0" }}>
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                disabled={activeStep === 0}
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                style={{
                  background: activeStep === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: activeStep === 0 ? "not-allowed" : "pointer",
                  fontSize: "0.8rem",
                  fontWeight: "700"
                }}
              >
                &larr; Prev Step
              </button>
              <button
                disabled={activeStep === steps.length - 1}
                onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
                style={{
                  background: activeStep === steps.length - 1 ? "rgba(255,255,255,0.1)" : "#f97316",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: activeStep === steps.length - 1 ? "not-allowed" : "pointer",
                  fontSize: "0.8rem",
                  fontWeight: "800"
                }}
              >
                Next Step &rarr;
              </button>
            </div>
          </div>

          {/* Card Body: Left = Simple Explanation, Right = High-Fidelity Screen Mockup */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "28px",
              padding: "32px 28px"
            }}
          >
            {/* Left Column: Plain-Language Function Guide */}
            <div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  color: currentStep.accentColor,
                  letterSpacing: "0.05em",
                  marginBottom: "8px"
                }}
              >
                {currentStep.subtitle}
              </div>

              <p style={{ color: "#334155", fontSize: "1rem", lineHeight: 1.65, marginBottom: "20px", fontWeight: "600" }}>
                {currentStep.explanation.intro}
              </p>

              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "0.92rem", fontWeight: "900", color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  How This Module Works:
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {currentStep.explanation.howItWorks.map((point, pIdx) => {
                    const [head, ...rest] = point.split(":");
                    return (
                      <div key={pIdx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.9rem", lineHeight: 1.55 }}>
                        <span style={{ color: "#10b981", marginTop: "3px", flexShrink: 0 }}>
                          <FaCheckCircle />
                        </span>
                        <div>
                          <strong style={{ color: "#0f172a" }}>{head}:</strong> {rest.join(":")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* User Value / Outcome Box */}
              <div
                style={{
                  background: "#f0f9ff",
                  borderLeft: `4px solid ${currentStep.accentColor}`,
                  padding: "14px 18px",
                  borderRadius: "0 10px 10px 0",
                  fontSize: "0.88rem",
                  color: "#0369a1",
                  fontWeight: "700"
                }}
              >
                💡 <strong>Library Owner Benefit:</strong> {currentStep.explanation.userValue}
              </div>

              <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link to="/register" className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.88rem" }}>
                  <FaUserPlus /> Register Your Library Free
                </Link>
                <Link to="/pricing" className="btn-secondary" style={{ padding: "10px 18px", fontSize: "0.88rem" }}>
                  View Pricing Plans
                </Link>
              </div>
            </div>

            {/* Right Column: Screen Image Mockup (Browser Window) */}
            <div>
              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid #cbd5e1",
                  overflow: "hidden",
                  boxShadow: "0 14px 35px rgba(15, 23, 42, 0.12)",
                  background: "#ffffff"
                }}
              >
                {/* Browser Address Bar */}
                <div
                  style={{
                    background: "#f1f5f9",
                    borderBottom: "1px solid #e2e8f0",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px"
                  }}
                >
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }}></span>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "20px",
                      padding: "4px 14px",
                      fontSize: "0.75rem",
                      color: "#334155",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flex: 1,
                      maxWidth: "280px",
                      justifyContent: "center"
                    }}
                  >
                    <FaLock style={{ color: "#10b981", fontSize: "10px" }} />
                    <span>{currentStep.mockup.url}</span>
                  </div>

                  <div style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: "800", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span className="pulse-dot-green"></span>
                    <span>{currentStep.mockup.status}</span>
                  </div>
                </div>

                {/* Rendered Live Screen Mockup Body */}
                {currentStep.mockup.content}
              </div>

              <div style={{ textAlign: "center", marginTop: "10px", fontSize: "0.74rem", color: "#94a3b8" }}>
                🔒 Zero sensitive information • Screen mock showing verified user functions
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COMPLETE SYSTEM COMPARISON TABLE: PAPER REGISTERS VS LMS BY STUDY GURU
            ========================================================================= */}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            padding: "36px 28px",
            marginBottom: "50px"
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 32px" }}>
            <span style={{ fontSize: "0.8rem", color: "#f97316", fontWeight: "800", textTransform: "uppercase" }}>
              Direct Comparison
            </span>
            <h3 style={{ fontSize: "1.8rem", fontWeight: "900", color: "#0f172a", marginTop: "4px" }}>
              Paper Register vs LMS by Study Guru
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
              Why modern study libraries replace paper registers with LMS by Study Guru
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#ffffff", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ padding: "14px 16px", color: "#0f172a", fontWeight: "900" }}>Library Operations</th>
                  <th style={{ padding: "14px 16px", color: "#dc2626", fontWeight: "900", background: "#fef2f2" }}>❌ Traditional Paper Register</th>
                  <th style={{ padding: "14px 16px", color: "#059669", fontWeight: "900", background: "#ecfdf5" }}>✅ LMS by Study Guru</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { op: "Seat Allocation & Shifts", old: "Double booking disputes; same desk assigned to multiple students.", lms: "Visual seat matrix; Morning, Afternoon, Evening, and Night managed separately." },
                  { op: "Student Admissions", old: "5-minute manual paper forms; risk of lost or damaged paper registers.", lms: "30-second digital admission + instant auto-generated QR Student ID Card." },
                  { op: "Gate Attendance", old: "Long queues for register signatures; high risk of fake proxy attendance.", lms: "Tablet QR Kiosk; students scan in under 0.4 seconds to log verified entry." },
                  { op: "Monthly Fee Collection", old: "Manual paper receipt books; difficult to track cash collections.", lms: "Instant Cash/UPI billing + 1-click official PDF invoice sent on WhatsApp." },
                  { op: "Due Reminders & Renewals", old: "Manually flipping through registers to check unpaid student validities.", lms: "Automated polite WhatsApp renewal reminders sent 3 days before expiry." },
                  { op: "Daily Cash & Profit Tracking", old: "Cash leakage risks; stressful month-end calculations and disputes.", lms: "Automated daily counter cash closing + real-time net profit analytics." }
                ].map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: "1px solid #e2e8f0", background: rIdx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                    <td style={{ padding: "14px 16px", fontWeight: "800", color: "#0f172a" }}>{row.op}</td>
                    <td style={{ padding: "14px 16px", color: "#b91c1c", background: "rgba(254, 242, 242, 0.5)" }}>{row.old}</td>
                    <td style={{ padding: "14px 16px", color: "#047857", fontWeight: "600", background: "rgba(236, 253, 245, 0.5)" }}>{row.lms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Help & Free Registration Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "#ffffff",
            padding: "36px",
            borderRadius: "18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
            boxShadow: "0 12px 30px rgba(2, 132, 199, 0.25)"
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.6rem", fontWeight: "900", color: "#ffffff", marginBottom: "6px" }}>
              Modernize Your Study Library Today
            </h3>
            <p style={{ color: "#e0f2fe", fontSize: "0.95rem", margin: 0, maxWidth: "620px" }}>
              First Three Months Pro Subscription Free * • Instant verification • Fast 15-minute onboarding setup.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              to="/register"
              style={{
                background: "#f97316",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "10px",
                fontWeight: "900",
                fontSize: "0.95rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)"
              }}
            >
              <FaUserPlus /> Register Your Library
            </Link>
            <a
              href="https://wa.me/919142025447?text=Hi%20Software%20Native,%20I%20want%20to%20see%20features%20demo%20of%20LMS%20Cloud."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#ffffff",
                color: "#0369a1",
                padding: "12px 22px",
                borderRadius: "10px",
                fontWeight: "800",
                fontSize: "0.95rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaWhatsapp style={{ color: "#22c55e", fontSize: "18px" }} /> WhatsApp Helpline
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

