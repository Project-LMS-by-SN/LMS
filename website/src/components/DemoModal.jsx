import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTimes,
  FaCheckCircle,
  FaWhatsapp,
  FaBuilding,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaArrowRight
} from "react-icons/fa";

export default function DemoModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    ownerName: "",
    libraryName: "",
    gmail: "",
    phone: "",
    cityName: "",
    stateName: "Uttar Pradesh",
    pincode: "",
    capacity: "200"
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [regId, setRegId] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.ownerName || !formData.libraryName || !formData.phone || !formData.gmail) {
      alert("Please fill in Owner Name, Library Name, Gmail ID, and Phone Number.");
      return;
    }
    const generatedId = `LMS-REG-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    setRegId(generatedId);
    setIsSubmitted(true);
  };

  const openWhatsAppConfirmation = () => {
    const text = encodeURIComponent(
      `🏛️ *QUICK LIBRARY REGISTRATION REQUEST*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Application ID:* ${regId}\n` +
      `👤 *Owner Name:* ${formData.ownerName}\n` +
      `📚 *Library Name:* ${formData.libraryName}\n` +
      `📧 *Gmail ID:* ${formData.gmail}\n` +
      `📞 *Phone:* ${formData.phone}\n` +
      `📍 *Location:* ${formData.cityName || "N/A"}, ${formData.stateName} (${formData.pincode || "N/A"})\n` +
      `🪑 *Capacity:* ${formData.capacity} Students\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Please schedule my onboarding and activate my library portal!`
    );
    window.open(`https://wa.me/919142025447?text=${text}`, "_blank");
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    }}>
      <div style={{
        background: "#ffffff",
        border: "1.5px solid var(--border-medium)",
        borderRadius: "24px",
        maxWidth: "560px",
        width: "100%",
        padding: "32px",
        position: "relative",
        boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
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
            background: "#f1f5f9",
            color: "#64748b",
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
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "12px" }} className="badge-green">
              <FaBuilding /> Official Library Registration
            </div>
            <h3 style={{ fontSize: "1.6rem", color: "#0f172a", marginBottom: "6px" }}>Register Your Library</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "22px", lineHeight: "1.5" }}>
              Enter your library details below to get instant setup & First Three Months Pro Subscription Free * on your real seat layout.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Owner Name */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "5px", color: "#0f172a" }}>
                  Owner Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <FaUser style={{ position: "absolute", left: "14px", top: "13px", color: "#94a3b8", fontSize: "14px" }} />
                  <input
                    type="text"
                    name="ownerName"
                    required
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Sharma"
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 38px",
                      borderRadius: "10px",
                      border: "1.5px solid var(--border-medium)",
                      fontSize: "0.92rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* Library Name */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "5px", color: "#0f172a" }}>
                  Library Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <FaBuilding style={{ position: "absolute", left: "14px", top: "13px", color: "#94a3b8", fontSize: "14px" }} />
                  <input
                    type="text"
                    name="libraryName"
                    required
                    value={formData.libraryName}
                    onChange={handleChange}
                    placeholder="e.g. Apex Reading Hall"
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 38px",
                      borderRadius: "10px",
                      border: "1.5px solid var(--border-medium)",
                      fontSize: "0.92rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* Gmail & WhatsApp */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "5px", color: "#0f172a" }}>
                    Gmail ID <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <FaEnvelope style={{ position: "absolute", left: "12px", top: "13px", color: "#94a3b8", fontSize: "13px" }} />
                    <input
                      type="email"
                      name="gmail"
                      required
                      value={formData.gmail}
                      onChange={handleChange}
                      placeholder="library@gmail.com"
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 34px",
                        borderRadius: "10px",
                        border: "1.5px solid var(--border-medium)",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "5px", color: "#0f172a" }}>
                    WhatsApp Phone <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <FaPhoneAlt style={{ position: "absolute", left: "12px", top: "13px", color: "#10b981", fontSize: "13px" }} />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 34px",
                        borderRadius: "10px",
                        border: "1.5px solid var(--border-medium)",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* City, State, Pincode */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "5px", color: "#0f172a" }}>
                    City <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="cityName"
                    required
                    value={formData.cityName}
                    onChange={handleChange}
                    placeholder="e.g. Jaipur"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid var(--border-medium)",
                      fontSize: "0.88rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "5px", color: "#0f172a" }}>
                    State <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="stateName"
                    value={formData.stateName}
                    onChange={handleChange}
                    placeholder="e.g. Rajasthan"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid var(--border-medium)",
                      fontSize: "0.88rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "5px", color: "#0f172a" }}>
                    Pincode <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    maxLength="6"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="302015"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid var(--border-medium)",
                      fontSize: "0.88rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* Student Capacity */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "5px", color: "#0f172a" }}>
                  Student Capacity (Seats) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {["50", "200", "500", "Unlimited"].map((cap) => (
                    <button
                      type="button"
                      key={cap}
                      onClick={() => setFormData((prev) => ({ ...prev, capacity: cap }))}
                      style={{
                        padding: "8px 4px",
                        borderRadius: "8px",
                        border: `1.5px solid ${formData.capacity === cap ? "#2563eb" : "var(--border-medium)"}`,
                        background: formData.capacity === cap ? "#eff6ff" : "#ffffff",
                        color: formData.capacity === cap ? "#2563eb" : "#334155",
                        fontWeight: "800",
                        fontSize: "0.82rem",
                        cursor: "pointer"
                      }}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                background: "#f8fafc",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "0.8rem",
                color: "#64748b",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>Upload library picture on full form:</span>
                <Link to="/register" onClick={onClose} style={{ color: "#2563eb", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" }}>
                  Full Form <FaArrowRight style={{ fontSize: "10px" }} />
                </Link>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: "4px", width: "100%", padding: "13px" }}>
                Submit Registration Application
              </button>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#dcfce7",
              color: "#16a34a",
              fontSize: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <FaCheckCircle />
            </div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "8px", color: "#0f172a" }}>Registration Received!</h3>
            <p style={{ color: "#475569", fontSize: "0.92rem", marginBottom: "20px", lineHeight: "1.6" }}>
              Thank you, <strong>{formData.ownerName}</strong>! Your application for <strong>{formData.libraryName}</strong> (ID: <span style={{ color: "#2563eb", fontWeight: "700" }}>{regId}</span>) has been received.
            </p>

            <button
              onClick={openWhatsAppConfirmation}
              className="btn-whatsapp"
              style={{ width: "100%", marginBottom: "12px", padding: "14px" }}
            >
              <FaWhatsapp style={{ fontSize: "18px" }} /> Send Details on WhatsApp
            </button>

            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid var(--border-medium)",
                background: "#ffffff",
                color: "#475569",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
