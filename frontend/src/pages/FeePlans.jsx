import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import { useSubmitLock } from "../hooks/useSubmitLock";

const emptyForm = {
  plan_name: "",
  duration_days: "",
  amount: "",
  plan_type: "RESERVED",
};

const FeePlans = () => {
  const { darkMode } = useTheme();
  const queryClient = useQueryClient();
  const textPrimary = darkMode ? "#f1f5f9" : "#1e293b";
  const userObj = JSON.parse(localStorage.getItem("lms_user") || "{}");
  const isOwner = !userObj.role || userObj.role === "OWNER";
  const [showForm, setShowForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const formRef = useRef(null);
  const nameInputRef = useRef(null);
  const { isSubmitting, runWithLock } = useSubmitLock();
  const { isSubmitting: isRowBusy, runWithLock: runRowWithLock } = useSubmitLock();

  useEffect(() => {
    if (!showForm) return;
    const frameId = requestAnimationFrame(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (nameInputRef.current) {
        nameInputRef.current.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, [showForm, editingPlanId]);

  const { data: feePlans = [], isLoading } = useQuery({
    queryKey: ["feePlansAll"],
    queryFn: async () => {
      const res = await api.get("/fee-plans");
      return res.data?.data || [];
    },
  });

  const refreshFeePlans = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["feePlansAll"] }),
      queryClient.invalidateQueries({ queryKey: ["feePlans"] }),
    ]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "plan_type" && value === "REGISTRATION" && !prev.duration_days ? { duration_days: "365" } : {}),
    }));
  };

  const openAddForm = () => {
    setEditingPlanId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (plan) => {
    setEditingPlanId(plan.id);

    setFormData({
      plan_name: plan.plan_name || "",
      duration_days: plan.duration_days !== undefined && plan.duration_days !== null ? String(plan.duration_days) : "",
      amount: plan.amount !== undefined && plan.amount !== null ? String(plan.amount) : "",
      plan_type: plan.plan_type || "RESERVED",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setEditingPlanId(null);
    setFormData(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isReg = formData.plan_type === "REGISTRATION";

    if (!formData.plan_name || (!isReg && (formData.duration_days === "" || formData.duration_days === null)) || formData.amount === "" || formData.amount === null) {
      alert("Plan name and amount are required");
      return;
    }

    if (!isReg && Number(formData.duration_days) <= 0) {
      alert("Duration days must be greater than 0");
      return;
    }

    if (Number(formData.amount) < 0) {
      alert("Amount cannot be negative");
      return;
    }

    const payload = {
      plan_name: formData.plan_name,
      duration_days: isReg ? 365 : Number(formData.duration_days),
      amount: Number(formData.amount),
      plan_type: formData.plan_type || "RESERVED",
    };

    await runWithLock(async () => {
      try {
        if (editingPlanId) {
          await api.put(`/fee-plans/${editingPlanId}`, payload);
          closeForm();
          await refreshFeePlans();
          alert("Fee plan updated successfully");
        } else {
          await api.post("/fee-plans", payload);
          closeForm();
          await refreshFeePlans();
          alert("Fee plan added successfully");
        }
      } catch (error) {
        alert(error.response?.data?.message || "Failed to save fee plan");
      }
    });
  };

  const handleToggleStatus = async (plan) => {
    await runRowWithLock(async () => {
      const newAction = plan.is_active ? "deactivate" : "activate";
      const confirmMsg = `Are you sure you want to ${newAction} this fee plan?`;

      if (!window.confirm(confirmMsg)) return;

      try {
        await api.patch(`/fee-plans/${plan.id}/deactivate`);
        alert(`Fee plan ${plan.is_active ? "deactivated" : "activated"} successfully`);
        await refreshFeePlans();
      } catch (error) {
        alert(error.response?.data?.message || `Failed to ${newAction} fee plan`);
      }
    });
  };

  const handleDelete = async (plan) => {
    if (plan?.is_allocated) {
      alert(`This fee plan is currently allocated to ${plan.allocated_count || 1} student(s), so it cannot be deleted. Deactivate it instead.`);
      return;
    }

    await runRowWithLock(async () => {
      const confirmDelete = window.confirm(
        "Delete permanently only if this plan was created by mistake. Continue?"
      );

      if (!confirmDelete) return;

      try {
        await api.delete(`/fee-plans/${plan.id}`);
        alert("Fee plan deleted permanently");
        await refreshFeePlans();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete fee plan");
      }
    });
  };

  const reservedPlans = feePlans.filter(p => p.plan_type === "RESERVED");
  const unreservedPlans = feePlans.filter(p => p.plan_type === "UNRESERVED");
  const registrationPlans = feePlans.filter(p => p.plan_type === "REGISTRATION");

  const renderReservedTable = (plans, emptyMsg) => {
    return (
      <>
        <table>
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Duration Days</th>
              <th>Amount</th>
              <th>Status</th>
              {isOwner && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>{plan.plan_name}</span>
                    {plan.is_allocated && (
                      <span
                        title={`Allocated to ${plan.allocated_count || 1} student(s)`}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: darkMode ? "rgba(59, 130, 246, 0.18)" : "#eff6ff",
                          color: darkMode ? "#93c5fd" : "#1d4ed8",
                          border: `1px solid ${darkMode ? "rgba(59, 130, 246, 0.35)" : "#bfdbfe"}`,
                        }}
                      >
                        Allocated ({plan.allocated_count || 1})
                      </span>
                    )}
                  </div>
                </td>
                <td>{plan.duration_days} days</td>
                <td>₹{plan.amount}</td>
                <td>
                  <span className={plan.is_active ? "status-badge" : "danger-badge"}>
                    {plan.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
                {isOwner && (
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => openEditForm(plan)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={plan.is_active ? "deactivate-btn" : "edit-btn"}
                        style={!plan.is_active ? { background: "#22c55e", color: "white" } : {}}
                        disabled={isRowBusy}
                        onClick={() => handleToggleStatus(plan)}
                      >
                        {plan.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        disabled={Boolean(plan.is_allocated) || isRowBusy}
                        title={
                          plan.is_allocated
                            ? `Allocated to ${plan.allocated_count || 1} student(s) — deactivate instead of deleting`
                            : "Delete fee plan permanently"
                        }
                        style={
                          plan.is_allocated
                            ? { opacity: 0.45, cursor: "not-allowed" }
                            : undefined
                        }
                        onClick={() => handleDelete(plan)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {plans.length === 0 && (
          <p className="empty-text">{isLoading && feePlans.length === 0 ? "Loading fee plans..." : emptyMsg}</p>
        )}
      </>
    );
  };

  const renderUnreservedTable = (plans, emptyMsg) => {
    return (
      <>
        <table>
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Duration Days</th>
              <th>Amount</th>
              <th>Status</th>
              {isOwner && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>{plan.plan_name}</span>
                    {plan.is_allocated && (
                      <span
                        title={`Allocated to ${plan.allocated_count || 1} student(s)`}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: darkMode ? "rgba(59, 130, 246, 0.18)" : "#eff6ff",
                          color: darkMode ? "#93c5fd" : "#1d4ed8",
                          border: `1px solid ${darkMode ? "rgba(59, 130, 246, 0.35)" : "#bfdbfe"}`,
                        }}
                      >
                        Allocated ({plan.allocated_count || 1})
                      </span>
                    )}
                  </div>
                </td>
                <td>{plan.duration_days} days</td>
                <td>₹{plan.amount}</td>
                <td>
                  <span className={plan.is_active ? "status-badge" : "danger-badge"}>
                    {plan.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
                {isOwner && (
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => openEditForm(plan)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={plan.is_active ? "deactivate-btn" : "edit-btn"}
                        style={!plan.is_active ? { background: "#22c55e", color: "white" } : {}}
                        disabled={isRowBusy}
                        onClick={() => handleToggleStatus(plan)}
                      >
                        {plan.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        disabled={Boolean(plan.is_allocated) || isRowBusy}
                        title={
                          plan.is_allocated
                            ? `Allocated to ${plan.allocated_count || 1} student(s) — deactivate instead of deleting`
                            : "Delete fee plan permanently"
                        }
                        style={
                          plan.is_allocated
                            ? { opacity: 0.45, cursor: "not-allowed" }
                            : undefined
                        }
                        onClick={() => handleDelete(plan)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {plans.length === 0 && (
          <p className="empty-text">{isLoading && feePlans.length === 0 ? "Loading fee plans..." : emptyMsg}</p>
        )}
      </>
    );
  };

  const renderRegistrationTable = (plans, emptyMsg) => {
    return (
      <>
        <table>
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>One-time Registration Amount</th>
              <th>Status</th>
              {isOwner && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td style={{ fontWeight: 600 }}>{plan.plan_name}</td>
                <td style={{ fontWeight: 700, color: "#16a34a", fontSize: "15px" }}>₹{plan.amount}</td>
                <td>
                  <span className={plan.is_active ? "status-badge" : "danger-badge"}>
                    {plan.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
                {isOwner && (
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => openEditForm(plan)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={plan.is_active ? "deactivate-btn" : "edit-btn"}
                        style={!plan.is_active ? { background: "#22c55e", color: "white" } : {}}
                        disabled={isRowBusy}
                        onClick={() => handleToggleStatus(plan)}
                      >
                        {plan.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {plans.length === 0 && (
          <p className="empty-text">{emptyMsg}</p>
        )}
      </>
    );
  };

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <h1>Fee Plans</h1>
          <p>Manage library subscription plans</p>
        </div>

        {isOwner && (
          <button className="primary-btn" onClick={openAddForm}>
            + Add Plan
          </button>
        )}
      </div>

      {showForm && isOwner && (
        <div
          ref={formRef}
          className="form-card"
          style={{
            scrollMarginTop: "88px",
            ...(editingPlanId ? { border: "2px solid #3b82f6" } : {}),
          }}
        >
          <h2>{formData.plan_type === "REGISTRATION" ? "Edit Registration Fee Plan" : (editingPlanId ? "Edit Fee Plan" : "Add Fee Plan")}</h2>

          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-group">
              <label>Plan Name *</label>
              <input
                ref={nameInputRef}
                type="text"
                name="plan_name"
                value={formData.plan_name}
                onChange={handleChange}
                placeholder="Plan Name"
              />
            </div>

            {formData.plan_type !== "REGISTRATION" && (
              <div className="form-group">
                <label>Plan Type *</label>
                <select
                  name="plan_type"
                  value={formData.plan_type}
                  onChange={handleChange}
                >
                  <option value="RESERVED">Reserved</option>
                  <option value="UNRESERVED">Unreserved</option>
                </select>
              </div>
            )}

            {formData.plan_type !== "REGISTRATION" && (
              <div className="form-group">
                <label>Duration Days *</label>
                <input
                  type="number"
                  name="duration_days"
                  value={formData.duration_days}
                  onChange={handleChange}
                  placeholder="30"
                />
              </div>
            )}

            <div className="form-group">
              <label>{formData.plan_type === "REGISTRATION" ? "Registration Amount (One-time ₹) *" : "Amount *"}</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="100"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingPlanId ? "Update Plan" : "Save Plan"}
              </button>

              <button type="button" className="secondary-btn" onClick={closeForm} disabled={isSubmitting}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="table-card">
          <h3 style={{ color: textPrimary, fontSize: "16px", marginBottom: "16px", fontWeight: 600 }}>Reserved Fee Plans</h3>
          {renderReservedTable(reservedPlans, "No fee plans found")}
        </div>

        <div className="table-card">
          <h3 style={{ color: textPrimary, fontSize: "16px", marginBottom: "16px", fontWeight: 600 }}>Unreserved Fee Plans</h3>
          {renderUnreservedTable(unreservedPlans, "No plan added")}
        </div>

        <div className="table-card">
          <h3 style={{ color: textPrimary, fontSize: "16px", marginBottom: "16px", fontWeight: 600 }}>Registration Fee Plans</h3>
          {renderRegistrationTable(registrationPlans, "No plan added")}
        </div>
      </div>
    </div>
  );
};

export default FeePlans;