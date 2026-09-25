import { useEffect, useState } from "react";
import api from "../api/axios";
import { formatTime } from "../utils/timeUtils";
import { useTheme } from "../context/ThemeContext";

const DonutChart = ({ available, total }) => {
  const pct = total > 0 ? (available / total) * 100 : 0;
  const circumference = 2 * Math.PI * 15.9;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    pct > 50 ? "#10b981" : pct > 25 ? "#f59e0b" : "#ef4444";

  return (
    <svg width="80" height="80" viewBox="0 0 36 36">
      <circle
        className="donut-bg-circle"
        cx="18" cy="18" r="15.9"
        fill="none" stroke="#e2e8f0" strokeWidth="3"
      />
      <circle
        cx="18" cy="18" r="15.9"
        fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
      <text className="donut-text" x="18" y="18" textAnchor="middle" dominantBaseline="central"
        fontSize="7" fontWeight="700" fill="#1e293b">
        {Math.round(pct)}%
      </text>
      <text x="18" y="24" textAnchor="middle" dominantBaseline="central"
        fontSize="4.5" fill="#94a3b8">
        avail
      </text>
    </svg>
  );
};

const SeatAvailability = ({ onShiftClick }) => {
  const { timeFormat } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/dashboard/seat-availability");
        setData(res.data.data);
      } catch (err) {
        console.log("Seat availability error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="seat-avail-card">
        <h3>Seat Availability</h3>
        <div className="seat-avail-loading">Loading...</div>
      </div>
    );
  }

  if (!data || data.shifts.length === 0) {
    return (
      <div className="seat-avail-card">
        <h3>Seat Availability</h3>
        <div className="seat-avail-empty">No shifts configured</div>
      </div>
    );
  }

  return (
    <div className="seat-avail-card">
      <h3>Seat Availability</h3>
      <div className="shifts-container">
        {data.shifts.map((shift) => {
          const available = shift.total_seats - shift.occupied_seats;
          return (
            <div
              className="shift-card"
              key={shift.shift_id}
              onClick={() => onShiftClick(shift)}
            >
              <DonutChart available={available} total={shift.total_seats} />
              <div className="shift-info">
                <div className="shift-name">{shift.shift_name}</div>
                <div className="shift-time">
                  {formatTime(shift.start_time, timeFormat)} - {formatTime(shift.end_time, timeFormat)}
                </div>
                <div className="shift-count">
                  {available} of {shift.total_seats} available
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeatAvailability;
