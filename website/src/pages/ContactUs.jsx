import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaWhatsapp,
  FaRocket,
  FaPaperPlane,
  FaCheckCircle,
  FaTag,
  FaTh
} from "react-icons/fa";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    libraryName: "",
    phone: "",
    gmail: "",
    inquiryTopic: "Registration & First 3 Months Free Offer",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Name constraint
    const cleanName = formData.name.trim();
    if (!cleanName || cleanName.length < 2) {
      alert("Please enter a valid Name (at least 2 characters).");
      return;
    }
    if (!/^[a-zA-Z\s.]+$/.test(cleanName)) {
      alert("Name should only contain alphabetic letters and spaces.");
      return;
    }
    if (cleanName.length > 60) {
      alert("Name cannot exceed 60 characters.");
      return;
    }

    // 2. Library Name constraint (if provided)
    if (formData.libraryName && formData.libraryName.trim().length > 80) {
      alert("Library Name cannot exceed 80 characters.");
      return;
    }

    // 3. WhatsApp Mobile constraint
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert("Please enter a valid 10-digit WhatsApp mobile number.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      alert("Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.");
      return;
    }

    // 4. Gmail ID constraint (Optional, but if filled, must be valid)
    if (formData.gmail && formData.gmail.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.gmail.trim())) {
        alert("Please enter a valid Gmail ID / Email address (e.g. name@gmail.com) or leave it empty.");
        return;
      }
      if (formData.gmail.trim().length > 80) {
        alert("Gmail ID cannot exceed 80 characters.");
        return;
      }
    }

    // 5. Message constraint
    if (formData.message && formData.message.length > 1000) {
      alert("Message cannot exceed 1000 characters.");
      return;
    }

    setSubmitted(true);
  };

  const openWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `*LMS Product Inquiry - LMS by Study Guru*\n\n` +
      `*Topic:* ${formData.inquiryTopic}\n` +
      `*Owner Name:* ${formData.name || "Library Owner"}\n` +
      `*Library Name:* ${formData.libraryName || "Not provided"}\n` +
      `*Mobile Number:* ${formData.phone || "Not provided"}\n` +
      (formData.gmail ? `*Gmail / Email:* ${formData.gmail}\n` : "") +
      `*Message / Question:* ${formData.message || "I would like to inquire about LMS product registration, pricing plans, and features."}`
    );
    window.open(`https://wa.me/919142025447?text=${text}`, "_blank");
  };

  return (
    <div style={{ padding: "60px 0 90px", background: "#f8fafc" }}>
      <div className="container" style={{ maxWidth: "1160px" }}>
        
        {/* Top Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)", fontWeight: "900", color: "#0f172a", lineHeight: 1.15, margin: "0 0 10px" }}>
            Get in Touch for <span style={{ color: "#0284c7" }}>Any Support</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "1.05rem", maxWidth: "700px", margin: "0 auto" }}>
            If you have any questions or queries regarding pricing, registration, free plans, offers, features, or any other information, please feel free to contact us.<br></br>Our team will be happy to assist you!
          </p>
        </div>

        {/* =========================================================================
            SPLIT CONTAINER: LEFT 2x2 CARDS (DARK) + RIGHT SKY BLUE FORM
            ========================================================================= */}
        <div
          className="contact-split-box"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.15fr",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(15, 23, 42, 0.16)",
            background: "#0f172a"
          }}
        >
          {/* ========================================================= */}
          {/* LEFT SIDE: 2x2 GRID OF 4 WHITE CARDS (DARK BACKGROUND) */}
          {/* ========================================================= */}
          <div
            style={{
              background: "#0f172a",
              padding: "44px 32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}
          >
            <div
              className="contact-cards-2x2"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px"
              }}
            >
              {/* Card 1: Phone */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "28px 16px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 22px rgba(0, 0, 0, 0.2)",
                  transition: "transform 0.2s ease"
                }}
              >
                <a
                  href="tel:+919142025447"
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "#e0f2fe",
                    color: "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    marginBottom: "14px",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "transform 0.2s"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                  onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <FaPhoneAlt />
                </a>
                <h4
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: "900",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#0f172a",
                    marginBottom: "8px"
                  }}
                >
                  Phone Number
                </h4>
                <a
                  href="tel:+919142025447"
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: "800",
                    color: "#0284c7",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "color 0.2s"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#f97316")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#0284c7")}
                >
                  +91 9142025447
                </a>
                <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                  Mon - Sat  (11 AM - 7 PM)
                </div>
              </div>

              {/* Card 2: WhatsApp */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "28px 16px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 22px rgba(0, 0, 0, 0.2)",
                  transition: "transform 0.2s ease"
                }}
              >
                <a
                  href="https://wa.me/919142025447?text=Hi%20Software%20Native,%20I%20have%20an%20inquiry%20regarding%20LMS%20Cloud."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    color: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    marginBottom: "14px",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "transform 0.2s"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                  onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <FaWhatsapp />
                </a>
                <h4
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: "900",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#0f172a",
                    marginBottom: "8px"
                  }}
                >
                  WhatsApp Chat
                </h4>
                <a
                  href="https://wa.me/919142025447?text=Hi%20Software%20Native,%20I%20have%20an%20inquiry%20regarding%20LMS%20Cloud."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: "800",
                    color: "#16a34a",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "color 0.2s"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#059669")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#16a34a")}
                >
                  +91 9142025447
                </a>
                <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                  Instant Reply 
                </div>
              </div>

              {/* Card 3: Email */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "28px 16px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 22px rgba(0, 0, 0, 0.2)",
                  transition: "transform 0.2s ease"
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "#e0f2fe",
                    color: "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    marginBottom: "14px"
                  }}
                >
                  <FaEnvelope />
                </div>
                <h4
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: "900",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#0f172a",
                    marginBottom: "8px"
                  }}
                >
                  Email
                </h4>
                <a
                  href="mailto:contactsoftwarenative@gmail.com"
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#0284c7",
                    wordBreak: "break-all",
                    textDecoration: "underline"
                  }}
                >
                  contactsoftwarenative@gmail.com
                </a>
                <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
                  24/7 Official Support
                </div>
              </div>

              {/* Card 4: Product Desk / Offer */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "28px 16px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 22px rgba(0, 0, 0, 0.2)",
                  transition: "transform 0.2s ease"
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "#ffedd5",
                    color: "#ea580c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    marginBottom: "14px"
                  }}
                >
                  <FaRocket />
                </div>
                <h4
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: "900",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#0f172a",
                    marginBottom: "8px"
                  }}
                >
                  Product Desk
                </h4>
                <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#ea580c" }}>
                  First 3 Months Free *
                </div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                  Registration & Pricing
                </div>
              </div>
            </div>

            {/* Bottom info note on left */}
            <div style={{ marginTop: "24px", textAlign: "center", color: "#94a3b8", fontSize: "0.78rem" }}>
              
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE: SKY BLUE FORM PANEL (MATCHING ATTACHED IMAGE) */}
          {/* ========================================================= */}
          <div
            style={{
              background: "linear-gradient(150deg, #38bdf8 0%, #0284c7 60%, #0369a1 100%)",
              padding: "48px 40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              color: "#ffffff"
            }}
          >
            {!submitted ? (
              <div>
                <h2
                  style={{
                    fontSize: "2.4rem",
                    fontWeight: "900",
                    color: "#ffffff",
                    marginBottom: "8px",
                    letterSpacing: "-0.02em"
                  }}
                >
                  Contact Us
                </h2>
                <p style={{ color: "#e0f2fe", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "26px", fontWeight: "500" }}>
                  Send us a message for inquiries regarding Library Registration, Pricing Plans, and Features.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Name Input */}
                  <div>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={60}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your Name *"
                      style={{
                        width: "100%",
                        padding: "13px 18px",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "0.95rem",
                        color: "#0f172a",
                        background: "#ffffff",
                        outline: "none",
                        fontWeight: "600",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
                      }}
                    />
                  </div>

                  {/* Library Name Input */}
                  <div>
                    <input
                      type="text"
                      maxLength={80}
                      value={formData.libraryName}
                      onChange={(e) => setFormData({ ...formData, libraryName: e.target.value })}
                      placeholder="Enter Library / Reading Hall Name (Optional)"
                      style={{
                        width: "100%",
                        padding: "13px 18px",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "0.95rem",
                        color: "#0f172a",
                        background: "#ffffff",
                        outline: "none",
                        fontWeight: "600",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
                      }}
                    />
                  </div>

                  {/* WhatsApp Mobile Number Input */}
                  <div>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      placeholder="Enter 10-Digit WhatsApp Mobile Number *"
                      style={{
                        width: "100%",
                        padding: "13px 18px",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "0.95rem",
                        color: "#0f172a",
                        background: "#ffffff",
                        outline: "none",
                        fontWeight: "600",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
                      }}
                    />
                  </div>

                  {/* Gmail ID / Email Input (Optional) */}
                  <div>
                    <input
                      type="email"
                      maxLength={80}
                      value={formData.gmail}
                      onChange={(e) => setFormData({ ...formData, gmail: e.target.value.trim() })}
                      placeholder="Enter Gmail ID / Email Address (Optional)"
                      style={{
                        width: "100%",
                        padding: "13px 18px",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "0.95rem",
                        color: "#0f172a",
                        background: "#ffffff",
                        outline: "none",
                        fontWeight: "600",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
                      }}
                    />
                  </div>

                  {/* Inquiry Topic Dropdown */}
                  <div>
                    <select
                      value={formData.inquiryTopic}
                      onChange={(e) => setFormData({ ...formData, inquiryTopic: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "13px 18px",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "0.92rem",
                        color: "#0f172a",
                        background: "#ffffff",
                        outline: "none",
                        fontWeight: "700",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                        cursor: "pointer"
                      }}
                    >
                      <option value="Registration & First 3 Months Free Offer">Library Registration & 3 Months Free Pro Offer</option>
                      <option value="Pricing & Subscription Plans">Plans & Pricing (Starter, Basic, Pro, Enterprise)</option>
                      <option value="Features & Live Demo Walkthrough">Core Features Demo (Interactive Seat Map, Attendance)</option>
                      <option value="QR Attendance Kiosk & Hardware Setup">Gate QR Attendance Kiosk & Tablet Setup</option>
                      <option value="Data Migration from Paper / Excel">Old Paper Register / Excel Data Migration to LMS</option>
                      <option value="General Product Inquiry">General LMS Product Inquiry</option>
                    </select>
                  </div>

                  {/* Message Input */}
                  <div>
                    <textarea
                      rows={4}
                      maxLength={1000}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Enter your Message / Requirement (e.g. Total seats, shift timings, specific questions...)"
                      style={{
                        width: "100%",
                        padding: "13px 18px",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "0.95rem",
                        color: "#0f172a",
                        background: "#ffffff",
                        outline: "none",
                        fontWeight: "600",
                        resize: "vertical",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
                      }}
                    ></textarea>
                  </div>

                  {/* Submit Button (Matching Style in Image with Orange Accent) */}
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "6px" }}>
                    <button
                      type="submit"
                      style={{
                        background: "#ffffff",
                        color: "#0284c7",
                        border: "2px solid #ffffff",
                        padding: "12px 34px",
                        borderRadius: "8px",
                        fontSize: "0.92rem",
                        fontWeight: "900",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#f97316";
                        e.currentTarget.style.borderColor = "#f97316";
                        e.currentTarget.style.color = "#ffffff";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.borderColor = "#ffffff";
                        e.currentTarget.style.color = "#0284c7";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      SUBMIT
                    </button>

                    <button
                      type="button"
                      onClick={openWhatsAppInquiry}
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                        border: "1.5px solid rgba(255, 255, 255, 0.6)",
                        padding: "12px 22px",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        fontWeight: "800",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#22c55e";
                        e.currentTarget.style.borderColor = "#22c55e";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                      }}
                    >
                      <FaWhatsapp style={{ fontSize: "17px" }} /> Quick WhatsApp
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 10px" }}>
                <div
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    color: "#16a34a",
                    fontSize: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
                  }}
                >
                  <FaCheckCircle />
                </div>
                <h3 style={{ fontSize: "1.8rem", fontWeight: "900", marginBottom: "8px", color: "#ffffff" }}>
                  Message Received!
                </h3>
                <p style={{ color: "#e0f2fe", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                  Thank you, <strong>{formData.name}</strong>. Our LMS product specialist will contact you on <strong>{formData.phone}</strong> shortly.
                </p>

                <button
                  onClick={openWhatsAppInquiry}
                  style={{
                    background: "#22c55e",
                    color: "#ffffff",
                    border: "none",
                    padding: "13px 26px",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                    boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)"
                  }}
                >
                  <FaWhatsapp style={{ fontSize: "18px" }} /> Chat on WhatsApp Now
                </button>
                <br />
                <button
                  onClick={() => setSubmitted(false)}
                  style={{
                    background: "transparent",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.4)",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    marginTop: "8px"
                  }}
                >
                  Send Another Message
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Responsive CSS */}
        <style>{`
          @media (max-width: 900px) {
            .contact-split-box {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 520px) {
            .contact-cards-2x2 {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

      </div>
    </div>
  );
}
