import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaRupeeSign } from "react-icons/fa";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const years = Array.from({ length: 6 }, (_, i) =>
  (currentYear - 5 + i).toString()
);

const RevenueAnalysisReport = () => {
  const { darkMode } = useTheme();
  const [fromYear, setFromYear] = useState(currentYear.toString());
  const [fromMonth, setFromMonth] = useState("1");
  const [toYear, setToYear] = useState(currentYear.toString());
  const [toMonth, setToMonth] = useState("12");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (fy, fm, ty, tm) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/reports/revenue?from_year=${fy}&from_month=${fm}&to_year=${ty}&to_month=${tm}`
      );
      setData(res.data.data);
    } catch (error) {
      console.log("Revenue report error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(fromYear, fromMonth, toYear, toMonth);
  }, []);

  const handleFilter = () => {
    fetchReport(fromYear, fromMonth, toYear, toMonth);
  };

  const setQuickFilter = (months) => {
    const end = new Date();
    const start = new Date(
      end.getFullYear(),
      end.getMonth() - (months - 1),
      1
    );
    setFromYear(start.getFullYear().toString());
    setFromMonth((start.getMonth() + 1).toString());
    setToYear(end.getFullYear().toString());
    setToMonth((end.getMonth() + 1).toString());
    fetchReport(
      start.getFullYear().toString(),
      (start.getMonth() + 1).toString(),
      end.getFullYear().toString(),
      (end.getMonth() + 1).toString()
    );
  };

  const monthlyData = data?.monthlyData || [];
  const totalRevenue = data?.totalRevenue || 0;
  const totalExpenses = data?.totalExpenses || 0;
  const totalProfit = data?.totalProfit || 0;
  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);

  const labels = monthlyData.map(
    (d) => `${MONTHS[d.month - 1]} ${d.year}`
  );

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              to="/reports"
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
              <h1>Revenue Analysis</h1>
              <p>Analyze revenue across custom date ranges</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="form-card"
        style={{
          display: "flex",
          gap: "24px",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div className="form-group" style={{ minWidth: "70px" }}>
            <label>From Year</label>
            <select
              value={fromYear}
              onChange={(e) => setFromYear(e.target.value)}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: "80px" }}>
            <label>Month</label>
            <select
              value={fromMonth}
              onChange={(e) => setFromMonth(e.target.value)}
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span
          style={{ color: "#94a3b8", fontWeight: 600, paddingBottom: "10px" }}
        >
          →
        </span>

        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div className="form-group" style={{ minWidth: "70px" }}>
            <label>To Year</label>
            <select
              value={toYear}
              onChange={(e) => setToYear(e.target.value)}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: "80px" }}>
            <label>Month</label>
            <select
              value={toMonth}
              onChange={(e) => setToMonth(e.target.value)}
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="primary-btn"
          onClick={handleFilter}
          disabled={loading}
        >
          Apply
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <button
          className="secondary-btn"
          style={{ fontWeight: 600, background: (fromMonth === "1" && toMonth === "12" && fromYear === toYear) ? (darkMode ? "rgba(59,130,246,0.2)" : "#eff6ff") : undefined, borderColor: (fromMonth === "1" && toMonth === "12" && fromYear === toYear) ? "#3b82f6" : undefined }}
          onClick={() => {
            setFromYear(currentYear.toString());
            setFromMonth("1");
            setToYear(currentYear.toString());
            setToMonth("12");
            fetchReport(currentYear.toString(), "1", currentYear.toString(), "12");
          }}
        >
          Full Year {currentYear} (Jan - Dec)
        </button>
        <button className="secondary-btn" onClick={() => setQuickFilter(1)}>
          Last 1 Month
        </button>
        <button className="secondary-btn" onClick={() => setQuickFilter(3)}>
          Last 3 Months
        </button>
        <button className="secondary-btn" onClick={() => setQuickFilter(6)}>
          Last 6 Months
        </button>
        <button className="secondary-btn" onClick={() => setQuickFilter(12)}>
          Last 1 Year
        </button>
      </div>

      {loading ? (
        <p className="empty-text">Loading revenue data...</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "24px"
            }}
          >
            <div className="stats-card">
              <div className="card-icon blue">
                <FaRupeeSign />
              </div>
              <div>
                <p>Total Revenue</p>
                <h2 style={{ color: "#22c55e" }}>₹{totalRevenue.toLocaleString()}</h2>
              </div>
            </div>
            <div className="stats-card">
              <div className="card-icon red">
                <FaRupeeSign />
              </div>
              <div>
                <p>Total Expenses</p>
                <h2 style={{ color: "#ef4444" }}>₹{totalExpenses.toLocaleString()}</h2>
              </div>
            </div>
            <div className="stats-card">
              <div className="card-icon green">
                <FaRupeeSign />
              </div>
              <div>
                <p>Total Profit</p>
                <h2 style={{ color: totalProfit >= 0 ? "#22c55e" : "#ef4444" }}>₹{totalProfit.toLocaleString()}</h2>
              </div>
            </div>
            <div className="stats-card">
              <div className="card-icon purple">
                <FaRupeeSign />
              </div>
              <div>
                <p>Period</p>
                <h2 style={{ fontSize: "16px", marginTop: "4px" }}>
                  {MONTHS[data.fromMonth - 1]} {data.fromYear} –{" "}
                  {MONTHS[data.toMonth - 1]} {data.toYear}
                </h2>
              </div>
            </div>
          </div>

          <div
            className="chart-container"
            style={{
              background: darkMode ? "#1e293b" : "#FCFBF9",
              padding: "24px",
              borderRadius: "12px",
              marginBottom: "24px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
            }}
          >
            <h3
              style={{
                color: darkMode ? "#f8fafc" : "#1e293b",
                fontSize: "18px",
                marginBottom: "20px",
              }}
            >
              Monthly Revenue
            </h3>
            <div
              style={{
                height: "260px",
                display: "flex",
                gap: "8px",
                borderBottom: darkMode ? "2px solid rgba(255,255,255,0.1)" : "2px solid #e2e8f0",
                paddingBottom: "10px",
                position: "relative",
                width: "100%",
                overflowX: "auto",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "calc(100% - 10px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  color: "#94a3b8",
                  fontSize: "12px",
                  paddingBottom: "12px",
                }}
              >
                <span>₹{maxRevenue.toLocaleString()}</span>
                <span>₹{Math.round(maxRevenue / 2).toLocaleString()}</span>
                <span>₹0</span>
              </div>
              <div
                className="chart-bars-container"
                style={{
                  marginLeft: "65px",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "16px",
                  width: "calc(100% - 65px)",
                  minWidth: monthlyData.length > 6 ? `${monthlyData.length * 60}px` : "100%",
                  height: "100%",
                  paddingTop: "28px",
                }}
              >
                {monthlyData.map((d, i) => {
                  const height =
                    d.revenue > 0
                      ? Math.max((d.revenue / maxRevenue) * 100, 4)
                      : 4;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100%",
                        justifyContent: "flex-end",
                        minWidth: "48px",
                      }}
                    >
                      {d.revenue > 0 && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: darkMode ? "#60a5fa" : "#2563eb",
                            whiteSpace: "nowrap",
                            marginBottom: "4px",
                            background: darkMode ? "rgba(59, 130, 246, 0.2)" : "#eff6ff",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: darkMode ? "1px solid rgba(59, 130, 246, 0.3)" : "none",
                          }}
                        >
                          ₹{Math.round(d.revenue).toLocaleString("en-IN")}
                        </span>
                      )}
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "46px",
                          height: `${height}%`,
                          background:
                            d.revenue > 0
                              ? "linear-gradient(180deg, #3b82f6, #2563eb)"
                              : (darkMode ? "#334155" : "#e2e8f0"),
                          borderRadius: "6px 6px 0 0",
                          transition: "height 0.3s",
                          minHeight: "4px",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          color: darkMode ? "#94a3b8" : "#64748b",
                          marginTop: "8px",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {labels[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="table-card">
            <h3
              style={{
                marginBottom: "16px",
                fontSize: "16px",
                color: darkMode ? "#f8fafc" : "#1e293b",
              }}
            >
              Revenue Breakdown
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Revenue</th>
                  <th>Expenses</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((d, i) => (
                  <tr key={i}>
                    <td>
                      {MONTHS[d.month - 1]} {d.year}
                    </td>
                    <td>
                      <span style={{ color: "#22c55e", fontWeight: "600" }}>₹{(d.revenue || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <span style={{ color: "#ef4444", fontWeight: "600" }}>₹{(d.expenses || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <span style={{ color: (d.profit || 0) >= 0 ? "#22c55e" : "#ef4444", fontWeight: "700" }}>
                        ₹{(d.profit || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
                {monthlyData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-text">
                      No data for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: darkMode ? "rgba(255,255,255,0.04)" : "#f8fafc" }}>
                  <td style={{ fontWeight: 700, fontSize: "15px" }}>Total</td>
                  <td style={{ fontWeight: 700, fontSize: "15px", color: "#22c55e" }}>
                    ₹{totalRevenue.toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 700, fontSize: "15px", color: "#ef4444" }}>
                    ₹{totalExpenses.toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 700, fontSize: "15px", color: totalProfit >= 0 ? "#22c55e" : "#ef4444" }}>
                    ₹{totalProfit.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueAnalysisReport;
