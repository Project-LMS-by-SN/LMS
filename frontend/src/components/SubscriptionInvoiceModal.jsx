import React, { useRef, useState } from "react";
import { FaDownload, FaPrint, FaTimes, FaCheckCircle, FaShieldAlt } from "react-icons/fa";
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

const SubscriptionInvoiceModal = ({ isOpen, onClose, transaction, user }) => {
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef(null);

  if (!isOpen || !transaction) return null;

  const invoiceNo = `INV-SN-${new Date(transaction.createdAt || Date.now()).getFullYear()}-${String(transaction.id || 1).padStart(5, "0")}`;
  const libraryName = user?.library_name || "Library Main Branch";
  const tierName = (transaction.tier || "PRO").replace("_", " ");
  const billingCycle = (transaction.billing || "monthly").toUpperCase();

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${invoiceNo}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to download PDF invoice. You can use the Print button as an alternative.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(6px)", zIndex: 1100, display: "flex",
      alignItems: "center", justifyContent: "center", padding: "16px",
      overflowY: "auto"
    }}>
      <div style={{
        background: "#ffffff", borderRadius: "16px", maxWidth: "800px", width: "100%",
        maxHeight: "95vh", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)", overflow: "hidden"
      }}>
        {/* Actions Bar */}
        <div style={{
          padding: "14px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
              Tax Invoice & Payment Receipt
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1",
                padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <FaPrint /> Print
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#ffffff",
                border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px",
                fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(37,99,235,0.3)"
              }}
            >
              <FaDownload /> {downloading ? "Generating PDF..." : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent", border: "none", color: "#64748b",
                cursor: "pointer", fontSize: "18px", padding: "6px", display: "flex"
              }}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Printable / Renderable Invoice Container */}
        <div style={{ overflowY: "auto", padding: "20px" }}>
          <div
            id="subscription-invoice-content"
            ref={invoiceRef}
            style={{
              background: "#ffffff",
              color: "#0f172a",
              padding: "40px",
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}
          >
            {/* Header: Company & Invoice Info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #2563eb", paddingBottom: "24px", marginBottom: "28px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", borderRadius: "8px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold" }}>
                    📚
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.5px" }}>
                      LMS by Software Native
                    </h1>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                      by {libraryName}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "8px", lineHeight: "1.5" }}>
                  Software Native Technologies Pvt. Ltd.<br />
                  Cloud Library Management Solutions<br />
                  Email: support@softwarenative.com
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{
                  display: "inline-block", background: "#f0fdf4", border: "1px solid #bbf7d0",
                  color: "#16a34a", padding: "4px 12px", borderRadius: "20px",
                  fontSize: "12px", fontWeight: 800, textTransform: "uppercase",
                  marginBottom: "8px"
                }}>
                  <FaCheckCircle style={{ marginRight: "4px" }} /> PAYMENT COMPLETED
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Invoice No: <strong style={{ color: "#0f172a" }}>{invoiceNo}</strong>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Date & Time: <strong style={{ color: "#0f172a" }}>{formatDateTime(transaction.createdAt)}</strong>
                </div>
              </div>
            </div>

            {/* Billed To & Payment Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px", background: "#f8fafc", padding: "18px 20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                  Billed To / Customer Details
                </span>
                <h3 style={{ margin: "4px 0 2px", fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>
                  {libraryName}
                </h3>
                <div style={{ fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                  Owner: {user?.name || "Library Administrator"}<br />
                  Email: {user?.email || "N/A"}<br />
                  {user?.library_address ? <span>Address: {user.library_address}<br /></span> : null}
                  {user?.library_phone ? <span>Contact: {user.library_phone}</span> : null}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                  Payment & Transaction Details
                </span>
                <div style={{ fontSize: "13px", color: "#334155", marginTop: "6px", lineHeight: "1.6" }}>
                  <div><strong>Payment Method:</strong> Razorpay Online Payment</div>
                  <div><strong>Order ID:</strong> <code style={{ background: "#e2e8f0", padding: "2px 4px", borderRadius: "4px", fontSize: "11px" }}>{transaction.orderId}</code></div>
                  <div><strong>Payment ID:</strong> <code style={{ background: "#e2e8f0", padding: "2px 4px", borderRadius: "4px", fontSize: "11px" }}>{transaction.paymentId || "pay_verified"}</code></div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#16a34a", fontWeight: 600, fontSize: "12px", marginTop: "2px" }}>
                    <FaShieldAlt /> 100% Verified Secure Transaction
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#1e293b", color: "#ffffff", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", borderRadius: "6px 0 0 0" }}>Plan Description</th>
                  <th style={{ padding: "12px 14px" }}>Billing Cycle</th>
                  <th style={{ padding: "12px 14px" }}>Validity Period</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", borderRadius: "0 6px 0 0" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "16px 14px" }}>
                    <div style={{ fontWeight: 800, fontSize: "14px", color: "#1e293b" }}>
                      LMS Cloud Subscription — {tierName} Plan
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      Full access to library dashboard, student management, seating & shifts
                    </div>
                    {transaction.couponCode && (
                      <span style={{ display: "inline-block", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", marginTop: "4px" }}>
                        Coupon Applied: {transaction.couponCode}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px 14px", color: "#334155", fontWeight: 600 }}>
                    {billingCycle}
                  </td>
                  <td style={{ padding: "16px 14px", color: "#475569" }}>
                    {formatDateOnly(transaction.createdAt)} to {formatDateOnly(transaction.subscriptionExpiry)}
                  </td>
                  <td style={{ padding: "16px 14px", textAlign: "right", fontWeight: 800, color: "#1e293b", fontSize: "15px" }}>
                    ₹{transaction.amount}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Summary & Totals */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
              <div style={{ maxWidth: "380px", fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                <strong>Terms & Conditions:</strong><br />
                This invoice confirms payment received for online software subscription services provided by Software Native for {libraryName}. Subscriptions are non-refundable once activated.
              </div>

              <div style={{ minWidth: "260px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#64748b" }}>
                  <span>Subtotal:</span>
                  <span>₹{transaction.amount}</span>
                </div>
                {transaction.couponCode && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#16a34a" }}>
                    <span>Special Discount:</span>
                    <span>Applied</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#64748b" }}>
                  <span>GST / Tax:</span>
                  <span>₹0.00 (Included)</span>
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", padding: "10px 0",
                  borderTop: "2px solid #0f172a", marginTop: "6px", fontSize: "17px", fontWeight: 800, color: "#0f172a"
                }}>
                  <span>Total Paid:</span>
                  <span style={{ color: "#2563eb" }}>₹{transaction.amount}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "18px", textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
              <p style={{ margin: 0 }}>
                Thank you for partnering with <strong>LMS by Software Native</strong>!
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px" }}>
                This is a computer-generated invoice and requires no physical signature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionInvoiceModal;
