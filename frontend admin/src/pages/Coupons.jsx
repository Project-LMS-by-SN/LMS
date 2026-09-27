import React, { useState } from "react";
import { FaTag, FaPlus, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { useAdminData } from "../context/AdminDataContext";

const Coupons = () => {
  const { data, createCoupon, toggleCoupon, applyCouponToLibrary, showToast } = useAdminData();

  const [addModal, setAddModal] = useState(false);
  const [newForm, setNewForm] = useState({
    code: "",
    discount_type: "PERCENT",
    discount_value: 20,
    min_order: 999,
    max_discount: 1000,
    expiry_date: "2026-12-31",
    applicable_tier: "ALL",
    usage_limit: 100,
    description: "",
  });

  // Simulator State
  const [tester, setTester] = useState({
    selected_library_id: data.libraries[0]?.id || "",
    selected_plan_id: data.fee_plans[0]?.id || "",
    coupon_code: "WELCOME50",
    result: null,
    error: null,
  });

  const handleTestApply = (e) => {
    e.preventDefault();
    const code = tester.coupon_code.trim().toUpperCase();
    const plan = data.fee_plans.find((p) => p.id === tester.selected_plan_id);

    if (!plan) {
      setTester((prev) => ({ ...prev, error: "Please select a fee plan", result: null }));
      return;
    }

    const coupon = data.coupons.find((c) => c.code.toUpperCase() === code);

    if (!coupon) {
      setTester((prev) => ({
        ...prev,
        error: `Coupon "${code}" is invalid or does not exist.`,
        result: null,
      }));
      return;
    }

    if (!coupon.is_active) {
      setTester((prev) => ({
        ...prev,
        error: `Coupon "${code}" is currently disabled.`,
        result: null,
      }));
      return;
    }

    if (coupon.applicable_tier !== "ALL" && coupon.applicable_tier !== plan.tier_key) {
      setTester((prev) => ({
        ...prev,
        error: `Coupon "${code}" is only applicable for ${coupon.applicable_tier} tier.`,
        result: null,
      }));
      return;
    }

    const baseAmount = Number(plan.monthly_price);
    if (baseAmount < coupon.min_order) {
      setTester((prev) => ({
        ...prev,
        error: `Minimum order amount of ₹${coupon.min_order} required for this coupon.`,
        result: null,
      }));
      return;
    }

    let discount = 0;
    if (coupon.discount_type === "PERCENT") {
      discount = Math.round((baseAmount * coupon.discount_value) / 100);
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }

    const finalAmount = Math.max(0, baseAmount - discount);

    setTester((prev) => ({
      ...prev,
      error: null,
      result: {
        coupon,
        plan,
        baseAmount,
        discount,
        finalAmount,
      },
    }));
    showToast(`Coupon applied! Discount: ₹${discount}`);
  };

  const handleCommitToLibrary = () => {
    if (!tester.result) return;
    const { coupon, plan } = tester.result;
    applyCouponToLibrary(tester.selected_library_id, plan.tier_key, coupon.id);
    setTester((prev) => ({ ...prev, result: null, coupon_code: "" }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newForm.code.trim()) {
      alert("Please provide a valid coupon code");
      return;
    }

    const newCoupon = {
      id: `coup-${Date.now()}`,
      code: newForm.code.toUpperCase().trim(),
      discount_type: newForm.discount_type,
      discount_value: Number(newForm.discount_value),
      min_order: Number(newForm.min_order),
      max_discount: Number(newForm.max_discount),
      expiry_date: newForm.expiry_date,
      applicable_tier: newForm.applicable_tier,
      usage_count: 0,
      usage_limit: Number(newForm.usage_limit),
      is_active: true,
      description: newForm.description || `${newForm.discount_value}${newForm.discount_type === "PERCENT" ? "%" : "₹"} Discount Coupon`,
    };

    createCoupon(newCoupon);
    setAddModal(false);
    setNewForm({
      code: "",
      discount_type: "PERCENT",
      discount_value: 20,
      min_order: 999,
      max_discount: 1000,
      expiry_date: "2026-12-31",
      applicable_tier: "ALL",
      usage_limit: 100,
      description: "",
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          backgroundColor: "#ffffff",
          padding: "20px 24px",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
            Coupon Codes & Live Apply Engine
          </h2>
          <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
            Generate promo codes, configure percentage/flat discounts, and calculate live subscription savings.
          </p>
        </div>

        <button
          onClick={() => setAddModal(true)}
          style={{
            padding: "9px 16px",
            borderRadius: "8px",
            backgroundColor: "#059669",
            color: "#ffffff",
            border: "none",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FaPlus /> Create New Coupon
        </button>
      </div>

      {/* Interactive Coupon Apply Simulator */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          padding: "22px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaTag style={{ color: "#059669" }} /> Interactive Coupon Apply & Calculation Tester
          </h3>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#059669",
              backgroundColor: "#d1fae5",
              padding: "3px 8px",
              borderRadius: "4px",
            }}
          >
            Live Calculator
          </span>
        </div>

        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
          Select any library and plan, test any active coupon code to verify live price deductions before activating.
        </p>

        <form onSubmit={handleTestApply} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Target Library:</label>
              <select
                value={tester.selected_library_id}
                onChange={(e) => setTester((prev) => ({ ...prev, selected_library_id: e.target.value }))}
                style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
              >
                {data.libraries.map((l) => (
                  <option key={l.id} value={l.id}>
                    [{l.code}] {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Subscription Plan:</label>
              <select
                value={tester.selected_plan_id}
                onChange={(e) => setTester((prev) => ({ ...prev, selected_plan_id: e.target.value }))}
                style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
              >
                {data.fee_plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.monthly_price}/mo
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Coupon Code:</label>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <input
                  type="text"
                  placeholder="e.g. WELCOME50, PRO1"
                  value={tester.coupon_code}
                  onChange={(e) => setTester((prev) => ({ ...prev, coupon_code: e.target.value.toUpperCase() }))}
                  style={{ flex: 1, padding: "8px 10px", fontFamily: "monospace", fontWeight: "700" }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#1d4ed8",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {tester.error && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: "600",
              }}
            >
              ⚠️ {tester.error}
            </div>
          )}

          {tester.result && (
            <div
              style={{
                padding: "16px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", color: "#334155" }}>
                <span>Original Plan Price ({tester.result.plan.name}):</span>
                <strong>₹{tester.result.baseAmount}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", color: "#059669" }}>
                <span>Coupon Discount ({tester.result.coupon.code}):</span>
                <strong>- ₹{tester.result.discount}</strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: "800",
                  borderTop: "1px dashed #a7f3d0",
                  paddingTop: "8px",
                  color: "#0f172a",
                }}
              >
                <span>Final Payable:</span>
                <span style={{ color: "#059669" }}>₹{tester.result.finalAmount}</span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={handleCommitToLibrary}
                  style={{
                    padding: "8px 14px",
                    backgroundColor: "#059669",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "12.5px",
                  }}
                >
                  ✓ Activate Plan on Library with Discount
                </button>
                <button
                  type="button"
                  onClick={() => setTester((prev) => ({ ...prev, result: null, coupon_code: "" }))}
                  style={{
                    padding: "8px 14px",
                    backgroundColor: "transparent",
                    color: "#64748b",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12.5px",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Coupons List Table - Fits 100% in one frame with NO horizontal slider */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
          width: "100%",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
          <thead>
            <tr
              style={{
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid var(--border-subtle)",
                color: "#64748b",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <th style={{ padding: "10px 12px", width: "24%" }}>Coupon Code</th>
              <th style={{ padding: "10px 12px", width: "18%" }}>Discount Value</th>
              <th style={{ padding: "10px 12px", width: "15%" }}>Applicable Tier</th>
              <th style={{ padding: "10px 12px", width: "15%" }}>Expiry Date</th>
              <th style={{ padding: "10px 12px", width: "14%" }}>Redemptions</th>
              <th style={{ padding: "10px 12px", width: "8%" }}>Status</th>
              <th style={{ padding: "10px 12px", width: "6%", textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.coupons.map((c) => (
              <tr
                key={c.id}
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  backgroundColor: "#ffffff",
                }}
              >
                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: "800",
                      fontSize: "11.5px",
                      backgroundColor: "#d1fae5",
                      color: "#065f46",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.code}
                  </span>
                  <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                    {c.description}
                  </div>
                </td>

                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontWeight: "700", color: "#059669", fontSize: "13px", whiteSpace: "nowrap" }}>
                    {c.discount_type === "PERCENT" ? `${c.discount_value}% OFF` : `Flat ₹${c.discount_value} OFF`}
                  </span>
                  <div style={{ fontSize: "10.5px", color: "#64748b", whiteSpace: "nowrap" }}>Min: ₹{c.min_order}</div>
                </td>

                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "10.5px",
                      fontWeight: "600",
                      backgroundColor: "#f1f5f9",
                      color: "#334155",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.applicable_tier}
                  </span>
                </td>

                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "12px", whiteSpace: "nowrap" }}>{c.expiry_date}</div>
                </td>

                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "12px" }}>{c.usage_count}</span>
                  <span style={{ color: "#64748b", fontSize: "11px", whiteSpace: "nowrap" }}> / {c.usage_limit}</span>
                </td>

                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      padding: "2px 7px",
                      borderRadius: "10px",
                      fontSize: "10.5px",
                      fontWeight: "700",
                      backgroundColor: c.is_active ? "#d1fae5" : "#fee2e2",
                      color: c.is_active ? "#065f46" : "#991b1b",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.is_active ? "Active" : "Disabled"}
                  </span>
                </td>

                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <button
                    onClick={() => toggleCoupon(c.id)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "5px",
                      backgroundColor: c.is_active ? "#fee2e2" : "#d1fae5",
                      color: c.is_active ? "#dc2626" : "#059669",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.is_active ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Coupon Modal */}
      {addModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "var(--shadow-modal)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "14px" }}>
              Create New Promo / Coupon Code
            </h3>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Coupon Code:</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME20, SPECIAL100"
                  value={newForm.code}
                  onChange={(e) => setNewForm({ ...newForm, code: e.target.value.toUpperCase() })}
                  style={{ width: "100%", marginTop: "4px", padding: "8px 10px", fontFamily: "monospace", fontWeight: "700" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Discount Type:</label>
                  <select
                    value={newForm.discount_type}
                    onChange={(e) => setNewForm({ ...newForm, discount_type: e.target.value })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                  >
                    <option value="PERCENT">Percentage (%) Off</option>
                    <option value="FLAT">Flat Amount (₹) Off</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Discount Value:</label>
                  <input
                    type="number"
                    value={newForm.discount_value}
                    onChange={(e) => setNewForm({ ...newForm, discount_value: Number(e.target.value) })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Min Order (₹):</label>
                  <input
                    type="number"
                    value={newForm.min_order}
                    onChange={(e) => setNewForm({ ...newForm, min_order: Number(e.target.value) })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Expiry Date:</label>
                  <input
                    type="date"
                    value={newForm.expiry_date}
                    onChange={(e) => setNewForm({ ...newForm, expiry_date: e.target.value })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Description:</label>
                <input
                  type="text"
                  placeholder="e.g. 20% discount on initial signup"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "9px",
                    backgroundColor: "#059669",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Create & Activate Coupon
                </button>
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  style={{
                    padding: "9px 16px",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
