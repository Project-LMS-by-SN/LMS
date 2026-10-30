import { FaStar, FaQuoteLeft, FaCheckCircle } from "react-icons/fa";

const reviews = [
  {
    name: "Sunil Choudhary",
    role: "Owner, Apex Study Point",
    location: "Gopalpura Bypass, Jaipur",
    seats: "180 Seats (4 Shifts)",
    text: "Before LMS, managing Morning and Evening shift seat overlap was a daily headache. With their 10-column live matrix, no two students can book the same slot. Our collection increased by 20% in the very first month!",
    rating: 5,
    borderTop: "#2563eb"
  },
  {
    name: "Praveen Sharma",
    role: "Director, Target Reading Zone",
    location: "Mukherjee Nagar, Delhi",
    seats: "320 Seats (2 Branches)",
    text: "The counter QR admission feature alone saves us 2 hours every day. UPSC aspirants scan the reception QR on their phone, fill details, and get their digital ID card instantly. Best software in India for study libraries.",
    rating: 5,
    borderTop: "#10b981"
  },
  {
    name: "Dr. Alok Mishra",
    role: "Founder, Scholars Paradise Library",
    location: "Boring Road, Patna",
    seats: "150 Seats (Full Day & Night)",
    text: "The WhatsApp fee due alert is a lifesaver. Students receive polite automated alerts 3 days before their monthly subscription expires. Dues are collected on time without uncomfortable manual follow-ups.",
    rating: 5,
    borderTop: "#ef4444"
  },
  {
    name: "Anand Verma",
    role: "Owner, Lakshya Self Study Hub",
    location: "Indraprastha Area, Kota",
    seats: "240 Seats (24-Hour Shifts)",
    text: "Students scan the attendance QR kiosk at the entrance in less than a second. We always know exactly how many students are inside the hall. Single-device security means staff can't misuse credentials.",
    rating: 5,
    borderTop: "#2563eb"
  }
];

export default function Testimonials() {
  return (
    <section className="section-padding" style={{ background: "#ffffff", borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="container">
        {/* Section Heading */}
        <div style={{ textAlign: "center", maxWidth: "750px", margin: "0 auto 48px" }}>
          <div className="badge-green" style={{ marginBottom: "14px" }}>
            <FaCheckCircle /> Real Library Owner Experiences
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", marginBottom: "16px", color: "#0f172a" }}>
            Trusted by 100+ Study Libraries Across India
          </h2>
          <p style={{ color: "#475569", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Hear how library owners simplified multi-shift seating, improved student discipline, and stopped revenue leakage.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px"
        }}>
          {reviews.map((r, i) => (
            <div
              key={i}
              className="white-card"
              style={{
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderTop: `4px solid ${r.borderTop}`
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "4px", color: "#f59e0b" }}>
                    {[...Array(r.rating)].map((_, s) => (
                      <FaStar key={s} />
                    ))}
                  </div>
                  <FaQuoteLeft style={{ color: "#cbd5e1", fontSize: "20px" }} />
                </div>

                <p style={{ fontSize: "0.92rem", color: "#334155", lineHeight: 1.6, marginBottom: "24px", fontStyle: "italic" }}>
                  "{r.text}"
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "16px",
                  flexShrink: 0
                }}>
                  {r.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "#0f172a" }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {r.role} • {r.location}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: "700", marginTop: "2px" }}>
                    ⚡ {r.seats}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
