import { useState } from "react";
import { Link } from "react-router-dom";
import { FaCalculator, FaRupeeSign, FaClock, FaCheckCircle, FaArrowRight } from "react-icons/fa";

export default function RevenueCalculator() {
  const [seats, setSeats] = useState(100);
  const [feePerSeat, setFeePerSeat] = useState(800);
  const [shiftMultiplier, setShiftMultiplier] = useState(1.8);

  const effectiveStudents = Math.round(seats * shiftMultiplier);
  const monthlyRevenue = effectiveStudents * feePerSeat;
  const annualRevenue = monthlyRevenue * 12;
  const recoveredLeakage = Math.round(monthlyRevenue * 0.12);
  const hoursSaved = Math.round((seats / 25) * 10);

  return (
    <section className="section-padding" style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="container">
        <div className="white-card" style={{
          padding: "48px 36px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)"
        }}>
          <div style={{ textAlign: "center", maxWidth: "750px", margin: "0 auto 40px" }}>
            <div className="badge-green" style={{ marginBottom: "12px" }}>
              <FaCalculator /> Interactive ROI & Revenue Estimator
            </div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", marginBottom: "14px", color: "#0f172a" }}>
              Calculate Your Library's Earning Potential
            </h2>
            <p style={{ color: "#475569", fontSize: "0.98rem", lineHeight: 1.6 }}>
              Study libraries operating multi-shifts achieve up to 2.2x seat utilization. 
              See how much revenue LMS can help you track and collect without fee leakage.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: "36px",
            alignItems: "center"
          }} className="calc-grid-layout">
            {/* Input Sliders */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* Slider 1: Seats */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <label style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>Total Physical Seats:</label>
                  <span style={{ fontSize: "1.15rem", fontWeight: "900", color: "#2563eb" }}>
                    {seats} Seats
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="500"
                  step="10"
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#2563eb", cursor: "pointer", height: "8px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#64748b", marginTop: "6px" }}>
                  <span>30 Seats (Starter)</span>
                  <span>250 Seats</span>
                  <span>500+ Seats (Multi-branch)</span>
                </div>
              </div>

              {/* Slider 2: Fee */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <label style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>Avg. Monthly Fee per Shift (₹):</label>
                  <span style={{ fontSize: "1.15rem", fontWeight: "900", color: "#059669" }}>
                    ₹{feePerSeat.toLocaleString("en-IN")} / month
                  </span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="2000"
                  step="50"
                  value={feePerSeat}
                  onChange={(e) => setFeePerSeat(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#10b981", cursor: "pointer", height: "8px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#64748b", marginTop: "6px" }}>
                  <span>₹400 / mo</span>
                  <span>₹1,000 / mo</span>
                  <span>₹2,000 / mo</span>
                </div>
              </div>

              {/* Shift Multiplier */}
              <div>
                <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "800", marginBottom: "10px", color: "#0f172a" }}>
                  Operational Shift Model:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShiftMultiplier(1.0)}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      fontWeight: "800",
                      background: shiftMultiplier === 1.0 ? "#eff6ff" : "#f1f5f9",
                      color: shiftMultiplier === 1.0 ? "#2563eb" : "#475569",
                      border: shiftMultiplier === 1.0 ? "2px solid #2563eb" : "1px solid var(--border-subtle)"
                    }}
                  >
                    1 Shift (Full Day)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftMultiplier(1.8)}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      fontWeight: "800",
                      background: shiftMultiplier === 1.8 ? "#eff6ff" : "#f1f5f9",
                      color: shiftMultiplier === 1.8 ? "#2563eb" : "#475569",
                      border: shiftMultiplier === 1.8 ? "2px solid #2563eb" : "1px solid var(--border-subtle)"
                    }}
                  >
                    2 Shifts (Day & Eve)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftMultiplier(2.5)}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      fontWeight: "800",
                      background: shiftMultiplier === 2.5 ? "#eff6ff" : "#f1f5f9",
                      color: shiftMultiplier === 2.5 ? "#2563eb" : "#475569",
                      border: shiftMultiplier === 2.5 ? "2px solid #2563eb" : "1px solid var(--border-subtle)"
                    }}
                  >
                    3-4 Shifts (24 Hours)
                  </button>
                </div>
              </div>
            </div>

            {/* Results Presentation Card */}
            <div style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "32px",
              border: "1px solid #bfdbfe",
              boxShadow: "0 10px 30px rgba(37, 99, 235, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
              <div>
                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "700" }}>
                  ESTIMATED MONTHLY TURNOVER
                </span>
                <div style={{ fontSize: "2.6rem", fontWeight: "900", color: "#2563eb", marginTop: "4px" }}>
                  ₹{monthlyRevenue.toLocaleString("en-IN")}
                  <span style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: "600" }}> / month</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#059669", fontWeight: "700", marginTop: "4px" }}>
                  From ~{effectiveStudents} active multi-shift students
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>ANNUAL TURNOVER</span>
                  <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a", marginTop: "2px" }}>
                    ₹{(annualRevenue / 100000).toFixed(2)} Lakhs
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: "800" }}>DUES RECOVERED (12%)</span>
                  <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#059669", marginTop: "2px" }}>
                    +₹{recoveredLeakage.toLocaleString("en-IN")}/mo
                  </div>
                </div>
              </div>

              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "12px 16px",
                borderRadius: "12px",
                fontSize: "0.85rem",
                color: "#065f46",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontWeight: "600"
              }}>
                <FaClock style={{ fontSize: "16px", flexShrink: 0, color: "#10b981" }} />
                <span>Save <strong>~{hoursSaved} hours/month</strong> previously wasted on physical entry registers.</span>
              </div>

              <Link
                to="/demo"
                className="btn-primary"
                style={{ width: "100%", padding: "14px", marginTop: "4px", justifyContent: "center" }}
              >
                <span>Automate My Library Now</span>
                <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .calc-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
