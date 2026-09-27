import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaSearch,
  FaPhoneAlt,
  FaEnvelope,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaEye
} from "react-icons/fa";
import { useAdminData } from "../context/AdminDataContext";

const Libraries = () => {
  const { data, saveLibraryProfile, toggleLibraryStatus, calculateDaysLeft } = useAdminData();
  const [searchQuery, setSearchQuery] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);

  const filteredLibraries = useMemo(() => {
    if (!searchQuery.trim()) return data.libraries;
    const q = searchQuery.toLowerCase().trim();
    return data.libraries.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        l.owner_name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q)
    );
  }, [data.libraries, searchQuery]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!editModal) return;
    saveLibraryProfile(editModal);
    setEditModal(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
            Registered Libraries Profiles
          </h2>
          <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
            Total {data.libraries.length} Libraries Registered on the Platform
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "280px" }}>
          <FaSearch
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              fontSize: "13px",
            }}
          />
          <input
            type="text"
            placeholder="Search by code, library name, owner, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
            }}
          />
        </div>
      </div>

      {/* Libraries Table Card - Fits 100% in one frame with NO horizontal slider */}
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
              <th style={{ padding: "10px 12px", width: "24%" }}>Library & Code</th>
              <th style={{ padding: "10px 12px", width: "20%" }}>Owner & Contact</th>
              <th style={{ padding: "10px 12px", width: "16%" }}>Location</th>
              <th style={{ padding: "10px 12px", width: "12%" }}>Active Students</th>
              <th style={{ padding: "10px 12px", width: "11%" }}>Plan Tier</th>
              <th style={{ padding: "10px 12px", width: "8%" }}>Status</th>
              <th style={{ padding: "10px 12px", width: "11%", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLibraries.map((lib) => {
              const daysLeft = calculateDaysLeft(lib.subscription_expiry);
              const isActive = lib.status === "ACTIVE";

              return (
                <tr
                  key={lib.id}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    backgroundColor: "#ffffff",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <td style={{ padding: "10px 12px" }}>
                    <Link
                      to={`/libraries/${lib.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: "700",
                          fontSize: "11px",
                          backgroundColor: "#dbeafe",
                          color: "#1e40af",
                          padding: "3px 6px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          letterSpacing: "0.2px",
                        }}
                      >
                        {lib.code}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: "700",
                            fontSize: "13px",
                            color: "#0f172a",
                            lineHeight: "1.3",
                            transition: "color 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#1d4ed8")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#0f172a")}
                        >
                          {lib.name}
                        </div>
                        <div style={{ fontSize: "10.5px", color: "#64748b", whiteSpace: "nowrap" }}>
                          Reg: {lib.created_at}
                        </div>
                      </div>
                    </Link>
                  </td>

                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "12.5px" }}>{lib.owner_name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "2px", fontSize: "11px", color: "#64748b" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                        <FaPhoneAlt style={{ fontSize: "9px", color: "#2563eb" }} /> {lib.phone}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                        <FaEnvelope style={{ fontSize: "9px" }} /> {lib.email}
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "12px" }}>{lib.city}</div>
                    <div
                      title={lib.address}
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        maxWidth: "160px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {lib.address}
                    </div>
                  </td>

                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <span
                        style={{
                          fontWeight: "800",
                          color: "#059669",
                          backgroundColor: "#ecfdf5",
                          border: "1px solid #d1fae5",
                          padding: "2px 7px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ● {data.students.filter((s) => s.library_id === lib.id && s.status === "ACTIVE").length} Active
                      </span>
                    </div>
                    <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px", whiteSpace: "nowrap" }}>
                      Quota: {lib.active_students_limit}
                    </div>
                  </td>

                  <td style={{ padding: "10px 12px" }}>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "10.5px",
                        fontWeight: "700",
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        whiteSpace: "nowrap",
                        display: "inline-block",
                      }}
                    >
                      {lib.subscription_tier}
                    </span>
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontWeight: "600",
                        color: daysLeft <= 0 ? "#dc2626" : "#059669",
                        marginTop: "2px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
                    </div>
                  </td>

                  <td style={{ padding: "10px 12px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "2px 7px",
                        borderRadius: "12px",
                        fontSize: "10.5px",
                        fontWeight: "700",
                        backgroundColor: isActive ? "#d1fae5" : "#fee2e2",
                        color: isActive ? "#065f46" : "#991b1b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ● {lib.status}
                    </span>
                  </td>

                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", gap: "4px", justifyContent: "center", flexWrap: "nowrap" }}>
                      <Link
                        to={`/libraries/${lib.id}`}
                        title="View Full Library Profile & Expiry Tracker"
                        style={{
                          padding: "4px 8px",
                          borderRadius: "5px",
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          fontSize: "11px",
                          fontWeight: "700",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <FaEye style={{ fontSize: "10px" }} /> View
                      </Link>

                      <button
                        onClick={() => setEditModal(lib)}
                        title="Edit Library"
                        style={{
                          padding: "4px 8px",
                          borderRadius: "5px",
                          backgroundColor: "#1d4ed8",
                          color: "#ffffff",
                          border: "none",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <FaEdit style={{ fontSize: "9.5px" }} /> Edit
                      </button>

                      <button
                        onClick={() => toggleLibraryStatus(lib.id)}
                        title={isActive ? "Suspend Library" : "Activate Library"}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "5px",
                          backgroundColor: isActive ? "#dc2626" : "#059669",
                          color: "#ffffff",
                          border: "none",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isActive ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Library Modal */}
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
              boxShadow: "var(--shadow-modal)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>
              Edit Library Profile: [{editModal.code}]
            </h3>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Library Name:</label>
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
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Library Code:</label>
                  <input
                    type="text"
                    value={editModal.code}
                    onChange={(e) => setEditModal({ ...editModal, code: e.target.value.toUpperCase() })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px", fontFamily: "monospace" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Owner Name:</label>
                  <input
                    type="text"
                    value={editModal.owner_name}
                    onChange={(e) => setEditModal({ ...editModal, owner_name: e.target.value })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Phone Number:</label>
                  <input
                    type="text"
                    value={editModal.phone}
                    onChange={(e) => setEditModal({ ...editModal, phone: e.target.value })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Gmail / Email:</label>
                  <input
                    type="email"
                    value={editModal.email}
                    onChange={(e) => setEditModal({ ...editModal, email: e.target.value })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>City:</label>
                  <input
                    type="text"
                    value={editModal.city}
                    onChange={(e) => setEditModal({ ...editModal, city: e.target.value })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Active Student Quota:</label>
                  <input
                    type="number"
                    value={editModal.active_students_limit}
                    onChange={(e) => setEditModal({ ...editModal, active_students_limit: Number(e.target.value) })}
                    style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Address:</label>
                <textarea
                  rows="2"
                  value={editModal.address}
                  onChange={(e) => setEditModal({ ...editModal, address: e.target.value })}
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
                  Save Profile Updates
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

      {/* View Profile Modal */}
      {viewModal && (
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: "700",
                    fontSize: "12px",
                    backgroundColor: "#dbeafe",
                    color: "#1e40af",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {viewModal.code}
                </span>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                  {viewModal.name}
                </h3>
              </div>
              <button
                onClick={() => setViewModal(null)}
                style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "13px",
              }}
            >
              <div><strong>Owner:</strong> {viewModal.owner_name}</div>
              <div><strong>Phone:</strong> {viewModal.phone}</div>
              <div><strong>Email:</strong> {viewModal.email}</div>
              <div><strong>Location:</strong> {viewModal.address}, {viewModal.city}</div>
              <div><strong>Active Students:</strong> {data.students.filter(s => s.library_id === viewModal.id && s.status === "ACTIVE").length} Enrolled</div>
              <div><strong>Active Student Quota:</strong> {viewModal.active_students_limit} Limit</div>
              <div><strong>Subscription:</strong> {viewModal.subscription_tier} ({viewModal.subscription_cycle})</div>
              <div><strong>Valid Till:</strong> {viewModal.subscription_expiry}</div>
              <div><strong>Status:</strong> {viewModal.status}</div>
            </div>

            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setViewModal(null)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Libraries;
