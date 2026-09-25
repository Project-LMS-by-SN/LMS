import { useEffect, useState, useCallback } from "react";
import { FaSearch, FaUserCircle, FaTimes, FaTrash, FaCreditCard, FaChair, FaClock, FaCalendarAlt, FaArrowLeft, FaEdit, FaComments, FaPaperPlane, FaWhatsapp, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import { formatTime } from "../utils/timeUtils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getSeatColorForEdit = (seat, selectedShiftIds, selectedSeatId, profileData, darkMode) => {
  if (seat.is_active === false) {
    return {
      bg: darkMode ? "#1e293b" : "#f1f5f9",
      border: darkMode ? "#475569" : "#94a3b8",
      color: darkMode ? "#94a3b8" : "#64748b",
      isSelectable: false,
      tooltip: "Inactive"
    };
  }

  const isSelected = String(selectedSeatId) === String(seat.id);
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
  const shiftIds = (selectedShiftIds || []).map(Number);

  const hasConflict = activeShifts.some(os =>
    shiftIds.includes(Number(os.shift_id)) &&
    String(os.student_code) !== String(profileData?.student_code)
  );

  if (hasConflict) {
    return {
      bg: darkMode ? "rgba(148,163,184,0.15)" : "#e0e0e0",
      border: darkMode ? "#475569" : "#9e9e9e",
      color: darkMode ? "#94a3b8" : "#9e9e9e",
      isSelectable: false,
      tooltip: "Occupied in selected shift"
    };
  }

  return {
    bg: darkMode ? "rgba(34,197,94,0.12)" : "#e8f5e9",
    border: "#4caf50",
    color: darkMode ? "#22c55e" : "#2e7d32",
    isSelectable: true,
    tooltip: "Available"
  };
};

