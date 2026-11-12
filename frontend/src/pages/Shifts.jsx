import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import EasyTimeInput from "../components/EasyTimeInput";
import { formatTime, calculateDuration, timeToMinutes } from "../utils/timeUtils";
import { useSubmitLock } from "../hooks/useSubmitLock";

const doShiftTimesOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1Raw = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2Raw = timeToMinutes(end2);
  if (s1 === null || e1Raw === null || s2 === null || e2Raw === null) return false;
  if (s1 === e1Raw || s2 === e2Raw) return true;

  const e1 = e1Raw > s1 ? e1Raw : e1Raw + 1440;
  const e2 = e2Raw > s2 ? e2Raw : e2Raw + 1440;

  for (const offset of [-1440, 0, 1440]) {
    const oStart = s2 + offset;
    const oEnd = e2 + offset;
    if (s1 < oEnd && oStart < e1) return true;
  }
  return false;
};

const emptyForm = {
  shift_name: "",
  start_time: "07:00",
  end_time: "15:00",
};

const Shifts = () => {
  const userObj = JSON.parse(localStorage.getItem("lms_user") || "{}");
  const isOwner = userObj.role === "OWNER";
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const formRef = useRef(null);
  const nameInputRef = useRef(null);
  const { isSubmitting, runWithLock } = useSubmitLock();
  const { isSubmitting: isDeleting, runWithLock: runDeleteWithLock } = useSubmitLock();

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
  }, [showForm, editingShiftId]);

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await api.get("/shifts");
      return res.data?.data || [];
    },
  });

  const refreshShifts = async () => {
    await queryClient.invalidateQueries({ queryKey: ["shifts"] });
  };

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

  const timeConflictMessage = useMemo(() => {
    const startMins = timeToMinutes(formData.start_time);
    const endMins = timeToMinutes(formData.end_time);
    if (startMins === null || endMins === null) return "";
    if (startMins === endMins) {
      return "Start time and end time cannot be the same.";
    }
    const conflicting = shifts.find(
      (s) =>
        s.is_active !== false &&
        s.id !== editingShiftId &&
        doShiftTimesOverlap(formData.start_time, formData.end_time, s.start_time, s.end_time)
    );
    if (conflicting) {
      return `Time overlaps with "${conflicting.shift_name}" (${formatTime(conflicting.start_time, "12hr")} - ${formatTime(conflicting.end_time, "12hr")}).`;
    }
    return "";
  }, [formData.start_time, formData.end_time, shifts, editingShiftId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.shift_name || !formData.start_time || !formData.end_time) {
      alert("Shift name, start time, and end time are required");
      return;
    }

    if (timeConflictMessage) {
      alert(timeConflictMessage);
      return;
    }

    await runWithLock(async () => {
      try {
        if (editingShiftId) {
          await api.put(`/shifts/${editingShiftId}`, formData);
          closeForm();
          await refreshShifts();
          alert("Shift updated successfully");
        } else {
          await api.post("/shifts", formData);
          closeForm();
          await refreshShifts();
          alert("Shift added successfully");
        }
      } catch (error) {
        alert(error.response?.data?.message || "Failed to save shift");
      }
    });
  };

  const handleDelete = async (id) => {
    await runDeleteWithLock(async () => {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this shift?"
      );

      if (!confirmDelete) return;

      try {
        await api.delete(`/shifts/${id}`);
        alert("Shift deleted successfully");
        await refreshShifts();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete shift");
      }
    });
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
        <div
          ref={formRef}
          className="form-card"
          style={{
            scrollMarginTop: "88px",
            ...(editingShiftId ? { border: "2px solid #3b82f6" } : {}),
          }}
        >
          <h2>{editingShiftId ? "Edit Shift" : "Add Shift"}</h2>

          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-group">
              <label>Shift Name *</label>
              <input
                ref={nameInputRef}
                type="text"
                name="shift_name"
                value={formData.shift_name}
                onChange={handleChange}
                placeholder="e.g. Morning, Evening, Full Day"
                required
              />
            </div>

            <div className="responsive-grid-1-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "16px" }}>
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

            {calculatedDuration && !timeConflictMessage && (
              <div className="duration-summary-box">
                <span>Total Shift Duration:</span>
                <span className="duration-badge-pill">{calculatedDuration}</span>
              </div>
            )}

            {timeConflictMessage && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  color: "#dc2626",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {timeConflictMessage}
              </div>
            )}

            <div className="form-actions" style={{ marginTop: "16px" }}>
              <button type="submit" className="primary-btn" disabled={Boolean(timeConflictMessage) || isSubmitting}>
                {isSubmitting ? "Saving..." : editingShiftId ? "Update Shift" : "Save Shift"}
              </button>

              <button type="button" className="secondary-btn" onClick={closeForm} disabled={isSubmitting}>
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
              const start12 = formatTime(shift.start_time, "12hr");
              const end12 = formatTime(shift.end_time, "12hr");
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
                          type="button"
                          className="delete-btn"
                          disabled={isDeleting}
                          onClick={() => handleDelete(shift.id)}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {shifts.length === 0 && (
          <p className="empty-text">{isLoading && shifts.length === 0 ? "Loading shifts..." : "No shifts found"}</p>
        )}
      </div>
    </div>
  );
};

export default Shifts;