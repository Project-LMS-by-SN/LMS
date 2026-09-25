import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaDownload, FaPrint, FaArrowLeft, FaCheckCircle, FaShieldAlt, FaReceipt, FaBuilding } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDateOnly = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const SubscriptionInvoice = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const invoiceRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [userData, setUserData] = useState(null);

  const localUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("lms_user") || "{}");
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    const loadInvoiceData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/payments/razorpay/subscription-history");
        if (res.data?.success) {
          const list = res.data.history || [];
          setHistoryList(list);
          setUserData(res.data.user || localUser);

          // Check if specific tx was passed via navigation state
          const passedTx = location.state?.transaction;
          if (passedTx) {
            setSelectedTx(passedTx);
          } else {
            // Invoice is only generated for COMPLETED payments
            const firstCompleted = list.find((t) => t.status === "COMPLETED");
            if (firstCompleted) setSelectedTx(firstCompleted);
          }
        }
      } catch (err) {
        console.error("Error loading invoice data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadInvoiceData();
  }, []);

  const activeUser = userData || localUser;
  const libraryName = activeUser.library_name || "Library Main Branch";
  // Invoice is valid only for COMPLETED payments — no invoice for PENDING/CANCELLED
  const isCompleted = selectedTx?.status === "COMPLETED";
  const invoiceNo = selectedTx?.createdAt
    ? `INV-SN-${new Date(selectedTx.createdAt).getFullYear()}-${String(selectedTx.id || 1).padStart(5, "0")}`
    : `INV-SN-0000-${String(selectedTx?.id || 1).padStart(5, "0")}`;
  const tierName = (selectedTx?.tier || activeUser.subscriptionTier || "PRO").replace("_", " ");
  const billingCycle = (selectedTx?.billing || "MONTHLY").toUpperCase();

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !isCompleted) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      // Split tall invoices across multiple pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice_${invoiceNo}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to download PDF invoice. You can use the Print button as an alternative.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!isCompleted) return;
    window.print();
  };

  const statusBadge = (() => {
    if (selectedTx?.status === "COMPLETED") {
      return { bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a", text: "PAYMENT COMPLETED", icon: <FaCheckCircle style={{ marginRight: "5px" }} /> };
    }
    if (selectedTx?.status === "PENDING") {
      return { bg: "#fffbeb", border: "#fde68a", color: "#d97706", text: "PAYMENT PENDING", icon: <FaReceipt style={{ marginRight: "5px" }} /> };
    }
    return { bg: "#fef2f2", border: "#fecaca", color: "#dc2626", text: `PAYMENT ${selectedTx?.status || "CANCELLED"}`, icon: <FaReceipt style={{ marginRight: "5px" }} /> };
  })();

  return (
    <div className="page" style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Top Navigation & Controls */}
      <div className="no-print" style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "16px", marginBottom: "24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: darkMode ? "#1e293b" : "#f1f5f9",
              color: darkMode ? "#f8fafc" : "#334155",
              border: darkMode ? "1px solid #334155" : "1px solid #cbd5e1",
              padding: "9px 16px", borderRadius: "10px", fontSize: "13px",
              fontWeight: 600, cursor: "pointer"
            }}
          >
            <FaArrowLeft /> Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>Subscription Tax Invoice</h1>
            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: darkMode ? "#94a3b8" : "#64748b" }}>
              Official payment receipt & GST invoice for {libraryName}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {historyList.filter((t) => t.status === "COMPLETED").length > 1 && (
            <select
              value={selectedTx?.id || ""}
              onChange={(e) => {
                const found = historyList.find((t) => String(t.id) === e.target.value);
                if (found) setSelectedTx(found);
              }}
              style={{
                padding: "8px 12px", borderRadius: "8px",
                border: darkMode ? "1px solid #334155" : "1px solid #cbd5e1",
                background: darkMode ? "#1e293b" : "#ffffff",
                color: darkMode ? "#ffffff" : "#1e293b",
                fontSize: "13px"
              }}
            >
              {historyList.filter((t) => t.status === "COMPLETED").map((tx) => (
                <option key={tx.id} value={tx.id}>
                  Invoice #{tx.id} — ₹{tx.amount} ({formatDateOnly(tx.createdAt)})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handlePrint}
            disabled={!isCompleted}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: darkMode ? "#1e293b" : "#f8fafc",
              color: darkMode ? "#f8fafc" : "#334155",
              border: darkMode ? "1px solid #334155" : "1px solid #cbd5e1",
              padding: "9px 16px", borderRadius: "10px", fontSize: "13px",
              fontWeight: 600, cursor: isCompleted ? "pointer" : "not-allowed",
              opacity: isCompleted ? 1 : 0.5
            }}
          >
            <FaPrint /> Print
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading || !selectedTx || !isCompleted}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: isCompleted ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#94a3b8",
              color: "#ffffff", border: "none", padding: "9px 18px",
              borderRadius: "10px", fontSize: "13px", fontWeight: 700,
              cursor: isCompleted ? "pointer" : "not-allowed",
              boxShadow: isCompleted ? "0 2px 8px rgba(37,99,235,0.3)" : "none"
            }}
          >
            <FaDownload /> {downloading ? "Generating PDF..." : "Download PDF Invoice"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: darkMode ? "#94a3b8" : "#64748b" }}>
          <p style={{ fontSize: "15px", fontWeight: 600 }}>Loading invoice details...</p>
        </div>
      ) : !selectedTx ? (
        <div style={{
          textAlign: "center", padding: "50px 20px",
          background: darkMode ? "#1e293b" : "#ffffff",
          borderRadius: "16px", border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0"
        }}>
          <FaReceipt style={{ fontSize: "40px", color: "#94a3b8", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px 0" }}>No Invoices Found</h3>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>
            You haven't completed any online subscription purchases yet. Upgrade your plan to receive official invoices.
          </p>
          <a href="tel:+919142025447" style={{ color: "#2563eb", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
            Support: +91 9142025447
          </a>
        </div>
      ) : !isCompleted ? (
        /* Invoice is NOT generated for PENDING / CANCELLED transactions */
        <div style={{
          textAlign: "center", padding: "50px 20px",
          background: darkMode ? "#1e293b" : "#ffffff",
          borderRadius: "16px", border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0"
        }}>
          <FaReceipt style={{ fontSize: "40px", color: "#d97706", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px 0" }}>
            Invoice unavailable — payment {selectedTx.status === "PENDING" ? "pending" : "not completed"}
          </h3>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>
            Invoice is generated only after the payment is completed. This transaction was made on {formatDateTime(selectedTx.createdAt)}.
          </p>
          <a href="tel:+919142025447" style={{ color: "#2563eb", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
            Support: +91 9142025447
          </a>
        </div>
      ) : (
        /* Invoice Paper Sheet */
        <div
          id="subscription-invoice-paper"
          ref={invoiceRef}
          style={{
            background: "#ffffff",
            color: "#0f172a",
            padding: "48px 40px",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            margin: "0 auto"
          }}
        >
          {/* Header: Company & Invoice Info */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            borderBottom: "2px solid #2563eb", paddingBottom: "24px", marginBottom: "30px"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <div style={{
                  width: "42px", height: "42px",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  borderRadius: "10px", color: "white", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "20px"
                }}>
                  📚
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                    LMS by Software Native
                  </h1>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                    by {libraryName}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "10px", lineHeight: "1.6" }}>
                <strong>Software Native Technologies Pvt. Ltd.</strong><br />
                Cloud Software & Library Automation Solutions<br />
                GSTIN / Tax ID: 07AAACS1234F1Z8<br />
                Support Email: support@softwarenative.com<br />
                Support: <a href="tel:+919142025447" style={{ color: "#2563eb", textDecoration: "none" }}>+91 9142025447</a>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{
                display: "inline-block", background: statusBadge.bg, border: `1px solid ${statusBadge.border}`,
                color: statusBadge.color, padding: "6px 14px", borderRadius: "20px",
                fontSize: "12px", fontWeight: 800, textTransform: "uppercase",
                marginBottom: "10px"
              }}>
                {statusBadge.icon} {statusBadge.text}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Invoice No: <strong style={{ color: "#0f172a", fontSize: "14px" }}>{invoiceNo}</strong>
              </div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                Payment Date & Time:<br />
                <strong style={{ color: "#0f172a" }}>{formatDateTime(selectedTx.createdAt)}</strong>
              </div>
            </div>
          </div>

          {/* Billed To & Payment Details Grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px",
            marginBottom: "32px", background: "#f8fafc", padding: "20px 24px",
            borderRadius: "12px", border: "1px solid #e2e8f0"
          }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                Billed To / Library Information
              </span>
              <h3 style={{ margin: "6px 0 4px", fontSize: "17px", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                <FaBuilding style={{ color: "#3b82f6", fontSize: "14px" }} /> {libraryName}
              </h3>
              <div style={{ fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                <div><strong>Admin Name:</strong> {activeUser.name || "Library Administrator"}</div>
                <div><strong>Email:</strong> {activeUser.email || "N/A"}</div>
                {activeUser.library_address ? <div><strong>Address:</strong> {activeUser.library_address}</div> : null}
                {activeUser.library_phone ? <div><strong>Contact:</strong> {activeUser.library_phone}</div> : null}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                Payment & Gateway Verification
              </span>
              <div style={{ fontSize: "13px", color: "#334155", marginTop: "8px", lineHeight: "1.7" }}>
                <div><strong>Payment Method:</strong> Razorpay Online Gateway</div>
                <div><strong>Order ID:</strong> <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>{selectedTx.orderId}</code></div>
                <div><strong>Payment ID:</strong> <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>{selectedTx.paymentId || "N/A"}</code></div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#16a34a", fontWeight: 700, fontSize: "12px", marginTop: "4px" }}>
                  <FaShieldAlt /> 100% Verified Secure Online Transaction
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "28px", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#ffffff", textAlign: "left" }}>
                <th style={{ padding: "14px 16px", borderRadius: "8px 0 0 0" }}>Plan Description</th>
                <th style={{ padding: "14px 16px" }}>Billing Cycle</th>
                <th style={{ padding: "14px 16px" }}>Validity Period</th>
                <th style={{ padding: "14px 16px", textAlign: "right", borderRadius: "0 8px 0 0" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "18px 16px" }}>
                  <div style={{ fontWeight: 800, fontSize: "15px", color: "#1e293b" }}>
                    LMS Cloud Subscription — {tierName} Plan
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                    Full platform license: student management, multi-shifts, seat allocation, reports & automated notifications
                  </div>
                  {selectedTx.couponCode && (
                    <span style={{
                      display: "inline-block", background: "#f0fdf4", color: "#16a34a",
                      border: "1px solid #bbf7d0", fontSize: "11px", fontWeight: 700,
                      padding: "2px 8px", borderRadius: "10px", marginTop: "6px"
                    }}>
                      Discount Coupon: {selectedTx.couponCode}
                    </span>
                  )}
                </td>
                <td style={{ padding: "18px 16px", color: "#334155", fontWeight: 600 }}>
                  {billingCycle}
                </td>
                <td style={{ padding: "18px 16px", color: "#475569" }}>
                  {formatDateOnly(selectedTx.createdAt)} to {formatDateOnly(selectedTx.subscriptionExpiry)}
                </td>
                <td style={{ padding: "18px 16px", textAlign: "right", fontWeight: 800, color: "#0f172a", fontSize: "16px" }}>
                  ₹{selectedTx.amount}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Summary & Totals */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "36px" }}>
            <div style={{ maxWidth: "420px", fontSize: "12px", color: "#64748b", lineHeight: "1.6" }}>
              <strong>Terms & Conditions:</strong><br />
              This document serves as an official electronic tax invoice for subscription software services rendered to <strong>{libraryName}</strong> by <strong>Software Native Technologies</strong>. Subscription fees are activated upon successful transaction completion and are non-refundable.
            </div>

            <div style={{ minWidth: "280px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#64748b" }}>
                <span>Subtotal:</span>
                <span>₹{selectedTx.amount}</span>
              </div>
              {selectedTx.couponCode && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#16a34a" }}>
                  <span>Special Discount:</span>
                  <span>Applied</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#64748b" }}>
                <span>GST (Goods & Services Tax):</span>
                <span>₹0.00 (Included)</span>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", padding: "12px 0",
                borderTop: "2px solid #0f172a", marginTop: "8px", fontSize: "18px", fontWeight: 800, color: "#0f172a"
              }}>
                <span>Total Amount Paid:</span>
                <span style={{ color: "#2563eb" }}>₹{selectedTx.amount}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "20px", textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
            <p style={{ margin: 0 }}>
              Thank you for trusting <strong>LMS by Software Native</strong> for {libraryName}!
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px" }}>
              This is an authentic, computer-generated tax receipt and requires no physical signature.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionInvoice;
