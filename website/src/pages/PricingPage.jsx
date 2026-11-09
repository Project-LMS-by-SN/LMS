import { Link } from "react-router-dom";
import SubscriptionTiers from "../components/SubscriptionTiers";
import FAQAccordion from "../components/FAQAccordion";
import { FaTag, FaUserPlus } from "react-icons/fa";

export default function PricingPage() {
  return (
    <div style={{ paddingBottom: "80px" }}>
      {/* Pricing Header */}
      <section style={{
        padding: "70px 0 30px",
        textAlign: "center",
        background: "radial-gradient(circle at 50% 0%, #eff6ff 0%, #ffffff 80%)",
        borderBottom: "1px solid var(--border-subtle)"
      }}>
        <div className="container" style={{ maxWidth: "850px" }}>
          <div className="badge-green" style={{ marginBottom: "16px" }}>
            <FaTag /> Special Launch Offer: First Three Months Pro Subscription Free *
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", lineHeight: 1.15, marginBottom: "18px", color: "#0f172a" }}>
            Simple & Transparent <span className="gradient-blue">Pricing For Every Library</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6, marginBottom: "24px" }}>
            First Three Months Pro Subscription Free * on your real branch. No advance payment or card required.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link to="/register" className="btn-primary">
              <FaUserPlus /> Register Your Library — Free
            </Link>
          </div>
        </div>
      </section>

      {/* Subscription Tiers & Features Comparison */}
      <SubscriptionTiers />

      {/* FAQs */}
      <FAQAccordion />
    </div>
  );
}
