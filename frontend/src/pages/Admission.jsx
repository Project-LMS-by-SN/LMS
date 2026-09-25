import { useEffect, useState, useRef, useMemo } from "react";
import { FaUserCircle, FaCamera, FaCheckCircle } from "react-icons/fa";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import { formatTime } from "../utils/timeUtils";
import CustomDatePicker from "../components/CustomDatePicker";

const getSeatColorForAdmission = (seat, selectedShiftIds, selectedSeatId, darkMode = false) => {
  if (seat.is_active === false) {
    return {
      bg: darkMode ? "#1e293b" : "#f1f5f9",
      border: darkMode ? "#475569" : "#94a3b8",
      color: darkMode ? "#94a3b8" : "#64748b",
      isSelectable: false,
      tooltip: "Inactive"
    };
  }

  const isSelected = selectedSeatId === seat.id;
  if (isSelected) {
    return {
      bg: "#3b82f6",
      border: "#2563eb",
      color: "white",
      isSelectable: true,
      tooltip: `Selected - Seat ${seat.seat_number}`
    };
  }

  const activeShifts = seat.occupied_shifts || [];
  
  // Check if occupied in any of the selected shifts
  const isOccupiedInSelectedShifts = activeShifts.some(os => selectedShiftIds.map(Number).includes(Number(os.shift_id)));

  if (isOccupiedInSelectedShifts) {
    return {
      bg: darkMode ? "rgba(239,68,68,0.12)" : "#e0e0e0",
      border: darkMode ? "#ef4444" : "#9e9e9e",
      color: darkMode ? "#f87171" : "#757575",
      isSelectable: false,
      tooltip: "Occupied in selected shift"
    };
  }

  return {
    bg: darkMode ? "rgba(34,197,94,0.12)" : "#e8f5e9",
    border: "#4caf50",
    color: darkMode ? "#4ade80" : "#2e7d32",
    isSelectable: true,
    tooltip: "Available"
  };
};

