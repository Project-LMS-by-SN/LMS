import { useState } from "react";
import { Link } from "react-router-dom";
import { FaClock, FaCheckCircle, FaUserCheck, FaInfoCircle, FaCalendarAlt, FaShieldAlt, FaArrowRight, FaExclamationCircle } from "react-icons/fa";

const shifts = [
  { id: "morning", name: "Morning Shift", time: "06:00 AM - 12:00 PM", occupiedIndices: [0, 1, 2, 4, 5, 8, 9, 10, 12, 14, 15, 18, 19, 21, 22, 25, 27, 28], expiredIndices: [8, 22] },
  { id: "afternoon", name: "Afternoon Shift", time: "12:00 PM - 05:00 PM", occupiedIndices: [1, 3, 5, 6, 7, 10, 11, 13, 16, 17, 20, 22, 23, 26, 29], expiredIndices: [11] },
  { id: "evening", name: "Evening Shift", time: "05:00 PM - 10:00 PM", occupiedIndices: [0, 2, 4, 6, 8, 9, 12, 14, 15, 17, 18, 19, 21, 24, 25, 27, 28, 29], expiredIndices: [4, 19] },
  { id: "night", name: "Night Shift", time: "10:00 PM - 06:00 AM", occupiedIndices: [0, 3, 7, 10, 13, 15, 18, 22, 25, 28], expiredIndices: [7] },
  { id: "fullday", name: "24-Hour / Full Day", time: "24 Hours Dedicated Seat", occupiedIndices: [0, 4, 8, 12, 16, 20, 24, 28], expiredIndices: [16] },
];

const mockStudents = [
  { name: "Aman Verma", course: "UPSC Aspirant", validity: "28 Nov 2026", due: "₹0 (Paid)", status: "Active" },
  { name: "Pooja Sharma", course: "Chartered Accountant", validity: "15 Dec 2026", due: "₹0 (Paid)", status: "Active" },
  { name: "Rohan Gupta", course: "IIT-JEE / NEET", validity: "Expired Yesterday", due: "₹800 (Due)", status: "Expired" },
  { name: "Sneha Patel", course: "State Judiciary", validity: "10 Nov 2026", due: "₹0 (Paid)", status: "Active" },
  { name: "Vikram Rathore", course: "SSC CGL / Banking", validity: "22 Dec 2026", due: "₹0 (Paid)", status: "Active" },
  { name: "Ananya Iyer", course: "Medical Resident", validity: "Expired (3 Days)", due: "₹1,000 (Due)", status: "Expired" }
];

export default function LiveSeatSimulator() {
  const [activeShift, setActiveShift] = useState(shifts[0]);
  const [selectedSeat, setSelectedSeat] = useState({
    seatNumber: "A01",
    isOccupied: true,
    isExpired: false,
    student: mockStudents[0]
  });

  const totalSeats = 30;
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
    <section id="shifts-seats" className="section-padding" style={{ background: "#ffffff", borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="container">
        {/* Section Heading */}
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 48px" }}>
          <div className="badge-blue" style={{ marginBottom: "14px" }}>
            <FaClock /> Multi-Shift & 10-Column Seat Engine
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", marginBottom: "16px", color: "#0f172a" }}>
            Test the Interactive Seat Allocation Engine
          </h2>
          <p style={{ color: "#475569", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Never double-book a seat again. Select any shift below to watch our live matrix 
            instantly adapt to student shifts, validities, and counter check-ins.
          </p>
        </div>

        {/* Shift Selection Pills */}
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
                  padding: "10px 20px",
                  borderRadius: "14px",
                  fontSize: "0.88rem",
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

        {/* Simulator Grid & Details Card */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 1.2fr",
          gap: "28px",
          alignItems: "start"
        }} className="simulator-grid-layout">
          {/* Seat Grid Frame */}
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
                <h3 style={{ fontSize: "1.18rem", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
                  Reading Hall Alpha — Shift: {activeShift.name}
                </h3>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  Click any seat below to inspect student validity and fee status
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
                  {expiredCount} Due
                </span>
              </div>
            </div>

            {/* 10-Column Seat Matrix */}
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
                    title={`Seat ${seatCode}`}
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
              <span style={{ color: "#2563eb", fontWeight: "700" }}>⚡ Shift Transition Buffer: 15 Mins</span>
            </div>
          </div>

          {/* Seat Details Popover Card */}
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
                  INSPECTED SEAT
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
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", marginBottom: "4px" }}>STUDENT NAME</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#0f172a" }}>
                    {selectedSeat.student.name}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: "600", marginTop: "2px" }}>
                    {selectedSeat.student.course}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{
                    padding: "12px",
                    borderRadius: "12px",
                    background: selectedSeat.isExpired ? "#fef2f2" : "#f0fdf4",
                    border: `1px solid ${selectedSeat.isExpired ? "#fecaca" : "#bbf7d0"}`
                  }}>
                    <div style={{ fontSize: "0.75rem", color: selectedSeat.isExpired ? "#991b1b" : "#065f46", fontWeight: "700", marginBottom: "2px" }}>VALID TILL</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "800", color: selectedSeat.isExpired ? "#dc2626" : "#059669" }}>
                      {selectedSeat.student.validity}
                    </div>
                  </div>

                  <div style={{
                    padding: "12px",
                    borderRadius: "12px",
                    background: selectedSeat.isExpired ? "#fef2f2" : "#eff6ff",
                    border: `1px solid ${selectedSeat.isExpired ? "#fecaca" : "#bfdbfe"}`
                  }}>
                    <div style={{ fontSize: "0.75rem", color: selectedSeat.isExpired ? "#991b1b" : "#1e40af", fontWeight: "700", marginBottom: "2px" }}>DUE BALANCE</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "800", color: selectedSeat.isExpired ? "#dc2626" : "#2563eb" }}>
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
                    gap: "8px",
                    fontWeight: "600"
                  }}>
                    <FaExclamationCircle /> Automated WhatsApp fee reminder queued
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
                    gap: "8px",
                    fontWeight: "600"
                  }}>
                    <FaUserCheck /> Verified at QR Attendance Kiosk today at 06:14 AM
                  </div>
                )}
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
                <h4 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "6px", color: "#0f172a" }}>Seat is 100% Vacant</h4>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "20px" }}>
                  This seat is available for {activeShift.name}. You can assign a new student or take counter walk-in admission.
                </p>
                <Link
                  to="/demo"
                  className="btn-green"
                  style={{ width: "100%", fontSize: "0.9rem", justifyContent: "center" }}
                >
                  Book Walk-in Admission Demo
                </Link>
              </div>
            )}

            <div style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Want full custom seat maps?
              </span>
              <Link
                to="/shifts-seats"
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "800",
                  color: "#2563eb"
                }}
              >
                View Dedicated Seat Page &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .simulator-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
