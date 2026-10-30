import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaQuestionCircle } from "react-icons/fa";

const faqs = [
  {
    q: "How difficult is it to migrate from physical registers to LMS?",
    a: "It takes less than 30 minutes! You can upload an Excel sheet with your current students, or simply let walk-in students scan the reception QR code to register themselves. Our team also provides free 1-on-1 assistance over WhatsApp to set up your seat layout."
  },
  {
    q: "Do I need to buy expensive biometric machines or barcode scanners?",
    a: "Not at all. LMS includes a standalone Public QR Attendance Kiosk (/public-attendance) that works on any standard tablet, old mobile phone, or laptop webcam. Students simply scan their personal QR code or enter their ID to mark entry/exit."
  },
  {
    q: "Can I customize shifts according to my library's timings?",
    a: "Yes! You can configure any shift configuration: Morning (e.g. 6 AM to 12 PM), Afternoon (12 PM to 5 PM), Evening (5 PM to 10 PM), Night (10 PM to 6 AM), or 24-Hour dedicated seats with custom pricing for each slot."
  },
  {
    q: "How does the automated WhatsApp fee reminder system work?",
    a: "LMS automatically tracks validities. 3 days before a student's validity expires, an automated polite WhatsApp payment reminder is generated with the renewal fee amount and library counter details. No uncomfortable manual confrontations needed."
  },
  {
    q: "What security features protect my library data from staff misuse?",
    a: "LMS includes strict Single-Device session enforcement. Staff can only access staff-permitted pages (Cashier & Attendance) and cannot log in from unauthorized secondary devices or change library owner credentials."
  },
  {
    q: "Can I manage 2 or more library branches from one account?",
    a: "Yes. Our Enterprise plan includes a Multi-Branch Console where you can switch branches in 1 click, view consolidated revenue analytics, and assign branch-specific staff."
  }
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="section-padding" style={{ background: "#f8fafc" }}>
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* Section Heading */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="badge-blue" style={{ marginBottom: "14px" }}>
            <FaQuestionCircle /> Frequently Asked Questions
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", marginBottom: "14px", color: "#0f172a" }}>
            Everything You Need to Know
          </h2>
          <p style={{ color: "#475569", fontSize: "1rem", lineHeight: 1.6 }}>
            Got questions about onboarding, shifts, hardware, or WhatsApp alerts? We have answers.
          </p>
        </div>

        {/* Accordion List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {faqs.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="white-card"
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: isOpen ? "1.5px solid #2563eb" : "1px solid var(--border-subtle)",
                  transition: "all 0.25s ease"
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  style={{
                    width: "100%",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                    color: isOpen ? "#2563eb" : "#0f172a",
                    fontWeight: "800",
                    fontSize: "1.05rem"
                  }}
                >
                  <span>{f.q}</span>
                  <span style={{ color: isOpen ? "#2563eb" : "#94a3b8", fontSize: "16px", marginLeft: "12px" }}>
                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>

                {isOpen && (
                  <div style={{
                    padding: "0 24px 22px 24px",
                    color: "#475569",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: "16px"
                  }}>
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