const Students = () => {
  const { darkMode, timeFormat } = useTheme();
  
  const formatReadableDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getExpirySubText = (dateStr) => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      const positiveDays = Math.abs(diffDays);
      return { text: `Expired ${positiveDays}d ago`, isExpired: true };
    } else if (diffDays === 0) {
      return { text: "Expires today", isWarning: true };
    } else {
      return { text: `${diffDays}d left`, isExpired: false };
    }
  };

  const handleToggleStudentStatus = async (student) => {
    const newStatus = student.account_status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const confirmMsg = newStatus === "DISABLED"
      ? `Are you sure you want to disable ${student.full_name}?`
      : `Are you sure you want to activate ${student.full_name}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.put(`/students/${student.id}`, { account_status: newStatus });
      alert(`Student successfully ${newStatus === "DISABLED" ? "disabled" : "activated"}`);
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  const isSeatOccupiedInEdit = (seat) => {
    const shiftIds = (editForm.shift_ids || []).map(Number);
    if (!shiftIds.length) return false;
    const occupiedShifts = seat.occupied_shifts || [];
    return occupiedShifts.some(os =>
      shiftIds.includes(Number(os.shift_id)) &&
      String(os.student_code) !== String(profileData?.student_code)
    );
  };

  const [currentViewYear, setCurrentViewYear] = useState(new Date().getFullYear());
  const [currentViewMonth, setCurrentViewMonth] = useState(new Date().getMonth());
  const loggedInUser = JSON.parse(localStorage.getItem("lms_user") || "{}");
  const isOwner = loggedInUser.role === "OWNER";
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileTab, setProfileTab] = useState("payment");
  const [chatInput, setChatInput] = useState("");
  const [chatTemplate, setChatTemplate] = useState("expiry_reminder");
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgTemplate, setMsgTemplate] = useState("expiry_reminder");
  const [msgCustom, setMsgCustom] = useState("");
  const [quickMsgStudent, setQuickMsgStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [accessTypeFilter, setAccessTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState(false);
  const [editTab, setEditTab] = useState("personal");
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [feePlans, setFeePlans] = useState([]);
  const [seats, setSeats] = useState([]);
  const [editFloor, setEditFloor] = useState("");
  const [editRoom, setEditRoom] = useState("");

  const handleEditFloorChange = (floor) => {
    setEditFloor(floor);
    const rooms = [...new Set(seats.filter(s => s.floor === floor && s.is_active !== false).map(s => s.room).filter(Boolean))].sort();
    setEditRoom(rooms[0] || "");
  };

  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students");
      setStudents(res.data.data);
    } catch (error) {
      console.log("Students fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const handleReset = () => {
      setProfileData(null);
      setSelectedStudent(null);
    };
    window.addEventListener("reset-students-view", handleReset);
    return () => window.removeEventListener("reset-students-view", handleReset);
  }, []);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && selectedStudent) closeProfile();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedStudent]);

  const openProfile = async (student) => {
    setSelectedStudent(student);
    setProfileData(null);
    setProfileLoading(true);
    setCurrentViewYear(new Date().getFullYear());
    setCurrentViewMonth(new Date().getMonth());
    setProfileTab("payment");
    setChatInput("");
    setChatTemplate("expiry_reminder");
    try {
      const res = await api.get(`/students/${student.id}/profile`);
      setProfileData(res.data.data);
    } catch (error) {
      console.log("Profile fetch error:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getWhatsAppMessage = () => {
    if (!profileData) return "";
    const name = profileData.full_name || "Student";
    const plan = profileData.validity?.plan_name || "";
    const planText = plan ? `${plan}` : "Your plan";
    const endDate = profileData.validity?.end_date;
    const daysLeft = endDate
      ? Math.ceil((new Date(endDate) - new Date()) / (1000 * 3600 * 24))
      : null;
    const libraryName = loggedInUser?.branch_name || "Library";

    if (chatTemplate === "expired") {
      if (endDate) return `Hi ${name}, your ${planText} has expired on ${formatDate(endDate)}. Please renew immediately to avoid any interruption. — ${libraryName}`;
      return `Hi ${name}, your plan has expired. Please renew immediately to avoid any interruption. — ${libraryName}`;
    }
    if (chatTemplate === "custom") {
      return chatInput;
    }
    if (endDate) return `Hi ${name}, your ${planText} is expiring on ${formatDate(endDate)} (${daysLeft} days left). Please renew to continue your access. — ${libraryName}`;
    return `Hi ${name}, please check your plan status and renew if needed. — ${libraryName}`;
  };

  const handleSendWhatsApp = () => {
    const message = getWhatsAppMessage();
    if (!message.trim()) return;
    const mobile = profileData?.mobile?.replace(/[^0-9]/g, "");
    if (!mobile) {
      alert("No mobile number found for this student");
      return;
    }
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${mobile}?text=${encodedMsg}`, "_blank");
  };

  const getModalMessage = () => {
    const sd = profileData || quickMsgStudent;
    if (!sd) return "";
    const name = sd.full_name || "Student";
    const plan = sd.validity?.plan_name || sd.plan_name || "";
    const planText = plan ? `${plan}` : "Your plan";
    const endDate = sd.validity?.end_date || sd.end_date;
    const daysLeft = endDate
      ? Math.ceil((new Date(endDate) - new Date()) / (1000 * 3600 * 24))
      : null;
    const libraryName = loggedInUser?.branch_name || "Library";
    if (msgTemplate === "expired") {
      if (endDate) return `Hi ${name}, your ${planText} has expired on ${formatDate(endDate)}. Please renew immediately to avoid any interruption. — ${libraryName}`;
      return `Hi ${name}, your plan has expired. Please renew immediately to avoid any interruption. — ${libraryName}`;
    }
    if (msgTemplate === "custom") return msgCustom;
    if (endDate) return `Hi ${name}, your ${planText} is expiring on ${formatDate(endDate)} (${daysLeft} days left). Please renew to continue your access. — ${libraryName}`;
    return `Hi ${name}, please check your plan status and renew if needed. — ${libraryName}`;
  };

  const handleSendModalWhatsApp = () => {
    const message = getModalMessage();
    if (!message.trim()) return;
    const sd = profileData || quickMsgStudent;
    const mobile = sd?.mobile?.replace(/[^0-9]/g, "");
    if (!mobile) { alert("No mobile number found"); return; }
    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(message)}`, "_blank");
    setShowMsgModal(false);
    setQuickMsgStudent(null);
  };

  const closeProfile = () => {
    setSelectedStudent(null);
    setProfileData(null);
  };

  const handleDeleteAdmission = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this admission? This will soft-delete the student. Payments and attendance data will be preserved."
    );
    if (!confirmDelete) return;
    try {
      await api.delete(`/students/${selectedStudent.id}`);
      alert("Admission deleted successfully");
      closeProfile();
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete admission");
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = profileData.account_status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const confirmMsg = newStatus === "DISABLED"
      ? "Are you sure you want to disable this member?"
      : "Are you sure you want to activate this member?";
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.put(`/students/${selectedStudent.id}`, { account_status: newStatus });
      alert(`Student successfully ${newStatus === "DISABLED" ? "disabled" : "activated"}`);
      setProfileData(prev => ({
        ...prev,
        account_status: newStatus
      }));
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const openEditForm = async () => {
    try {
      const [shiftsRes, plansRes, seatsRes] = await Promise.all([
        api.get("/students/shifts"),
        api.get("/students/fee-plans"),
        api.get("/seats"),
      ]);
      setShifts(shiftsRes.data.data || []);
      setFeePlans(plansRes.data.data || []);
      const allSeats = seatsRes.data.data || [];
      setSeats(allSeats);

      const currentAssignment = profileData.shift_assignments?.find(a => a.assignment_status === "ACTIVE");
      const currentSeatId = currentAssignment?.seat_id || "";
      const currentSeat = allSeats.find(s => s.id === currentSeatId);

      let initialFloor = "";
      let initialRoom = "";

      if (currentSeat) {
        initialFloor = currentSeat.floor || "";
        initialRoom = currentSeat.room || "";
      } else {
        const activeSeats = allSeats.filter(s => s.is_active !== false);
        const floors = [...new Set(activeSeats.map(s => s.floor).filter(Boolean))].sort();
        if (floors.length > 0) {
          initialFloor = floors[0];
          const rooms = [...new Set(activeSeats.filter(s => s.floor === floors[0]).map(s => s.room).filter(Boolean))].sort();
          if (rooms.length > 0) {
            initialRoom = rooms[0];
          }
        }
      }

      setEditFloor(initialFloor);
      setEditRoom(initialRoom);
      const currentShiftId = currentAssignment?.shift_id || "";

      setEditForm({
        full_name: profileData.full_name || "",
        mobile: profileData.mobile || "",
        email: profileData.email || "",
        gender: profileData.gender || "",
        dob: profileData.dob ? profileData.dob.split("T")[0] : "",
        aadhar_number: profileData.aadhar_number || "",
        address: profileData.address || "",
        reg_no: profileData.reg_no || "",
        shift_ids: profileData.shift_assignments
          ? profileData.shift_assignments.filter(a => a.assignment_status === "ACTIVE").map(a => a.shift_id)
          : [],
        seat_id: currentAssignment?.seat_id || "",
        fee_plan_id: profileData.validity?.fee_plan_id || "",
        access_type: profileData.validity?.access_type || "",
      });
    } catch (err) {
      console.error("Failed to load edit data:", err);
    }
    setEditingStudent(true);
    setEditTab("personal");
  };

  const handleShiftChange = (shiftId) => {
    handleEditChange("shift_id", shiftId);
    handleEditChange("seat_id", "");
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      await api.put(`/students/${selectedStudent.id}`, {
        full_name: editForm.full_name,
        mobile: editForm.mobile,
        email: editForm.email,
        gender: editForm.gender,
        dob: editForm.dob,
        aadhar_number: editForm.aadhar_number,
        address: editForm.address,
        reg_no: editForm.reg_no,
      });
      await api.put(`/students/${selectedStudent.id}/details`, {
        shift_ids: editForm.shift_ids || [],
        seat_id: editForm.seat_id || null,
        fee_plan_id: editForm.fee_plan_id || null,
        access_type: editForm.access_type || null,
      });
      alert("Student profile updated successfully!");
      openProfile(selectedStudent);
      setEditingStudent(false);
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setEditSaving(false);
    }
  };

  const getStudentStatus = (student) => {
    if (student.account_status === "DISABLED" || student.account_status === "INACTIVE") {
      return "inactive";
    }
    if (student.account_status === "SUSPENDED") {
      return "suspended";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const twentyDaysAgo = new Date(today);
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    if (!student.end_date) {
      const admissionDate = new Date(student.admission_date);
      admissionDate.setHours(0, 0, 0, 0);
      if (admissionDate < twentyDaysAgo) return "inactive";
      if (admissionDate < sevenDaysAgo) return "suspended";
      return "active";
    }

    const endDate = new Date(student.end_date);
    endDate.setHours(0, 0, 0, 0);
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);

    if (student.due_amount > 0) {
      if (endDate < twentyDaysAgo) return "inactive";
      if (endDate < sevenDaysAgo) return "suspended";
      if (endDate < today) return "suspended";
    }

    if (endDate < twentyDaysAgo) return "inactive";
    if (endDate < today) return "expired";
    if (endDate <= next7Days) return "expiring_soon";
    return "active";
  };

  const getStatusCounts = () => {
    const base = students.filter(s => {
      if (accessTypeFilter === "RESERVED") return s.access_type === "RESERVED";
      if (accessTypeFilter === "UNRESERVED") return s.access_type === "UNRESERVED";
      return true;
    });
    return {
      all: base.length,
      active: base.filter(s => getStudentStatus(s) === "active").length,
      expiring_soon: base.filter(s => getStudentStatus(s) === "expiring_soon").length,
      inactive: base.filter(s => getStudentStatus(s) === "inactive").length,
      suspended: base.filter(s => getStudentStatus(s) === "suspended").length,
    };
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.reg_no?.includes(searchQuery) ||
      student.mobile?.includes(searchQuery) ||
      student.student_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.access_type?.toLowerCase().includes(searchQuery.toLowerCase());

    if (accessTypeFilter === "RESERVED") {
      if (student.access_type !== "RESERVED") return false;
    }
    if (accessTypeFilter === "UNRESERVED") {
      if (student.access_type !== "UNRESERVED") return false;
    }

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    return getStudentStatus(student) === statusFilter;
  });

  const getStatusBadge = (status) => {
    if (status === "ACTIVE") return "status-badge";
    if (status === "DISABLED") return "danger-badge";
    return "status-badge";
  };

  const getStatusText = (status) => {
    if (status === "ACTIVE") return "Active";
    if (status === "DISABLED") return "Disabled";
    return "Unknown";
  };

  if (loading) {
    return <div className="page"><p>Loading...</p></div>;
  }

  const textPrimary = darkMode ? "#f1f5f9" : "#1e293b";
  const cardBg = darkMode ? "#1e293b" : "#ffffff";
  const borderColor = darkMode ? "#334155" : "#e2e8f0";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";

  if (selectedStudent) {
    return (
      <div className="page">
        {/* Back Button */}
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={closeProfile}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              background: darkMode ? "#1e293b" : "#ffffff",
              border: `1px solid ${borderColor}`,
              color: textPrimary,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = darkMode ? "#334155" : "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = darkMode ? "#1e293b" : "#ffffff")}
          >
            <FaArrowLeft /> Back to Members
          </button>
        </div>

        {profileLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: textSecondary }}>
            Loading profile...
          </div>
        ) : profileData ? (
          <div className="responsive-grid-1-1-2" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start" }}>
            {/* Left Column: Personal info, Validity, Shift & Seat, Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Profile Card */}
              <div
                style={{
                  background: "linear-gradient(135deg, #1e293b, #0f172a)",
                  padding: "32px",
                  color: "white",
                  borderRadius: "16px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      fontWeight: "bold",
                      color: "white",
                      textTransform: "uppercase",
                      overflow: "hidden",
                    }}
                  >
                    {profileData.profile_photo_url ? (
                      <img
                        src={profileData.profile_photo_url}
                        alt="Profile"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      getInitials(profileData.full_name)
                    )}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "24px", color: "#ffffff" }}>{profileData.full_name}</h2>
                    <p style={{ margin: "4px 0", opacity: 0.8, fontSize: "14px", color: "#cbd5e1" }}>
                      Code: {profileData.student_code} | Reg No: {profileData.reg_no || "N/A"}{profileData.email ? ` | ${profileData.email}` : ""}
                    </p>
                    <span
                      className="status-badge"
                      style={{
                        background:
                          profileData.account_status === "ACTIVE"
                            ? "rgba(34,197,94,0.2)"
                            : "rgba(239,68,68,0.2)",
                        color: profileData.account_status === "ACTIVE" ? "#4ade80" : "#fca5a5",
                        display: "inline-block",
                        marginTop: "8px",
                      }}
                    >
                      {getStatusText(profileData.account_status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Details Card */}
              <div className="table-card" style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "16px", padding: "24px" }}>
                <h3 style={{ fontSize: "16px", color: textPrimary, marginBottom: "16px", fontWeight: "700" }}>Personal Details</h3>
                <div className="responsive-grid-1-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="profile-info-group">
                    <div className="profile-info-label">Mobile Number</div>
                    <div className="profile-info-value" style={{ color: textPrimary }}>{profileData.mobile}</div>
                  </div>
                  <div className="profile-info-group">
                    <div className="profile-info-label">Email (Gmail)</div>
                    <div className="profile-info-value" style={{ color: textPrimary, wordBreak: "break-all" }}>{profileData.email || "N/A"}</div>
                  </div>
                  <div className="profile-info-group">
                    <div className="profile-info-label">Gender</div>
                    <div className="profile-info-value" style={{ color: textPrimary }}>{profileData.gender}</div>
                  </div>
                  <div className="profile-info-group">
                    <div className="profile-info-label">Date of Birth</div>
                    <div className="profile-info-value" style={{ color: textPrimary }}>{profileData.dob || "N/A"}</div>
                  </div>
                  <div className="profile-info-group">
                    <div className="profile-info-label">Aadhar Number</div>
                    <div className="profile-info-value" style={{ color: textPrimary }}>{profileData.aadhar_number || "N/A"}</div>
                  </div>
                  <div className="profile-info-group" style={{ gridColumn: "span 2" }}>
                    <div className="profile-info-label">Address</div>
                    <div className="profile-info-value" style={{ color: textPrimary }}>{profileData.address || "N/A"}</div>
                  </div>
                </div>
              </div>



              {/* Shift & Seat info */}
              {profileData.shift_assignments && profileData.shift_assignments.length > 0 && (() => {
                const sortedAssignments = [...profileData.shift_assignments].sort((a, b) =>
                  (a.start_time || "").localeCompare(b.start_time || "")
                );

                return (
                  <div className="table-card" style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "16px", padding: "24px" }}>
                    <h3 style={{ fontSize: "16px", color: textPrimary, marginBottom: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaClock /> Shift &amp; Seat Information
                    </h3>
                    {sortedAssignments.map((sa, idx) => (
                      <div
                        key={idx}
                        className="responsive-grid-1-1"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "16px",
                          marginBottom: idx < sortedAssignments.length - 1 ? "16px" : 0,
                          paddingBottom: idx < sortedAssignments.length - 1 ? "16px" : 0,
                          borderBottom: idx < sortedAssignments.length - 1 ? `1px solid ${borderColor}` : "none",
                        }}
                      >
                        <div className="profile-info-group">
                          <div className="profile-info-label">Shift {idx + 1}</div>
                          <div className="profile-info-value" style={{ color: textPrimary }}>{sa.shift_name}</div>
                        </div>
                        <div className="profile-info-group">
                          <div className="profile-info-label">Timing</div>
                          <div className="profile-info-value" style={{ color: textPrimary }}>
                            {formatTime(sa.start_time, timeFormat)} - {formatTime(sa.end_time, timeFormat)}
                          </div>
                        </div>
                        <div className="profile-info-group" style={{ gridColumn: "span 2" }}>
                          <div className="profile-info-label">Seat Assignment</div>
                          <div className="profile-info-value" style={{ color: textPrimary }}>
                            {sa.seat_number 
                              ? `Seat ${sa.seat_number} (Floor ${sa.floor || 'N/A'}, Room ${sa.room || 'N/A'})` 
                              : (profileData.validity?.access_type === "RESERVED" ? "No Seat Assigned" : "Unreserved")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", alignItems: "center", flexWrap: "nowrap" }}>
                <button
                  className="secondary-btn"
                  style={{
                    background: "#eff6ff",
                    color: "#2563eb",
                    borderColor: "#dbeafe",
                    fontWeight: 600,
                    padding: "10px 16px",
                    borderRadius: "10px",
                    whiteSpace: "nowrap",
                  }}
                  onClick={openEditForm}
                >
                  <FaEdit style={{ marginRight: "6px" }} /> Edit Profile
                </button>
                {isOwner && (
                  <>
                    <button
                      className="secondary-btn"
                      style={{
                        background: profileData.account_status === "ACTIVE" ? "#fffbeb" : "#f0fdf4",
                        color: profileData.account_status === "ACTIVE" ? "#d97706" : "#16a34a",
                        borderColor: profileData.account_status === "ACTIVE" ? "#fef3c7" : "#dcfce7",
                        fontWeight: 600,
                        padding: "10px 16px",
                        borderRadius: "10px",
                        whiteSpace: "nowrap",
                      }}
                      onClick={handleToggleStatus}
                    >
                      {profileData.account_status === "ACTIVE" ? "Disable Member" : "Activate Member"}
                    </button>
                    <button
                      className="secondary-btn"
                      style={{
                        background: "#fef2f2",
                        color: "#dc2626",
                        borderColor: "#fca5a5",
                        fontWeight: 600,
                        padding: "10px 16px",
                        borderRadius: "10px",
                        whiteSpace: "nowrap",
                      }}
                      onClick={handleDeleteAdmission}
                    >
                      <FaTrash style={{ marginRight: "6px" }} /> Delete Admission
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Attendance, Payment & Chat */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Tab Selector */}
              <div style={{ display: "flex", background: darkMode ? "#1e293b" : "#f1f5f9", borderRadius: "12px", padding: "4px", gap: "4px", border: `1px solid ${borderColor}` }}>
                <button
                  type="button"
                  onClick={() => setProfileTab("payment")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    background: profileTab === "payment" ? "#3b82f6" : "transparent",
                    color: profileTab === "payment" ? "#ffffff" : textSecondary,
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <FaCreditCard /> Payment History
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab("attendance")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    background: profileTab === "attendance" ? "#3b82f6" : "transparent",
                    color: profileTab === "attendance" ? "#ffffff" : textSecondary,
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <FaCalendarAlt /> Attendance History
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab("chat")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    background: profileTab === "chat" ? "#3b82f6" : "transparent",
                    color: profileTab === "chat" ? "#ffffff" : textSecondary,
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <FaWhatsapp style={{ color: "#25D660" }} /> WhatsApp
                </button>
              </div>

              {/* Show selected tab content */}
              {profileTab === "attendance" && (
                <div className="table-card" style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "16px", padding: "24px" }}>
                  <style>{`
                    .attendance-calendar-grid {
                      display: grid;
                      grid-template-columns: repeat(7, 1fr);
                      gap: 8px;
                    }
                    .calendar-day-header {
                      text-align: center;
                      font-weight: bold;
                      font-size: 12px;
                      color: #64748b;
                      padding: 6px 0;
                    }
                    .calendar-cell {
                      aspect-ratio: 1;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      border-radius: 8px;
                      font-size: 13px;
                      font-weight: 600;
                      position: relative;
                      cursor: pointer;
                      transition: all 0.2s;
                    }
                    .calendar-cell.padding {
                      color: #cbd5e1;
                      cursor: not-allowed;
                      background: transparent;
                    }
                    body.dark .calendar-cell.padding {
                      color: #475569;
                    }
                    .calendar-cell.no-record {
                      background: #f1f5f9;
                      color: #64748b;
                    }
                    body.dark .calendar-cell.no-record {
                      background: #1e293b;
                      color: #94a3b8;
                    }
                    .calendar-cell.present {
                      background: #22c55e !important;
                      color: #ffffff !important;
                      box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3);
                    }
                    .calendar-cell.absent {
                      background: #ef4444 !important;
                      color: #ffffff !important;
                      box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
                    }
                    .calendar-tooltip {
                      visibility: hidden;
                      width: 140px;
                      background-color: #1e293b;
                      color: #fff;
                      text-align: center;
                      border-radius: 8px;
                      padding: 8px 12px;
                      position: absolute;
                      z-index: 100;
                      bottom: 125%;
                      left: 50%;
                      transform: translateX(-50%);
                      opacity: 0;
                      transition: opacity 0.2s, visibility 0.2s;
                      font-size: 11px;
                      line-height: 1.4;
                      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
                      pointer-events: none;
                      border: 1px solid #334155;
                    }
                    .calendar-cell:hover .calendar-tooltip {
                      visibility: visible;
                      opacity: 1;
                    }
                  `}</style>

                  <h3 style={{ fontSize: "16px", color: textPrimary, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaCalendarAlt /> Attendance History Calendar
                  </h3>

                  <div style={{
                    fontSize: "12px",
                    color: darkMode ? "#93c5fd" : "#1e40af",
                    background: darkMode ? "rgba(59, 130, 246, 0.1)" : "#eff6ff",
                    border: `1px solid ${darkMode ? "rgba(59, 130, 246, 0.2)" : "#bfdbfe"}`,
                    padding: "6px 12px",
                    borderRadius: "6px",
                    marginBottom: "14px"
                  }}>
                    <strong>Note:</strong> Attendance logs are saved for <strong>30 days</strong>.
                  </div>

                  {/* Month switcher */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentViewMonth === 0) {
                          setCurrentViewMonth(11);
                          setCurrentViewYear((prev) => prev - 1);
                        } else {
                          setCurrentViewMonth((prev) => prev - 1);
                        }
                      }}
                      style={{
                        background: "none",
                        border: `1px solid ${borderColor}`,
                        padding: "4px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: textPrimary,
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      &lt;
                    </button>
                    <span style={{ fontWeight: "bold", fontSize: "15px", color: textPrimary }}>
                      {MONTHS[currentViewMonth]} {currentViewYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentViewMonth === 11) {
                          setCurrentViewMonth(0);
                          setCurrentViewYear((prev) => prev + 1);
                        } else {
                          setCurrentViewMonth((prev) => prev + 1);
                        }
                      }}
                      style={{
                        background: "none",
                        border: `1px solid ${borderColor}`,
                        padding: "4px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: textPrimary,
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="attendance-calendar-grid">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <div key={day} className="calendar-day-header">
                        {day}
                      </div>
                    ))}

                    {(() => {
                      const firstDayIdx = new Date(currentViewYear, currentViewMonth, 1).getDay();
                      const totalDays = new Date(currentViewYear, currentViewMonth + 1, 0).getDate();
                      const prevTotalDays = new Date(currentViewYear, currentViewMonth, 0).getDate();

                      const cells = [];
                      for (let i = firstDayIdx - 1; i >= 0; i--) {
                        cells.push({ day: prevTotalDays - i, isCurrentMonth: false });
                      }
                      for (let d = 1; d <= totalDays; d++) {
                        cells.push({ day: d, isCurrentMonth: true });
                      }

                      return cells.map((cell, idx) => {
                        if (!cell.isCurrentMonth) {
                          return (
                            <div key={`prev-${idx}`} className="calendar-cell padding">
                              {cell.day}
                            </div>
                          );
                        }

                        const monthStr = String(currentViewMonth + 1).padStart(2, "0");
                        const dayStr = String(cell.day).padStart(2, "0");
                        const dateKey = `${currentViewYear}-${monthStr}-${dayStr}`;

                        const record = profileData.attendance?.find((att) => {
                          const recDate = att.attendance_date?.split("T")[0];
                          return recDate === dateKey;
                        });

                        let cellClass = "calendar-cell no-record";
                        let tooltipContent = (
                          <div className="calendar-tooltip">
                            <strong>{dateKey}</strong>
                            <br />
                            No Record
                          </div>
                        );

                        if (record) {
                          if (record.status === "PRESENT") {
                            cellClass = "calendar-cell present";
                            tooltipContent = (
                              <div className="calendar-tooltip" style={{ background: "#15803d", borderColor: "#166534" }}>
                                <strong>{dateKey}</strong>
                                <br />
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><FaCheckCircle /> Present</span>
                                <br />
                                In: {record.check_in_time || "—"}
                                <br />
                                Out: {record.check_out_time || "—"}
                              </div>
                            );
                          } else if (record.status === "ABSENT") {
                            cellClass = "calendar-cell absent";
                            tooltipContent = (
                              <div className="calendar-tooltip" style={{ background: "#b91c1c", borderColor: "#991b1b" }}>
                                <strong>{dateKey}</strong>
                                <br />
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><FaTimesCircle /> Absent</span>
                              </div>
                            );
                          }
                        }

                        return (
                          <div key={`curr-${cell.day}`} className={cellClass}>
                            {cell.day}
                            {tooltipContent}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {profileTab === "payment" && (
                <>
                  <div className="table-card" style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "16px", padding: "24px" }}>
                    <h3 style={{ fontSize: "16px", color: textPrimary, marginBottom: "16px", fontWeight: "700" }}>Payment History</h3>
                    {profileData.payments && profileData.payments.length > 0 ? (
                      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "250px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${borderColor}`, color: textSecondary, fontSize: "12px" }}>
                              <th style={{ padding: "10px 12px", textAlign: "left" }}>Invoice No</th>
                              <th style={{ padding: "10px 12px", textAlign: "right" }}>Amount</th>
                              <th style={{ padding: "10px 12px", textAlign: "left" }}>Mode</th>
                              <th style={{ padding: "10px 12px", textAlign: "left" }}>Reference / Remark</th>
                              <th style={{ padding: "10px 12px", textAlign: "left" }}>Payment Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profileData.payments.map((p) => (
                              <tr key={p.id} style={{ borderBottom: `1px solid ${borderColor}`, color: textPrimary }}>
                                <td style={{ padding: "12px 10px" }}>{p.invoice_no || "N/A"}</td>
                                <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700, color: "#16a34a" }}>
                                  ₹{Number(p.amount_received || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: "12px 10px" }}>
                                  <span className="status-badge" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
                                    {p.mode_name}
                                  </span>
                                </td>
                                <td style={{ padding: "12px 10px" }}>
                                  <span style={{ fontWeight: 600, color: p.remarks?.includes("Admission") ? "#2563eb" : "#16a34a", fontSize: "13px" }}>
                                    {p.remarks || "(Fee Renewal)"}
                                  </span>
                                </td>
                                <td style={{ padding: "12px 10px", color: textSecondary, fontSize: "13px" }}>
                                  <div style={{ fontWeight: 600, color: textPrimary }}>
                                    {p.payment_date ? p.payment_date.split(" ")[0] : ""}
                                  </div>
                                  <div style={{ fontSize: "11px", color: textSecondary, marginTop: "2px" }}>
                                    {formatTime(p.payment_date ? p.payment_date.split(" ").slice(1).join(" ") : "", timeFormat)}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ color: textSecondary, textAlign: "center", padding: "20px" }}>No payments recorded</p>
                    )}
                  </div>

                  {/* Validity Info */}
                  {profileData.validity && (
                    <div className="table-card" style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "16px", padding: "24px" }}>
                      <h3 style={{ fontSize: "16px", color: textPrimary, marginBottom: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                        <FaCalendarAlt /> Validity Information
                      </h3>
                      <div className="responsive-grid-1-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div className="profile-info-group">
                          <div className="profile-info-label">Plan</div>
                          <div className="profile-info-value" style={{ color: textPrimary }}>{profileData.validity.plan_name || "N/A"}</div>
                        </div>
                        <div className="profile-info-group">
                          <div className="profile-info-label">Duration</div>
                          <div className="profile-info-value" style={{ color: textPrimary }}>{profileData.validity.duration_days || "N/A"} days</div>
                        </div>
                        <div className="profile-info-group">
                          <div className="profile-info-label">Start Date</div>
                          <div className="profile-info-value" style={{ color: textPrimary }}>{profileData.validity.start_date}</div>
                        </div>
                        <div className="profile-info-group">
                          <div className="profile-info-label">End Date</div>
                          <div className="profile-info-value" style={{ color: textPrimary }}>{profileData.validity.end_date}</div>
                        </div>
                        <div className="profile-info-group">
                          <div className="profile-info-label">Access Type</div>
                          <div className="profile-info-value" style={{ color: textPrimary }}>{profileData.validity.access_type}</div>
                        </div>
                        <div className="profile-info-group">
                          <div className="profile-info-label">Total Amount</div>
                          <div className="profile-info-value" style={{ color: textPrimary }}>₹{profileData.validity.total_amount}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {profileTab === "chat" && (
                <div className="table-card" style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "16px", padding: "24px" }}>
                  <h3 style={{ fontSize: "16px", color: textPrimary, marginBottom: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaWhatsapp style={{ color: "#25D660" }} /> Send WhatsApp Message
                  </h3>

                  {/* Template Selector */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                    {[
                      { key: "expiry_reminder", label: "Expiry Reminder", color: "#f59e0b" },
                      { key: "expired", label: "Expired", color: "#ef4444" },
                      { key: "custom", label: "Custom Message", color: "#3b82f6" },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setChatTemplate(t.key)}
                        style={{
                          padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
                          cursor: "pointer", border: `2px solid ${chatTemplate === t.key ? t.color : borderColor}`,
                          background: chatTemplate === t.key ? `${t.color}15` : "transparent",
                          color: chatTemplate === t.key ? t.color : textSecondary,
                          transition: "all 0.15s",
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Student Info */}
                  <div style={{
                    background: darkMode ? "#0f172a" : "#f8fafc", borderRadius: "12px", padding: "14px 18px",
                    border: `1px solid ${borderColor}`, marginBottom: "16px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: textPrimary }}>{profileData?.full_name}</div>
                      <div style={{ fontSize: "12px", color: textSecondary }}>{profileData?.student_code} · {profileData?.mobile || "No mobile"}</div>
                    </div>
                    <div style={{ fontSize: "12px", color: textSecondary }}>
                      {profileData?.validity?.plan_name} · Expires: {profileData?.validity?.end_date || "N/A"}
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div style={{
                    background: darkMode ? "#1e293b" : "#ffffff",
                    border: `1px solid ${borderColor}`, borderRadius: "12px", padding: "16px",
                    marginBottom: "16px", minHeight: "100px",
                  }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: textSecondary, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Message Preview
                    </div>
                    {chatTemplate === "custom" ? (
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type your custom message here..."
                        rows={5}
                        style={{
                          width: "100%", resize: "vertical", padding: "12px", borderRadius: "8px",
                          border: `1px solid ${borderColor}`, background: darkMode ? "#0f172a" : "#f8fafc",
                          color: textPrimary, fontSize: "14px", lineHeight: "1.5", boxSizing: "border-box",
                          fontFamily: "inherit",
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: "14px", lineHeight: "1.6", color: textPrimary, whiteSpace: "pre-wrap" }}>
                        {getWhatsAppMessage()}
                      </div>
                    )}
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendWhatsApp}
                    style={{
                      width: "100%", padding: "14px 24px", borderRadius: "12px", border: "none",
                      background: "#25D660", color: "#fff", fontWeight: 700, fontSize: "15px",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#20bd5a"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#25D660"}
                  >
                    <FaWhatsapp style={{ fontSize: "20px" }} /> Send on WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: textSecondary }}>
            Failed to load profile
          </div>
        )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
        }}>
          <div style={{
            background: cardBg, borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "600px",
            border: `1px solid ${borderColor}`, maxHeight: "95vh", display: "flex", flexDirection: "column",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)", boxSizing: "border-box"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: textPrimary }}>Edit Student Profile</h2>
              <button onClick={() => setEditingStudent(false)} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: "20px" }}>
                <FaTimes />
              </button>
            </div>

            {/* Tab Headers */}
            <div style={{ display: "flex", borderBottom: `1px solid ${borderColor}`, marginBottom: "20px", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setEditTab("personal")}
                style={{
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  borderBottom: editTab === "personal" ? "2px solid #3b82f6" : "2px solid transparent",
                  color: editTab === "personal" ? "#3b82f6" : textSecondary,
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Personal Info
              </button>
              <button
                type="button"
                onClick={() => setEditTab("assignment")}
                style={{
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  borderBottom: editTab === "assignment" ? "2px solid #3b82f6" : "2px solid transparent",
                  color: editTab === "assignment" ? "#3b82f6" : textSecondary,
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Seat & Plan Assignment
              </button>
            </div>

            {/* Tab Content Wrapper */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px", minHeight: "280px", maxHeight: "450px" }}>
              {editTab === "personal" ? (
                <div className="responsive-grid-1-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {[
                    { label: "Full Name *", field: "full_name", type: "text" },
                    { label: "Mobile *", field: "mobile", type: "tel" },
                    { label: "Email *", field: "email", type: "email" },
                    { label: "Reg No", field: "reg_no", type: "text" },
                    { label: "Gender *", field: "gender", type: "select", options: ["Male", "Female", "Other"] },
                    { label: "Date of Birth", field: "dob", type: "date" },
                    { label: "Aadhar Number", field: "aadhar_number", type: "text" },
                  ].map(({ label, field, type, options }) => (
                    <div key={field} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: textSecondary }}>{label}</label>
                      {type === "select" ? (
                        <select
                          value={editForm[field] || ""}
                          onChange={(e) => handleEditChange(field, e.target.value)}
                          style={{
                            padding: "10px 14px", borderRadius: "10px", border: `1px solid ${borderColor}`,
                            background: darkMode ? "#1e293b" : "#fff", color: textPrimary, fontSize: "14px",
                          }}
                        >
                          <option value="">Select</option>
                          {options.map(o => (
                            <option key={o} value={o.toUpperCase()}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={type}
                          value={editForm[field] || ""}
                          onChange={(e) => handleEditChange(field, e.target.value)}
                          style={{
                            padding: "10px 14px", borderRadius: "10px", border: `1px solid ${borderColor}`,
                            background: darkMode ? "#1e293b" : "#fff", color: textPrimary, fontSize: "14px",
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "span 2" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: textSecondary }}>Address</label>
                    <textarea
                      value={editForm.address || ""}
                      onChange={(e) => handleEditChange("address", e.target.value)}
                      rows={2}
                      style={{
                        padding: "10px 14px", borderRadius: "10px", border: `1px solid ${borderColor}`,
                        background: darkMode ? "#1e293b" : "#fff", color: textPrimary, fontSize: "14px", resize: "vertical",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="responsive-grid-1-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "span 2" }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: textSecondary }}>Shifts *</label>
                        <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 500 }}>(Uncheck a shift to remove/delete it)</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const allIds = shifts.map(s => s.id);
                            handleEditChange("shift_ids", editForm.shift_ids?.length === allIds.length ? [] : allIds);
                          }}
                          style={{
                            padding: '8px 18px', borderRadius: '8px',
                            border: `2px solid ${editForm.shift_ids?.length === shifts.length && shifts.length > 0 ? '#2563eb' : '#d4d4d8'}`,
                            background: editForm.shift_ids?.length === shifts.length && shifts.length > 0 ? '#eff6ff' : '#FCFBF9',
                            color: editForm.shift_ids?.length === shifts.length && shifts.length > 0 ? '#2563eb' : '#64748b',
                            fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        >
                          Full Day {editForm.shift_ids?.length === shifts.length && shifts.length > 0 && <FaCheckCircle style={{ marginLeft: "4px" }} />}
                        </button>
                        {editForm.shift_ids?.length > 0 && editForm.shift_ids.length < shifts.length && (
                          <span style={{
                            padding: '8px 18px', borderRadius: '8px', border: '2px solid #f59e0b',
                            background: '#fffbeb', color: '#d97706', fontWeight: 600, fontSize: '13px',
                          }}>
                            Custom
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {shifts.map(shift => {
                          const selected = editForm.shift_ids?.includes(shift.id);
                          return (
                            <div
                              key={shift.id}
                              onClick={() => {
                                const ids = editForm.shift_ids || [];
                                const newIds = ids.includes(shift.id)
                                  ? ids.filter(id => id !== shift.id)
                                  : [...ids, shift.id];
                                handleEditChange("shift_ids", newIds);
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 16px', borderRadius: '8px',
                                border: `2px solid ${selected ? '#2563eb' : '#e2e8f0'}`,
                                background: selected ? '#eff6ff' : '#FCFBF9', cursor: 'pointer',
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
                                <div style={{ fontWeight: 600, fontSize: '14px', color: textPrimary }}>{shift.shiftName}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                  {formatTime(shift.startTime?.slice(0, 5), timeFormat)} - {formatTime(shift.endTime?.slice(0, 5), timeFormat)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {editForm.shift_ids?.length > 0 && (
                        <p style={{ marginTop: '4px', fontSize: '13px', color: '#64748b' }}>
                          {editForm.shift_ids.length} shift(s) selected
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: textSecondary }}>Access Type *</label>
                      <select
                        value={editForm.access_type || ""}
                        onChange={(e) => {
                          handleEditChange("access_type", e.target.value);
                          if (e.target.value === "UNRESERVED") {
                            handleEditChange("seat_id", "");
                          }
                        }}
                        style={{
                          padding: "10px 14px", borderRadius: "10px", border: `1px solid ${borderColor}`,
                          background: darkMode ? "#1e293b" : "#fff", color: textPrimary, fontSize: "14px",
                        }}
                      >
                        <option value="">Select Access</option>
                        <option value="RESERVED">Reserved</option>
                        <option value="UNRESERVED">Unreserved</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "span 2" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: textSecondary }}>Fee Plan *</label>
                      <select
                        value={editForm.fee_plan_id || ""}
                        onChange={(e) => handleEditChange("fee_plan_id", e.target.value)}
                        style={{
                          padding: "10px 14px", borderRadius: "10px", border: `1px solid ${borderColor}`,
                          background: darkMode ? "#1e293b" : "#fff", color: textPrimary, fontSize: "14px",
                        }}
                      >
                        <option value="">Select Plan</option>
                        {feePlans
                          .filter(plan => {
                            if (editForm.access_type === "RESERVED") {
                              return plan.planType === "RESERVED";
                            } else if (editForm.access_type === "UNRESERVED") {
                              return plan.planType === "UNRESERVED";
                            }
                            return true;
                          })
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.planName} — ₹{Number(p.amount)} ({p.durationDays}d)</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Seat Grid Selector */}
                  {editForm.access_type === "RESERVED" && editForm.shift_ids?.length > 0 && (
                    <div style={{ marginTop: "12px", borderTop: `1px solid ${borderColor}`, paddingTop: "16px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: textSecondary, display: "block", marginBottom: "8px" }}>Select Seat</label>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '11px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: darkMode ? 'rgba(34,197,94,0.12)' : '#e8f5e9', border: '1px solid #4caf50', borderRadius: '3px' }}></div> Available</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: darkMode ? 'rgba(148,163,184,0.15)' : '#e0e0e0', border: '1px solid #9e9e9e', borderRadius: '3px' }}></div> Occupied</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#3b82f6', border: '1px solid #2563eb', borderRadius: '3px' }}></div> Selected</div>
                      </div>

                      {/* Floor & Room filter options */}
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '11px', color: textSecondary, marginBottom: '4px', fontWeight: '600' }}>Floor</label>
                          <select
                            value={editFloor}
                            onChange={(e) => handleEditFloorChange(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: `1px solid ${borderColor}`,
                              background: darkMode ? "#1e293b" : "#fff",
                              color: textPrimary,
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          >
                            <option value="">Select Floor</option>
                            {[...new Set(seats.filter(s => s.is_active !== false).map(s => s.floor).filter(Boolean))].sort().map(f => (
                              <option key={f} value={f}>Floor {f}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '11px', color: textSecondary, marginBottom: '4px', fontWeight: '600' }}>Room</label>
                          <select
                            value={editRoom}
                            onChange={(e) => setEditRoom(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: `1px solid ${borderColor}`,
                              background: darkMode ? "#1e293b" : "#fff",
                              color: textPrimary,
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          >
                            <option value="">Select Room</option>
                            {[...new Set(seats.filter(s => s.floor === editFloor && s.is_active !== false).map(s => s.room).filter(Boolean))].sort().map(r => (
                              <option key={r} value={r}>Room {r}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {editForm.seat_id && (() => {
                        const sObj = seats.find(s => s.id === editForm.seat_id);
                        return sObj ? (
                          <p style={{ marginTop: '4px', marginBottom: '12px', color: '#22c55e', fontWeight: 'bold', fontSize: '12px' }}>
                            Currently Selected: Seat {sObj.seat_number} (Floor {sObj.floor}, Room {sObj.room})
                          </p>
                        ) : null;
                      })()}

                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: '12px',
                        background: darkMode ? '#1e293b' : '#f8fafc',
                        padding: '12px',
                        borderRadius: '10px',
                        border: `1px solid ${borderColor}`,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {(() => {
                          const activeSeats = seats.filter(s => s.is_active !== false && s.floor === editFloor && s.room === editRoom);
                          if (activeSeats.length === 0) {
                            return <div style={{ color: textMuted, fontSize: '12px', textAlign: 'center', padding: '10px' }}>No active seats available in this floor & room.</div>;
                          }
                          const groups = {};
                          activeSeats.forEach(seat => {
                            const rowLetter = (seat.seat_number || '').replace(/[0-9]/g, '').charAt(0).toUpperCase() || 'A';
                            if (!groups[rowLetter]) groups[rowLetter] = [];
                            groups[rowLetter].push(seat);
                          });
                          return Object.keys(groups).sort().map(rowLetter => (
                            <div key={rowLetter}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: darkMode ? '#64748b' : '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ background: darkMode ? '#334155' : '#e2e8f0', padding: '1px 8px', borderRadius: '4px' }}>{rowLetter} Row</span>
                                <span style={{ fontWeight: 500, fontSize: '9px' }}>({groups[rowLetter].length})</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: '6px' }}>
                                {groups[rowLetter].map(seat => {
                                  const sc = getSeatColorForEdit(seat, editForm.shift_ids || [], editForm.seat_id, profileData, darkMode);
                                  return (
                                    <div
                                      key={seat.id}
                                      onClick={() => sc.isSelectable && handleEditChange("seat_id", seat.id)}
                                      style={{
                                        height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '11px', fontWeight: 'bold', borderRadius: '4px',
                                        cursor: sc.isSelectable ? 'pointer' : 'not-allowed',
                                        background: sc.bg,
                                        color: sc.color,
                                        border: `1.5px solid ${sc.border}`,
                                        boxShadow: (String(editForm.seat_id) === String(seat.id)) ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none',
                                        transition: 'all 0.15s',
                                        opacity: sc.isSelectable ? 1 : 0.45,
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
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", borderTop: `1px solid ${borderColor}`, paddingTop: "16px" }}>
              <div>
                {editTab === "assignment" && (
                  <button
                    type="button"
                    onClick={() => setEditTab("personal")}
                    style={{
                      padding: "10px 20px", borderRadius: "10px", border: `1px solid ${borderColor}`,
                      background: "transparent", color: textSecondary, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Back
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditingStudent(false)}
                  style={{
                    padding: "10px 20px", borderRadius: "10px", border: `1px solid ${borderColor}`,
                    background: "transparent", color: textSecondary, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                {editTab === "personal" ? (
                  <button
                    type="button"
                    onClick={() => setEditTab("assignment")}
                    style={{
                      padding: "10px 20px", borderRadius: "10px", border: "none",
                      background: "#3b82f6", color: "#fff", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSaveEdit}
                    disabled={editSaving}
                    style={{
                      padding: "10px 20px", borderRadius: "10px", border: "none",
                      background: "#22c55e", color: "#fff", fontWeight: 600, cursor: editSaving ? "default" : "pointer",
                      opacity: editSaving ? 0.7 : 1,
                    }}
                  >
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-title-row">
        <div>
          <h1>Member Portal</h1>
          <p>View and manage all library members · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {/* Access Type Filter Bullets & Clear Button */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "12px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: darkMode ? "#cbd5e1" : "#475569" }}>
            <input
              type="radio"
              name="accessTypeFilter"
              value="all"
              checked={accessTypeFilter === "all"}
              onChange={() => setAccessTypeFilter("all")}
              style={{ cursor: "pointer", accentColor: "#3b82f6" }}
            />
            All Seats
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: darkMode ? "#cbd5e1" : "#475569" }}>
            <input
              type="radio"
              name="accessTypeFilter"
              value="RESERVED"
              checked={accessTypeFilter === "RESERVED"}
              onChange={() => setAccessTypeFilter("RESERVED")}
              style={{ cursor: "pointer", accentColor: "#3b82f6" }}
            />
            Reserved Seats
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: darkMode ? "#cbd5e1" : "#475569" }}>
            <input
              type="radio"
              name="accessTypeFilter"
              value="UNRESERVED"
              checked={accessTypeFilter === "UNRESERVED"}
              onChange={() => setAccessTypeFilter("UNRESERVED")}
              style={{ cursor: "pointer", accentColor: "#3b82f6" }}
            />
            Unreserved Seats
          </label>
        </div>
        
        {(accessTypeFilter !== "all" || statusFilter !== "all" || searchQuery !== "") && (
          <button
            onClick={() => {
              setAccessTypeFilter("all");
              setStatusFilter("all");
              setSearchQuery("");
            }}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              background: darkMode ? "rgba(239, 68, 68, 0.2)" : "#fef2f2",
              color: darkMode ? "#f87171" : "#ef4444",
              border: `1px solid ${darkMode ? "rgba(239, 68, 68, 0.3)" : "#fca5a5"}`,
              transition: "all 0.15s"
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: "all", label: `All`, color: darkMode ? "#94a3b8" : "#64748b", bg: darkMode ? "#1e293b" : "#f1f5f9" },
          { key: "active", label: `Active`, color: "#16a34a", bg: "#f0fdf4" },
          { key: "expiring_soon", label: `Expiring in 7 Days`, color: "#d97706", bg: "#fffbeb" },
          { key: "inactive", label: `Inactive`, color: "#dc2626", bg: "#fef2f2" },
          { key: "suspended", label: `Suspended`, color: "#ea580c", bg: "#fff7ed" },
        ].map((btn) => {
          const counts = getStatusCounts();
          const count = btn.key === "all" ? counts.all : counts[btn.key] || 0;
          return (
            <button
              key={btn.key}
              onClick={() => setStatusFilter(btn.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: statusFilter === btn.key ? `2px solid ${btn.color}` : `1px solid ${borderColor}`,
                background: statusFilter === btn.key ? btn.bg : (darkMode ? "#1e293b" : "#fff"),
                color: btn.color,
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {btn.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="search-box" style={{ border: '1px solid #d4d4d8', marginBottom: '24px', background: 'white' }}>
        <FaSearch style={{ color: '#999', fontSize: '18px' }} />
        <input
          type="text"
          placeholder="Search by name, code, reg no, or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-col {
            display: none !important;
          }
          .students-table th, .students-table td {
            padding: 10px 6px !important;
          }
        }
      `}</style>
      <div className="table-card" style={{ padding: '0 12px', background: cardBg, border: `1px solid ${borderColor}`, borderRadius: '16px' }}>
        <table className="students-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${borderColor}`, color: textSecondary, fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '16px 12px' }}>Student</th>
              <th className="desktop-col" style={{ padding: '16px 12px' }}>Contact</th>
              <th style={{ padding: '16px 12px' }}>Seat / Shift</th>
              <th className="desktop-col" style={{ padding: '16px 12px' }}>Plan</th>
              <th className="desktop-col" style={{ padding: '16px 12px' }}>Expiry</th>
              <th className="desktop-col" style={{ padding: '16px 12px' }}>Status</th>
              <th style={{ padding: '16px 12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-text" style={{ textAlign: 'center', padding: '32px' }}>No students found</td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const initials = getInitials(student.full_name);
                const expiryInfo = getExpirySubText(student.end_date);
                const isValidityExpired = expiryInfo ? expiryInfo.isExpired : false;
                
                return (
                  <tr key={student.id} style={{ borderBottom: `1px solid ${borderColor}`, fontSize: '14px', verticalAlign: 'middle' }}>
                    {/* STUDENT */}
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: textPrimary, fontSize: '15px' }}>{student.full_name}</span>
                            {student.due_amount > 0 && (
                              <span style={{
                                backgroundColor: '#fef2f2',
                                color: '#ef4444',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                ₹{student.due_amount} due
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>
                            {student.student_code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CONTACT */}
                    <td className="desktop-col" style={{ padding: '16px 12px' }}>
                      <div style={{ fontWeight: 500, color: textPrimary }}>{student.mobile}</div>
                      {student.email && (
                        <div style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>{student.email}</div>
                      )}
                    </td>

                    {/* SEAT / SHIFT */}
                    <td style={{ padding: '16px 12px' }}>
                      {student.seat_number ? (
                        <>
                          <div style={{ fontWeight: 600, color: textPrimary }}>Seat {student.seat_number}</div>
                          <div style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>{student.shift_name}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 600, color: textSecondary }}>
                            {student.access_type === "RESERVED" ? "No Seat" : "Unreserved"}
                          </div>
                          <div style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>{student.shift_name || "—"}</div>
                        </>
                      )}
                    </td>

                    {/* PLAN */}
                    <td className="desktop-col" style={{ padding: '16px 12px' }}>
                      {student.plan_name ? (
                        <span style={{ color: textPrimary, fontWeight: 500 }}>{student.plan_name}</span>
                      ) : (
                        <span style={{ color: textSecondary }}>—</span>
                      )}
                    </td>

                    {/* EXPIRY */}
                    <td className="desktop-col" style={{ padding: '16px 12px' }}>
                      {student.end_date ? (
                        <>
                          <div style={{ fontWeight: 500, color: textPrimary }}>{formatReadableDate(student.end_date)}</div>
                          {expiryInfo && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: expiryInfo.isExpired ? '#ef4444' : expiryInfo.isWarning ? '#f59e0b' : textSecondary, 
                              marginTop: '2px' 
                            }}>
                              {expiryInfo.text}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: textSecondary }}>—</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="desktop-col" style={{ padding: '16px 12px' }}>
                      {(() => {
                        if (student.account_status === "DISABLED") {
                          return (
                            <span style={{
                              backgroundColor: '#f3f4f6',
                              color: '#4b5563',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4b5563' }}></span>
                              Disabled
                            </span>
                          );
                        }
                        const status = getStudentStatus(student);
                        const statusStyles = {
                          active: { bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a', label: 'Active' },
                          expiring_soon: { bg: '#fffbeb', color: '#d97706', dot: '#d97706', label: 'Expiring in 7 Days' },
                          expired: { bg: '#fef2f2', color: '#ef4444', dot: '#ef4444', label: 'Expired' },
                          inactive: { bg: '#fef2f2', color: '#dc2626', dot: '#dc2626', label: 'Inactive' },
                          suspended: { bg: '#fff7ed', color: '#ea580c', dot: '#ea580c', label: 'Suspended' },
                        };
                        const s = statusStyles[status] || statusStyles.active;
                        return (
                          <span style={{
                            backgroundColor: s.bg,
                            color: s.color,
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: s.dot }}></span>
                            {s.label}
                          </span>
                        );
                      })()}
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <button
                          style={{
                            padding: '6px 14px',
                            border: '1px solid #cbd5e1',
                            background: darkMode ? '#334155' : '#ffffff',
                            color: textPrimary,
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onClick={() => openProfile(student)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? '#475569' : '#f8fafc';
                            e.currentTarget.style.borderColor = '#94a3b8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#ffffff';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                          }}
                        >
                          View
                        </button>
                        <button
                          className="desktop-col"
                          style={{
                            padding: '6px 14px',
                            border: `1px solid ${student.account_status === 'ACTIVE' ? '#fca5a5' : '#bbf7d0'}`,
                            background: student.account_status === 'ACTIVE' ? '#fee2e2' : '#f0fdf4',
                            color: student.account_status === 'ACTIVE' ? '#dc2626' : '#16a34a',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            minWidth: '80px',
                            textAlign: 'center'
                          }}
                          onClick={() => handleToggleStudentStatus(student)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = student.account_status === 'ACTIVE' ? '#fecaca' : '#dcfce7';
                            e.currentTarget.style.borderColor = student.account_status === 'ACTIVE' ? '#f87171' : '#86efac';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = student.account_status === 'ACTIVE' ? '#fee2e2' : '#f0fdf4';
                            e.currentTarget.style.borderColor = student.account_status === 'ACTIVE' ? '#fca5a5' : '#bbf7d0';
                          }}
                        >
                          {student.account_status === 'ACTIVE' ? 'Disable' : 'Activate'}
                        </button>
                        <button
                          className="desktop-col"
                          style={{
                            padding: '6px 14px',
                            border: '1px solid #bbf7d0',
                            background: '#f0fdf4',
                            color: '#16a34a',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickMsgStudent(student);
                            setShowMsgModal(true);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#dcfce7';
                            e.currentTarget.style.borderColor = '#86efac';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0fdf4';
                            e.currentTarget.style.borderColor = '#bbf7d0';
                          }}
                        >
                          <FaWhatsapp style={{ fontSize: "14px" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legacy profile overlay placeholder removed since profile is rendered as full screen page */}

      {/* Send Message Modal */}
      {showMsgModal && (
        <div onClick={() => { setShowMsgModal(false); setMsgTemplate("expiry_reminder"); setMsgCustom(""); setQuickMsgStudent(null); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: cardBg, border: `1px solid ${borderColor}`, borderRadius: "18px",
            padding: "28px", width: "95vw", maxWidth: "420px", boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: textPrimary, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}><FaWhatsapp style={{ color: "#25D660" }} /> Send WhatsApp Message</h2>
              <button onClick={() => { setShowMsgModal(false); setMsgTemplate("expiry_reminder"); setMsgCustom(""); setQuickMsgStudent(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}><FaTimes /></button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {[
                { key: "expiry_reminder", label: "Expiry Reminder", color: "#f59e0b" },
                { key: "expired", label: "Expired", color: "#ef4444" },
                { key: "custom", label: "Custom", color: "#3b82f6" },
              ].map(t => (
                <button key={t.key} onClick={() => setMsgTemplate(t.key)} style={{
                  padding: "8px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  border: `2px solid ${msgTemplate === t.key ? t.color : borderColor}`,
                  background: msgTemplate === t.key ? `${t.color}15` : "transparent",
                  color: msgTemplate === t.key ? t.color : textSecondary,
                }}>{t.label}</button>
              ))}
            </div>

            <div style={{
              background: darkMode ? "#0f172a" : "#f8fafc", borderRadius: "10px", padding: "12px 14px",
              border: `1px solid ${borderColor}`, marginBottom: "14px",
            }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: textPrimary }}>{(profileData || quickMsgStudent)?.full_name}</div>
              <div style={{ fontSize: "11px", color: textSecondary }}>{(profileData || quickMsgStudent)?.student_code} · {(profileData || quickMsgStudent)?.mobile || "No mobile"}</div>
            </div>

            <div style={{
              background: darkMode ? "#1e293b" : "#fff", border: `1px solid ${borderColor}`,
              borderRadius: "10px", padding: "14px", marginBottom: "16px", minHeight: "80px",
            }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: textSecondary, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Message Preview</div>
              {msgTemplate === "custom" ? (
                <textarea value={msgCustom} onChange={e => setMsgCustom(e.target.value)} placeholder="Type your message..."
                  rows={3} style={{
                    width: "100%", resize: "vertical", padding: "10px", borderRadius: "8px",
                    border: `1px solid ${borderColor}`, background: darkMode ? "#0f172a" : "#f8fafc",
                    color: textPrimary, fontSize: "13px", lineHeight: "1.5", boxSizing: "border-box", fontFamily: "inherit",
                  }} />
              ) : (
                <div style={{ fontSize: "13px", lineHeight: "1.6", color: textPrimary, whiteSpace: "pre-wrap" }}>{getModalMessage()}</div>
              )}
            </div>

            <button onClick={handleSendModalWhatsApp}
              style={{
                width: "100%", padding: "12px 20px", borderRadius: "10px", border: "none",
                background: "#25D660", color: "#fff", fontWeight: 700, fontSize: "14px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
              <FaWhatsapp style={{ fontSize: "16px" }} /> Send on WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;