import React, { useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaCheck, FaInfinity } from "react-icons/fa";
import { useAdminData } from "../context/AdminDataContext";

const FeePlans = () => {
  const { data, saveFeePlan, addFeePlan, deleteFeePlan } = useAdminData();
  const [editModal, setEditModal] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    if (!editModal) return;
    saveFeePlan({
      ...editModal,
      seat_limit: "Unlimited", // Subscription plans have no seat limit
    });
    setEditModal(null);
  };

  const handleAddNewPlan = () => {
    const newPlan = {
      id: `plan-${Date.now()}`,
      tier_key: "CUSTOM",
      name: "Custom Study Cluster Plan",
      monthly_price: 1999,
      annual_price: 19999,
      seat_limit: "Unlimited",
      discount_percent: 20,
      description: "Tailored plan for multi-branch study libraries with zero seat restrictions",
      features: [
        "Unlimited Seats & Flexible Desks",
        "Multi-Branch Central Access",
        "SMS & WhatsApp Attendance Reminders",
        "Custom Invoicing with GST",
        "Dedicated Account Support",
      ],
      is_active: true,
      badge: "No Seat Limit",
    };
    addFeePlan(newPlan);
    setEditModal(newPlan);
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
            Platform Subscription Plans & Pricing Configurator
          </h2>
          <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
            Subscription plans have <strong>No Seat Limit</strong> (All libraries enjoy unlimited seats). Configure monthly & annual pricing, discounts, and features.
          </p>
        </div>

        <button
          onClick={handleAddNewPlan}
          style={{
            padding: "9px 16px",
            borderRadius: "8px",
            backgroundColor: "#1d4ed8",
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
          <FaPlus /> Add New Fee Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {data.fee_plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "700",
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  {plan.tier_key}
                </span>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#059669",
                    backgroundColor: "#d1fae5",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  <FaInfinity style={{ fontSize: "10px" }} /> Unlimited Seats
                </span>
              </div>

              <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "4px 0 6px 0" }}>
                {plan.name}
              </h3>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 16px 0", minHeight: "36px" }}>
                {plan.description}
              </p>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  padding: "12px 14px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "24px", fontWeight: "800", color: "#1d4ed8" }}>
                    ₹{plan.monthly_price}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>/ month</span>
                </div>
                <div style={{ fontSize: "12px", color: "#475569", marginTop: "3px" }}>
                  Annual: <strong>₹{plan.annual_price}</strong> / yr ({plan.discount_percent}% off)
                </div>
                <div style={{ fontSize: "12px", color: "#059669", fontWeight: "700", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <FaCheck style={{ fontSize: "10px" }} /> Seat Limit: Unlimited (No Restriction)
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8" }}>
                  Features Included:
                </div>
                {plan.features?.map((feat, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#334155" }}>
                    <FaCheck style={{ color: "#059669", fontSize: "10px", flexShrink: 0 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                onClick={() => setEditModal(plan)}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "6px",
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "12.5px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <FaEdit /> Edit Plan
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Delete plan ${plan.name}?`)) {
                    deleteFeePlan(plan.id);
                  }
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Plan Modal */}
      {editModal && (
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
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "var(--shadow-modal)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>
              Edit Fee Plan: {editModal.name}
            </h3>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Plan Display Name:</label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Monthly Fee (₹):</label>
                  <input
                    type="number"
                    value={editModal.monthly_price}
                    onChange={(e) => setEditModal({ ...editModal, monthly_price: Number(e.target.value) })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Annual Fee (₹):</label>
                  <input
                    type="number"
                    value={editModal.annual_price}
                    onChange={(e) => setEditModal({ ...editModal, annual_price: Number(e.target.value) })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                    required
                  />
                </div>
              </div>

              {/* Note that Seat Limit is Unlimited */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "6px",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  fontSize: "12.5px",
                  color: "#065f46",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FaInfinity /> Seat Limit: Unlimited (All LMS subscription plans have no seat restriction)
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Discount Percentage (%):</label>
                <input
                  type="number"
                  value={editModal.discount_percent}
                  onChange={(e) => setEditModal({ ...editModal, discount_percent: Number(e.target.value) })}
                  style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Description:</label>
                <textarea
                  rows="2"
                  value={editModal.description}
                  onChange={(e) => setEditModal({ ...editModal, description: e.target.value })}
                  style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "9px",
                    backgroundColor: "#1d4ed8",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
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

export default FeePlans;
