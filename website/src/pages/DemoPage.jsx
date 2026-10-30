import { useState } from "react";
import { FaCalendarCheck, FaCheckCircle, FaWhatsapp, FaPhoneAlt, FaBuilding, FaUser, FaClock, FaShieldAlt } from "react-icons/fa";

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    libraryName: "",
    phone: "",
    city: "",
    seats: "100",
    shifts: "Multi-Shift (Morning/Evening/Night)",
    preferredTime: "Morning (10:00 AM - 01:00 PM)"
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.libraryName) {
      alert("Please fill in your name, library name, and contact number.");
      return;
    }
    setSubmitted(true);
  };

  const openWhatsAppConfirmation = () => {
    const text = encodeURIComponent(
      `Hello Software Native Support! I have requested a 1-on-1 live walkthrough for LMS:\n\n*Name:* ${formData.name}\n*Library:* ${formData.libraryName}\n*Phone:* ${formData.phone}\n*City:* ${formData.city || "Not provided"}\n*Seats:* ${formData.seats}\n*Shift Model:* ${formData.shifts}\n*Preferred Slot:* ${formData.preferredTime}\n\nPlease confirm our live onboarding session!`
    );
    window.open(`https://wa.me/919142025447?text=${text}`, "_blank");
  };

  return (
    <div style={{ paddingBottom: "80px" }}>
      {/* Page Header */}
      <section style={{
        padding: "70px 0 40px",
        textAlign: "center",
        background: "radial-gradient(circle at 50% 0%, #eff6ff 0%, #ffffff 80%)",
        borderBottom: "1px solid var(--border-subtle)"
      }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div className="badge-green" style={{ marginBottom: "16px" }}>
            <span className="pulse-dot-green"></span>
            <span>100% Free 15-Minute Personalized Walkthrough</span>
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", lineHeight: 1.15, marginBottom: "16px" }}>
            Book Your Free <span className="gradient-blue">Live Onboarding Demo</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6 }}>
            See how LMS works live on your actual branch seat count. Our senior library software engineers will walk you through setting up shifts, QR kiosks, and cashier fee desks.
          </p>
        </div>
      </section>

      {/* Booking Layout */}
      <section className="section-padding">
        <div className="container" style={{ maxWidth: "1050px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "36px",
            alignItems: "start"
          }} className="demo-grid-layout">
            {/* Form Frame */}
            <div className="white-card" style={{ padding: "36px" }}>
              {!submitted ? (
                <div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "8px", color: "#0f172a" }}>
                    Schedule Your Demo Session
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "0.92rem", marginBottom: "28px" }}>
                    Takes less than 60 seconds to fill. We'll connect with you over WhatsApp or Direct Call.
                  </p>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", marginBottom: "6px" }}>
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Suresh Patel"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          border: "1px solid var(--border-medium)",
                          fontSize: "0.92rem",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", marginBottom: "6px" }}>
                          Library Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.libraryName}
                          onChange={(e) => setFormData({ ...formData, libraryName: e.target.value })}
                          placeholder="e.g. Apex Study Hall"
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            border: "1px solid var(--border-medium)",
                            fontSize: "0.92rem",
                            outline: "none"
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", marginBottom: "6px" }}>
                          WhatsApp Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="9876543210"
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            border: "1px solid var(--border-medium)",
                            fontSize: "0.92rem",
                            outline: "none"
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", marginBottom: "6px" }}>
                          City / State
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="e.g. Jaipur, Rajasthan"
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            border: "1px solid var(--border-medium)",
                            fontSize: "0.92rem",
                            outline: "none"
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", marginBottom: "6px" }}>
                          Number of Physical Seats
                        </label>
                        <select
                          value={formData.seats}
                          onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            border: "1px solid var(--border-medium)",
                            fontSize: "0.92rem",
                            outline: "none"
                          }}
                        >
                          <option value="30-70">30 - 70 Seats</option>
                          <option value="71-150">71 - 150 Seats</option>
                          <option value="151-300">151 - 300 Seats</option>
                          <option value="300+">300+ Seats (Multi-branch)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", marginBottom: "6px" }}>
                          Shift Model
                        </label>
                        <select
                          value={formData.shifts}
                          onChange={(e) => setFormData({ ...formData, shifts: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            border: "1px solid var(--border-medium)",
                            fontSize: "0.92rem",
                            outline: "none"
                          }}
                        >
                          <option value="Multi-Shift">Multi-Shift (Morning/Evening/Night)</option>
                          <option value="Full Day">Full Day Dedicated Seats</option>
                          <option value="24 Hours">24 Hours Continuous</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", marginBottom: "6px" }}>
                          Preferred Callback Slot
                        </label>
                        <select
                          value={formData.preferredTime}
                          onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            border: "1px solid var(--border-medium)",
                            fontSize: "0.92rem",
                            outline: "none"
                          }}
                        >
                          <option value="Morning">Morning (10:00 AM - 01:00 PM)</option>
                          <option value="Afternoon">Afternoon (01:00 PM - 05:00 PM)</option>
                          <option value="Evening">Evening (05:00 PM - 09:00 PM)</option>
                          <option value="Immediately">Immediate Callback</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ width: "100%", padding: "14px", fontSize: "1rem", marginTop: "6px" }}
                    >
                      <FaCalendarCheck /> Confirm Free Live Walkthrough
                    </button>

                    <div style={{ textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
                      🔒 Zero commitment • Free 7-day trial credentials provided during call
                    </div>
                  </form>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 10px" }}>
                  <div style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    color: "#10b981",
                    fontSize: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px"
                  }}>
                    <FaCheckCircle />
                  </div>
                  <h3 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "10px", color: "#0f172a" }}>
                    Demo Booked Successfully!
                  </h3>
                  <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "28px" }}>
                    Thank you, <strong>{formData.name}</strong>. Our senior engineer will connect with you on <strong>{formData.phone}</strong> for <strong>{formData.libraryName}</strong> during the selected slot.
                  </p>

                  <button
                    onClick={openWhatsAppConfirmation}
                    className="btn-whatsapp"
                    style={{ width: "100%", padding: "14px", marginBottom: "12px" }}
                  >
                    <FaWhatsapp style={{ fontSize: "20px" }} /> Open WhatsApp to Connect Now
                  </button>

                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn-secondary"
                    style={{ width: "100%" }}
                  >
                    Modify Booking Details
                  </button>
                </div>
              )}
            </div>

            {/* Right: What You'll Learn in Demo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="white-card" style={{ padding: "28px", borderTop: "4px solid #2563eb" }}>
                <h4 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1e3a8a", marginBottom: "16px" }}>
                  What You'll See in the 15-Min Demo
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem", color: "#334155" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <FaCheckCircle style={{ color: "#10b981", marginTop: "3px", flexShrink: 0 }} />
                    <span>How to set up your exact 10-column library hall layout in minutes</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <FaCheckCircle style={{ color: "#10b981", marginTop: "3px", flexShrink: 0 }} />
                    <span>How students scan QR codes at reception to self-register</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <FaCheckCircle style={{ color: "#10b981", marginTop: "3px", flexShrink: 0 }} />
                    <span>How the cashier desk prints QR fee receipts and updates validities</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <FaCheckCircle style={{ color: "#10b981", marginTop: "3px", flexShrink: 0 }} />
                    <span>Automated WhatsApp expiry notifications to recover overdue dues</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <FaCheckCircle style={{ color: "#10b981", marginTop: "3px", flexShrink: 0 }} />
                    <span>Single-device session security to prevent unauthorized staff logins</span>
                  </div>
                </div>
              </div>

              <div className="white-card" style={{ padding: "24px", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <FaPhoneAlt style={{ color: "#2563eb", fontSize: "20px" }} />
                  <div>
                    <h5 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#1e40af" }}>Need an Immediate Walkthrough?</h5>
                    <div style={{ fontSize: "0.82rem", color: "#475569" }}>Call our senior tech team directly:</div>
                  </div>
                </div>
                <a
                  href="tel:+919142025447"
                  style={{ fontSize: "1.2rem", fontWeight: "900", color: "#2563eb", display: "block", marginTop: "6px" }}
                >
                  +91 9142025447
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 850px) {
          .demo-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
