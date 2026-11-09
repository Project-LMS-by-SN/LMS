import { Link } from "react-router-dom";
import FeaturesGrid from "../components/FeaturesGrid";
import FeatureWorkflowGuide from "../components/FeatureWorkflowGuide";
import RevenueCalculator from "../components/RevenueCalculator";
import { FaLayerGroup, FaTh, FaUserPlus, FaWhatsapp, FaShieldAlt } from "react-icons/fa";

export default function FeaturesPage() {
  return (
    <div style={{ paddingBottom: "80px" }}>
      {/* Header Banner */}
      <section
        style={{
          padding: "70px 0 45px",
          textAlign: "center",
          background: "radial-gradient(circle at 50% 0%, #eff6ff 0%, #ffffff 80%)",
          borderBottom: "1px solid var(--border-subtle)"
        }}
      >
        <div className="container" style={{ maxWidth: "880px" }}>
          <div className="badge-blue" style={{ marginBottom: "16px" }}>
            <FaLayerGroup /> Complete Study Space Operating Guide
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", lineHeight: 1.15, marginBottom: "18px", color: "#0f172a" }}>
            Engineered for High-Efficiency <span className="gradient-blue">Study Space Operations</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6, marginBottom: "28px" }}>
            Discover how LMS by Study Guru eliminates messy paper registers, prevents double-booking disputes, and makes cashier fee collections 100% automated and transparent.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link to="/register" className="btn-primary" style={{ padding: "12px 24px" }}>
              <FaUserPlus /> Register Your Library - Free
            </Link>
            <a
              href="https://wa.me/919142025447?text=Hi%20Software%20Native,%20I%20want%20to%20understand%20LMS%20features."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              style={{ padding: "12px 22px" }}
            >
              <FaWhatsapp /> WhatsApp Support
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Step-by-Step Practical Workflow Guide with Screen Mockups */}
      <FeatureWorkflowGuide />

      {/* Grid of All Core Features */}
      <FeaturesGrid />

      {/* Interactive Revenue Calculator */}
      <RevenueCalculator />
    </div>
  );
}
