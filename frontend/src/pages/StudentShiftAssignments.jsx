import { useEffect, useState } from "react";
import api from "../api/axios";
import { formatTime } from "../utils/timeUtils";
import { useTheme } from "../context/ThemeContext";

const emptyForm = {
  validity_id: "",
  shift_id: "",
  seat_id: "",
};

const StudentShiftAssignments = () => {
  const { timeFormat } = useTheme();
  const [assignments, setAssignments] = useState([]);
  const [validities, setValidities] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [seats, setSeats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const [assignmentRes, validityRes, shiftRes, seatRes] =
        await Promise.all([
          api.get("/student-shift-assignments"),
          api.get("/student-validities"),
          api.get("/shifts"),
          api.get("/seats"),
        ]);

      setAssignments(assignmentRes.data.data);
      setValidities(validityRes.data.data);
      setShifts(shiftRes.data.data);
      setSeats(seatRes.data.data);
    } catch (error) {
      console.log("Shift assignment fetch error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedValidity = validities.find(
    (validity) => String(validity.id) === String(formData.validity_id)
  );

  const isReserved = selectedValidity?.access_type === "RESERVED";

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "validity_id") {
      const validity = validities.find(
        (item) => String(item.id) === String(value)
      );

      setFormData({
        ...formData,
        validity_id: value,
        seat_id: validity?.access_type === "RESERVED" ? formData.seat_id : "",
      });

      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.validity_id || !formData.shift_id) {
      alert("Student validity and shift are required");
      return;
    }

    if (isReserved && !formData.seat_id) {
      alert("Seat is required for reserved students");
      return;
    }

    const payload = {
      validity_id: Number(formData.validity_id),
      shift_id: Number(formData.shift_id),
      seat_id: isReserved ? Number(formData.seat_id) : null,
    };

    try {
      await api.post("/student-shift-assignments", payload);

      alert("Shift assigned successfully");

      closeForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to assign shift");
    }
  };

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <h1>Shift Assignments</h1>
          <p>Assign students to shifts and seats</p>
        </div>

        <button className="primary-btn" onClick={() => setShowForm(true)}>
          + Assign Shift
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>Assign Student Shift</h2>

          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-group">
              <label>Student Validity *</label>
              <select
                name="validity_id"
                value={formData.validity_id}
                onChange={handleChange}
              >
                <option value="">Select student validity</option>

                {validities.map((validity) => (
                  <option key={validity.id} value={validity.id}>
                    {validity.student_code} - {validity.full_name} -{" "}
                    {validity.plan_name} - {validity.access_type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Shift *</label>
              <select
                name="shift_id"
                value={formData.shift_id}
                onChange={handleChange}
              >
                <option value="">Select shift</option>

                {shifts
                  .filter((shift) => shift.is_active)
                  .map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shift_name} ({formatTime(shift.start_time, timeFormat)} - {formatTime(shift.end_time, timeFormat)})
                    </option>
                  ))}
              </select>
            </div>

            {isReserved && (
              <div className="form-group">
                <label>Seat *</label>
                <select
                  name="seat_id"
                  value={formData.seat_id}
                  onChange={handleChange}
                >
                  <option value="">Select seat</option>

                  {seats
                    .filter((seat) => seat.is_active)
                    .map((seat) => (
                      <option key={seat.id} value={seat.id}>
                        {seat.seat_number}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {!isReserved && formData.validity_id && (
              <div className="form-group full-width">
                <p className="empty-text">
                  This student has UNRESERVED access, so seat is not required.
                </p>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                Save Assignment
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
              <th>Student</th>
              <th>Code</th>
              <th>Plan</th>
              <th>Access</th>
              <th>Shift</th>
              <th>Seat</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.full_name}</td>
                <td>{assignment.student_code}</td>
                <td>{assignment.plan_name}</td>
                <td>{assignment.access_type}</td>
                <td>
                  <strong>{assignment.shift_name}</strong>
                  {assignment.start_time && (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {formatTime(assignment.start_time, timeFormat)} - {formatTime(assignment.end_time, timeFormat)}
                    </div>
                  )}
                </td>
                <td>{assignment.seat_number || "No Seat"}</td>
                <td>
                  <span
                    className={
                      assignment.is_active ? "status-badge" : "danger-badge"
                    }
                  >
                    {assignment.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {assignments.length === 0 && (
          <p className="empty-text">No shift assignments found</p>
        )}
      </div>
    </div>
  );
};

export default StudentShiftAssignments;