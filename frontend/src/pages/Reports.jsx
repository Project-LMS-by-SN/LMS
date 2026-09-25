import { Link } from "react-router-dom";
import { FaClipboardList } from "react-icons/fa";

const Reports = () => {
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

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <h1>Reports</h1>
          <p>Access detailed reports and analytics</p>
        </div>
      </div>

      <div
        className="stats-grid responsive-grid-1-1"
        style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}
      >
        <Link to={`${prefix}/attendance`} style={{ textDecoration: "none" }}>
          <div
            className="stats-card"
            style={{ cursor: "pointer", padding: "32px 24px", height: "100%" }}
          >
            <div className="card-icon green">
              <FaClipboardList />
            </div>
            <div>
              <p>Attendance Manager & QR Scanner</p>
              <h2 style={{ fontSize: "18px", marginTop: "4px" }}>
                Mark manual check-in/out & scan entrance QR code
              </h2>
            </div>
          </div>
        </Link>

        <Link to={`${prefix}/reports/daily-attendance`} style={{ textDecoration: "none" }}>
          <div
            className="stats-card"
            style={{ cursor: "pointer", padding: "32px 24px", height: "100%" }}
          >
            <div className="card-icon blue">
              <FaClipboardList />
            </div>
            <div>
              <p>Daily Attendance Logs</p>
              <h2 style={{ fontSize: "18px", marginTop: "4px" }}>
                View detailed attendance records for any specific date
              </h2>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Reports;
