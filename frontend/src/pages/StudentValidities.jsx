import { useEffect, useState } from "react";
import api from "../api/axios";
import CustomDatePicker from "../components/CustomDatePicker";

const emptyForm = {
  student_id: "",
  fee_plan_id: "",
  start_date: "",
  access_type: "UNRESERVED",
  custom_amount: "",
};

const StudentValidities = () => {
  const [validities, setValidities] = useState([]);
  const [students, setStudents] = useState([]);
  const [feePlans, setFeePlans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [accessFilter, setAccessFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    try {
      const [validityRes, studentRes, feePlanRes] = await Promise.all([
        api.get("/student-validities"),
        api.get("/students"),
        api.get("/fee-plans"),
      ]);

      setValidities(validityRes.data.data);
      setStudents(studentRes.data.data);
      setFeePlans(feePlanRes.data.data);
    } catch (error) {
      console.log("Validity fetch error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeFeePlans = feePlans.filter((plan) => plan.is_active);

  const getStatus = (validity) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(validity.end_date);
    endDate.setHours(0, 0, 0, 0);
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);
    const fifteenDaysAgo = new Date(today);
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    fifteenDaysAgo.setHours(0, 0, 0, 0);

    if (validity.due_amount > 0) {
      if (endDate < fifteenDaysAgo) return "inactive";
      if (endDate < today) return "unpaid";
    }

    if (endDate < today) return "expired";
    if (endDate <= next7Days) return "expiring_soon";
    return "active";
  };

  const filteredValidities = validities.filter((v) => {
    if (accessFilter !== "ALL" && v.access_type !== accessFilter) return false;
    if (statusFilter === "all") return true;
    return getStatus(v) === statusFilter;
  });

  const getStatusCounts = (type) => {
    const base = validities.filter((v) => type === "ALL" || v.access_type === type);
    return {
      all: base.length,
      active: base.filter((v) => getStatus(v) === "active").length,
      expiring_soon: base.filter((v) => getStatus(v) === "expiring_soon").length,
      inactive: base.filter((v) => getStatus(v) === "inactive").length,
      unpaid: base.filter((v) => getStatus(v) === "unpaid").length,
    };
  };

  const counts = getStatusCounts(accessFilter);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextFormData = { [name]: value };
    if (name === "access_type") {
      nextFormData.fee_plan_id = "";
    }

    setFormData({
      ...formData,
      ...nextFormData,
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.student_id ||
      !formData.fee_plan_id ||
      !formData.start_date ||
      !formData.access_type
    ) {
      alert("Student, fee plan, start date, and access type are required");
      return;
    }

    const payload = {
      student_id: Number(formData.student_id),
      fee_plan_id: Number(formData.fee_plan_id),
      start_date: formData.start_date,
      access_type: formData.access_type,
    };

    if (formData.custom_amount !== "") {
      if (Number(formData.custom_amount) < 0) {
        alert("Custom amount cannot be negative");
        return;
      }

      payload.custom_amount = Number(formData.custom_amount);
    }

    try {
      await api.post("/student-validities", payload);

      alert("Student validity saved successfully");

      closeForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save validity");
    }
  };

  const statusLabels = {
    active: { label: "Active", color: "#16a34a", bg: "#f0fdf4" },
    expiring_soon: { label: "Expiring in 7 Days", color: "#d97706", bg: "#fffbeb" },
    expired: { label: "Expired", color: "#dc2626", bg: "#fef2f2" },
    inactive: { label: "Inactive", color: "#dc2626", bg: "#fef2f2" },
    unpaid: { label: "Unpaid", color: "#d97706", bg: "#fffbeb" },
  };

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <h1>Student Validity</h1>
          <p>Assign or update student subscription validity</p>
        </div>

        <button className="primary-btn" onClick={() => setShowForm(true)}>
          + Assign Validity
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>Assign / Update Validity</h2>

          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-group">
              <label>Student *</label>
              <select
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_code} - {student.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fee Plan *</label>
              <select
                name="fee_plan_id"
                value={formData.fee_plan_id}
                onChange={handleChange}
              >
                <option value="">Select fee plan</option>
                {activeFeePlans
                  .filter((plan) => {
                    if (formData.access_type === "RESERVED") {
                      return plan.plan_type === "RESERVED";
                    } else if (formData.access_type === "UNRESERVED") {
                      return plan.plan_type === "UNRESERVED";
                    }
                    return true;
                  })
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.plan_name} - ₹{plan.amount} - {plan.duration_days} days
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Start Date *</label>
              <CustomDatePicker
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                placeholder="Select start date"
              />
            </div>

            <div className="form-group">
              <label>Access Type *</label>
              <select
                name="access_type"
                value={formData.access_type}
                onChange={handleChange}
              >
                <option value="UNRESERVED">Unreserved</option>
                <option value="RESERVED">Reserved</option>
              </select>
            </div>

            <div className="form-group">
              <label>Custom Amount</label>
              <input
                type="number"
                name="custom_amount"
                value={formData.custom_amount}
                onChange={handleChange}
                placeholder="Optional, e.g. 750"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                Save Validity
              </button>

              <button type="button" className="secondary-btn" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {["ALL", "RESERVED", "UNRESERVED"].map((type) => (
            <button
              key={type}
              onClick={() => { setAccessFilter(type); setStatusFilter("all"); }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: accessFilter === type ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                background: accessFilter === type ? '#eff6ff' : '#f8fafc',
                color: accessFilter === type ? '#2563eb' : '#64748b',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {type === "ALL" ? "All" : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { key: "all", label: `All (${counts.all})`, color: "#64748b", bg: "#f1f5f9" },
            { key: "active", label: `Active (${counts.active})`, color: "#16a34a", bg: "#f0fdf4" },
            { key: "expiring_soon", label: `Expiring in 7 Days (${counts.expiring_soon})`, color: "#d97706", bg: "#fffbeb" },
            { key: "inactive", label: `Inactive (${counts.inactive})`, color: "#dc2626", bg: "#fef2f2" },
            { key: "unpaid", label: `Unpaid (${counts.unpaid})`, color: "#d97706", bg: "#fff7ed" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setStatusFilter(btn.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: statusFilter === btn.key ? `2px solid ${btn.color}` : '1px solid #e2e8f0',
                background: statusFilter === btn.key ? btn.bg : '#fff',
                color: btn.color,
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Code</th>
              <th>Plan</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Amount</th>
              <th>Due</th>
              <th>Access Type</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredValidities.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  No validities found
                </td>
              </tr>
            ) : (
              filteredValidities.map((validity) => {
                const status = getStatus(validity);
                const style = statusLabels[status];
                return (
                  <tr key={validity.id}>
                    <td>{validity.full_name}</td>
                    <td>{validity.student_code}</td>
                    <td>{validity.plan_name}</td>
                    <td>{validity.start_date}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{validity.end_date}</div>
                      {(() => {
                        if (!validity.end_date) return null;
                        const exp = new Date(validity.end_date);
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        exp.setHours(0, 0, 0, 0);
                        const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
                        return (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: diff < 0 ? "#dc2626" : diff <= 7 ? "#d97706" : "#16a34a" }}>
                            {diff < 0 ? `Expired ${Math.abs(diff)}d ago` : diff === 0 ? "Expires today" : `${diff}d left`}
                          </span>
                        );
                      })()}
                    </td>
                    <td>₹{validity.total_amount}</td>
                    <td style={{ color: validity.due_amount > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                      {validity.due_amount > 0 ? `₹${validity.due_amount}` : '₹0'}
                    </td>
                    <td>
                      <span className="status-badge">{validity.access_type}</span>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: style.bg,
                        color: style.color,
                        fontWeight: 600,
                        fontSize: '12px',
                      }}>
                        {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentValidities;