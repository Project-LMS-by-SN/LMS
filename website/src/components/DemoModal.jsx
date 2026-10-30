import { useState } from "react";
import { FaTimes, FaCheckCircle, FaWhatsapp, FaCalendarCheck, FaPhoneAlt, FaBuilding, FaUser } from "react-icons/fa";

export default function DemoModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    fullName: "",
    libraryName: "",
    phone: "",
    city: "",
    totalSeats: "100",
    shiftType: "Multi-Shift (Morning/Evening/Night)"
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.libraryName) {
      alert("Please fill in your name, library name, and contact number.");
      return;
    }
    setIsSubmitted(true);
  };

  const openWhatsAppConfirmation = () => {
    const text = encodeURIComponent(
      `Hello Software Native Support! I just requested a demo for my library:\n\n*Name:* ${formData.fullName}\n*Library:* ${formData.libraryName}\n*City:* ${formData.city || "Not specified"}\n*Seats:* ${formData.totalSeats}\n*Shift Model:* ${formData.shiftType}\n*Phone:* ${formData.phone}\n\nPlease schedule my live onboarding walkthrough!`
    );
    window.open(`https://wa.me/919142025447?text=${text}`, "_blank");
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      backgroundColor: "rgba(3, 7, 18, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    }}>
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-medium)",
        borderRadius: "24px",
        maxWidth: "540px",
        width: "100%",
        padding: "32px",
        position: "relative",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "var(--bg-surface-elevated)",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border-subtle)",
            fontSize: "16px"
          }}
          aria-label="Close Modal"
        >
          <FaTimes />
        </button>

        {!isSubmitted ? (
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "12px" }} className="badge-pill">
              <FaCalendarCheck /> Book 1-on-1 Free Walkthrough
            </div>
            <h3 style={{ fontSize: "1.6rem", marginBottom: "8px" }}>Get a Personalized Live Demo</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", marginBottom: "24px", lineHeight: "1.5" }}>
              See how LMS handles multi-shift seat maps, instant fee collection, and QR attendance for your library.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "var(--text-main)" }}>
                  Your Full Name *
                </label>
                <div style={{ position: "relative" }}>
                  <FaUser style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-subtle)", fontSize: "14px" }} />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Sharma"
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 40px",
                      borderRadius: "12px",
                      border: "1px solid var(--border-medium)",
                      background: "var(--bg-surface-elevated)",
                      color: "var(--text-main)",
                      fontSize: "0.92rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "var(--text-main)" }}>
                    Library Name *
                  </label>
                  <div style={{ position: "relative" }}>
                    <FaBuilding style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-subtle)", fontSize: "14px" }} />
                    <input
                      type="text"
                      name="libraryName"
                      required
                      value={formData.libraryName}
                      onChange={handleChange}
                      placeholder="e.g. Apex Reading Hall"
                      style={{
                        width: "100%",
                        padding: "12px 14px 12px 40px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-medium)",
                        background: "var(--bg-surface-elevated)",
                        color: "var(--text-main)",
                        fontSize: "0.92rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "var(--text-main)" }}>
                    WhatsApp Phone *
                  </label>
                  <div style={{ position: "relative" }}>
                    <FaPhoneAlt style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-subtle)", fontSize: "14px" }} />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      style={{
                        width: "100%",
                        padding: "12px 14px 12px 40px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-medium)",
                        background: "var(--bg-surface-elevated)",
                        color: "var(--text-main)",
                        fontSize: "0.92rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "var(--text-main)" }}>
                    City / State
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Jaipur, Rajasthan"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: "1px solid var(--border-medium)",
                      background: "var(--bg-surface-elevated)",
                      color: "var(--text-main)",
                      fontSize: "0.92rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px", color: "var(--text-main)" }}>
                    Approx. Seats
                  </label>
                  <select
                    name="totalSeats"
                    value={formData.totalSeats}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: "1px solid var(--border-medium)",
                      background: "var(--bg-surface-elevated)",
                      color: "var(--text-main)",
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

              <button type="submit" className="btn-primary" style={{ marginTop: "10px", width: "100%" }}>
                Request Free Live Demo
              </button>

              <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-subtle)" }}>
                ⚡ Average response time: &lt; 5 minutes via WhatsApp or Direct Call
              </div>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              fontSize: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <FaCheckCircle />
            </div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Demo Request Received!</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", marginBottom: "24px", lineHeight: "1.6" }}>
              Thank you, <strong>{formData.fullName}</strong>. Our onboarding team has logged your library <strong>({formData.libraryName})</strong> and will reach out shortly.
            </p>

            <button
              onClick={openWhatsAppConfirmation}
              className="btn-whatsapp"
              style={{ width: "100%", marginBottom: "12px" }}
            >
              <FaWhatsapp style={{ fontSize: "18px" }} /> Connect on WhatsApp Instantly
            </button>

            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ width: "100%" }}
            >
              Done & Return to Site
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
