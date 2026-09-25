import { useEffect, useState } from "react";
import { FaTrash, FaPlus, FaTimes, FaMoneyBillWave, FaCheckCircle } from "react-icons/fa";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import CustomDatePicker from "../components/CustomDatePicker";

const categoryColors = {
  Rent: { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", bar: "#ef4444" },
  Electricity: { bg: "rgba(245, 158, 11, 0.1)", text: "#f59e0b", bar: "#f59e0b" },
  Internet: { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", bar: "#3b82f6" },
  Maintenance: { bg: "rgba(168, 85, 247, 0.1)", text: "#a855f7", bar: "#a855f7" },
  Other: { bg: "rgba(107, 114, 128, 0.1)", text: "#6b7280", bar: "#6b7280" },
};

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const emptyForm = {
  category: "Other",
  description: "",
  date: getTodayStr(),
  amount: "",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const years = Array.from({ length: 6 }, (_, i) => (currentYear - 5 + i).toString());

const Expenses = () => {
  const { darkMode } = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("1M");
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchExpenses = async () => {
    try {
      const res = await api.get("/expenses");
      if (res.data.success) {
        setExpenses(res.data.data.list);
      }
    } catch (err) {
      showToast("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.date || !formData.amount) {
      showToast("All fields are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/expenses", formData);
      showToast("Expense added successfully");
      setShowModal(false);
      setFormData(emptyForm);
      fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add expense", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, description) => {
    if (!window.confirm(`Delete expense "${description}"?`)) return;
    try {
      await api.delete(`/expenses/${id}`);
      showToast("Expense removed successfully");
      fetchExpenses();
    } catch (err) {
      showToast("Failed to delete expense", "error");
    }
  };

  const cardBg = darkMode ? "#1e293b" : "#ffffff";
  const borderColor = darkMode ? "#334155" : "#e2e8f0";
  const textPrimary = darkMode ? "#f1f5f9" : "#1e293b";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";

  const getFilteredExpenses = () => {
    const now = new Date();
    let startDate;
    if (filter === "1M") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (filter === "3M") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else if (filter === "6M") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    } else if (filter === "1Y") {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else if (filter === "YEAR") {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth) - 1;
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return expenses.filter((e) => {
        const d = new Date(e.date);
        return d >= startDate && d <= endDate;
      });
    }
    return expenses.filter((e) => new Date(e.date) >= startDate);
  };

  const filteredExpenses = getFilteredExpenses();

  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const filteredBreakdown = (() => {
    const catTotals = filteredExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
    const total = Object.values(catTotals).reduce((s, v) => s + v, 0);
    return Object.entries(catTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }));
  })();

  const filterLabel = { "1M": "Last 1 Month", "3M": "Last 3 Months", "6M": "Last 6 Months", "1Y": "Last 1 Year", "YEAR": `${MONTHS[parseInt(selectedMonth) - 1]} ${selectedYear}` }[filter];

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <p style={{ color: textSecondary, fontSize: "18px" }}>Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            background: toast.type === "error" ? "#ef4444" : "#22c55e",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "slideIn 0.2s ease",
          }}
        >
          {toast.type === "error" ? <FaTimes style={{ color: "#ef4444" }} /> : <FaCheckCircle style={{ color: "#22c55e" }} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-title-row">
        <div>
          <h1>Expenses Tracker</h1>
          <p style={{ color: textSecondary, fontSize: "14px", marginTop: "4px" }}>
            Track and analyze your library running costs
          </p>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          <FaPlus style={{ marginRight: "6px" }} /> Add Expense
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
        {["1M", "3M", "6M", "1Y"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              border: `1px solid ${filter === f ? "#2563eb" : borderColor}`,
              background: filter === f ? "#eff6ff" : cardBg,
              color: filter === f ? "#2563eb" : textSecondary,
              transition: "all 0.2s",
            }}
          >
            {f === "1M" ? "Last 1 Month" : f === "3M" ? "Last 3 Months" : f === "6M" ? "Last 6 Months" : "Last 1 Year"}
          </button>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            value={filter === "YEAR" ? selectedYear : ""}
            onChange={(e) => { setSelectedYear(e.target.value); setFilter("YEAR"); }}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: `1px solid ${filter === "YEAR" ? "#2563eb" : borderColor}`,
              background: filter === "YEAR" ? "#eff6ff" : cardBg,
              color: filter === "YEAR" ? "#2563eb" : textSecondary,
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">Select Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {filter === "YEAR" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #2563eb",
                background: "#eff6ff",
                color: "#2563eb",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          )}
        </div>
        <span style={{ fontSize: "13px", color: textSecondary, marginLeft: "auto", fontWeight: 500 }}>
          Showing: <strong style={{ color: textPrimary }}>{filterLabel}</strong> ({filteredExpenses.length} records)
        </span>
      </div>

      {/* Top Cards Section */}
      <div className="responsive-grid-1-5-1" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Left card: Big Red Month Total card */}
        <div
          style={{
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "#ffffff",
            padding: "32px",
            borderRadius: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.2)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div>
            <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold", opacity: 0.85 }}>
              {filter === "YEAR" ? `${MONTHS[parseInt(selectedMonth) - 1]} ${selectedYear}` : filter === "1M" ? "THIS MONTH" : `LAST ${filter.replace("M", " MONTHS").replace("Y", " YEAR")}`} EXPENSES
            </span>
            <div style={{ fontSize: "48px", fontWeight: "800", marginTop: "8px", fontFamily: "Outfit, Inter, sans-serif" }}>
              ₹{filteredTotal.toLocaleString("en-IN")}
            </div>
            <p style={{ fontSize: "13px", marginTop: "12px", opacity: 0.85 }}>
              Based on {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", padding: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaMoneyBillWave style={{ fontSize: "40px", color: "#4ade80" }} />
          </div>
        </div>

        {/* Right card: Breakdown List */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${borderColor}`,
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          }}
        >
          <h3 style={{ fontSize: "13px", color: textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "bold", marginBottom: "20px" }}>
            BREAKDOWN BY CATEGORY
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {["Rent", "Electricity", "Internet", "Maintenance", "Other"].map((cat) => {
              const item = filteredBreakdown.find((b) => b.category === cat) || { amount: 0, percentage: 0 };
              const colors = categoryColors[cat] || categoryColors.Other;
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                    <span style={{ color: textPrimary }}>{cat}</span>
                    <span style={{ color: textPrimary }}>
                      ₹{item.amount.toLocaleString("en-IN")} ({item.percentage}%)
                    </span>
                  </div>
                  <div style={{ background: darkMode ? "#334155" : "#f1f5f9", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: colors.bar,
                        width: `${item.percentage}%`,
                        borderRadius: "999px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction Log Table */}
      <div className="table-card" style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "16px", padding: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: textPrimary, marginBottom: "20px" }}>Transaction Log</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, color: textSecondary, fontSize: "12px", textTransform: "uppercase" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: "600" }}>Category</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: "600" }}>Description</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: "600" }}>Date</th>
                <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: "600" }}>Amount</th>
                <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: "600" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => {
                const colors = categoryColors[exp.category] || categoryColors.Other;
                return (
                  <tr key={exp.id} className="table-row" style={{ borderBottom: `1px solid ${borderColor}`, fontSize: "14px", color: textPrimary }}>
                    <td style={{ padding: "16px" }}>
                      <span
                        style={{
                          background: colors.bg,
                          color: colors.text,
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontWeight: "bold",
                          fontSize: "12px",
                          display: "inline-block",
                        }}
                      >
                        • {exp.category}
                      </span>
                    </td>
                    <td style={{ padding: "16px", maxWidth: "320px", wordBreak: "break-word" }}>{exp.description}</td>
                    <td style={{ padding: "16px", color: textSecondary }}>
                      {new Date(exp.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "16px", textAlign: "right", fontWeight: "700", color: "#ef4444" }}>
                      ₹{exp.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <button
                        onClick={() => handleDelete(exp.id, exp.description)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13px",
                          fontWeight: "600",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <FaTrash size={12} /> Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: textSecondary }}>
                    No expenses found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal dialog */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: cardBg,
              border: `1px solid ${borderColor}`,
              borderRadius: "16px",
              padding: "28px",
              width: "95vw",
              maxWidth: "480px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              animation: "scaleUp 0.15s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: textPrimary, margin: 0 }}>Add Expense</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: textSecondary, cursor: "pointer", fontSize: "16px" }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13px", color: textPrimary }}>
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${borderColor}`,
                    background: darkMode ? "#0f172a" : "#ffffff",
                    color: textPrimary,
                    outline: "none",
                  }}
                >
                  <option value="Rent">Rent</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Internet">Internet</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13px", color: textPrimary }}>
                  Description *
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g. Monthly rent, office cleaning supplies"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${borderColor}`,
                    background: darkMode ? "#0f172a" : "#ffffff",
                    color: textPrimary,
                    outline: "none",
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontWeight: "600", fontSize: "13px", color: textPrimary }}>
                    Date *
                  </label>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", background: darkMode ? "rgba(34,197,94,0.15)" : "#f0fdf4", padding: "1px 6px", borderRadius: "4px" }}>
                    Current Date (Auto)
                  </span>
                </div>
                <div style={{ cursor: "not-allowed" }}>
                  <CustomDatePicker
                    name="date"
                    value={formData.date || getTodayStr()}
                    readOnly
                    placeholder="Expense Date"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13px", color: textPrimary }}>
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  name="amount"
                  placeholder="e.g. 5000"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${borderColor}`,
                    background: darkMode ? "#0f172a" : "#ffffff",
                    color: textPrimary,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="secondary-btn"
                  style={{ padding: "10px 20px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="primary-btn"
                  style={{ padding: "10px 20px" }}
                >
                  {submitting ? "Adding..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
