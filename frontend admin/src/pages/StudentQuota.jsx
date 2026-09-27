import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FaChair, FaEdit, FaUserCheck, FaArrowRight, FaEye, FaSearch } from "react-icons/fa";
import { useAdminData } from "../context/AdminDataContext";

const StudentQuota = () => {
  const { libraryMatrix, saveLibraryQuota } = useAdminData();
  const [quotaModal, setQuotaModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMatrix = useMemo(() => {
    if (!searchQuery.trim()) return libraryMatrix;
    const q = searchQuery.toLowerCase().trim();
    return libraryMatrix.filter((lib) => {
      return (
        lib.name?.toLowerCase().includes(q) ||
        lib.code?.toLowerCase().includes(q) ||
        lib.city?.toLowerCase().includes(q) ||
        lib.subscription_tier?.toLowerCase().includes(q)
      );
    });
  }, [libraryMatrix, searchQuery]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!quotaModal) return;
    saveLibraryQuota(quotaModal);
    setQuotaModal(null);
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
            Active Students: Library-Wise Quota & Tracking
          </h2>
          <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
            Track libraries by active student count & quota utilization. All subscriptions and limits are managed active student-wise.
          </p>
        </div>

        <Link
          to="/students"
          style={{
            padding: "9px 16px",
            borderRadius: "8px",
            backgroundColor: "#1d4ed8",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          View All Students <FaArrowRight style={{ fontSize: "11px" }} />
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          backgroundColor: "#ffffff",
          padding: "14px 18px",
          borderRadius: "10px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <FaSearch
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              fontSize: "12px",
            }}
          />
          <input
            type="text"
            placeholder="Search by library name, code, city, tier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              fontSize: "12.5px",
            }}
          />
        </div>

        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
          Showing <strong>{filteredMatrix.length}</strong> of {libraryMatrix.length} Libraries
        </div>
      </div>

      {/* Breakdown Table Card - Fits 100% in one frame with NO horizontal slider */}
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
        {filteredMatrix.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <FaUserCheck style={{ fontSize: "32px", opacity: 0.3, color: "#1d4ed8", marginBottom: "10px" }} />
            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#0f172a" }}>No Libraries Found</h4>
            <p style={{ margin: 0, fontSize: "12.5px" }}>
              No libraries match your search "{searchQuery}".
            </p>
          </div>
        ) : (
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
                <th style={{ padding: "10px 12px", width: "24%" }}>Library Code & Name</th>
                <th style={{ padding: "10px 12px", width: "18%" }}>Active Students</th>
                <th style={{ padding: "10px 12px", width: "14%" }}>Student Quota</th>
                <th style={{ padding: "10px 12px", width: "18%" }}>Quota Utilization</th>
                <th style={{ padding: "10px 12px", width: "13%" }}>Inactive / Deleted</th>
                <th style={{ padding: "10px 12px", width: "13%", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatrix.map((lib) => (
              <tr
                key={lib.id}
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  backgroundColor: "#ffffff",
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
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 6px",
                        borderRadius: "4px",
                        backgroundColor: "#dbeafe",
                        color: "#1e40af",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
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
                        {lib.city} • Tier: {lib.subscription_tier}
                      </div>
                    </div>
                  </Link>
                </td>

                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                    <span style={{ fontSize: "16px", fontWeight: "800", color: "#059669" }}>
                      {lib.active_count}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>active enrolled</span>
                  </div>
                  <div style={{ fontSize: "10.5px", color: "#64748b", whiteSpace: "nowrap" }}>
                    Max Quota: {lib.active_students_limit}
                  </div>
                </td>

                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>{lib.active_students_limit}</span> Limit
                </td>

                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11.5px" }}>
                    <span style={{ fontWeight: "600", color: "#0f172a" }}>{lib.occupancy_rate}%</span>
                    <span style={{ fontSize: "10.5px", color: "#64748b" }}>
                      {lib.active_count}/{lib.active_students_limit} students
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      borderRadius: "10px",
                      backgroundColor: "#e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${lib.occupancy_rate}%`,
                        borderRadius: "10px",
                        backgroundColor:
                          lib.occupancy_rate > 90 ? "#dc2626" : lib.occupancy_rate > 70 ? "#d97706" : "#059669",
                      }}
                    />
                  </div>
                </td>

                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "11.5px", whiteSpace: "nowrap" }}>
                    <span style={{ color: "#d97706", fontWeight: "600" }}>{lib.inactive_count} Inact</span>
                    {" • "}
                    <span style={{ color: "#dc2626", fontWeight: "600" }}>{lib.deleted_count} Del</span>
                  </div>
                </td>

                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ display: "inline-flex", gap: "4px", justifyContent: "center", flexWrap: "nowrap" }}>
                    <Link
                      to={`/libraries/${lib.id}`}
                      style={{
                        padding: "5px 8px",
                        borderRadius: "6px",
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        textDecoration: "none",
                        fontWeight: "700",
                        fontSize: "11px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        whiteSpace: "nowrap",
                      }}
                      title="View Profile & Expiry Tracker"
                    >
                      <FaEye style={{ fontSize: "10px" }} /> View
                    </Link>

                    <button
                      onClick={() => setQuotaModal(lib)}
                      style={{
                        padding: "5px 9px",
                        borderRadius: "6px",
                        backgroundColor: "#1d4ed8",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: "600",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <FaEdit style={{ fontSize: "9.5px" }} /> Update
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

      {/* Update Quota Modal */}
      {quotaModal && (
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
              maxWidth: "460px",
              boxShadow: "var(--shadow-modal)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
              Update Library Active Student Quota
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
              [{quotaModal.code}] {quotaModal.name}
            </p>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                  Active Student Limit (Quota):
                </label>
                <input
                  type="number"
                  value={quotaModal.active_students_limit}
                  onChange={(e) => setQuotaModal({ ...quotaModal, active_students_limit: Number(e.target.value) })}
                  style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Status:</label>
                <select
                  value={quotaModal.status}
                  onChange={(e) => setQuotaModal({ ...quotaModal, status: e.target.value })}
                  style={{ width: "100%", marginTop: "4px", padding: "8px 10px" }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "9px",
                    backgroundColor: "#059669",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Save Quota Update
                </button>
                <button
                  type="button"
                  onClick={() => setQuotaModal(null)}
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

export default StudentQuota;
