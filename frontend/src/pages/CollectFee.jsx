import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import { formatTime } from "../utils/timeUtils";
import CustomDatePicker from "../components/CustomDatePicker";
import {
  FaCreditCard,
  FaSearch,
  FaUserCheck,
  FaReceipt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimes,
  FaPrint,
  FaHistory,
  FaClock,
  FaHashtag,
  FaArrowRight,
} from "react-icons/fa";

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const generateInvoiceNo = () => {
  const prefix = "INV";
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const timeStr = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${dateStr}-${timeStr}-${randomPart}`;
};

const CollectFee = () => {
  const { darkMode, timeFormat } = useTheme();
  const [students, setStudents] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Student Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentValidity, setStudentValidity] = useState(null);
  const [validityLoading, setValidityLoading] = useState(false);
  const searchRef = useRef(null);

  // Form Fields
  const [renewalPlanFee, setRenewalPlanFee] = useState(0);
  const [paymentModeId, setPaymentModeId] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [invoiceNo, setInvoiceNo] = useState(generateInvoiceNo());
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(getTodayStr());
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const [studentRes, modeRes, paymentRes] = await Promise.all([
        api.get("/students"),
        api.get("/payment-modes"),
        api.get("/payments"),
      ]);
      setStudents(studentRes.data.data || []);
      const rawModes = modeRes.data.data || [];
      const modes = rawModes.length > 0
        ? rawModes
        : [
            { id: 1, mode_name: "Cash" },
            { id: 2, mode_name: "UPI" },
            { id: 3, mode_name: "Card" },
          ];
      setPaymentModes(modes);
      if (modes.length > 0) setPaymentModeId(modes[0].id.toString());
      
      const allPayments = paymentRes.data.data || [];
      setRecentPayments(allPayments.slice(0, 5));
    } catch (err) {
      showToast("Failed to load initial data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const q = query.toLowerCase();
    const filtered = students.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(q) ||
        s.mobile?.includes(q) ||
        s.student_code?.toLowerCase().includes(q) ||
        s.reg_no?.toLowerCase().includes(q)
    );
    setSearchResults(filtered);
    setShowResults(true);
  };

  // Select Student from Dropdown
  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.full_name} (${student.student_code || student.mobile})`);
    setShowResults(false);
    setValidityLoading(true);

    try {
      const res = await api.get(`/students/${student.id}/profile`);
      if (res.data.success && res.data.data) {
        const val = res.data.data.validity;
        const shifts = res.data.data.shift_assignments || [];
        setStudentValidity(val);
        
        // Fee Plan Renewal Amount (strictly fee plan amount, WITHOUT one-time admission registration fee)
        let planRate = 0;
        if (val) {
          const basePlanAmount = val.plan_amount !== undefined && val.plan_amount !== null
            ? Number(val.plan_amount)
            : Number(val.total_amount || 0);

          const shiftMultiplier = (val.access_type === "UNRESERVED" && shifts.length > 1)
            ? shifts.length
            : 1;

          planRate = basePlanAmount * shiftMultiplier;
        }
        setRenewalPlanFee(planRate);

        // Auto fill amount with due amount if positive, else fee plan renewal rate
        const due = student.due_amount || (val ? val.due_amount : 0);
        if (due > 0) {
          setAmountReceived(due.toString());
        } else if (planRate > 0) {
          setAmountReceived(planRate.toString());
        } else if (val && val.total_amount) {
          setAmountReceived(val.total_amount.toString());
        } else {
          setAmountReceived("");
        }
      }
    } catch {
      showToast("Failed to load student details", "error");
    } finally {
      setValidityLoading(false);
    }
  };

  // Close search results dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Submit Payment Collection
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      showToast("Please search and select a student first", "error");
      return;
    }
    if (!amountReceived || parseFloat(amountReceived) <= 0) {
      showToast("Enter a valid payment amount", "error");
      return;
    }
    if (!paymentModeId) {
      showToast("Select a payment mode", "error");
      return;
    }
    if (!invoiceNo) {
      showToast("Invoice number is required", "error");
      return;
    }

    setSubmitting(true);
    const finalRemarks = remarks.trim() || "(Fee Renewal)";
    try {
      let payload;
      if (studentValidity && studentValidity.id) {
        payload = {
          validity_id: studentValidity.id,
          payment_mode_id: parseInt(paymentModeId, 10),
          invoice_no: invoiceNo,
          amount_received: parseFloat(amountReceived),
          payment_date: paymentDate,
          utr_number: utrNumber.trim() || null,
          remarks: finalRemarks,
        };
        await api.post("/payments/create", payload);
      } else {
        payload = {
          student_id: selectedStudent.id,
          fee_plan_id: 1,
          start_date: getTodayStr(),
          access_type: selectedStudent.access_type || "UNRESERVED",
          payment_mode_id: parseInt(paymentModeId, 10),
          invoice_no: invoiceNo,
          amount_received: parseFloat(amountReceived),
          payment_date: paymentDate,
          utr_number: utrNumber.trim() || null,
          remarks: finalRemarks,
        };
        await api.post("/payments/record", payload);
      }

      showToast(`Payment of ₹${amountReceived} collected successfully!`);
      
      // Reset Form State
      setSelectedStudent(null);
      setStudentValidity(null);
      setRenewalPlanFee(0);
      setSearchQuery("");
      setAmountReceived("");
      setUtrNumber("");
      setRemarks("");
      setInvoiceNo(generateInvoiceNo());
      
      // Refresh Data
      fetchData();
    } catch (err) {
      try {
        const fallbackPayload = {
          student_id: selectedStudent.id,
          fee_plan_id: (studentValidity && studentValidity.fee_plan_id) || 1,
          start_date: getTodayStr(),
          access_type: selectedStudent.access_type || "UNRESERVED",
          payment_mode_id: parseInt(paymentModeId, 10),
          invoice_no: invoiceNo,
          amount_received: parseFloat(amountReceived),
          payment_date: paymentDate,
          utr_number: utrNumber.trim() || null,
          remarks: finalRemarks,
        };
        await api.post("/payments/record", fallbackPayload);
        showToast(`Payment of ₹${amountReceived} collected successfully!`);
        setSelectedStudent(null);
        setStudentValidity(null);
        setRenewalPlanFee(0);
        setSearchQuery("");
        setAmountReceived("");
        setUtrNumber("");
        setRemarks("");
        setInvoiceNo(generateInvoiceNo());
        fetchData();
      } catch (err2) {
        showToast(err2.response?.data?.message || err.response?.data?.message || "Failed to collect payment", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const cardBg = darkMode ? "#1e293b" : "#ffffff";
  const border = darkMode ? "#334155" : "#e2e8f0";
  const textPrimary = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const pageBg = darkMode ? "#0f172a" : "#f1f5f9";
  const inputBg = darkMode ? "#0f172a" : "#ffffff";

  return (
    <div className="page" style={{ background: pageBg, minHeight: "100vh", paddingBottom: "40px" }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed", top: "20px", right: "20px", zIndex: 9999,
            background: toast.type === "error" ? "#ef4444" : "#22c55e",
            color: "#fff", padding: "12px 20px", borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)", fontSize: "14px", fontWeight: 600,
            display: "flex", alignItems: "center", gap: "10px", minWidth: "220px",
          }}
        >
          {toast.type === "error" ? <FaTimes /> : <FaCheckCircle />} {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="page-title-row" style={{ marginBottom: "20px" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaCreditCard style={{ color: "#3b82f6" }} /> Collect Fee
          </h1>
          <p style={{ color: textMuted, marginTop: "4px" }}>
            Search student, record fee collection, and view recent transaction history.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", alignItems: "start" }}>
        {/* Left Section: Collect Payment Form */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: "14px", padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: textPrimary, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaMoneyBillWave style={{ color: "#22c55e" }} /> Fee Collection Section
          </h3>

          <form onSubmit={handleSubmitPayment}>
            {/* Student Live Search */}
            <div ref={searchRef} style={{ position: "relative", marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: textMuted, marginBottom: "6px" }}>
                Select Student / Member <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: inputBg, border: `1px solid ${border}`, borderRadius: "10px", padding: "8px 14px" }}>
                <FaSearch style={{ color: textMuted, fontSize: "14px" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                  placeholder="Type student name, mobile, code or reg no..."
                  style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "14px", color: textPrimary }}
                />
                {selectedStudent && (
                  <button
                    type="button"
                    onClick={() => { setSelectedStudent(null); setStudentValidity(null); setSearchQuery(""); setAmountReceived(""); setRenewalPlanFee(0); }}
                    style={{ border: "none", background: "transparent", color: textMuted, cursor: "pointer" }}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                  background: cardBg, border: `1px solid ${border}`, borderRadius: "10px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)", marginTop: "6px", maxHeight: "250px", overflowY: "auto",
                }}>
                  {searchResults.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleSelectStudent(st)}
                      style={{
                        padding: "10px 14px", borderBottom: `1px solid ${border}`, cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? "#334155" : "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: textPrimary, fontSize: "14px" }}>{st.full_name}</div>
                        <div style={{ fontSize: "12px", color: textMuted }}>
                          {st.student_code} · {st.mobile} {st.seat_number ? `· Seat: ${st.seat_number}` : ""}
                        </div>
                      </div>
                      {st.due_amount > 0 && (
                        <span style={{ fontSize: "11px", fontWeight: 700, background: "#fef2f2", color: "#ef4444", padding: "2px 8px", borderRadius: "12px" }}>
                          ₹{st.due_amount} due
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Student Card Summary */}
            {selectedStudent && (
              <div style={{
                background: darkMode ? "rgba(59, 130, 246, 0.1)" : "#eff6ff",
                border: `1px solid ${darkMode ? "rgba(59, 130, 246, 0.2)" : "#bfdbfe"}`,
                borderRadius: "12px", padding: "14px 18px", marginBottom: "20px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: textPrimary, display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaUserCheck style={{ color: "#3b82f6" }} /> {selectedStudent.full_name}
                  </div>
                  <span style={{ fontSize: "12px", background: "#3b82f6", color: "#fff", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                    {selectedStudent.student_code}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "12px", color: textMuted }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Mobile:</span> {selectedStudent.mobile}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Seat:</span> {selectedStudent.seat_number || "Unreserved"}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Plan:</span> {selectedStudent.plan_name || "N/A"}
                    {renewalPlanFee > 0 && (
                      <span style={{ color: "#16a34a", fontWeight: 700, marginLeft: "4px" }} title="Pure Fee Plan rate without registration fee">
                        (₹{renewalPlanFee})
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "8px", borderTop: `1px solid ${border}` }}>
                  <span style={{ fontSize: "12px", color: textMuted }}>
                    Plan End Date: <strong style={{ color: textPrimary }}>{selectedStudent.end_date || "N/A"}</strong>
                    {selectedStudent.end_date && (() => {
                      const exp = new Date(selectedStudent.end_date);
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      exp.setHours(0, 0, 0, 0);
                      const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
                      return (
                        <span style={{
                          marginLeft: "6px", fontSize: "11px", fontWeight: 700,
                          color: diff < 0 ? "#dc2626" : diff <= 7 ? "#d97706" : "#16a34a"
                        }}>
                          ({diff < 0 ? `Expired ${Math.abs(diff)}d ago` : diff === 0 ? "Expires today" : `${diff}d left`})
                        </span>
                      );
                    })()}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: selectedStudent.due_amount > 0 ? "#ef4444" : "#16a34a" }}>
                    {selectedStudent.due_amount > 0 ? `Pending Due: ₹${selectedStudent.due_amount}` : "Fee Paid"}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Input Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: textMuted, marginBottom: "4px" }}>
                  Amount Received (₹) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="e.g. 1000"
                  required
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: inputBg, color: textPrimary, fontSize: "14px", fontWeight: "600", outline: "none", boxSizing: "border-box" }}
                />
                {renewalPlanFee > 0 && (!selectedStudent?.due_amount || selectedStudent?.due_amount <= 0) && (
                  <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600, display: "block", marginTop: "4px" }}>
                    ✓ Fee plan renewal rate (₹{renewalPlanFee})
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: textMuted, marginBottom: "4px" }}>
                  Payment Mode <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={paymentModeId}
                  onChange={(e) => setPaymentModeId(e.target.value)}
                  required
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: inputBg, color: textPrimary, fontSize: "14px", fontWeight: "600", outline: "none", boxSizing: "border-box", cursor: "pointer" }}
                >
                  {paymentModes.map((m) => (
                    <option key={m.id} value={m.id}>{m.mode_name || m.modeName || "Cash"}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted }}>
                    Invoice Number <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#3b82f6", background: darkMode ? "rgba(59,130,246,0.15)" : "#eff6ff", padding: "1px 6px", borderRadius: "4px" }}>
                    Auto-generated
                  </span>
                </div>
                <input
                  type="text"
                  value={invoiceNo}
                  readOnly
                  title="Unique invoice number is auto-generated and cannot be modified"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${border}`,
                    background: darkMode ? "rgba(255,255,255,0.04)" : "#f8fafc",
                    color: textMuted,
                    fontSize: "14px",
                    fontWeight: "600",
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: "not-allowed",
                  }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted }}>
                    Payment Date <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", background: darkMode ? "rgba(34,197,94,0.15)" : "#f0fdf4", padding: "1px 6px", borderRadius: "4px" }}>
                    Current Date
                  </span>
                </div>
                <div style={{ cursor: "not-allowed" }}>
                  <CustomDatePicker
                    value={paymentDate}
                    readOnly
                    placeholder="Payment Date"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: textMuted, marginBottom: "4px" }}>
                  UTR / Reference No (Optional)
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. UTR987654321"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: inputBg, color: textPrimary, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: textMuted, marginBottom: "4px" }}>
                  Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Monthly fee payment"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: inputBg, color: textPrimary, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%", padding: "12px", borderRadius: "10px", fontSize: "15px", fontWeight: 700,
                background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", border: "none",
                cursor: submitting ? "not-allowed" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                boxShadow: "0 4px 14px rgba(34, 197, 94, 0.3)", transition: "all 0.2s",
              }}
            >
              {submitting ? "Processing Payment..." : <><FaCheckCircle /> Collect Payment Now</>}
            </button>
          </form>
        </div>

        {/* Right Section: Last 5 Payments */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: "14px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
              <FaHistory style={{ color: "#3b82f6" }} /> Last 5 Recent Payments
            </h3>
            <span style={{ fontSize: "11px", fontWeight: 700, background: darkMode ? "#334155" : "#f1f5f9", color: textMuted, padding: "2px 8px", borderRadius: "12px" }}>
              Top 5
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: textMuted }}>Loading payments...</div>
          ) : recentPayments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: textMuted }}>No payments collected yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: darkMode ? "#0f172a" : "#f8fafc",
                    border: `1px solid ${border}`,
                    borderRadius: "10px",
                    padding: "12px 14px",
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: textPrimary, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                      {p.full_name || "Member"}
                      <span style={{ fontSize: "11px", color: textMuted, fontWeight: 500 }}>({p.student_code || "N/A"})</span>
                    </div>
                    <div style={{ fontSize: "12px", color: textMuted, marginTop: "2px", display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span><FaHashtag style={{ fontSize: "10px" }} /> {p.invoice_no}</span>
                      <span>
                        <FaClock style={{ fontSize: "10px", marginRight: "4px" }} />
                        {p.payment_date ? p.payment_date.split(" ")[0] : ""}
                        <span style={{ fontSize: "11px", marginLeft: "6px", color: textMuted }}>
                          {formatTime(p.payment_date ? p.payment_date.split(" ").slice(1).join(" ") : "", timeFormat)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#16a34a" }}>
                      +₹{p.amount_received}
                    </div>
                    <span style={{
                      fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                      background: darkMode ? "rgba(59,130,246,0.15)" : "#eff6ff",
                      color: "#2563eb", padding: "2px 6px", borderRadius: "4px", display: "inline-block", marginTop: "2px",
                    }}>
                      {p.mode_name || "Cash"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectFee;
