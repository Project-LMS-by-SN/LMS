import { useState } from "react";
import { FaPhoneAlt, FaEnvelope, FaWhatsapp, FaMapMarkerAlt, FaClock, FaCheckCircle, FaUser, FaBuilding, FaPaperPlane } from "react-icons/fa";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    libraryName: "",
    phone: "",
    city: "",
    seats: "100",
    message: ""
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

  const openWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `Hello Software Native Support! I have an inquiry about LMS for my study library:\n\n*Name:* ${formData.name}\n*Library:* ${formData.libraryName}\n*Phone:* ${formData.phone}\n*City:* ${formData.city || "Not provided"}\n*Seats:* ${formData.seats}\n*Message:* ${formData.message || "I want to schedule an onboarding call"}`
    );
    window.open(`https://wa.me/919142025447?text=${text}`, "_blank");
  };

  return (
    <div style={{ paddingBottom: "80px" }}>
      {/* Contact Hero Banner (White with radial blue wash) */}
      <section style={{
        padding: "70px 0 40px",
        textAlign: "center",
        background: "radial-gradient(circle at 50% 0%, #eff6ff 0%, #ffffff 80%)",
        borderBottom: "1px solid var(--border-subtle)"
      }}>
        <div className="container" style={{ maxWidth: "850px" }}>
          <div className="badge-green" style={{ marginBottom: "16px" }}>
            <span className="pulse-dot-green"></span>
            <span>Online Support — Average Response Time: &lt; 5 mins</span>
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", lineHeight: 1.15, marginBottom: "18px", color: "#0f172a" }}>
            We're Here to Help <span className="gradient-blue">Your Library Grow</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6 }}>
            Need assistance configuring your shift layout, have questions about subscription plans, or want a 1-on-1 walkthrough? Reach out to our dedicated support team anytime.
          </p>
        </div>
      </section>

      {/* Main Support Grid */}
      <section className="section-padding" style={{ paddingTop: "20px" }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1.3fr",
            gap: "36px",
            alignItems: "start"
          }} className="contact-grid-layout">
            {/* Left: Contact Channels */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* WhatsApp Card */}
              <div className="white-card" style={{ padding: "28px", borderTop: "4px solid #25D366" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "#ecfdf5",
                    color: "#25D366",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px"
                  }}>
                    <FaWhatsapp />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "900", color: "#0f172a" }}>WhatsApp Support Desk</h3>
                    <div style={{ fontSize: "0.82rem", color: "#059669", fontWeight: "700" }}>
                      Instant chat • Average response: &lt; 5 mins
                    </div>
                  </div>
                </div>
                <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "18px" }}>
                  Connect directly with our onboarding specialists. We guide you through adding students, configuring shifts, and setting up your counter QR code.
                </p>
                <a
                  href="https://wa.me/919142025447?text=Hi%20Software%20Native%20Support,%20I%20need%20help%20setting%20up%20my%20library."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <FaWhatsapp /> Start WhatsApp Support Chat
                </a>
              </div>

              {/* Direct Call Card */}
              <div className="white-card" style={{ padding: "28px", borderTop: "4px solid #2563eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px"
                  }}>
                    <FaPhoneAlt />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "900", color: "#0f172a" }}>Phone Support Helpline</h3>
                    <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      Mon - Sun (09:00 AM - 09:00 PM IST)
                    </div>
                  </div>
                </div>
                <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "16px" }}>
                  Speak directly with an LMS product specialist about your library requirements and pricing.
                </p>
                <a
                  href="tel:+919142025447"
                  className="btn-secondary"
                  style={{ width: "100%", justifyContent: "center", color: "#2563eb", fontWeight: "800" }}
                >
                  <FaPhoneAlt /> Call +91 9142025447
                </a>
              </div>

              {/* Email & Headquarters Card */}
              <div className="white-card" style={{ padding: "28px", borderTop: "4px solid #ef4444" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#fef2f2",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0
                    }}>
                      <FaEnvelope />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>Official Inquiries</h4>
                      <div style={{ fontSize: "0.88rem", color: "#475569" }}>
                        <a href="mailto:contactsoftwarenative@gmail.com" style={{ color: "#2563eb", fontWeight: "700" }}>contactsoftwarenative@gmail.com</a>
                        <br />
                        <span style={{ fontSize: "0.82rem", color: "#64748b" }}>support@softwarenative.com</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0
                    }}>
                      <FaMapMarkerAlt />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>Software Native Technologies</h4>
                      <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.5 }}>
                        Cloud Software & Library Automation Engineering Division<br />
                        Serving study libraries across 28+ states in India.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Contact & Setup Form */}
            <div className="white-card" style={{ padding: "36px" }}>
              {!submitted ? (
                <div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: "900", marginBottom: "8px", color: "#0f172a" }}>
                    Get Free Setup Assistance
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "0.92rem", marginBottom: "28px" }}>
                    Fill out the form below. An LMS technical specialist will call you back within minutes to set up your library.
                  </p>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "800", marginBottom: "6px", color: "#0f172a" }}>
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
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
                        <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "800", marginBottom: "6px", color: "#0f172a" }}>
                          Library / Hall Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.libraryName}
                          onChange={(e) => setFormData({ ...formData, libraryName: e.target.value })}
                          placeholder="e.g. Central Reading Room"
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
                        <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "800", marginBottom: "6px", color: "#0f172a" }}>
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
                        <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "800", marginBottom: "6px", color: "#0f172a" }}>
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
                        <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "800", marginBottom: "6px", color: "#0f172a" }}>
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
                          <option value="50">Under 50 Seats</option>
                          <option value="100">50 - 150 Seats</option>
                          <option value="250">150 - 250 Seats</option>
                          <option value="500">250 - 500 Seats</option>
                          <option value="1000+">500+ Seats (Multiple Branches)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "800", marginBottom: "6px", color: "#0f172a" }}>
                        How can we help? (Optional)
                      </label>
                      <textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us about your shift timings, branch locations, or specific questions..."
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          border: "1px solid var(--border-medium)",
                          fontSize: "0.92rem",
                          outline: "none",
                          resize: "vertical"
                        }}
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                    >
                      <FaPaperPlane /> Submit Setup Request
                    </button>

                    <div style={{ textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
                      🔒 Your contact information is strictly confidential. No spam ever.
                    </div>
                  </form>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 10px" }}>
                  <div style={{
                    width: "70px",
                    height: "70px",
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
                  <h3 style={{ fontSize: "1.8rem", fontWeight: "900", marginBottom: "10px", color: "#0f172a" }}>Request Sent Successfully!</h3>
                  <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "28px" }}>
                    Thank you, <strong>{formData.name}</strong>. Our team will contact you on <strong>{formData.phone}</strong> to guide you through setting up <strong>{formData.libraryName}</strong>.
                  </p>

                  <button
                    onClick={openWhatsAppInquiry}
                    className="btn-whatsapp"
                    style={{ width: "100%", marginBottom: "14px", padding: "14px", justifyContent: "center" }}
                  >
                    <FaWhatsapp style={{ fontSize: "20px" }} /> Connect with Engineer on WhatsApp
                  </button>

                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn-secondary"
                    style={{ width: "100%" }}
                  >
                    Submit Another Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 850px) {
          .contact-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
