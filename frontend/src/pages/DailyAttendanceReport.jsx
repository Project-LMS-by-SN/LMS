import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaCalendarAlt } from "react-icons/fa";
import api from "../api/axios";
import CustomDatePicker from "../components/CustomDatePicker";

const DailyAttendanceReport = () => {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); }
    catch { return {}; }
  })();

  const getRolePrefix = () => {
    if (!user || !user.role) return "";
    const roleSegment = user.role.toLowerCase();
    const nameSegment = (user.name || "user").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `/${roleSegment}/${nameSegment}`;
  };
  const prefix = getRolePrefix();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (date) => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/daily-attendance?date=${date}`);
      setRecords(res.data.data);
    } catch (error) {
      console.log("Daily attendance report error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, []);

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchReport(date);
  };

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              to={`${prefix}/reports`}
              style={{
                color: "#64748b",
                fontSize: "20px",
                display: "flex",
                textDecoration: "none",
              }}
            >
              <FaArrowLeft />
            </Link>
            <div>
              <h1>Daily Attendance Report</h1>
              <p>View attendance records for a specific date</p>
            </div>
          </div>
        </div>
        <div style={{ width: "200px" }}>
          <CustomDatePicker
            value={selectedDate}
            min={(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0]; })()}
            max={new Date().toISOString().split("T")[0]}
            onChange={handleDateChange}
            placeholder="Select date"
          />
        </div>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 16px",
        borderRadius: "10px",
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        color: "#1e40af",
        fontSize: "13px",
        marginBottom: "20px"
      }}>
        <span>
          <strong>Note:</strong> Daily attendance records are saved for <strong>30 days</strong>. Records older than 30 days are automatically deleted.
        </span>
      </div>

      <div className="table-card">
        {loading ? (
          <p className="empty-text">Loading...</p>
        ) : records.length === 0 ? (
          <p className="empty-text">
            No attendance records found for {selectedDate}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student Code</th>
                <th>Full Name</th>
                <th>Shift</th>
                <th>Seat</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i}>
                  <td>
                    <strong>{r.student_code}</strong>
                  </td>
                  <td>{r.full_name}</td>
                  <td>{r.shift_name}</td>
                  <td>{r.seat_number || "-"}</td>
                  <td>{r.check_in_time || "-"}</td>
                  <td>{r.check_out_time || "-"}</td>
                  <td>
                    <span
                      className={
                        r.status === "PRESENT" ? "status-badge" : "danger-badge"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: "12px", fontSize: "13px", color: "#94a3b8" }}>
        Total records: {records.length}
      </div>
    </div>
  );
};

export default DailyAttendanceReport;
