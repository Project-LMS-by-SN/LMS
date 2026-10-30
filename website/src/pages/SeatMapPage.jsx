import { useState } from "react";
import { Link } from "react-router-dom";
import { FaClock, FaCheckCircle, FaUserCheck, FaInfoCircle, FaCalendarAlt, FaShieldAlt, FaWhatsapp, FaArrowRight, FaExclamationCircle } from "react-icons/fa";

const shifts = [
  { id: "morning", name: "Morning Shift", time: "06:00 AM - 12:00 PM", occupiedIndices: [0, 1, 2, 4, 5, 8, 9, 10, 12, 14, 15, 18, 19, 21, 22, 25, 27, 28], expiredIndices: [8, 22] },
  { id: "afternoon", name: "Afternoon Shift", time: "12:00 PM - 05:00 PM", occupiedIndices: [1, 3, 5, 6, 7, 10, 11, 13, 16, 17, 20, 22, 23, 26, 29], expiredIndices: [11] },
  { id: "evening", name: "Evening Shift", time: "05:00 PM - 10:00 PM", occupiedIndices: [0, 2, 4, 6, 8, 9, 12, 14, 15, 17, 18, 19, 21, 24, 25, 27, 28, 29], expiredIndices: [4, 19] },
  { id: "night", name: "Night Shift", time: "10:00 PM - 06:00 AM", occupiedIndices: [0, 3, 7, 10, 13, 15, 18, 22, 25, 28], expiredIndices: [7] },
  { id: "fullday", name: "24-Hour Dedicated", time: "24 Hours Full Day Seat", occupiedIndices: [0, 4, 8, 12, 16, 20, 24, 28], expiredIndices: [16] },
];

const mockStudents = [
  { name: "Aman Verma", course: "UPSC Aspirant", validity: "28 Nov 2026", due: "₹0 (Paid)", status: "Active" },
  { name: "Pooja Sharma", course: "Chartered Accountant", validity: "15 Dec 2026", due: "₹0 (Paid)", status: "Active" },
  { name: "Rohan Gupta", course: "IIT-JEE / NEET", validity: "Expired Yesterday", due: "₹800 (Due)", status: "Expired" },
  { name: "Sneha Patel", course: "State Judiciary", validity: "10 Nov 2026", due: "₹0 (Paid)", status: "Active" },
  { name: "Vikram Rathore", course: "SSC CGL / Banking", validity: "22 Dec 2026", due: "₹0 (Paid)", status: "Active" },
  { name: "Ananya Iyer", course: "Medical Resident", validity: "Expired (3 Days)", due: "₹1,000 (Due)", status: "Expired" }
];

