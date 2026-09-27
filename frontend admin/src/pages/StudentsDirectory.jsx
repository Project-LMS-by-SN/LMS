import React, { useState, useMemo } from "react";
import {
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaSearch,
  FaBuilding,
  FaFilter,
  FaPhoneAlt,
  FaEnvelope,
  FaWhatsapp,
  FaUsers
} from "react-icons/fa";
import { useAdminData } from "../context/AdminDataContext";

const StudentsDirectory = () => {
  const { data, stats } = useAdminData();

  // Status Section Tab: 'ACTIVE' | 'INACTIVE' | 'DELETED'
  const [statusTab, setStatusTab] = useState("ACTIVE");

  // Search States: Search by Student & Search by Library
  const [studentSearch, setStudentSearch] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedLibraryFilter, setSelectedLibraryFilter] = useState("ALL");

  const filteredStudents = useMemo(() => {
    return data.students.filter((s) => {
      // 1. Status Section match
      if (s.status !== statusTab) return false;

      // 2. Dropdown Library Filter
      if (
        selectedLibraryFilter !== "ALL" &&
        s.library_code !== selectedLibraryFilter &&
        s.library_id !== selectedLibraryFilter
      ) {
        return false;
      }

      // 3. Search by Student (Name, Phone, Gmail / Email)
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const matchName = s.name?.toLowerCase().includes(q);
        const matchPhone = s.phone?.includes(q);
        const matchEmail = s.email?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail) return false;
      }

      // 4. Search by Library (Library Name or Library Code)
      if (librarySearch.trim()) {
        const libQ = librarySearch.toLowerCase().trim();
        const matchLibCode = s.library_code?.toLowerCase().includes(libQ);
        const matchLibName = s.library_name?.toLowerCase().includes(libQ);
        if (!matchLibCode && !matchLibName) return false;
      }

      return true;
    });
  }, [data.students, statusTab, selectedLibraryFilter, studentSearch, librarySearch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Banner with 3 Status Section Tabs */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "20px 24px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        {/* Status Selection Pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setStatusTab("ACTIVE")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: statusTab === "ACTIVE" ? "#059669" : "#f1f5f9",
              color: statusTab === "ACTIVE" ? "#ffffff" : "#475569",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <FaUserCheck />
            Active Students ({stats.activeStudents})
          </button>

          <button
            onClick={() => setStatusTab("INACTIVE")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: statusTab === "INACTIVE" ? "#d97706" : "#f1f5f9",
              color: statusTab === "INACTIVE" ? "#ffffff" : "#475569",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <FaUserClock />
            Inactive Students ({stats.inactiveStudents})
          </button>

          <button
            onClick={() => setStatusTab("DELETED")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: statusTab === "DELETED" ? "#dc2626" : "#f1f5f9",
              color: statusTab === "DELETED" ? "#ffffff" : "#475569",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <FaUserTimes />
            Deleted / Archived ({stats.deletedStudents})
          </button>
        </div>

        <div style={{ fontSize: "12.5px", color: "#64748b" }}>
          🛡️ Read-only Master Directory across all registered libraries (Actions restricted to library owners)
        </div>
      </div>

      {/* Dual Search & Filter Bar: Search Student, Search Library, Filter Library */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "12px",
          backgroundColor: "#ffffff",
          padding: "16px 20px",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Search by Student */}
        <div>
          <label style={{ fontSize: "11.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
            Search Student:
          </label>
          <div style={{ position: "relative" }}>
            <FaSearch
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: "12.5px",
              }}
            />
            <input
              type="text"
              placeholder="Search by student name, phone, gmail..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 34px" }}
            />
          </div>
        </div>

        {/* Search by Library */}
        <div>
          <label style={{ fontSize: "11.5px", fontWeight: "700", color: "#1d4ed8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
            Search by Library:
          </label>
          <div style={{ position: "relative" }}>
            <FaBuilding
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#1d4ed8",
                fontSize: "12.5px",
              }}
            />
            <input
              type="text"
              placeholder="Search by library code (LIB-DEL-01) or name..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                borderColor: librarySearch.trim() ? "#3b82f6" : "var(--border-subtle)",
                backgroundColor: librarySearch.trim() ? "#eff6ff" : "#ffffff",
              }}
            />
          </div>
        </div>

        {/* Dropdown Library Filter */}
        <div>
          <label style={{ fontSize: "11.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
            Filter by Library:
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={selectedLibraryFilter}
              onChange={(e) => setSelectedLibraryFilter(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", fontWeight: "600" }}
            >
              <option value="ALL">All Libraries (Combined)</option>
              {data.libraries.map((lib) => (
                <option key={lib.id} value={lib.code}>
                  [{lib.code}] {lib.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Search Badges / Summary */}
      {(studentSearch || librarySearch || selectedLibraryFilter !== "ALL") && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px", color: "#64748b", flexWrap: "wrap" }}>
          <span>Active Filters:</span>
          {studentSearch && (
            <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "3px 9px", borderRadius: "12px", fontWeight: "600" }}>
              Student: "{studentSearch}"
            </span>
          )}
          {librarySearch && (
            <span style={{ backgroundColor: "#dbeafe", color: "#1e40af", padding: "3px 9px", borderRadius: "12px", fontWeight: "700" }}>
              Library Search: "{librarySearch}"
            </span>
          )}
          {selectedLibraryFilter !== "ALL" && (
            <span style={{ backgroundColor: "#d1fae5", color: "#065f46", padding: "3px 9px", borderRadius: "12px", fontWeight: "600" }}>
              Library Code: {selectedLibraryFilter}
            </span>
          )}
          <button
            onClick={() => {
              setStudentSearch("");
              setLibrarySearch("");
              setSelectedLibraryFilter("ALL");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#dc2626",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
              textDecoration: "underline",
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Students Directory Table */}
      {/* Students Directory Table - Fits 100% in one frame with NO horizontal slider */}
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
        {filteredStudents.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <FaUsers style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.35, color: "#1d4ed8" }} />
            <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#0f172a" }}>No Students Found</h4>
            <p style={{ margin: 0, fontSize: "12.5px" }}>
              No {statusTab.toLowerCase()} students match your search criteria.
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
                <th style={{ padding: "10px 12px", width: "22%" }}>Student</th>
                <th style={{ padding: "10px 12px", width: "18%" }}>Library Code</th>
                <th style={{ padding: "10px 12px", width: "14%" }}>Phone</th>
                <th style={{ padding: "10px 12px", width: "18%" }}>Email</th>
                <th style={{ padding: "10px 12px", width: "11%" }}>Seat / Shift</th>
                <th style={{ padding: "10px 12px", width: "8%" }}>Fee</th>
                <th style={{ padding: "10px 12px", width: "9%" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((stu) => {
                return (
                  <tr
                    key={stu.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {/* Student Name */}
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            backgroundColor:
                              stu.status === "ACTIVE"
                                ? "#059669"
                                : stu.status === "INACTIVE"
                                ? "#d97706"
                                : "#dc2626",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "12px",
                            flexShrink: 0,
                          }}
                        >
                          {stu.name.charAt(0)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a", lineHeight: "1.3" }}>{stu.name}</div>
                          <div style={{ fontSize: "10.5px", color: "#64748b", whiteSpace: "nowrap" }}>Plan: {stu.plan_name}</div>
                        </div>
                      </div>
                    </td>

                    {/* Library Code - Clearly highlighted badge next to student */}
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            fontFamily: "monospace",
                            fontWeight: "800",
                            fontSize: "11px",
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                            width: "fit-content",
                            flexShrink: 0,
                          }}
                        >
                          {stu.library_code}
                        </span>
                        <span style={{ fontSize: "11px", color: "#475569", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {stu.library_name}
                        </span>
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                        <a
                          href={`tel:${stu.phone}`}
                          style={{
                            color: "#1d4ed8",
                            textDecoration: "none",
                            fontWeight: "600",
                            fontSize: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <FaPhoneAlt style={{ fontSize: "9px" }} />
                          {stu.phone}
                        </a>
                        <a
                          href={`https://wa.me/91${stu.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp Chat"
                          style={{ color: "#059669", fontSize: "13px", display: "inline-flex" }}
                        >
                          <FaWhatsapp />
                        </a>
                      </div>
                    </td>

                    {/* Gmail ID / Email */}
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
                        <FaEnvelope style={{ fontSize: "10px", color: "#94a3b8", flexShrink: 0 }} />
                        <a
                          href={`mailto:${stu.email}`}
                          title={stu.email}
                          style={{
                            color: "#334155",
                            textDecoration: "none",
                            fontSize: "11.5px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "inline-block",
                            maxWidth: "170px",
                          }}
                        >
                          {stu.email}
                        </a>
                      </div>
                    </td>

                    {/* Seat & Shift */}
                    <td style={{ padding: "9px 12px" }}>
                      <span
                        style={{
                          fontWeight: "700",
                          fontSize: "11px",
                          padding: "2px 5px",
                          borderRadius: "4px",
                          backgroundColor: "#f1f5f9",
                          color: "#1e293b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Seat: {stu.seat_number}
                      </span>
                      <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px", whiteSpace: "nowrap" }}>
                        {stu.shift_name}
                      </div>
                    </td>

                    {/* Fee Status */}
                    <td style={{ padding: "9px 12px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10.5px",
                          fontWeight: "700",
                          backgroundColor: stu.fee_status === "PAID" ? "#d1fae5" : "#fee2e2",
                          color: stu.fee_status === "PAID" ? "#065f46" : "#991b1b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {stu.fee_status}
                      </span>
                    </td>

                    {/* Validity & Status Details (Read-only as requested) */}
                    <td style={{ padding: "9px 12px" }}>
                      {stu.status === "ACTIVE" && (
                        <div>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontSize: "10.5px",
                              fontWeight: "700",
                              backgroundColor: "#d1fae5",
                              color: "#065f46",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Active
                          </span>
                          <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "1px", whiteSpace: "nowrap" }}>
                            {stu.validity_end}
                          </div>
                        </div>
                      )}

                      {stu.status === "INACTIVE" && (
                        <div>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontSize: "10.5px",
                              fontWeight: "700",
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Inactive
                          </span>
                          <div style={{ fontSize: "10.5px", color: "#b45309", marginTop: "1px", whiteSpace: "nowrap" }}>
                            {stu.inactive_reason || "Due"}
                          </div>
                        </div>
                      )}

                      {stu.status === "DELETED" && (
                        <div>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontSize: "10.5px",
                              fontWeight: "700",
                              backgroundColor: "#fee2e2",
                              color: "#991b1b",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Deleted
                          </span>
                          <div style={{ fontSize: "10.5px", color: "#dc2626", marginTop: "1px", whiteSpace: "nowrap" }}>
                            {stu.deleted_at}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentsDirectory;
