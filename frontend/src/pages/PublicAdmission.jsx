import React, { useState, useEffect, useRef } from "react";
import {
  FaBookOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPhone,
  FaMapMarkerAlt,
  FaCamera,
  FaSpinner,
  FaBuilding,
} from "react-icons/fa";
import api from "../api/axios";
import CustomDatePicker from "../components/CustomDatePicker";

const PublicAdmission = () => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [branchData, setBranchData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    gender: "MALE",
    dob: "",
    address: "",
    aadharNumber: "",
    profilePhotoUrl: "",
    remarks: "",
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token") || params.get("admToken") || params.get("admissionToken");
    const urlBranchId = params.get("branchId") || params.get("branch");
    const urlCode = params.get("code") || params.get("branchCode");

    // Check if user is logged in for dashboard preview
    const loggedInUser = (() => {
      try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); } catch { return {}; }
    })();

    let query = "";
    if (urlToken && urlToken.trim()) {
      query = `token=${encodeURIComponent(urlToken.trim())}`;
      setToken(urlToken.trim());
    } else if (urlBranchId && urlBranchId.trim()) {
      query = `branchId=${encodeURIComponent(urlBranchId.trim())}`;
    } else if (urlCode && urlCode.trim()) {
      query = `code=${encodeURIComponent(urlCode.trim())}`;
    } else if (loggedInUser?.branchId) {
      query = `branchId=${encodeURIComponent(loggedInUser.branchId)}`;
    } else {
      query = `token=default`;
    }

    const fetchBranchInfo = async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const res = await api.get(`/admission-requests/branch-info?${query}`);
        if (res.data?.success) {
          setBranchData(res.data.data);
          if (res.data.data?.branch?.admissionToken) {
            setToken(res.data.data.branch.admissionToken);
          }
        } else {
          setErrorMsg(res.data?.message || "Invalid admission link.");
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "Invalid or expired admission QR code link. Please verify with the library administration.");
      } finally {
        setLoading(false);
      }
    };

    fetchBranchInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
      setFormData((prev) => ({ ...prev, profilePhotoUrl: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!formData.fullName.trim()) {
      setSubmitError("Please enter your full name.");
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.trim().length < 10) {
      setSubmitError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!formData.email.trim()) {
      setSubmitError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setSubmitError("Please enter a valid email address.");
      return;
    }
    if (!formData.dob) {
      setSubmitError("Please select your date of birth.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        token,
        full_name: formData.fullName.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        gender: formData.gender,
        dob: formData.dob || null,
        address: formData.address.trim() || null,
        aadhar_number: formData.aadharNumber.trim() || null,
        profile_photo_url: formData.profilePhotoUrl || null,
        remarks: formData.remarks.trim() || null,
      };

      const res = await api.post("/admission-requests", payload);
      if (res.data?.success) {
        setSubmitSuccess(res.data.data || { referenceNumber: "PENDING", fullName: formData.fullName });
      } else {
        setSubmitError(res.data?.message || "Failed to submit admission form.");
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: "",
      mobile: "",
      email: "",
      gender: "MALE",
      dob: "",
      address: "",
      aadharNumber: "",
      profilePhotoUrl: "",
      remarks: "",
    });
    setPhotoPreview(null);
    setSubmitSuccess(null);
    setSubmitError("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)",
        padding: "24px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          background: "rgba(30, 41, 59, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Top Header Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            padding: "28px 24px",
            textAlign: "center",
            position: "relative",
            borderTopLeftRadius: "23px",
            borderTopRightRadius: "23px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.18)",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            <FaBookOpen /> Student Online Admission Portal
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px 0", color: "#ffffff" }}>
            {branchData?.branch?.name || "Library Admission"}
          </h1>
          {branchData?.branch?.address && (
            <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "rgba(255, 255, 255, 0.9)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <FaMapMarkerAlt /> {branchData.branch.address}
            </p>
          )}
          {branchData?.branch?.phone && (
            <p style={{ margin: 0, fontSize: "13px", color: "rgba(255, 255, 255, 0.8)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <FaPhone /> Helpline: {branchData.branch.phone}
            </p>
          )}
        </div>

        {/* Content Body */}
        <div style={{ padding: "32px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <FaSpinner style={{ animation: "spin 1s linear infinite", fontSize: "36px", color: "#38bdf8" }} />
              <p style={{ marginTop: "16px", color: "#94a3b8", fontSize: "15px" }}>
                Verifying library admission link...
              </p>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : errorMsg ? (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <FaExclamationTriangle style={{ fontSize: "36px", color: "#ef4444" }} />
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
                Unable to Access Admission Form
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", maxWidth: "440px", margin: "0 auto 24px" }}>
                {errorMsg}
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "10px 18px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "#cbd5e1",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <FaBuilding style={{ color: "#38bdf8" }} /> Please visit the library reception desk directly
              </div>
            </div>
          ) : submitSuccess ? (
            /* Success Screen */
            <div style={{ textAlign: "center", padding: "30px 16px" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <FaCheckCircle style={{ fontSize: "44px", color: "#10b981" }} />
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "10px", color: "#ffffff" }}>
                Application Submitted Successfully!
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>
                Your admission request has been sent to <strong>{branchData?.branch?.name}</strong>.
              </p>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                  padding: "20px",
                  maxWidth: "420px",
                  margin: "0 auto 28px",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>Application Reference</span>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "#38bdf8" }}>{submitSuccess.referenceNumber}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>Applicant Name</span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc" }}>{submitSuccess.fullName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>Status</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}>
                    Pending Desk Verification
                  </span>
                </div>
              </div>

              <div style={{ background: "rgba(37, 99, 235, 0.1)", border: "1px solid rgba(37, 99, 235, 0.3)", borderRadius: "12px", padding: "16px", marginBottom: "28px", maxWidth: "460px", margin: "0 auto 28px", fontSize: "13px", color: "#bfdbfe", textAlign: "left", lineHeight: "1.6" }}>
                <strong>📌 Next Steps:</strong>
                <ol style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                  <li>Visit the library reception desk with your reference number.</li>
                  <li>Select your designated seat and finalize your preferred shift.</li>
                  <li>Complete membership fee payment to receive your library ID card.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Submit Another Application
              </button>
            </div>
          ) : (
            /* Admission Registration Form */
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
                  Please fill in your details below to apply for membership at <strong>{branchData?.branch?.name}</strong>.
                </p>
              </div>

              {submitError && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#fca5a5",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaExclamationTriangle /> {submitError}
                </div>
              )}

              {/* Profile Photo Uploader */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                  Profile Photo (Optional)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? "#38bdf8" : "rgba(255, 255, 255, 0.2)"}`,
                    borderRadius: "14px",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    cursor: "pointer",
                    background: isDragging ? "rgba(56, 189, 248, 0.12)" : "rgba(15, 23, 42, 0.6)",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box",
                  }}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #38bdf8",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        color: "#94a3b8",
                        flexShrink: 0,
                      }}
                    >
                      <FaCamera />
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
                      {photoPreview ? (
                        <>
                          <FaCheckCircle style={{ color: "#10b981" }} /> Photo selected
                        </>
                      ) : (
                        "Drag & drop or click to upload photo"
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "3px" }}>
                      JPG, PNG, WebP up to 5MB
                    </div>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoPreview(null);
                          setFormData((prev) => ({ ...prev, profilePhotoUrl: "" }));
                        }}
                        style={{
                          marginTop: "6px",
                          fontSize: "12px",
                          color: "#f87171",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          fontWeight: 500,
                        }}
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handlePhotoFile(e.target.files[0])}
                />
              </div>

              {/* Grid 2 Columns */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                {/* Full Name */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Full Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Mobile Number <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Email Address <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Gender <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="MALE" style={{ background: "#1e293b", color: "#fff" }}>Male</option>
                    <option value="FEMALE" style={{ background: "#1e293b", color: "#fff" }}>Female</option>
                    <option value="OTHER" style={{ background: "#1e293b", color: "#fff" }}>Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Date of Birth <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <CustomDatePicker
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    placeholder="Select date of birth"
                    required
                    forceDark={true}
                    max={new Date().toISOString().split("T")[0]}
                    triggerStyle={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      minHeight: "46px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Aadhar / ID Card */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Aadhar / ID Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="aadharNumber"
                    value={formData.aadharNumber}
                    onChange={handleChange}
                    placeholder="e.g. 12-digit Aadhar"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Address */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                  Residential Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Street address, city, pin code..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Remarks */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                  Additional Notes or Questions (Optional)
                </label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Any specific requirement or target exams (e.g. UPSC, NEET, etc.)..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  border: "none",
                  borderRadius: "14px",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.5)",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? (
                  <>
                    <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> Submitting Application...
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> Submit Admission Application
                  </>
                )}
              </button>

              <p style={{ margin: "14px 0 0 0", textAlign: "center", fontSize: "12px", color: "#64748b" }}>
                Your information is safe and will only be used for library membership registration.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicAdmission;
