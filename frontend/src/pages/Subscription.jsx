import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheck, FaUsers, FaArrowRight, FaTimes, FaCalendarAlt, FaExclamationTriangle, FaReceipt, FaCheckCircle, FaCreditCard, FaShieldAlt, FaDownload, FaFileInvoice, FaExternalLinkAlt, FaTag } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import SubscriptionInvoiceModal from "../components/SubscriptionInvoiceModal";

const Subscription = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [billing, setBilling] = useState("monthly");
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", libName: "", phone: "", message: "" });
  const [contactSuccess, setContactSuccess] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountedPrice, durationMonths, message, lockBilling }
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [, setCouponSuccess] = useState("");

  // Subscription History state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const res = await api.post("/payments/razorpay/validate-coupon", {
        couponCode: code,
        tier: "PRO",
        billing: billing,
      });

      if (res.data?.success) {
        setAppliedCoupon({
          code: res.data.couponCode || code,
          discountedPrice: res.data.discountedPrice !== undefined ? res.data.discountedPrice : 1,
          durationMonths: res.data.durationMonths || 3,
          message: res.data.message || `Coupon ${code} applied successfully!`,
          lockBilling: res.data.lockBilling || "quarterly",
        });
        if (res.data.lockBilling) {
          setBilling(res.data.lockBilling);
        }
        setCouponSuccess(res.data.message || `Coupon applied successfully!`);
        setCouponError("");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid coupon code or not applicable.";
      setCouponError(msg);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess("");
    setCouponError("");
    setCouponInput("");
  };

  const fetchSubscriptionHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/payments/razorpay/subscription-history");
      if (res.data?.success) {
        setHistoryData(res.data);
      }
    } catch (err) {
      console.error("Failed to load subscription history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const [activeUser, setActiveUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); }
    catch { return {}; }
  });
  const user = activeUser;
  const currentTier = activeUser.subscriptionTier || "FREE";
  const subscriptionExpiry = activeUser.subscriptionExpiry;
  const pendingTier = activeUser.pendingTier;
  const pendingExpiryDays = activeUser.pendingExpiryDays;

  const [actLoading, setActLoading] = useState(false);
  const [showActivateConfirmModal, setShowActivateConfirmModal] = useState(false);

  const handleActivatePendingPlan = async () => {
    setActLoading(true);
    try {
      const res = await api.post("/users/activate-pending-plan");
      if (res.data.success) {
        alert(res.data.message || "Plan activated successfully!");
        const userStr = localStorage.getItem("lms_user");
        if (userStr) {
          const u = JSON.parse(userStr);
          u.subscriptionTier = res.data.subscriptionTier;
          u.subscriptionExpiry = res.data.subscriptionExpiry;
          u.pendingTier = null;
          u.pendingExpiryDays = null;
          localStorage.setItem("lms_user", JSON.stringify(u));
        }
        window.location.reload();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to activate plan.");
    } finally {
      setActLoading(false);
      setShowActivateConfirmModal(false);
    }
  };

  const getDaysRemaining = () => {
    if (!subscriptionExpiry) return null;
    const expiry = new Date(subscriptionExpiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };
  const daysLeft = getDaysRemaining();
  const isExpired = daysLeft !== null && daysLeft <= 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const executeUpgrade = async (tierKey, amount, tierName) => {
    try {
      const dbTier = String(tierKey).toUpperCase();
      const isPro = dbTier === "PRO";

      // If coupon applied on non-pro plan
      if (appliedCoupon && !isPro) {
        const proceed = window.confirm(
          `Coupon ${appliedCoupon.code} is only valid for Pro plan.\n\nWould you like to proceed with ${tierName} at regular price ₹${amount}?`
        );
        if (!proceed) return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load Razorpay SDK. Please check your internet connection.");
        return;
      }

      const isCouponActive = appliedCoupon && isPro;
      const orderBilling = isCouponActive && appliedCoupon.lockBilling ? appliedCoupon.lockBilling : billing;

      const orderPayload = {
        tier: dbTier,
        billing: orderBilling,
        couponCode: isCouponActive ? appliedCoupon.code : undefined,
      };

      const orderRes = await api.post("/payments/razorpay/create-order", orderPayload);
      if (!orderRes.data.success) {
        alert(orderRes.data.message || "Failed to initiate payment");
        return;
      }

      const { orderId, amount: orderAmount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: orderAmount,
        currency: currency,
        name: "Library Management System",
        description: isCouponActive
          ? `Upgrade to ${tierName || tierKey} plan (Coupon ${appliedCoupon.code} Applied)`
          : `Upgrade to ${tierName || tierKey} plan`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/payments/razorpay/verify-signature", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              tier: dbTier,
              billing: orderBilling,
              couponCode: isCouponActive ? appliedCoupon.code : undefined,
            });

            if (verifyRes.data.success) {
              alert(verifyRes.data.message || `Subscription upgraded successfully!`);
              const userStr = localStorage.getItem("lms_user");
              if (userStr) {
                const u = JSON.parse(userStr);
                u.subscriptionTier = dbTier;
                if (verifyRes.data.subscriptionExpiry) {
                  u.subscriptionExpiry = verifyRes.data.subscriptionExpiry;
                }
                localStorage.setItem("lms_user", JSON.stringify(u));
              }
              window.location.reload();
            }
          } catch (err) {
            alert(err.response?.data?.message || "Signature verification failed.");
          }
        },
        prefill: { name: user.name || "", email: user.email || "" },
        theme: { color: "#3b82f6" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upgrade subscription");
    }
  };

  const handleUpgrade = (tierKey, amount, tierName) => {
    executeUpgrade(tierKey, amount, tierName);
  };

  const textPrimary = darkMode ? "#f8fafc" : "#0f172a";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const cardBg = darkMode ? "#1e293b" : "#ffffff";
  const border = darkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setShowContactModal(false);
      setContactForm({ name: "", libName: "", phone: "", message: "" });
    }, 2500);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const getTierKey = (name) => name.toLowerCase();

  

  const DEFAULT_PLANS = [
    {
      id: "plan-free",
      name: "Free",
      dbTier: "FREE",
      tierKey: "FREE",
      monthlyPrice: 0,
      quarterlyPrice: 0,
      halfYearPrice: 0,
      annualPrice: 0,
      limit: "Up to 50 active students",
      studentCapacity: "Up to 50",
      staffCount: 0,
      deviceLimit: 1,
      attendance: "Basic Manual",
      admissionProcess: "QR / Manual",
      feeManagement: "Basic",
      supportLevel: "Community Support",
      planPriceLabel: "Null",
      description: "Essential library management for small reading rooms",
      features: [
        "Up to 50 active students",
        "0 Staff accounts (Owner only)",
        "1 Device login limit",
        "Basic Manual Attendance",
        "QR / Manual Admission",
        "Basic Fee Management",
        "Community Support",
      ],
      popular: false,
      badge: "",
      isActive: true,
    },
    {
      id: "plan-basic",
      name: "Basic",
      dbTier: "BASIC",
      tierKey: "BASIC",
      monthlyPrice: 150,
      quarterlyPrice: 450,
      halfYearPrice: 900,
      annualPrice: 1800,
      limit: "Up to 200 active students",
      studentCapacity: "Up to 200",
      staffCount: 2,
      deviceLimit: 2,
      attendance: "QR / Manual",
      admissionProcess: "QR / Manual",
      feeManagement: "Invoicing & Receipts",
      supportLevel: "Standard Email",
      planPriceLabel: "150",
      description: "Complete management solution for growing libraries",
      features: [
        "Up to 200 active students",
        "2 Staff member accounts",
        "2 Device login limits",
        "QR & Manual Attendance",
        "QR & Manual Admission",
        "Invoicing & Fee Receipts",
        "Standard Email Support",
      ],
      popular: false,
      badge: "",
      isActive: true,
    },
    {
      id: "plan-pro",
      name: "Pro",
      dbTier: "PRO",
      tierKey: "PRO",
      monthlyPrice: 250,
      quarterlyPrice: 750,
      halfYearPrice: 1500,
      annualPrice: 3000,
      limit: "Up to 500 active students",
      studentCapacity: "Up to 500",
      staffCount: 3,
      deviceLimit: 3,
      attendance: "QR / Manual",
      admissionProcess: "QR / Manual",
      feeManagement: "Invoicing & Receipts",
      supportLevel: "Priority Email & Chat",
      planPriceLabel: "250",
      description: "Advanced performance and priority support for busy libraries",
      features: [
        "Up to 500 active students",
        "3 Staff member accounts",
        "3 Device login limits",
        "QR & Manual Attendance",
        "QR & Manual Admission",
        "Invoicing & Fee Receipts",
        "Priority Email & Chat Support",
      ],
      popular: true,
      badge: "Most Popular",
      isActive: true,
    },
    {
      id: "plan-enterprise",
      name: "Enterprise",
      dbTier: "ENTERPRISE",
      tierKey: "ENTERPRISE",
      monthlyPrice: 0,
      quarterlyPrice: 0,
      halfYearPrice: 0,
      annualPrice: 0,
      isCustom: true,
      limit: "Unlimited active students",
      studentCapacity: "Unlimited",
      staffCount: 5,
      deviceLimit: 5,
      attendance: "Advanced Custom Integration",
      admissionProcess: "Custom Workflow & Portal",
      feeManagement: "Full ERP & Multi-Branch",
      supportLevel: "24/7 Dedicated Account Manager",
      planPriceLabel: "According To Features",
      description: "Multi-branch ERP and custom workflows for large institutions",
      features: [
        "Unlimited active students",
        "5 Staff member accounts",
        "5 Device login limits",
        "Advanced Custom Integration Attendance",
        "Custom Workflow & Portal Admission",
        "Full ERP & Multi-Branch Management",
        "24/7 Dedicated Account Manager",
      ],
      popular: false,
      badge: "Custom",
      isActive: true,
    },
  ];

  const [tiers, setTiers] = useState(DEFAULT_PLANS);
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const res = await api.get("/users/profile");
        if (res.data?.success && res.data?.data) {
          const fresh = res.data.data;
          setActiveUser((prev) => {
            const updated = {
              ...prev,
              subscriptionTier: fresh.subscriptionTier || prev.subscriptionTier,
              subscriptionExpiry: fresh.subscriptionExpiry || prev.subscriptionExpiry,
              pendingTier: fresh.pendingTier,
              pendingExpiryDays: fresh.pendingExpiryDays,
            };
            localStorage.setItem("lms_user", JSON.stringify(updated));
            return updated;
          });
        }
      } catch {
        // silent fail
      }
    };
    fetchLatestProfile();

    const fetchDbPlans = async () => {
      try {
        const res = await api.get("/payments/razorpay/plans");
        if (res.data?.success && Array.isArray(res.data?.plans) && res.data.plans.length > 0) {
          setTiers(res.data.plans);
        }
      } catch (err) {
        console.error("Failed to load plans from DB:", err);
      }
    };
    fetchDbPlans();
  }, []);

  const isCurrentPlan = (tier) => currentTier === tier.dbTier;

  return (
    <div className="page">
      <div className="page-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Subscription</h1>
          <p>Manage your library subscription plan</p>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchSubscriptionHistory();
            setShowHistoryModal(true);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: darkMode ? "rgba(30, 41, 59, 0.9)" : "#ffffff",
            color: textPrimary,
            border: `1px solid ${border}`,
            borderRadius: "12px",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease"
          }}
        >
          <FaReceipt style={{ color: "#3b82f6", fontSize: "15px" }} />
          <span>Subscription & Payment History</span>
        </button>
      </div>

      {/* Pending Purchased Plan Card */}
      {pendingTier && (
        <div style={{
          background: darkMode ? "rgba(245, 158, 11, 0.15)" : "linear-gradient(135deg, #fffbe6, #fef3c7)",
          border: darkMode ? "2px solid rgba(245, 158, 11, 0.4)" : "2px solid #f59e0b",
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: darkMode ? "0 10px 25px rgba(0,0,0,0.3)" : "0 10px 25px rgba(245, 158, 11, 0.15)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: "#f59e0b", color: "white", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: "22px"
            }}>
              &#9889;
            </div>
            <div>
              <div style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 700, color: darkMode ? "#fbbf24" : "#d97706", letterSpacing: "1px" }}>
                Purchased Plan Ready for Activation
              </div>
              <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: 800, color: darkMode ? "#fef3c7" : "#78350f" }}>
                {pendingTier.replace("_", " ")} ({pendingExpiryDays || 30} Days)
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: darkMode ? "#fde68a" : "#92400e" }}>
                Status: Pending Activation — Waiting for your manual activation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowActivateConfirmModal(true)}
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white", border: "none", padding: "12px 24px",
              borderRadius: "12px", fontWeight: 700, fontSize: "14px",
              cursor: "pointer", boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            &#9889; Activate Plan Now
          </button>
        </div>
      )}

      {/* Current Plan Banner */}
      <div style={{
        background: isExpired
          ? (darkMode ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)')
          : (darkMode ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(135deg, #f0fdf4, #dcfce7)'),
        border: isExpired
          ? (darkMode ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #fecaca')
          : (darkMode ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #bbf7d0'),
        borderRadius: '14px', padding: '20px 24px', marginBottom: '28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px', height: '50px', borderRadius: '12px',
            background: isExpired ? '#dc2626' : '#16a34a',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px'
          }}>
            <FaCalendarAlt />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: textPrimary, margin: 0 }}>
              {currentTier === "FREE" ? "No Active Plan" : `${currentTier === "PRO" ? "Pro" : currentTier === "BASIC" ? "Basic" : currentTier.replace("_", " ")} Plan`}
            </h3>
            <p style={{ fontSize: '13px', color: textMuted, margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaCalendarAlt /> Expires: {formatDate(subscriptionExpiry)}
              </span>
              {daysLeft !== null && (
                <span style={{
                  fontWeight: 700,
                  color: isExpired ? '#dc2626' : daysLeft <= 7 ? '#d97706' : (darkMode ? '#4ade80' : '#16a34a')
                }}>
                  {isExpired ? 'Expired' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                </span>
              )}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {currentTier !== "FREE" && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await api.get("/payments/razorpay/subscription-history");
                  // Invoice is only generated for COMPLETED payments
                  const completedTx = res.data?.history?.find((h) => h.status === "COMPLETED");
                  if (completedTx) {
                    setSelectedInvoice(completedTx);
                  } else {
                    alert("No completed payment found. Invoice is generated only after payment completion.");
                  }
                } catch {
                  setShowHistoryModal(true);
                }
              }}
              style={{
                background: darkMode ? "rgba(59, 130, 246, 0.2)" : "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                padding: "9px 16px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FaFileInvoice /> View Tax Invoice
            </button>
          )}
          {isExpired && (
            <a href="#plans" style={{
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff', padding: '10px 20px', borderRadius: '10px',
              fontWeight: 600, fontSize: '14px', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}>
              Renew Now
            </a>
          )}
        </div>
      </div>

      {/* Coupon Code Section */}
      <div style={{
        maxWidth: "600px", margin: "0 auto 28px auto",
        background: darkMode ? "#1e293b" : "#ffffff",
        border: appliedCoupon
          ? (darkMode ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #86efac")
          : `1px solid ${border}`,
        borderRadius: "16px", padding: "18px 22px",
        boxShadow: darkMode ? "0 4px 14px rgba(0,0,0,0.2)" : "0 4px 14px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: darkMode ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
              color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px"
            }}>
              <FaTag />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: textPrimary }}>
                Have a Coupon Code?
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: textMuted }}>
                Enter your promotional coupon below to unlock discounts
              </p>
            </div>
          </div>
        </div>

        {appliedCoupon ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: darkMode ? "rgba(16, 185, 129, 0.12)" : "#f0fdf4",
            border: darkMode ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #bbf7d0",
            borderRadius: "10px", padding: "10px 14px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaCheck style={{ color: "#10b981", fontSize: "14px" }} />
              <div>
                <span style={{ fontWeight: 700, color: darkMode ? "#4ade80" : "#15803d", fontSize: "13px" }}>
                  Coupon Applied ({appliedCoupon.code})!
                </span>
                <span style={{ fontSize: "12px", color: textMuted, marginLeft: "8px" }}>
                  {appliedCoupon.message}
                </span>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              style={{
                background: "transparent", border: "none", color: "#ef4444",
                fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
              }}
            >
              <FaTimes /> Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Enter coupon code (e.g. PRO1)"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value.toUpperCase());
                setCouponError("");
              }}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: "10px",
                border: `1px solid ${couponError ? "#ef4444" : border}`,
                background: darkMode ? "#0f172a" : "#f8fafc",
                color: textPrimary, fontSize: "13px", fontWeight: 600,
                letterSpacing: "0.5px", outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={couponLoading || !couponInput.trim()}
              style={{
                padding: "10px 20px", borderRadius: "10px", border: "none",
                background: couponLoading || !couponInput.trim() ? (darkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0") : "#3b82f6",
                color: couponLoading || !couponInput.trim() ? textMuted : "#fff",
                fontWeight: 700, fontSize: "13px", cursor: couponLoading || !couponInput.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              {couponLoading ? "Checking..." : "Apply"}
            </button>
          </form>
        )}

        {couponError && (
          <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}>
            <FaExclamationTriangle style={{ fontSize: "12px", flexShrink: 0 }} />
            {couponError}
          </p>
        )}
      </div>

      {/* Billing Toggle */}
      <div id="plans" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex', background: darkMode ? '#1e293b' : '#f1f5f9',
          borderRadius: '12px', padding: '4px', border: `1px solid ${border}`,
          flexWrap: 'wrap', justifyContent: 'center', gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: 600,
              fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
              background: billing === 'monthly' ? '#3b82f6' : 'transparent',
              color: billing === 'monthly' ? '#fff' : textMuted,
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("quarterly")}
            style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: 600,
              fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
              background: billing === 'quarterly' ? '#3b82f6' : 'transparent',
              color: billing === 'quarterly' ? '#fff' : textMuted,
            }}
          >
            Quarterly (3 Months)
          </button>
          <button
            type="button"
            onClick={() => setBilling("halfyearly")}
            style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: 600,
              fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
              background: billing === 'halfyearly' ? '#3b82f6' : 'transparent',
              color: billing === 'halfyearly' ? '#fff' : textMuted,
            }}
          >
            Half Yearly (6 Months)
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: 600,
              fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
              background: billing === 'yearly' ? '#3b82f6' : 'transparent',
              color: billing === 'yearly' ? '#fff' : textMuted,
            }}
          >
            Yearly (1 Year)
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {plansLoading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: textMuted }}>
          <div style={{ fontSize: "28px", marginBottom: "12px" }}>⏳</div>
          <p style={{ fontSize: "14px", fontWeight: 600 }}>Loading subscription plans...</p>
        </div>
      ) : tiers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: textMuted }}>
          <p style={{ fontSize: "14px" }}>No active subscription plans found.</p>
        </div>
      ) : (
      <>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "24px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}>
          {tiers.map((tier, idx) => {
            const current = isCurrentPlan(tier);
            const isPro = tier.dbTier === "PRO";
            const isFree = tier.dbTier === "FREE" || tier.dbTier === "STARTER";
            const isEnterprise = tier.dbTier === "ENTERPRISE" || tier.isCustom;
            const hasDiscount = appliedCoupon && isPro;

            const regularPrice = billing === "yearly" && (tier.annualPrice || tier.yearlyPrice)
              ? (tier.annualPrice || tier.yearlyPrice)
              : billing === "halfyearly" && tier.halfYearPrice
                ? tier.halfYearPrice
                : billing === "quarterly" && tier.quarterlyPrice
                  ? tier.quarterlyPrice
                  : tier.monthlyPrice;

            const price = hasDiscount ? appliedCoupon.discountedPrice : regularPrice;

            const period = isFree
              ? "forever"
              : isEnterprise
                ? ""
                : hasDiscount
                  ? "/ 3 months"
                  : billing === "yearly"
                    ? "/ year"
                    : billing === "halfyearly"
                      ? "/ 6 months"
                      : billing === "quarterly"
                        ? "/ 3 months"
                        : "/ month";

            const savings = !isFree && !isEnterprise && tier.monthlyPrice > 0
              ? (billing === "yearly" && tier.annualPrice
                ? Math.round((1 - (tier.annualPrice / (tier.monthlyPrice * 12))) * 100)
                : billing === "halfyearly" && tier.halfYearPrice
                  ? Math.round((1 - (tier.halfYearPrice / (tier.monthlyPrice * 6))) * 100)
                  : billing === "quarterly" && tier.quarterlyPrice
                    ? Math.round((1 - (tier.quarterlyPrice / (tier.monthlyPrice * 3))) * 100)
                    : 0)
              : 0;

            const disabled = isFree && current;

            return (
              <div key={idx} style={{
                background: cardBg,
                border: hasDiscount
                  ? "2px solid #10b981"
                  : current ? "2px solid #16a34a" : tier.popular ? "2px solid #3b82f6" : `1px solid ${border}`,
                borderRadius: "20px",
                padding: "28px 22px",
                position: "relative",
                boxShadow: hasDiscount
                  ? (darkMode ? "0 10px 30px rgba(16,185,129,0.2)" : "0 10px 30px rgba(16,185,129,0.15)")
                  : "0 8px 24px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transform: hasDiscount || (tier.popular && !current) ? "scale(1.02)" : "none",
                zIndex: hasDiscount ? 3 : tier.popular ? 2 : 1,
              }}>
                {hasDiscount && (
                  <span style={{
                    position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", padding: "5px 14px", borderRadius: "20px",
                    fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                    boxShadow: "0 4px 10px rgba(16, 185, 129, 0.4)", display: "flex", alignItems: "center", gap: "4px"
                  }}>
                    🎉 Coupon {appliedCoupon.code} Applied
                  </span>
                )}
                {!hasDiscount && current && (
                  <span style={{
                    position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                    background: "#16a34a", color: "#fff", padding: "5px 14px", borderRadius: "20px",
                    fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                  }}>
                    Current Plan
                  </span>
                )}
                {!hasDiscount && !current && tier.popular && (
                  <span style={{
                    position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                    background: "#3b82f6", color: "#fff", padding: "5px 14px", borderRadius: "20px",
                    fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                  }}>
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 style={{ fontSize: "19px", fontWeight: 700, margin: 0, color: textPrimary }}>{tier.name}</h3>
                  <p style={{ color: textMuted, fontSize: "13px", marginTop: "6px", minHeight: "32px" }}>{tier.description}</p>

                  <div style={{ margin: "20px 0" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
                      {isFree ? (
                        <>
                          <span style={{ fontSize: "36px", fontWeight: 800, color: textPrimary }}>₹0</span>
                          <span style={{ color: textMuted, fontSize: "13px" }}>/ Free Forever</span>
                        </>
                      ) : isEnterprise ? (
                        <>
                          <span style={{ fontSize: "28px", fontWeight: 800, color: textPrimary }}>Custom</span>
                          <span style={{ color: textMuted, fontSize: "13px" }}>According To Features</span>
                        </>
                      ) : hasDiscount ? (
                        <>
                          <span style={{ fontSize: "38px", fontWeight: 800, color: "#10b981" }}>₹{price.toLocaleString("en-IN")}</span>
                          <span style={{ fontSize: "18px", textDecoration: "line-through", color: textMuted }}>₹{regularPrice.toLocaleString("en-IN")}</span>
                          <span style={{ color: textMuted, fontSize: "13px" }}>{period}</span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: "36px", fontWeight: 800, color: textPrimary }}>₹{price.toLocaleString("en-IN")}</span>
                          <span style={{ color: textMuted, fontSize: "13px" }}>{period}</span>
                        </>
                      )}
                    </div>

                    {hasDiscount && (
                      <span style={{
                        display: "inline-block", marginTop: "6px", padding: "3px 10px",
                        borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                        background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)"
                      }}>
                        ⚡ Special Discount: ₹{price} Only
                      </span>
                    )}
                    {!hasDiscount && savings > 0 && (
                      <span style={{
                        display: "inline-block", marginTop: "6px", padding: "3px 10px",
                        borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                        background: "rgba(16,163,74,0.1)", color: "#16a34a"
                      }}>
                        Save {savings}%
                      </span>
                    )}
                  </div>

                  <div style={{
                    background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px",
                    fontSize: "13px", color: "#3b82f6", fontWeight: 600, marginBottom: "20px",
                  }}>
                    <FaUsers /> {tier.limit}
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                    {tier.features.map((f, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                        <FaCheck style={{ color: "#10b981", flexShrink: 0 }} />
                        <span style={{ color: darkMode ? "#cbd5e1" : "#475569" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    if (isEnterprise) {
                      setShowContactModal(true);
                    } else if (isFree) {
                      // Already on free or cannot downgrade via online payment
                    } else {
                      handleUpgrade(tier.dbTier || tier.tierKey, regularPrice, tier.name);
                    }
                  }}
                  style={{
                    width: "100%", marginTop: "24px", padding: "12px", borderRadius: "12px", fontWeight: 700,
                    cursor: disabled ? "default" : "pointer", fontSize: "14px", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: "8px", border: "none",
                    background: disabled
                      ? (darkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0")
                      : (isEnterprise
                        ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                        : hasDiscount
                          ? "linear-gradient(135deg, #10b981, #059669)"
                          : (current ? "#16a34a" : (tier.popular ? "#3b82f6" : (darkMode ? "rgba(255,255,255,0.1)" : "#f1f5f9")))),
                    color: disabled
                      ? textMuted
                      : (isEnterprise || hasDiscount || current || tier.popular ? "#fff" : (darkMode ? "#f8fafc" : "#0f172a")),
                    boxShadow: hasDiscount ? "0 4px 14px rgba(16, 185, 129, 0.35)" : "none",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    if (!disabled) {
                      e.target.style.transform = "translateY(-2px)";
                      if (isEnterprise) e.target.style.background = "#1d4ed8";
                      else if (hasDiscount) e.target.style.background = "#059669";
                      else if (current) e.target.style.background = "#15803d";
                      else if (tier.popular) e.target.style.background = "#2563eb";
                      else e.target.style.background = darkMode ? "rgba(255,255,255,0.15)" : "#e2e8f0";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!disabled) {
                      e.target.style.transform = "translateY(0)";
                      if (isEnterprise) e.target.style.background = "linear-gradient(135deg, #3b82f6, #2563eb)";
                      else if (hasDiscount) e.target.style.background = "linear-gradient(135deg, #10b981, #059669)";
                      else if (current) e.target.style.background = "#16a34a";
                      else if (tier.popular) e.target.style.background = "#3b82f6";
                      else e.target.style.background = darkMode ? "rgba(255,255,255,0.1)" : "#f1f5f9";
                    }
                  }}
                >
                  {isEnterprise
                    ? "Contact Sales"
                    : isFree
                      ? (current ? "Current Plan" : "Free Plan")
                      : hasDiscount
                        ? `Pay ₹${price} & Upgrade to ${tier.name}`
                        : (current ? "Renew Plan" : `Upgrade to ${tier.name}`)}
                  {!disabled && !isFree && <FaArrowRight style={{ fontSize: "11px" }} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div style={{ marginTop: "48px", maxWidth: "1200px", margin: "48px auto 0" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: textPrimary, margin: 0 }}>
              Subscription Tiers Specification
            </h2>
            <p style={{ fontSize: "13px", color: textMuted, marginTop: "6px" }}>
              Complete capacity, features, support level, and pricing breakdown
            </p>
          </div>

          <div style={{
            background: cardBg,
            borderRadius: "18px",
            border: `1px solid ${border}`,
            overflowX: "auto",
            boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.05)"
          }}>
            <table style={{ width: "100%", minWidth: "1020px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: darkMode ? "rgba(255,255,255,0.04)" : "#f8fafc", borderBottom: `1px solid ${border}` }}>
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: textPrimary, whiteSpace: "nowrap" }}>Subscription Tier</th>
                  <th style={{ padding: "16px 14px", fontWeight: 700, color: textPrimary, whiteSpace: "nowrap" }}>Student Capacity</th>
                  <th style={{ padding: "16px 14px", fontWeight: 700, color: textPrimary, whiteSpace: "nowrap" }}>Staff Count</th>
                  <th style={{ padding: "16px 14px", fontWeight: 700, color: textPrimary, whiteSpace: "nowrap" }}>Device Limit</th>
                  <th style={{ padding: "16px 14px", fontWeight: 700, color: textPrimary, whiteSpace: "nowrap" }}>Attendance</th>
                  <th style={{ padding: "16px 14px", fontWeight: 700, color: textPrimary, whiteSpace: "nowrap" }}>Admission Process</th>
                  <th style={{ padding: "16px 14px", fontWeight: 700, color: textPrimary, whiteSpace: "nowrap" }}>Fee Management</th>
                  <th style={{ padding: "16px 14px", fontWeight: 700, color: textPrimary, whiteSpace: "nowrap" }}>Support Level</th>
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: textPrimary, whiteSpace: "nowrap", textAlign: "right" }}>Plan Price</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    tier: "Free",
                    capacity: "Up to 50",
                    staff: "0",
                    device: "1",
                    attendance: "Basic Manual",
                    admission: "QR / Manual",
                    fee: "Basic",
                    support: "Community Support",
                    price: "Null",
                    isPopular: false,
                    key: "FREE"
                  },
                  {
                    tier: "Basic",
                    capacity: "Up to 200",
                    staff: "2",
                    device: "2",
                    attendance: "QR / Manual",
                    admission: "QR / Manual",
                    fee: "Invoicing & Receipts",
                    support: "Standard Email",
                    price: "150",
                    isPopular: false,
                    key: "BASIC"
                  },
                  {
                    tier: "Pro",
                    capacity: "Up to 500",
                    staff: "3",
                    device: "3",
                    attendance: "QR / Manual",
                    admission: "QR / Manual",
                    fee: "Invoicing & Receipts",
                    support: "Priority Email & Chat",
                    price: "250",
                    isPopular: true,
                    key: "PRO"
                  },
                  {
                    tier: "Enterprise",
                    capacity: "Unlimited",
                    staff: "5",
                    device: "5",
                    attendance: "Advanced Custom Integration",
                    admission: "Custom Workflow & Portal",
                    fee: "Full ERP & Multi-Branch",
                    support: "24/7 Dedicated Account Manager",
                    price: "According To Features",
                    isPopular: false,
                    key: "ENTERPRISE"
                  }
                ].map((row, rIdx) => {
                  const isCur = currentTier === row.key;
                  return (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: rIdx < 3 ? `1px solid ${border}` : "none",
                        background: row.isPopular
                          ? (darkMode ? "rgba(59,130,246,0.06)" : "#f0f7ff")
                          : (isCur ? (darkMode ? "rgba(16,185,129,0.06)" : "#f0fdf4") : "transparent")
                      }}
                    >
                      <td style={{ padding: "16px 20px", fontWeight: 700, color: textPrimary, whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{row.tier}</span>
                          {row.isPopular && (
                            <span style={{
                              fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px",
                              background: "#3b82f6", color: "#fff", textTransform: "uppercase"
                            }}>
                              Popular
                            </span>
                          )}
                          {isCur && (
                            <span style={{
                              fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px",
                              background: "#16a34a", color: "#fff"
                            }}>
                              Current
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px 14px", color: textPrimary, fontWeight: 600 }}>{row.capacity}</td>
                      <td style={{ padding: "16px 14px", color: textPrimary }}>{row.staff}</td>
                      <td style={{ padding: "16px 14px", color: textPrimary }}>{row.device}</td>
                      <td style={{ padding: "16px 14px", color: textMuted }}>{row.attendance}</td>
                      <td style={{ padding: "16px 14px", color: textMuted }}>{row.admission}</td>
                      <td style={{ padding: "16px 14px", color: textMuted }}>{row.fee}</td>
                      <td style={{ padding: "16px 14px", color: textMuted }}>{row.support}</td>
                      <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 800, color: textPrimary, fontSize: "15px" }}>
                        {row.price === "Null" ? (
                          <span style={{ color: textMuted }}>Free</span>
                        ) : row.price === "According To Features" ? (
                          <span style={{ fontSize: "12px", color: "#3b82f6" }}>Custom</span>
                        ) : (
                          <span>₹{row.price}<span style={{ fontSize: "11px", fontWeight: 500, color: textMuted }}>/mo</span></span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
        }}>
          <div style={{
            background: cardBg, border: `1px solid ${border}`, borderRadius: "24px",
            padding: "32px", width: "100%", maxWidth: "440px", position: "relative",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)", animation: "fadeIn 0.3s ease-out",
          }}>
            <button
              onClick={() => setShowContactModal(false)}
              style={{
                position: "absolute", top: "24px", right: "24px", background: "none", border: "none",
                color: textMuted, cursor: "pointer", fontSize: "18px",
              }}
            >
              <FaTimes />
            </button>

            {contactSuccess ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <FaCheck style={{ fontSize: "48px", color: "#10b981", marginBottom: "16px" }} />
                <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>Message Sent!</h3>
                <p style={{ color: textMuted, fontSize: "13px", marginTop: "8px" }}>Our team will get back to you shortly.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px 0" }}>Contact Sales</h2>
                <p style={{ color: textMuted, fontSize: "13px", margin: "0 0 24px 0" }}>Submit your details and we will build a custom plan for your library.</p>

                <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted }}>Your Name *</label>
                    <input
                      type="text" required name="name" value={contactForm.name} onChange={handleContactChange}
                      style={{ background: darkMode ? "rgba(0,0,0,0.2)" : "#fff", color: textPrimary, border: `1px solid ${border}`, padding: "10px", borderRadius: "10px", outline: "none" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted }}>Library Name *</label>
                    <input
                      type="text" required name="libName" value={contactForm.libName} onChange={handleContactChange}
                      style={{ background: darkMode ? "rgba(0,0,0,0.2)" : "#fff", color: textPrimary, border: `1px solid ${border}`, padding: "10px", borderRadius: "10px", outline: "none" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted }}>Phone Number *</label>
                    <input
                      type="tel" required name="phone" value={contactForm.phone} onChange={handleContactChange}
                      style={{ background: darkMode ? "rgba(0,0,0,0.2)" : "#fff", color: textPrimary, border: `1px solid ${border}`, padding: "10px", borderRadius: "10px", outline: "none" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted }}>Message</label>
                    <textarea
                      rows={2} name="message" value={contactForm.message} onChange={handleContactChange}
                      style={{ background: darkMode ? "rgba(0,0,0,0.2)" : "#fff", color: textPrimary, border: `1px solid ${border}`, padding: "10px", borderRadius: "10px", resize: "none", outline: "none" }}
                    />
                  </div>

                  <button type="submit" style={{
                    background: "#3b82f6", color: "#fff", border: "none", borderRadius: "12px",
                    padding: "12px", fontWeight: 700, cursor: "pointer", marginTop: "8px",
                  }}>
                    Send Message
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}



      {/* Confirm Plan Activation Modal */}
      {showActivateConfirmModal && pendingTier && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div style={{
            background: cardBg, border: `1px solid ${border}`, borderRadius: "20px",
            padding: "28px", maxWidth: "440px", width: "100%", textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <FaExclamationTriangle style={{ fontSize: "44px", color: "#f59e0b" }} />
            </div>
            <h3 style={{ fontSize: "19px", fontWeight: 700, color: textPrimary, marginBottom: "12px" }}>
              Confirm Plan Activation
            </h3>
            <p style={{ fontSize: "14px", color: textMuted, lineHeight: 1.5, marginBottom: "24px" }}>
              Are you sure you want to activate <strong>{pendingTier.replace("_", " ")}</strong> now?
              <br /><br />
              <span style={{ color: "#f59e0b", fontWeight: 600 }}>Notice:</span> Activating this plan will immediately switch your active plan to {pendingTier.replace("_", " ")} for {pendingExpiryDays || 30} days starting today.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setShowActivateConfirmModal(false)}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: "10px",
                  border: `1px solid ${border}`, background: "transparent",
                  color: textPrimary, fontWeight: 600, cursor: "pointer", fontSize: "14px"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActivatePendingPlan}
                disabled={actLoading}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: "10px",
                  border: "none", background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white", fontWeight: 700, cursor: "pointer", fontSize: "14px"
                }}
              >
                {actLoading ? "Activating..." : "Confirm & Activate Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription & Payment History Modal */}
      {showHistoryModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div style={{
            background: cardBg, border: `1px solid ${border}`, borderRadius: "20px",
            maxWidth: "920px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)", overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px", borderBottom: `1px solid ${border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: darkMode ? "rgba(255,255,255,0.02)" : "#f8fafc"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px", height: "42px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px", boxShadow: "0 4px 10px rgba(37,99,235,0.3)"
                }}>
                  <FaReceipt />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: textPrimary }}>
                    Subscription & Payment History
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: textMuted }}>
                    Plan status, validity dates, and Razorpay transaction records
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                style={{
                  background: "transparent", border: "none", color: textMuted,
                  cursor: "pointer", fontSize: "18px", padding: "6px", display: "flex"
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Active Plan Snapshot Card */}
              <div style={{
                background: isExpired
                  ? (darkMode ? "rgba(239,68,68,0.12)" : "#fef2f2")
                  : currentTier !== "FREE"
                  ? (darkMode ? "rgba(16,185,129,0.12)" : "#f0fdf4")
                  : (darkMode ? "rgba(59,130,246,0.12)" : "#eff6ff"),
                border: `1px solid ${isExpired
                  ? "rgba(239,68,68,0.3)"
                  : currentTier !== "FREE"
                  ? "rgba(16,185,129,0.3)"
                  : "rgba(59,130,246,0.3)"}`,
                borderRadius: "16px", padding: "18px 20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: isExpired ? "#ef4444" : currentTier !== "FREE" ? "#10b981" : "#3b82f6" }}>
                      Current Active Plan
                    </span>
                    <h4 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: 800, color: textPrimary }}>
                      {currentTier.replace("_", " ")}
                    </h4>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                      background: isExpired ? "#ef4444" : currentTier !== "FREE" ? "#10b981" : "#3b82f6",
                      color: "white", display: "inline-flex", alignItems: "center", gap: "5px"
                    }}>
                      <FaCheckCircle style={{ fontSize: "11px" }} />
                      {isExpired ? "Expired" : currentTier !== "FREE" ? "Payment Completed" : "Free Plan"}
                    </span>
                    {currentTier !== "FREE" && (
                      <button
                        type="button"
                        onClick={() => {
                          // Invoice is only generated for COMPLETED payments
                          const latestTx = historyData?.history?.find(h => h.status === "COMPLETED");
                          if (latestTx) {
                            setSelectedInvoice(latestTx);
                          } else {
                            alert("No completed payment found. Invoice is generated only after payment completion.");
                          }
                        }}
                        style={{
                          padding: "6px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "700",
                          background: "#2563eb", color: "#ffffff", border: "none", cursor: "pointer",
                          display: "inline-flex", alignItems: "center", gap: "6px"
                        }}
                      >
                        <FaReceipt /> View Active Invoice
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", fontSize: "13px" }}>
                  <div style={{ background: darkMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)", padding: "10px 14px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "11px", color: textMuted }}>Validity / Expiry Date</div>
                    <div style={{ fontWeight: 700, color: textPrimary, marginTop: "2px" }}>
                      {formatDate(subscriptionExpiry)}
                    </div>
                  </div>
                  <div style={{ background: darkMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)", padding: "10px 14px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "11px", color: textMuted }}>Days Remaining</div>
                    <div style={{ fontWeight: 700, color: isExpired ? "#ef4444" : "#10b981", marginTop: "2px" }}>
                      {daysLeft !== null ? (isExpired ? "0 days (Expired)" : `${daysLeft} days remaining`) : "Lifetime / No Expiry"}
                    </div>
                  </div>
                  <div style={{ background: darkMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)", padding: "10px 14px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "11px", color: textMuted }}>Payment Gateway</div>
                    <div style={{ fontWeight: 700, color: textPrimary, marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaShieldAlt style={{ color: "#3b82f6", fontSize: "12px" }} /> Razorpay Secure
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Section */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: 700, color: textPrimary }}>
                  Transaction History & Invoices
                  <a href="tel:+919142025447" style={{ marginLeft: "12px", fontSize: "12px", fontWeight: 600, color: "#3b82f6", textDecoration: "none" }}>
                    Support: +91 9142025447
                  </a>
                </h4>

                {historyLoading ? (
                  <div style={{ textAlign: "center", padding: "32px", color: textMuted }}>
                    Loading subscription history...
                  </div>
                ) : historyData?.history && historyData.history.length > 0 ? (
                  <div style={{
                    border: `1px solid ${border}`, borderRadius: "14px", overflowX: "auto",
                    background: cardBg, width: "100%", maxWidth: "100%"
                  }}>
                    <table style={{ width: "100%", minWidth: "760px", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: darkMode ? "rgba(255,255,255,0.04)" : "#f8fafc", textAlign: "left" }}>
                          <th style={{ padding: "12px 16px", color: textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>Plan & Cycle</th>
                          <th style={{ padding: "12px 16px", color: textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>Amount</th>
                          <th style={{ padding: "12px 16px", color: textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>Razorpay IDs</th>
                          <th style={{ padding: "12px 16px", color: textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>Date & Time</th>
                          <th style={{ padding: "12px 16px", color: textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>Status</th>
                          <th style={{ padding: "12px 16px", color: textMuted, fontWeight: 600, textAlign: "center", minWidth: "190px", whiteSpace: "nowrap" }}>Invoice Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.history.map((tx) => (
                          <tr key={tx.id} style={{ borderTop: `1px solid ${border}` }}>
                            <td style={{ padding: "14px 16px" }}>
                              <div style={{ fontWeight: 700, color: textPrimary }}>
                                {tx.tier.replace("_", " ")}
                              </div>
                              <div style={{ fontSize: "11px", color: textMuted, textTransform: "capitalize" }}>
                                {tx.billing}
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              <span style={{ fontWeight: 800, color: textPrimary }}>
                                ₹{tx.amount}
                              </span>
                              {tx.couponCode && (
                                <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 700, marginTop: "2px" }}>
                                  Coupon: {tx.couponCode}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: "11px", color: textMuted }}>
                              {tx.paymentId ? (
                                <div><strong style={{ color: textPrimary }}>Pay:</strong> {tx.paymentId}</div>
                              ) : null}
                              <div><strong style={{ color: textMuted }}>Order:</strong> {tx.orderId}</div>
                            </td>
                            <td style={{ padding: "14px 16px", color: textMuted, fontSize: "12px", whiteSpace: "nowrap" }}>
                              {formatDateTime(tx.createdAt)}
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              <span style={{
                                padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700,
                                background: tx.status === "COMPLETED" ? "rgba(16,185,129,0.15)" : tx.status === "PENDING" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                                color: tx.status === "COMPLETED" ? "#10b981" : tx.status === "PENDING" ? "#f59e0b" : "#ef4444",
                                display: "inline-flex", alignItems: "center", gap: "4px"
                              }}>
                                {tx.status === "COMPLETED" ? <FaCheckCircle style={{ fontSize: "10px" }} /> : null}
                                {tx.status === "COMPLETED" ? "Payment Completed" : tx.status === "PENDING" ? "Payment Pending" : tx.status === "CANCELLED" ? "Cancelled" : tx.status}
                              </span>
                            </td>
                            <td style={{ padding: "14px 20px", textAlign: "center", whiteSpace: "nowrap" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                                {tx.status === "COMPLETED" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedInvoice(tx)}
                                      title="Download PDF Invoice"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "7px 14px",
                                        borderRadius: "8px",
                                        background: "#2563eb",
                                        color: "#ffffff",
                                        border: "none",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        boxShadow: "0 2px 6px rgba(37,99,235,0.3)"
                                      }}
                                    >
                                      <FaDownload style={{ fontSize: "11px" }} /> Invoice PDF
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowHistoryModal(false);
                                        navigate("invoice", { state: { transaction: tx } });
                                      }}
                                      title="Open Full Screen Invoice Page"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: "7px 12px",
                                        borderRadius: "8px",
                                        background: darkMode ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                                        color: textPrimary,
                                        border: `1px solid ${border}`,
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap"
                                      }}
                                    >
                                      <FaExternalLinkAlt style={{ fontSize: "11px" }} /> Open
                                    </button>
                                  </>
                                ) : (
                                  <span style={{ fontSize: "11px", color: textMuted, fontStyle: "italic" }}>
                                    Invoice after payment
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{
                    border: `1px dashed ${border}`, borderRadius: "14px", padding: "28px 20px",
                    textAlign: "center", color: textMuted, background: darkMode ? "rgba(255,255,255,0.02)" : "#fafafa"
                  }}>
                    <FaCreditCard style={{ fontSize: "32px", color: "#94a3b8", marginBottom: "8px" }} />
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: 600, color: textPrimary }}>
                      {currentTier !== "FREE" ? `Current Plan: ${currentTier.replace("_", " ")} (Verified)` : "No Online Payments Yet"}
                    </p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
                      Whenever you upgrade or renew your plan via Razorpay, payment receipts, order IDs, and validity details will be archived here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 24px", borderTop: `1px solid ${border}`,
              display: "flex", justifyContent: "flex-end",
              background: darkMode ? "rgba(255,255,255,0.02)" : "#f8fafc"
            }}>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                style={{
                  padding: "10px 20px", borderRadius: "10px", border: `1px solid ${border}`,
                  background: cardBg, color: textPrimary, fontWeight: 600, fontSize: "13px", cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal with PDF Download */}
      <SubscriptionInvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        transaction={selectedInvoice}
        user={historyData?.user || user}
      />
    </div>
  );
};

export default Subscription;
