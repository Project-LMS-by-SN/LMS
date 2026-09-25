import { useEffect, useState } from "react";
import api from "../api/axios";
import EasyTimeInput from "../components/EasyTimeInput";
import { formatTime, calculateDuration } from "../utils/timeUtils";
import { useTheme } from "../context/ThemeContext";

const emptyForm = {
  shift_name: "",
  start_time: "07:00",
  end_time: "15:00",
};

const Shifts = () => {
  const userObj = JSON.parse(localStorage.getItem("lms_user") || "{}");
  const isOwner = userObj.role === "OWNER";
  const { timeFormat } = useTheme();
  const [shifts, setShifts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchShifts = async () => {
    try {
      const res = await api.get("/shifts");
      setShifts(res.data.data);
    } catch (error) {
      console.log("Shifts fetch error:", error);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTimeChange = (fieldName, newTime24) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: newTime24,
    }));
  };

  const openAddForm = () => {
    setEditingShiftId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (shift) => {
    setEditingShiftId(shift.id);
    setFormData({
      shift_name: shift.shift_name || "",
      start_time: shift.start_time ? formatTime(shift.start_time, "24hr") : "07:00",
      end_time: shift.end_time ? formatTime(shift.end_time, "24hr") : "15:00",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingShiftId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.shift_name || !formData.start_time || !formData.end_time) {
      alert("Shift name, start time, and end time are required");
      return;
    }

    try {
      if (editingShiftId) {
        await api.put(`/shifts/${editingShiftId}`, formData);
        alert("Shift updated successfully");
      } else {
        await api.post("/shifts", formData);
        alert("Shift added successfully");
      }

      closeForm();
      fetchShifts();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save shift");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this shift?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/shifts/${id}`);
      alert("Shift deleted successfully");
      fetchShifts();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete shift");
    }
  };

  const calculatedDuration = calculateDuration(
    formData.start_time,
    formData.end_time
  );

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <h1>Shifts</h1>
          <p>Manage library study shifts in 12-Hour (AM/PM) format</p>
        </div>

        {isOwner && (
          <button className="primary-btn" onClick={openAddForm}>
            + Add Shift
          </button>
        )}
      </div>

      {showForm && isOwner && (
        <div className="form-card">
          <h2>{editingShiftId ? "Edit Shift" : "Add Shift"}</h2>

          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-group">
              <label>Shift Name *</label>
              <input
                type="text"
                name="shift_name"
                value={formData.shift_name}
                onChange={handleChange}
                placeholder="e.g. Morning, Evening, Full Day"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <EasyTimeInput
                id="start_time"
                label="Start Time *"
                value={formData.start_time}
                onChange={(newVal) => handleTimeChange("start_time", newVal)}
              />

              <EasyTimeInput
                id="end_time"
                label="End Time *"
                value={formData.end_time}
                onChange={(newVal) => handleTimeChange("end_time", newVal)}
              />
            </div>

            {calculatedDuration && (
              <div className="duration-summary-box">
                <span>Total Shift Duration:</span>
                <span className="duration-badge-pill">{calculatedDuration}</span>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: "16px" }}>
              <button type="submit" className="primary-btn">
                {editingShiftId ? "Update Shift" : "Save Shift"}
              </button>

              <button type="button" className="secondary-btn" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Shift Name</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Status</th>
              {isOwner && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {shifts.map((shift) => {
              const start12 = formatTime(shift.start_time, timeFormat);
              const end12 = formatTime(shift.end_time, timeFormat);
              const duration = calculateDuration(shift.start_time, shift.end_time);

              return (
                <tr key={shift.id}>
                  <td>
                    <strong>{shift.shift_name}</strong>
                  </td>
                  <td>
                    <span className="time-12-text">{start12}</span>
                  </td>
                  <td>
                    <span className="time-12-text">{end12}</span>
                  </td>
                  <td>
                    <span className="duration-badge-pill">{duration || "-"}</span>
                  </td>
                  <td>
                    <span className={shift.is_active ? "status-badge" : "danger-badge"}>
                      {shift.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  {isOwner && (
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => openEditForm(shift)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(shift.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {shifts.length === 0 && <p className="empty-text">No shifts found</p>}
      </div>
    </div>
  );
};

export default Shifts;