const Admission = () => {
  const [formData, setFormData] = useState({
    student_code: "",
    reg_no: "",
    full_name: "",
    email: "",
    mobile: "",
    gender: "",
    dob: "",
    address: "",
    aadhar_number: "",
    seatType: "",
    shift_ids: [],
    fee_plan_id: "",
    profilePhotoUrl: "",
    requestId: "",
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  const uniqueFloors = useMemo(() => {
    return [...new Set(seats.filter(s => s.is_active !== false).map(s => s.floor).filter(Boolean))].sort();
  }, [seats]);

  const uniqueRooms = useMemo(() => {
    if (!selectedFloor) return [];
    return [...new Set(seats.filter(s => s.floor === selectedFloor && s.is_active !== false).map(s => s.room).filter(Boolean))].sort();
  }, [seats, selectedFloor]);

  const handleFloorChange = (floor) => {
    setSelectedFloor(floor);
    const rooms = [...new Set(seats.filter(s => s.floor === floor && s.is_active !== false).map(s => s.room).filter(Boolean))].sort();
    setSelectedRoom(rooms[0] || "");
  };
  const [shifts, setShifts] = useState([]);
  const [feePlans, setFeePlans] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [paymentMode, setPaymentMode] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [includeRegistrationFee, setIncludeRegistrationFee] = useState(false);
  const [customRegistrationFee, setCustomRegistrationFee] = useState("100");
  const [admissionRemark, setAdmissionRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [seatsRes, shiftsRes, plansRes, modesRes, codeRes] = await Promise.all([
          api.get("/seats"),
          api.get("/shifts"),
          api.get("/fee-plans"),
          api.get("/payment-modes"),
          api.get("/students/next-code"),
        ]);
        const allSeats = seatsRes.data.data || [];
        setSeats(allSeats);
        const activeSeats = allSeats.filter(s => s.is_active !== false);
        const floors = [...new Set(activeSeats.map(s => s.floor).filter(Boolean))].sort();
        if (floors.length > 0) {
          setSelectedFloor(floors[0]);
          const rooms = [...new Set(activeSeats.filter(s => s.floor === floors[0]).map(s => s.room).filter(Boolean))].sort();
          if (rooms.length > 0) {
            setSelectedRoom(rooms[0]);
          }
        }
        setShifts(shiftsRes.data.data);
        const activePlans = plansRes.data.data.filter(p => p.is_active !== false && p.plan_type !== "REGISTRATION");
        setFeePlans(activePlans);
        setPaymentModes(modesRes.data.data);

        let nextStudentCode = "";
        let nextRegNo = "";

        if (codeRes.data.success) {
          nextStudentCode = codeRes.data.data.student_code;
          nextRegNo = codeRes.data.data.reg_no;
          setFormData(prev => ({
            ...prev,
            student_code: nextStudentCode,
            reg_no: nextRegNo,
          }));
        }

        const params = new URLSearchParams(window.location.search);
        const requestId = params.get("request_id");
        if (requestId) {
          try {
            const reqRes = await api.get(`/admission-requests/${requestId}`);
            if (reqRes.data.success) {
              const reqData = reqRes.data.data;
              setFormData(prev => ({
                ...prev,
                student_code: nextStudentCode || prev.student_code,
                reg_no: nextRegNo || prev.reg_no,
                full_name: reqData.full_name || "",
                email: reqData.email || "",
                mobile: reqData.mobile || "",
                gender: reqData.gender || "",
                dob: reqData.dob || "",
                address: reqData.address || "",
                aadhar_number: reqData.aadhar_number || "",
                profilePhotoUrl: reqData.profile_photo_url || "",
                requestId: requestId,
              }));
              if (reqData.profile_photo_url) {
                setPhotoPreview(reqData.profile_photo_url);
              }
            }
          } catch (err) {
            console.error("Failed to load admission request details:", err);
          }
        }
      } catch (error) {
        console.log("Admission fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePhotoFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
      setFormData(prev => ({ ...prev, profilePhotoUrl: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handlePhotoFile(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextFormData = { [name]: value };

    if (name === "seatType") {
      nextFormData.fee_plan_id = "";
      if (value === "Unreserved") {
        nextFormData.seat_id = null;
        if (formData.shift_ids.length > 2) {
          alert("Unreserved seat type allows maximum of 2 shifts. Trimming to first 2 selected shifts.");
          nextFormData.shift_ids = formData.shift_ids.slice(0, 2);
        }
      }
    }

    setFormData(prev => ({ ...prev, ...nextFormData }));
    if (name === "seatType" && value === "Unreserved") {
      setSelectedSeat(null);
    }
  };

  const toggleShift = (shiftId) => {
    setFormData(prev => {
      const exists = prev.shift_ids.includes(shiftId);
      if (!exists && prev.seatType === "Unreserved" && prev.shift_ids.length >= 2) {
        alert("Maximum 2 shifts allowed for Unreserved seat type.");
        return prev;
      }
      return {
        ...prev,
        shift_ids: exists
          ? prev.shift_ids.filter(id => id !== shiftId)
          : [...prev.shift_ids, shiftId],
      };
    });
  };

  const selectFullDay = () => {
    if (formData.seatType === "Unreserved") {
      alert("Full Day selection is not allowed for Unreserved seats. Please select max 2 shifts manually.");
      return;
    }
    const allShiftIds = shifts.filter(s => s.is_active !== false).map(s => s.id);
    setFormData(prev => ({
      ...prev,
      shift_ids: prev.shift_ids.length === allShiftIds.length ? [] : allShiftIds,
    }));
  };

  const getCalculatedAmount = () => {
    const plan = feePlans.find(p => String(p.id) === String(formData.fee_plan_id));
    const baseAmount = plan ? Number(plan.amount) : 0;
    const addedRegFee = includeRegistrationFee ? (Number(customRegistrationFee) || 0) : 0;

    if (formData.seatType === "Unreserved" && formData.shift_ids.length > 0) {
      return (baseAmount * formData.shift_ids.length) + addedRegFee;
    }
    return baseAmount + addedRegFee;
  };

  const isFullDay = formData.shift_ids.length === shifts.filter(s => s.is_active !== false).length;
  const hasCustomSelection = formData.shift_ids.length > 0 && !isFullDay;

  const occupiedSeatIds = seats
    .filter(s => {
      if (formData.shift_ids.length === 0) return false;
      const seatOccupiedShifts = s.occupied_shifts || [];
      return seatOccupiedShifts.some(os => formData.shift_ids.map(Number).includes(Number(os.shift_id)));
    })
    .map(s => s.id);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.student_code || !formData.full_name || !formData.email || !formData.mobile || !formData.gender) {
      alert("Student code, name, email, mobile, and gender are required");
      return;
    }

    const cleanMobile = String(formData.mobile).trim();
    if (!/^\d{10}$/.test(cleanMobile)) {
      alert("Mobile number must be exactly 10 digits.");
      return;
    }

    const cleanEmail = String(formData.email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    const cleanAadhar = formData.aadhar_number ? String(formData.aadhar_number).trim() : "";
    if (cleanAadhar && !/^\d{12}$/.test(cleanAadhar)) {
      alert("Aadhar card number must be exactly 12 digits (or leave empty if not available).");
      return;
    }

    if (!formData.fee_plan_id) {
      alert("Please select a Fee Plan");
      return;
    }

    if (!formData.seatType) {
      alert("Please select Seat Type (Reserved or Unreserved)");
      return;
    }

    if (formData.shift_ids.length === 0) {
      alert("Please select at least one shift");
      return;
    }

    const needsSeat = formData.seatType === "Reserved";
    if (needsSeat && !selectedSeat) {
      alert("Please select a seat.");
      return;
    }

    if (!paymentMode) {
      alert("Please select a payment mode");
      return;
    }

    const selectedMode = paymentModes.find(m => String(m.id) === String(paymentMode));
    const modeNameUpper = selectedMode ? selectedMode.mode_name.toUpperCase() : "";

    if (modeNameUpper === "UPI" && !utrNumber.trim()) {
      alert("Please enter UTR number for UPI payment");
      return;
    }

    if (modeNameUpper === "CARD" && !utrNumber.trim()) {
      alert("Please enter card reference / transaction number");
      return;
    }

    const defaultRemark = includeRegistrationFee
      ? `(Admission Fee + Registration Fee)`
      : `(Admission Fee)`;
    const finalRemark = admissionRemark.trim() ? admissionRemark.trim() : defaultRemark;

    setSubmitting(true);
    try {
      const fullAdmissionPayload = {
        student_code: formData.student_code,
        reg_no: formData.reg_no || null,
        full_name: formData.full_name,
        email: formData.email,
        mobile: formData.mobile,
        gender: formData.gender,
        dob: formData.dob || null,
        address: formData.address || null,
        aadhar_number: formData.aadhar_number || null,
        profile_photo_url: formData.profilePhotoUrl || null,
        requestId: formData.requestId || null,
        // Fee & Seats
        fee_plan_id: Number(formData.fee_plan_id),
        seat_type: formData.seatType,
        shift_ids: formData.shift_ids.map(Number),
        seat_id: needsSeat ? Number(selectedSeat) : null,
        // Payment
        payment_mode_id: Number(paymentMode),
        payment_date: paymentDate,
        utr_number: (modeNameUpper === "UPI" || modeNameUpper === "CARD") ? utrNumber.trim() : null,
        remarks: finalRemark,
        custom_amount: getCalculatedAmount(),
      };

      await api.post("/students/admit", fullAdmissionPayload);

      alert("Student admitted with shifts & seat allocated successfully!");
      setAdmissionRemark("");
      setFormData({
        student_code: "", reg_no: "", full_name: "", email: "", mobile: "", gender: "",
        dob: "", address: "", aadhar_number: "", seatType: "", shift_ids: [], fee_plan_id: "",
        profilePhotoUrl: "", requestId: "",
      });
      setPhotoPreview(null);
      setSelectedSeat(null);
      setPaymentMode("");
      setUtrNumber("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      // Refresh next student code
      const codeRes = await api.get("/students/next-code");
      if (codeRes.data.success) {
        setFormData(prev => ({
          ...prev,
          student_code: codeRes.data.data.student_code,
          reg_no: codeRes.data.data.reg_no,
        }));
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to admit student");
    } finally {
      setSubmitting(false);
    }
  };

  const { darkMode, timeFormat } = useTheme();
  const card = darkMode ? "#1e293b" : "#FCFBF9";
  const border = darkMode ? "#334155" : "#e2e8f0";
  const textPrimary = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const inputBg = darkMode ? "#0f172a" : "#FCFBF9";
  const sectionBg = darkMode ? "#0f172a" : "#f8fafc";
  const readOnlyBg = darkMode ? "#1e293b" : "#f1f5f9";

  if (loading) {
    return <div className="page"><p>Loading...</p></div>;
  }

  return (
    <div className="page admission-page">
      <div className="page-title-row">
        <h1>Admission Portal</h1>
        <p style={{ color: textMuted, fontSize: '14px', marginTop: '4px' }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h2>Personal Details</h2>
          <div className="student-form">
            {/* Profile Photo Upload */}
            <div className="form-group full-width" style={{ display: "flex", gap: "24px", alignItems: "stretch", marginBottom: "20px" }}>
              {/* Profile Photo Uploader */}
              <div style={{ flex: "1 1 100%", display: "flex", flexDirection: "column" }}>
                <label style={{ marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Profile Photo</label>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? '#2563eb' : border}`,
                    borderRadius: '12px',
                    padding: '0 16px',
                    height: '106px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    background: isDragging ? (darkMode ? 'rgba(37,99,235,0.2)' : '#eff6ff') : sectionBg,
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${border}`, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: darkMode ? '#334155' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: textMuted, flexShrink: 0 }}>
                      <FaCamera style={{ fontSize: "24px", color: textMuted }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {photoPreview ? <><FaCheckCircle style={{ color: "#16a34a" }} /> Photo selected</> : 'Drag & drop or click to upload'}
                    </div>
                    <div style={{ fontSize: '11px', color: textMuted, marginTop: '2px' }}>JPG, PNG up to 5MB</div>
                    {photoPreview && (
                      <button type="button" onClick={e => { e.stopPropagation(); setPhotoPreview(null); setFormData(prev => ({ ...prev, profilePhotoUrl: '' })); }}
                        style={{ marginTop: '4px', fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => handlePhotoFile(e.target.files[0])} />
              </div>
            </div>

            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Enter full name" required />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" required />
            </div>
            <div className="form-group">
              <label>Student Code *</label>
              <input type="text" name="student_code" value={formData.student_code} readOnly style={{ background: readOnlyBg, cursor: 'not-allowed', color: textMuted }} />
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}` }}>
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Registration No</label>
              <input type="text" name="reg_no" value={formData.reg_no} readOnly style={{ background: readOnlyBg, cursor: 'not-allowed', color: textMuted }} />
            </div>

            <div className="form-group">
              <label>Mobile Number *</label>
              <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Enter mobile number" required />
            </div>
            <div className="form-group">
              <label>Aadhar Number</label>
              <input type="text" name="aadhar_number" value={formData.aadhar_number} onChange={handleChange} placeholder="12-digit Aadhar number" maxLength="12" />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <CustomDatePicker
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                placeholder="Select date of birth"
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Full address" />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h2>Admission Details</h2>
          <div className="student-form">
            <div className="form-group">
              <label>Seat Type</label>
              <select name="seatType" value={formData.seatType} onChange={handleChange} style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}` }}>
                <option value="">Select type</option>
                <option value="Reserved">Reserved</option>
                <option value="Unreserved">Unreserved</option>
              </select>
              {formData.shift_ids.length > 1 && formData.seatType === "Unreserved" && (
                <p style={{ marginTop: '6px', fontSize: '12px', color: '#f59e0b' }}>
                  Multiple shifts require Reserved seat type. Auto-switching to Reserved.
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Fee Plan</label>
              <select name="fee_plan_id" value={formData.fee_plan_id} onChange={handleChange} style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}` }}>
                <option value="">Select fee plan</option>
                {feePlans
                  .filter(plan => {
                    if (formData.seatType === "Reserved") {
                      return plan.plan_type === "RESERVED";
                    } else if (formData.seatType === "Unreserved") {
                      return plan.plan_type === "UNRESERVED";
                    }
                    return true;
                  })
                  .map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.plan_name} - ₹{plan.amount} / {plan.duration_days} days
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Shifts</label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={selectFullDay}
                  style={{
                    padding: '8px 18px', borderRadius: '8px', border: `2px solid ${isFullDay ? '#2563eb' : border}`,
                    background: isFullDay ? (darkMode ? 'rgba(37,99,235,0.2)' : '#eff6ff') : card,
                    color: isFullDay ? '#2563eb' : textMuted,
                    fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  Full Day {isFullDay && <FaCheckCircle style={{ marginLeft: '4px' }} />}
                </button>
                {hasCustomSelection && (
                  <span style={{
                    padding: '8px 18px', borderRadius: '8px', border: '2px solid #f59e0b',
                    background: darkMode ? 'rgba(245,158,11,0.15)' : '#fffbeb', color: '#d97706', fontWeight: 600, fontSize: '13px',
                  }}>
                    Custom
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {shifts.filter(s => s.is_active !== false).map(shift => {
                  const selected = formData.shift_ids.includes(shift.id);
                  return (
                    <label
                      key={shift.id}
                      onClick={() => toggleShift(shift.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 16px', borderRadius: '8px', border: `2px solid ${selected ? '#2563eb' : border}`,
                        background: selected ? (darkMode ? 'rgba(37,99,235,0.2)' : '#eff6ff') : card, cursor: 'pointer',
                        transition: 'all 0.2s', userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {}}
                        style={{ accentColor: '#2563eb', width: '16px', height: '16px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: textPrimary }}>{shift.shift_name}</div>
                        <div style={{ fontSize: '12px', color: textMuted }}>
                          {formatTime(shift.start_time, timeFormat)} - {formatTime(shift.end_time, timeFormat)}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {formData.shift_ids.length > 0 && (
                <p style={{ marginTop: '10px', fontSize: '13px', color: textMuted }}>
                  {formData.shift_ids.length} shift(s) selected
                </p>
              )}
            </div>
          </div>

          {formData.seatType === "Reserved" && (
            <div className="form-group full-width" style={{ marginTop: '18px' }}>
              <label>Select a Seat</label>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', fontSize: '13px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', background: darkMode ? 'rgba(34,197,94,0.2)' : '#e8f5e9', border: '2px solid #4caf50', borderRadius: '4px' }}></div> Available</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', background: darkMode ? 'rgba(239,68,68,0.2)' : '#e0e0e0', border: darkMode ? '2px solid #ef4444' : '2px solid #9e9e9e', borderRadius: '4px' }}></div> Occupied</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', background: '#3b82f6', border: '2px solid #2563eb', borderRadius: '4px' }}></div> Selected</div>
              </div>
              {/* Floor & Room filter options */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: textMuted, marginBottom: '4px', fontWeight: '600' }}>Floor</label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => handleFloorChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${border}`,
                      background: inputBg,
                      color: textPrimary,
                      fontSize: '14px',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select Floor</option>
                    {uniqueFloors.map(f => <option key={f} value={f}>Floor {f}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: textMuted, marginBottom: '4px', fontWeight: '600' }}>Room</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${border}`,
                      background: inputBg,
                      color: textPrimary,
                      fontSize: '14px',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select Room</option>
                    {uniqueRooms.map(r => <option key={r} value={r}>Room {r}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: sectionBg, padding: '20px', borderRadius: '8px', border: `1px solid ${border}` }}>
                {(() => {
                  const activeSeats = seats.filter(s => s.is_active !== false && s.floor === selectedFloor && s.room === selectedRoom);
                  if (activeSeats.length === 0) {
                    return <div style={{ color: textMuted, fontSize: '14px', textAlign: 'center', padding: '20px' }}>No active seats available in this floor & room.</div>;
                  }
                  const groups = {};
                  activeSeats.forEach(seat => {
                    const rowLetter = (seat.seat_number || '').replace(/[0-9]/g, '').charAt(0).toUpperCase() || 'A';
                    if (!groups[rowLetter]) groups[rowLetter] = [];
                    groups[rowLetter].push(seat);
                  });
                  return Object.keys(groups).sort().map(rowLetter => (
                    <div key={rowLetter}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: darkMode ? '#334155' : '#e2e8f0', color: textPrimary, padding: '2px 10px', borderRadius: '6px' }}>{rowLetter} Row</span>
                        <span style={{ fontWeight: 500, fontSize: '10px' }}>({groups[rowLetter].length})</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: '10px' }}>
                        {groups[rowLetter].map(seat => {
                          const sc = getSeatColorForAdmission(seat, formData.shift_ids, selectedSeat, darkMode);
                          return (
                            <div
                              key={seat.id}
                              onClick={() => sc.isSelectable && setSelectedSeat(seat.id)}
                              style={{
                                height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: 'bold', borderRadius: '6px',
                                cursor: sc.isSelectable ? 'pointer' : 'not-allowed',
                                background: sc.bg,
                                color: sc.color,
                                border: `2px solid ${sc.border}`,
                                boxShadow: (selectedSeat === seat.id) ? '0 4px 6px -1px rgba(59, 130, 246, 0.4)' : 'none',
                                transition: 'all 0.2s',
                                opacity: sc.isSelectable ? 1 : 0.55,
                              }}
                              title={sc.tooltip}
                            >
                              {seat.seat_number}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
              {selectedSeat && (() => {
                const sObj = seats.find(s => s.id === selectedSeat);
                return sObj ? (
                  <p style={{ marginTop: '12px', color: '#16a34a', fontWeight: 'bold', fontSize: '14px' }}>
                    Seat {sObj.seat_number} (Floor {sObj.floor}, Room {sObj.room}) selected for {formData.shift_ids.length} shift(s)
                  </p>
                ) : null;
              })()}
            </div>
          )}
        </div>

        <div className="form-card">
          <h2>Payment Details</h2>
          <div className="student-form">
            <div className="form-group">
              <label>Payment Mode *</label>
              <select
                value={paymentMode}
                onChange={(e) => {
                  setPaymentMode(e.target.value);
                  const sel = paymentModes.find(m => String(m.id) === String(e.target.value));
                  const nameUpper = sel ? sel.mode_name.toUpperCase() : "";
                  if (nameUpper !== "UPI" && nameUpper !== "CARD") {
                    setUtrNumber("");
                  }
                }}
                style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}` }}
              >
                <option value="">Select mode</option>
                {paymentModes.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.mode_name}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const sel = paymentModes.find(m => String(m.id) === String(paymentMode));
              const nameUpper = sel ? sel.mode_name.toUpperCase() : "";
              if (nameUpper === "UPI") {
                return (
                  <div className="form-group">
                    <label>UTR/Transaction ID *</label>
                    <input
                      type="text"
                      placeholder="Enter UPI UTR number"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                    />
                  </div>
                );
              }
              if (nameUpper === "CARD") {
                return (
                  <div className="form-group">
                    <label>Card / Reference Number *</label>
                    <input
                      type="text"
                      placeholder="Enter Card Last 4 digits or Ref Number"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                    />
                  </div>
                );
              }
              return null;
            })()}

            <div className="form-group">
              <label>Payment Date</label>
              <CustomDatePicker
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                placeholder="Payment date"
              />
            </div>

            <div className="form-group">
              <label>Payment Remark / Reference</label>
              <input
                type="text"
                placeholder="Default: (Admission Fee)"
                value={admissionRemark}
                onChange={(e) => setAdmissionRemark(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2', background: sectionBg, padding: '14px 18px', borderRadius: '10px', border: `1px solid ${border}` }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: textPrimary }}>
                <input
                  type="checkbox"
                  checked={includeRegistrationFee}
                  onChange={(e) => setIncludeRegistrationFee(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                />
                Add Registration Fee (Optional One-time at Admission)
              </label>
              {includeRegistrationFee && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: textMuted, fontWeight: '500' }}>Registration Amount (₹):</span>
                  <input
                    type="number"
                    value={customRegistrationFee}
                    onChange={(e) => setCustomRegistrationFee(e.target.value)}
                    placeholder="100"
                    style={{ width: '140px', padding: '6px 12px', borderRadius: '6px', border: `1px solid ${border}`, fontSize: '14px', fontWeight: '600', background: inputBg, color: textPrimary }}
                  />
                </div>
              )}
            </div>

            {formData.fee_plan_id && (() => {
              const plan = feePlans.find(p => String(p.id) === String(formData.fee_plan_id));
              const addedRegFee = includeRegistrationFee ? (Number(customRegistrationFee) || 0) : 0;
              return (
                <div className="form-group">
                  <label>Total Amount</label>
                  <input
                    type="text"
                    value={`₹${getCalculatedAmount().toLocaleString()}`}
                    disabled
                    style={{ background: readOnlyBg, color: textPrimary }}
                  />
                  {addedRegFee > 0 && (
                    <div style={{ fontSize: "12px", color: textMuted, marginTop: "4px" }}>
                      Plan: ₹{Number(plan ? plan.amount : 0).toLocaleString()}{formData.seatType === "Unreserved" && formData.shift_ids.length > 1 ? ` × ${formData.shift_ids.length} shifts` : ""} + Registration: ₹{addedRegFee.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '24px' }}>
          <button type="submit" className="primary-btn" disabled={submitting} style={{ minWidth: '160px' }}>
            {submitting ? "Admitting..." : "Save Admission"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Admission;