export default function SeatMapPage({ onOpenDemo }) {
  const [activeShift, setActiveShift] = useState(shifts[0]);
  const [selectedSeat, setSelectedSeat] = useState({
    seatNumber: "A01",
    isOccupied: true,
    isExpired: false,
    student: mockStudents[0]
  });

  const totalSeats = 30; // 3 rows of 10
  const occupiedCount = activeShift.occupiedIndices.length;
  const expiredCount = activeShift.expiredIndices.length;
  const availableCount = totalSeats - occupiedCount;

  const handleSeatClick = (index) => {
    const row = String.fromCharCode(65 + Math.floor(index / 10));
    const col = (index % 10) + 1;
    const seatNumber = `${row}${col < 10 ? "0" + col : col}`;
    const isOccupied = activeShift.occupiedIndices.includes(index);
    const isExpired = activeShift.expiredIndices.includes(index);
    const student = isOccupied ? mockStudents[index % mockStudents.length] : null;

    setSelectedSeat({
      seatNumber,
      isOccupied,
      isExpired,
      student
    });
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
        <div className="container" style={{ maxWidth: "850px" }}>
          <div className="badge-blue" style={{ marginBottom: "16px" }}>
            <FaClock /> 10-Column Multi-Shift Allocation Engine
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)", lineHeight: 1.15, marginBottom: "16px" }}>
            Zero Double-Booking With <span className="gradient-blue">Smart Shift Mapping</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6 }}>
            Never let two students fight over the same desk again. Click different shift tabs below to test 
            how our real-time seat matrix dynamically tracks occupancy, available slots, and overdue fees.
          </p>
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section className="section-padding">
        <div className="container">
          {/* Shift Selection Buttons */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "32px"
          }}>
            {shifts.map((s) => {
              const isActive = activeShift.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveShift(s)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "11px 22px",
                    borderRadius: "14px",
                    fontSize: "0.9rem",
                    fontWeight: "800",
                    transition: "all 0.25s ease",
                    background: isActive ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#ffffff",
                    color: isActive ? "#ffffff" : "#334155",
                    border: isActive ? "1px solid #2563eb" : "1px solid var(--border-medium)",
                    boxShadow: isActive ? "0 4px 16px rgba(37, 99, 235, 0.35)" : "0 2px 6px rgba(0,0,0,0.04)"
                  }}
                >
                  <span>{s.name}</span>
                  <span style={{ fontSize: "0.78rem", opacity: 0.85 }}>({s.time})</span>
                </button>
              );
            })}
          </div>

          {/* Seat Grid & Inspector */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.8fr 1.2fr",
            gap: "28px",
            alignItems: "start"
          }} className="seat-grid-layout">
            {/* Left: 10-Column Matrix Frame */}
            <div className="white-card" style={{ padding: "28px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "10px"
              }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
                    Reading Hall A — Shift: {activeShift.name}
                  </h3>
                  <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                    Click any seat box below to inspect validity, course, and payment status
                  </span>
                </div>

                <div style={{ display: "flex", gap: "12px", fontSize: "0.82rem", fontWeight: "700" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2563eb" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "4px", background: "#2563eb" }}></span>
                    {occupiedCount - expiredCount} Occupied
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "4px", background: "#10b981" }}></span>
                    {availableCount} Available
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#dc2626" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "4px", background: "#ef4444" }}></span>
                    {expiredCount} Fee Overdue
                  </span>
                </div>
              </div>

              {/* 10-Column Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, 1fr)",
                gap: "10px",
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "16px",
                border: "1px solid var(--border-subtle)"
              }}>
                {[...Array(totalSeats)].map((_, i) => {
                  const isOccupied = activeShift.occupiedIndices.includes(i);
                  const isExpired = activeShift.expiredIndices.includes(i);
                  const row = String.fromCharCode(65 + Math.floor(i / 10));
                  const col = (i % 10) + 1;
                  const seatCode = `${row}${col < 10 ? "0" + col : col}`;
                  const isSelected = selectedSeat?.seatNumber === seatCode;

                  const color = isExpired ? "#dc2626" : isOccupied ? "#2563eb" : "#059669";
                  const bg = isExpired ? "#fee2e2" : isOccupied ? "#dbeafe" : "#dcfce7";
                  const border = isSelected ? "#0f172a" : isExpired ? "#fca5a5" : isOccupied ? "#93c5fd" : "#86efac";

                  return (
                    <button
                      key={i}
                      onClick={() => handleSeatClick(i)}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "10px",
                        border: `2px solid ${border}`,
                        background: bg,
                        color: color,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "900",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        transform: isSelected ? "scale(1.08)" : "scale(1)",
                        boxShadow: isSelected ? "0 4px 14px rgba(0,0,0,0.2)" : "none"
                      }}
                    >
                      <span>{seatCode}</span>
                      <span style={{ fontSize: "0.6rem", opacity: 0.85 }}>
                        {isExpired ? "DUE" : isOccupied ? "OCC" : "FREE"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.82rem", color: "#64748b" }}>
                <span>Entrance Gate & Attendance QR Kiosk</span>
                <span style={{ color: "#2563eb", fontWeight: "700" }}>⚡ 15-Minute Shift Transition Buffer Active</span>
              </div>
            </div>

            {/* Right: Seat Inspector Card */}
            <div className="white-card" style={{ padding: "28px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "14px"
              }}>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "700" }}>
                    CURRENT SEAT SELECTION
                  </span>
                  <h3 style={{ fontSize: "1.9rem", fontWeight: "900", color: "#2563eb" }}>
                    Seat {selectedSeat.seatNumber}
                  </h3>
                </div>

                <span className={
                  selectedSeat.isExpired
                    ? "badge-red"
                    : selectedSeat.isOccupied
                    ? "badge-blue"
                    : "badge-green"
                }>
                  {selectedSeat.isExpired ? "Fee Due / Expired" : selectedSeat.isOccupied ? "Occupied" : "Available to Assign"}
                </span>
              </div>

              {selectedSeat.isOccupied && selectedSeat.student ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    border: "1px solid var(--border-subtle)"
                  }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", marginBottom: "4px" }}>
                      STUDENT DETAILS
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                      {selectedSeat.student.name}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: "600", marginTop: "2px" }}>
                      {selectedSeat.student.course}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{
                      padding: "14px",
                      borderRadius: "12px",
                      background: selectedSeat.isExpired ? "#fef2f2" : "#f0fdf4",
                      border: `1px solid ${selectedSeat.isExpired ? "#fecaca" : "#bbf7d0"}`
                    }}>
                      <div style={{ fontSize: "0.75rem", color: selectedSeat.isExpired ? "#991b1b" : "#065f46", fontWeight: "700" }}>
                        VALIDITY STATUS
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: "800", color: selectedSeat.isExpired ? "#dc2626" : "#059669", marginTop: "2px" }}>
                        {selectedSeat.student.validity}
                      </div>
                    </div>

                    <div style={{
                      padding: "14px",
                      borderRadius: "12px",
                      background: selectedSeat.isExpired ? "#fef2f2" : "#eff6ff",
                      border: `1px solid ${selectedSeat.isExpired ? "#fecaca" : "#bfdbfe"}`
                    }}>
                      <div style={{ fontSize: "0.75rem", color: selectedSeat.isExpired ? "#991b1b" : "#1e40af", fontWeight: "700" }}>
                        FEE BALANCE
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: "800", color: selectedSeat.isExpired ? "#dc2626" : "#2563eb", marginTop: "2px" }}>
                        {selectedSeat.student.due}
                      </div>
                    </div>
                  </div>

                  {selectedSeat.isExpired ? (
                    <div style={{
                      padding: "14px",
                      borderRadius: "12px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      fontSize: "0.85rem",
                      color: "#b91c1c",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontWeight: "600"
                    }}>
                      <FaExclamationCircle style={{ fontSize: "18px", flexShrink: 0 }} />
                      <span>Automated WhatsApp fee renewal reminder queued to send today at 10:00 AM.</span>
                    </div>
                  ) : (
                    <div style={{
                      padding: "14px",
                      borderRadius: "12px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      fontSize: "0.85rem",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontWeight: "600"
                    }}>
                      <FaUserCheck style={{ fontSize: "18px", flexShrink: 0 }} />
                      <span>Check-in verified at Reception QR Kiosk today at 06:14 AM.</span>
                    </div>
                  )}

                  <Link
                    to="/demo"
                    className="btn-primary"
                    style={{ width: "100%", padding: "12px", fontSize: "0.9rem", marginTop: "6px" }}
                  >
                    Experience Cashier Desk in Demo
                  </Link>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "30px 10px" }}>
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    color: "#10b981",
                    fontSize: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px"
                  }}>
                    <FaCheckCircle />
                  </div>
                  <h4 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>Seat is 100% Vacant</h4>
                  <p style={{ fontSize: "0.88rem", color: "#64748b", marginBottom: "20px" }}>
                    This seat is free for {activeShift.name}. Walk-in students can be registered immediately at the reception desk.
                  </p>
                  <Link
                    to="/demo"
                    className="btn-green"
                    style={{ width: "100%", padding: "12px", fontSize: "0.9rem" }}
                  >
                    Simulate Counter Admission
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Explanations Below Seat Map */}
      <section className="section-padding" style={{ background: "#ffffff", borderTop: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ maxWidth: "1000px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "2.2rem", marginBottom: "12px" }}>Why Indian Libraries Love This Seat Matrix</h2>
            <p style={{ color: "#475569", fontSize: "1rem" }}>
              Engineered specifically for high-density reading halls with morning, evening, and 24-hour shifts
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            <div className="white-card" style={{ padding: "24px", borderTop: "4px solid #2563eb" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "#1e3a8a" }}>1. Conflict-Free Shift Transitions</h3>
              <p style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.6 }}>
                The software prevents accidental double-bookings. Morning and evening shift students can be assigned the exact same physical desk without any time collisions.
              </p>
            </div>

            <div className="white-card" style={{ padding: "24px", borderTop: "4px solid #10b981" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "#065f46" }}>2. 1-Click Seat Reassignments</h3>
              <p style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.6 }}>
                When a student requests to switch from an AC aisle seat to a window desk, desk staff can reassign their seat with 1 click without messing up historical validity.
              </p>
            </div>

            <div className="white-card" style={{ padding: "24px", borderTop: "4px solid #ef4444" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "#991b1b" }}>3. Visual Expiry Highlights</h3>
              <p style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.6 }}>
                Seats with overdue student subscriptions turn red instantly on the staff floor plan, prompting counter staff to collect renewal fees before allowing entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .seat-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
