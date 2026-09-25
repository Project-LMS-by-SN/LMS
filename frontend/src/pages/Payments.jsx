import { useEffect, useState } from "react";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import { formatTime } from "../utils/timeUtils";
import { FaSearch, FaTimes, FaWallet, FaReceipt, FaHashtag, FaClock, FaUser } from "react-icons/fa";
import CustomDatePicker from "../components/CustomDatePicker";

const Payments = () => {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); }
    catch { return {}; }
  })();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const { darkMode, timeFormat } = useTheme();

  const DATE_FILTERS = [
    { label: "All time", value: "all" },
    { label: "Today", value: "today" },
    { label: "30 Days", value: "30d" },
    { label: "3 Months", value: "3m" },
    { label: "6 Months", value: "6m" },
    { label: "1 Year", value: "1y" },
    { label: "Custom", value: "custom" },
  ];

  const getFilterDate = (filter) => {
    const now = new Date();
    switch (filter) {
      case "today": { const d = new Date(now); d.setHours(0,0,0,0); return d; }
      case "30d": return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case "3m": return new Date(now - 90 * 24 * 60 * 60 * 1000);
      case "6m": return new Date(now - 180 * 24 * 60 * 60 * 1000);
      case "1y": return new Date(now - 365 * 24 * 60 * 60 * 1000);
      case "custom": {
        if (!customDate) return null;
        const d = new Date(customDate);
        d.setHours(0,0,0,0);
        return d;
      }
      default: return null;
    }
  };

  const fetchData = async () => {
    try {
      const res = await api.get("/payments");
      setPayments(res.data.data || []);
    } catch (error) {
      console.log("Payments fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPayments = payments.filter((p) => {
    // Search query filter (Student Name, Code, Invoice No, UTR, Remarks, Mode)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.full_name?.toLowerCase().includes(q);
      const matchCode = p.student_code?.toLowerCase().includes(q);
      const matchInvoice = p.invoice_no?.toLowerCase().includes(q);
      const matchUtr = p.utr_number?.toLowerCase().includes(q);
      const matchRemarks = p.remarks?.toLowerCase().includes(q);
      const matchMode = p.mode_name?.toLowerCase().includes(q);

      if (!matchName && !matchCode && !matchInvoice && !matchUtr && !matchRemarks && !matchMode) {
        return false;
      }
    }

    // Date filter
    if (dateFilter === "custom") {
      if (!customDate) return true;
      const recordDateStr = p.payment_date ? p.payment_date.substring(0, 10) : "";
      return recordDateStr === customDate;
    }
    const cutoff = getFilterDate(dateFilter);
    if (!cutoff) return true;
    const recordDateStr = p.payment_date ? p.payment_date.substring(0, 10) : "";
    const recordDate = new Date(recordDateStr);
    return recordDate >= cutoff;
  });

  const totalRevenue = filteredPayments.reduce(
    (sum, p) => sum + Number(p.amount_received),
    0
  );

  const cardBg = darkMode ? "#1e293b" : "#ffffff";
  const border = darkMode ? "#334155" : "#e2e8f0";
  const textPrimary = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const inputBg = darkMode ? "#0f172a" : "#ffffff";

  if (loading) {
    return (
      <div className="page" style={{ padding: "40px", textAlign: "center", color: textMuted }}>
        Loading payment history...
      </div>
    );
  }

  return (
    <div className="page">
      {/* Page Title */}
      <div className="page-title-row" style={{ marginBottom: "20px" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaWallet style={{ color: "#3b82f6" }} /> Payment History & Search
          </h1>
          <p style={{ color: textMuted, marginTop: "4px" }}>
            Search, filter, and review completed payment transactions · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Top Search & Date Filters Row */}
      <div style={{ display: "flex", gap: "14px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Payment Live Search Input */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: inputBg, border: `1px solid ${border}`, borderRadius: "10px",
          padding: "8px 14px", flex: 1, minWidth: "280px", maxWidth: "460px",
        }}>
          <FaSearch style={{ color: textMuted, fontSize: "14px" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, code, invoice no, UTR..."
            style={{ border: "none", outline: "none", background: "transparent", fontSize: "14px", color: textPrimary, width: "100%" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ border: "none", background: "transparent", color: textMuted, cursor: "pointer" }}
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Date Filter Pills */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginLeft: "auto", alignItems: "center" }}>
          {DATE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setDateFilter(f.value)}
              style={{
                padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                border: `2px solid ${dateFilter === f.value ? "#2563eb" : border}`,
                background: dateFilter === f.value ? (darkMode ? "rgba(37,99,235,0.2)" : "#eff6ff") : cardBg,
                color: dateFilter === f.value ? "#2563eb" : textMuted,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
          {dateFilter === "custom" && (
            <div style={{ width: "190px" }}>
              <CustomDatePicker
                align="right"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                placeholder="Pick date"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: user.role !== "STAFF" ? "1fr 1fr" : "1fr", gap: "16px", marginBottom: "24px" }}>
        <div className="stats-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: "12px", padding: "18px 20px" }}>
          <div>
            <p style={{ color: textMuted, fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Total Payments Recorded</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#3b82f6", marginTop: "4px", lineHeight: 1 }}>{filteredPayments.length}</h2>
          </div>
        </div>
        {user.role !== "STAFF" && (
          <div className="stats-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: "12px", padding: "18px 20px" }}>
            <div>
              <p style={{ color: textMuted, fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Total Filtered Revenue</p>
              <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#16a34a", marginTop: "4px", lineHeight: 1 }}>₹{totalRevenue.toLocaleString()}</h2>
            </div>
          </div>
        )}
      </div>

      {/* Payment History Table */}
      <div className="table-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: "14px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ color: textPrimary, fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <FaReceipt style={{ color: "#3b82f6" }} /> Payment Transactions ({filteredPayments.length})
          </h3>
          {searchQuery && (
            <span style={{ fontSize: "12px", color: textMuted, fontStyle: "italic" }}>
              Filtered by "{searchQuery}"
            </span>
          )}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${border}`, textAlign: "left", fontSize: "12px", color: textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <th style={{ padding: "10px 12px" }}>Invoice</th>
              <th style={{ padding: "10px 12px" }}>Student Member</th>
              <th style={{ padding: "10px 12px" }}>Code</th>
              <th style={{ padding: "10px 12px" }}>Mode</th>
              <th style={{ padding: "10px 12px" }}>Reference / Reason</th>
              <th style={{ padding: "10px 12px" }}>Amount</th>
              <th style={{ padding: "10px 12px" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id} style={{ borderBottom: `1px solid ${border}`, fontSize: "14px" }}>
                <td style={{ padding: "12px" }}>
                  <strong style={{ color: textPrimary, fontWeight: 700 }}>{payment.invoice_no}</strong>
                </td>
                <td style={{ padding: "12px", color: textPrimary, fontWeight: 600 }}>{payment.full_name || "N/A"}</td>
                <td style={{ padding: "12px", color: textMuted }}>{payment.student_code || "N/A"}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700,
                    background: darkMode ? "rgba(59,130,246,0.15)" : "#eff6ff",
                    color: "#2563eb", padding: "3px 8px", borderRadius: "6px", display: "inline-block",
                  }}>
                    {payment.mode_name}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  {payment.utr_number && (
                    <div style={{ fontSize: "12px", color: textMuted }}>UTR: {payment.utr_number}</div>
                  )}
                  <span style={{ fontSize: "12px", fontWeight: 600, color: payment.remarks?.includes("Admission") ? "#2563eb" : "#16a34a" }}>
                    {payment.remarks || "(Fee Renewal)"}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <strong style={{ color: "#16a34a", fontSize: "15px", fontWeight: 800 }}>+₹{payment.amount_received}</strong>
                </td>
                <td style={{ padding: "12px", color: textMuted, fontSize: "13px" }}>
                  <div style={{ fontWeight: 600, color: textPrimary }}>
                    {payment.payment_date ? payment.payment_date.split(" ")[0] : ""}
                  </div>
                  <div style={{ fontSize: "11px", color: textMuted, marginTop: "2px" }}>
                    {formatTime(payment.payment_date ? payment.payment_date.split(" ").slice(1).join(" ") : "", timeFormat)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPayments.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: textMuted, fontSize: "14px" }}>
            No payment transactions match your search or date filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
