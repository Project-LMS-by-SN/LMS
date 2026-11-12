import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import { formatTime } from "../utils/timeUtils";
import { useTheme } from "../context/ThemeContext";
import { FaChair, FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaTimes, FaSearch, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaBolt, FaHashtag, FaCheck } from "react-icons/fa";

const parseSeatParts = (seatNumber = "") => {
  const trimmed = String(seatNumber || "").trim().toUpperCase();
  const match = trimmed.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    return { prefix: match[1], num: parseInt(match[2], 10) };
  }
  const prefix = trimmed.replace(/[0-9]/g, "").trim() || "A";
  const numMatch = trimmed.match(/(\d+)/);
  return { prefix, num: numMatch ? parseInt(numMatch[1], 10) : 0 };
};

const Seats = () => {
  const { darkMode, timeFormat } = useTheme();
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showGenModal, setShowGenModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const computedTooltipPos = useMemo(() => {
    const TOOLTIP_W = 340, TOOLTIP_H = 220, OFFSET = 16;
    let left = tooltipPos.x + OFFSET, top = tooltipPos.y - 10;
    if (typeof window !== "undefined") {
      if (left + TOOLTIP_W > window.innerWidth) left = tooltipPos.x - TOOLTIP_W - OFFSET;
      if (top + TOOLTIP_H > window.innerHeight) top = tooltipPos.y - TOOLTIP_H;
      if (top < 0) top = 10;
      if (left < 0) left = 10;
    }
    return { left, top };
  }, [tooltipPos]);

  const [filterFloor, setFilterFloor] = useState("1");
  const [filterRoom, setFilterRoom] = useState("A1");

  const [genPrefix, setGenPrefix] = useState("A");
  const [genStart, setGenStart] = useState("1");
  const [genCount, setGenCount] = useState("50");
  const [genSeatType, setGenSeatType] = useState("Regular");
  const [genFloor, setGenFloor] = useState("1");
  const [genRoom, setGenRoom] = useState("A1");
  const [showNewFloor, setShowNewFloor] = useState(false);
  const [newFloorName, setNewFloorName] = useState("");
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSeats = async () => {
    try {
      const res = await api.get("/seats");
      setSeats(res.data.data);
    } catch {
      showToast("Failed to load seats", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSeats(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") { setShowGenModal(false); setSelectedSeat(null); setHoveredSeat(null); setDeleteMode(false); setSelectedSeatIds([]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!deleteMode && !selectedSeat) return;

    const handleDocumentClick = (e) => {
      const target = e.target instanceof Element ? e.target : e.target?.parentElement;
      if (!target) return;

      if (target.closest("[data-seat-item='true']")) return;
      if (deleteMode && target.closest("[data-delete-control='true']")) return;
      if (deleteMode && target.closest("[data-seat-filter='true']")) return;
      if (selectedSeat && target.closest("[data-seat-bar='true']")) return;

      if (deleteMode) {
        setDeleteMode(false);
        setSelectedSeatIds([]);
      }
      if (selectedSeat) {
        setSelectedSeat(null);
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [deleteMode, selectedSeat]);

  useEffect(() => {
    if (seats.length === 0) return;
    const roomsForCurrentFloor = [...new Set(seats.filter(s => {
      const sf = String(s.floor || "").trim().toLowerCase();
      const tf = String(filterFloor).trim().toLowerCase();
      return sf === tf || sf === `floor ${tf}` || `floor ${sf}` === tf;
    }).map(s => s.room).filter(Boolean))].sort();

    if (roomsForCurrentFloor.length > 0) {
      const hasCurrentRoom = roomsForCurrentFloor.some(r => {
        const sr = String(r).trim().toLowerCase();
        const tr = String(filterRoom).trim().toLowerCase();
        return sr === tr || sr === `room ${tr}` || `room ${sr}` === tr;
      });
      if (!hasCurrentRoom) {
        setFilterRoom(roomsForCurrentFloor[0]);
      }
    }
  }, [seats, filterFloor]);

  const allFloors = useMemo(() => [...new Set(seats.map(s => s.floor).filter(Boolean))].sort(), [seats]);
  const allRoomsForFloor = useMemo(() => [...new Set(seats.filter(s => s.floor === genFloor).map(s => s.room).filter(Boolean))].sort(), [seats, genFloor]);

  const uniqueFloors = useMemo(() => {
    const floors = [...new Set(seats.map(s => s.floor).filter(Boolean))].sort();
    if (floors.length === 0) return ["1"];
    const matchesFilter = floors.some(f => {
      const sf = String(f).trim().toLowerCase();
      const tf = String(filterFloor).trim().toLowerCase();
      return sf === tf || sf === `floor ${tf}` || `floor ${sf}` === tf;
    });
    if (!matchesFilter && filterFloor) {
      return [filterFloor, ...floors];
    }
    return floors;
  }, [seats, filterFloor]);

  const uniqueRooms = useMemo(() => {
    let rooms = [...new Set(seats.filter(s => {
      const sf = String(s.floor || "").trim().toLowerCase();
      const tf = String(filterFloor).trim().toLowerCase();
      return sf === tf || sf === `floor ${tf}` || `floor ${sf}` === tf;
    }).map(s => s.room).filter(Boolean))].sort();

    if (rooms.length === 0) return [filterRoom || "A1"];

    const matchesFilter = rooms.some(r => {
      const sr = String(r).trim().toLowerCase();
      const tr = String(filterRoom).trim().toLowerCase();
      return sr === tr || sr === `room ${tr}` || `room ${sr}` === tr;
    });

    if (!matchesFilter && filterRoom) {
      return [filterRoom, ...rooms];
    }
    return rooms;
  }, [seats, filterFloor, filterRoom]);

  const allUsedPrefixesMap = useMemo(() => {
    const map = {};
    seats.forEach(s => {
      const { prefix, num } = parseSeatParts(s.seat_number);
      if (!prefix) return;
      if (!map[prefix]) {
        map[prefix] = {
          count: 0,
          maxNum: 0,
          minNum: Infinity,
          existingNums: new Set(),
          sample: s.seat_number,
          floor: s.floor,
          room: s.room,
        };
      }
      map[prefix].count++;
      if (num > 0) {
        map[prefix].existingNums.add(num);
        if (num > map[prefix].maxNum) map[prefix].maxNum = num;
        if (num < map[prefix].minNum) map[prefix].minNum = num;
      }
    });
    return map;
  }, [seats]);

  const unusedPrefixesList = useMemo(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return letters.filter(l => !allUsedPrefixesMap[l]);
  }, [allUsedPrefixesMap]);

  const genPreview = useMemo(() => {
    const parsedStart = parseInt(genStart, 10);
    const startNum = !isNaN(parsedStart) && parsedStart >= 1 ? parsedStart : 0;
    const countNum = parseInt(genCount, 10) || 0;
    const prefixUp = (genPrefix || "").replace(/[^a-zA-Z]/g, "").toUpperCase().trim();
    const endNum = countNum > 0 && startNum >= 1 ? startNum + countNum - 1 : startNum;
    const isValid = countNum > 0 && countNum <= 200 && prefixUp.length > 0 && startNum >= 1;

    const existingGroup = allUsedPrefixesMap[prefixUp] || null;
    const nextAvailableStart = existingGroup ? existingGroup.maxNum + 1 : 1;
    const overlappingSeats = [];
    if (isValid && existingGroup) {
      for (let n = startNum; n <= endNum; n++) {
        if (existingGroup.existingNums.has(n)) {
          overlappingSeats.push(`${prefixUp}${n}`);
        }
      }
    }
    const hasOverlap = overlappingSeats.length > 0;
    return { startNum, countNum, prefixUp, endNum, isValid, existingGroup, nextAvailableStart, overlappingSeats, hasOverlap };
  }, [genStart, genCount, genPrefix, allUsedPrefixesMap]);

  const handleGenPrefixChange = (val) => {
    const clean = String(val || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
    setGenPrefix(clean);
    const existing = allUsedPrefixesMap[clean];
    if (existing) {
      setGenStart(String(existing.maxNum + 1));
    } else {
      setGenStart("1");
    }
  };

  const handleOpenGenModal = () => {
    const firstUnused = unusedPrefixesList.length > 0 ? unusedPrefixesList[0] : "A";
    const existing = allUsedPrefixesMap[firstUnused];
    setGenPrefix(firstUnused);
    setGenStart(existing ? String(existing.maxNum + 1) : "1");
    if (filterFloor && filterFloor !== "all") {
      setGenFloor(filterFloor);
    }
    if (filterRoom && filterRoom !== "all") {
      setGenRoom(filterRoom);
    }
    setShowGenModal(true);
  };

  const handleBulkGenerate = async () => {
    const start = parseInt(genStart, 10);
    const count = parseInt(genCount, 10);
    if (!genStart || !genCount || isNaN(start) || isNaN(count) || start < 1) { showToast("Enter valid start and count", "error"); return; }
    if (count <= 0) { showToast("Count must be at least 1", "error"); return; }
    if (count > 200) { showToast("Max 200 seats at once", "error"); return; }
    const prefix = genPrefix.replace(/[^a-zA-Z]/g, "").trim().toUpperCase();
    if (!prefix) { showToast("Enter a seat prefix", "error"); return; }
    if (!genFloor.trim()) { showToast("Select or add a floor", "error"); return; }
    if (!genRoom.trim()) { showToast("Select or add a room", "error"); return; }
    if (genPreview.hasOverlap) {
      showToast(`Seat(s) ${genPreview.overlappingSeats.slice(0, 3).join(", ")} already exist. Start from ${prefix}${genPreview.nextAvailableStart}.`, "error");
      return;
    }
    const generated = [];
    for (let i = 0; i < count; i++) generated.push(`${prefix}${start + i}`);
    setGenerating(true);
    try {
      const payload = { seats: generated, floor: genFloor.trim(), room: genRoom.trim() };
      const res = await api.post("/seats/bulk", payload);
      showToast(res.data.message || `Generated ${generated.length} seats`);
      setShowGenModal(false);
      setGenPrefix("A"); setGenStart("1"); setGenCount("50");
      setGenSeatType("Regular");
      setShowNewFloor(false); setNewFloorName(""); setShowNewRoom(false); setNewRoomName("");
      fetchSeats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to generate seats", "error");
    } finally { setGenerating(false); }
  };

  const handleToggleActive = async (seat) => {
    if (seat.is_active !== false && (seat.is_occupied || (seat.occupied_shifts && seat.occupied_shifts.length > 0))) {
      showToast("Allocated seat cannot be disabled. It is currently assigned to a student.", "error");
      return;
    }
    setActionLoading(seat.id);
    try {
      const res = await api.patch(`/seats/${seat.id}/toggle-active`);
      showToast(res.data.message);
      const newActive = res.data.data?.is_active;
      setSelectedSeat(prev => prev && prev.id === seat.id ? { ...prev, is_active: newActive } : null);
      fetchSeats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to toggle seat", "error");
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (seat) => {
    if (!window.confirm(`Delete seat ${seat.seat_number}? This cannot be undone.`)) return;
    setActionLoading(seat.id);
    try {
      await api.delete(`/seats/${seat.id}`);
      showToast(`Seat ${seat.seat_number} deleted and seats renumbered`);
      setSelectedSeat(null);
      fetchSeats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete seat", "error");
    } finally { setActionLoading(null); }
  };

  const handleRenumber = async () => {
    if (!window.confirm("This will renumber all seats sequentially (A1, A2, A3...). Continue?")) return;
    setActionLoading("renumber");
    try {
      const res = await api.post("/seats/renumber");
      showToast(res.data.message || "Seats renumbered");
      fetchSeats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to renumber seats", "error");
    } finally { setActionLoading(null); }
  };

  const toggleSeatSelect = (seatId) => {
    setSelectedSeatIds(prev =>
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    );
  };

  const handleBulkDelete = async () => {
    const occupied = selectedSeatIds.filter(id => {
      const s = seats.find(seat => seat.id === id);
      return s && s.is_occupied;
    });
    if (occupied.length > 0) {
      showToast(`${occupied.length} selected seat(s) are occupied and cannot be deleted`, "error");
      return;
    }
    if (!window.confirm(`Delete ${selectedSeatIds.length} seat(s)? This cannot be undone.`)) return;
    setActionLoading("bulk-delete");
    try {
      const res = await api.post("/seats/delete-bulk", { seat_ids: selectedSeatIds });
      showToast(res.data.message || `${selectedSeatIds.length} seats deleted`);
      setSelectedSeatIds([]);
      setDeleteMode(false);
      fetchSeats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete seats", "error");
    } finally { setActionLoading(null); }
  };

  const totalCount = seats.length;
  const occupiedCount = seats.filter(s => s.is_occupied).length;
  const availableCount = seats.filter(s => !s.is_occupied && s.is_active !== false).length;
  const inactiveCount = seats.filter(s => s.is_active === false).length;
  const occupancyPct = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;

  const filteredSeats = seats.filter(s => {
    const matchStatus =
      filter === "all" ? true :
      filter === "available" ? (!s.is_occupied && s.is_active !== false) :
      filter === "occupied" ? s.is_occupied :
      filter === "inactive" ? s.is_active === false : true;

    const sf = String(s.floor || "").trim().toLowerCase();
    const tf = String(filterFloor || "").trim().toLowerCase();
    const matchFloor = filterFloor === "all" || !filterFloor ? true : (
      sf === tf || sf === `floor ${tf}` || `floor ${sf}` === tf
    );

    const sr = String(s.room || "").trim().toLowerCase();
    const tr = String(filterRoom || "").trim().toLowerCase();
    const matchRoom = filterRoom === "all" || !filterRoom ? true : (
      sr === tr || sr === `room ${tr}` || `room ${sr}` === tr
    );

    const matchSearch = search === "" || (s.seat_number || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchFloor && matchRoom && matchSearch;
  });

  const seatGroups = useMemo(() => {
    const groups = {};
    filteredSeats.forEach(seat => {
      const { prefix } = parseSeatParts(seat.seat_number);
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(seat);
    });
    const sorted = {};
    Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .forEach(k => {
        sorted[k] = [...groups[k]].sort((a, b) => {
          const pa = parseSeatParts(a.seat_number);
          const pb = parseSeatParts(b.seat_number);
          if (pa.num !== pb.num) return pa.num - pb.num;
          return String(a.seat_number || "").localeCompare(String(b.seat_number || ""));
        });
      });
    return sorted;
  }, [filteredSeats]);

  const getSeatColor = (seat) => {
    if (seat.is_active === false) {
      return {
        bg: darkMode ? "#1e293b" : "#f1f5f9",
        border: darkMode ? "#475569" : "#94a3b8",
        color: darkMode ? "#94a3b8" : "#64748b",
        label: "Inactive"
      };
    }
    
    const activeShifts = seat.occupied_shifts || [];
    const count = activeShifts.length;

    if (count === 0) {
      return {
        bg: darkMode ? "rgba(34,197,94,0.12)" : "#f0fdf4",
        border: "#22c55e",
        color: "#16a34a",
        label: "Available"
      };
    }
    
    if (count === 1) {
      return {
        bg: darkMode ? "rgba(139,92,246,0.12)" : "#f5f3ff",
        border: "#8b5cf6",
        color: "#7c3aed",
        label: "1 shift"
      };
    }

    if (count === 2) {
      return {
        bg: darkMode ? "rgba(59,130,246,0.12)" : "#eff6ff",
        border: "#3b82f6",
        color: "#2563eb",
        label: "2 shifts"
      };
    }
    
    if (count === 3) {
      return {
        bg: darkMode ? "rgba(239,68,68,0.12)" : "#fef2f2",
        border: "#ef4444",
        color: "#dc2626",
        label: "3 shifts"
      };
    }

    // count >= 4 (Full Shift)
    return {
      bg: darkMode ? "rgba(249,115,22,0.12)" : "#fff7ed",
      border: "#f97316",
      color: "#ea580c",
      label: "4 shifts (Full Shift)"
    };
  };

  const getSectionColor = (section) => {
    if (!section) return { bg: darkMode ? "#1e293b" : "#ffffff", border: darkMode ? "#334155" : "#e2e8f0", labelBg: darkMode ? "#334155" : "#f1f5f9" };
    const s = section.toUpperCase();
    if (s === "A") return { bg: darkMode ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.04)", border: darkMode ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.2)", labelBg: darkMode ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)" };
    if (s === "B") return { bg: darkMode ? "rgba(139,92,246,0.06)" : "rgba(139,92,246,0.04)", border: darkMode ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.2)", labelBg: darkMode ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.1)" };
    return { bg: darkMode ? "rgba(236,72,153,0.06)" : "rgba(236,72,153,0.04)", border: darkMode ? "rgba(236,72,153,0.3)" : "rgba(236,72,153,0.2)", labelBg: darkMode ? "rgba(236,72,153,0.2)" : "rgba(236,72,153,0.1)" };
  };

  const card = darkMode ? "#1e293b" : "#FCFBF9";
  const border = darkMode ? "#334155" : "#e2e8f0";
  const textPrimary = darkMode ? "#f1f5f9" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const pageBg = darkMode ? "#0f172a" : "#f1f5f9";
  const inputBg = darkMode ? "#0f172a" : "#FCFBF9";

  const selectStyle = {
    background: card, color: textPrimary, border: `1px solid ${border}`, borderRadius: "8px",
    padding: "7px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer", outline: "none",
  };

  return (
    <div className="page" style={{ background: pageBg, minHeight: "100vh" }}>
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "error" ? "#ef4444" : "#22c55e",
          color: "#fff", padding: "12px 20px", borderRadius: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)", fontSize: "14px", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "10px", minWidth: "220px",
          animation: "slideIn 0.2s ease",
        }}>
          {toast.type === "error" ? <FaTimes style={{ color: "#ef4444" }} /> : <FaCheckCircle style={{ color: "#22c55e" }} />} {toast.msg}
        </div>
      )}

      {hoveredSeat && (
        <div style={{
          position: "fixed", left: computedTooltipPos.left, top: computedTooltipPos.top,
          zIndex: 9998, background: darkMode ? "#0f172a" : "#fff",
          border: `1px solid ${border}`, borderRadius: "12px", padding: "14px 18px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)", minWidth: "240px", maxWidth: "340px",
          pointerEvents: "none", transition: "opacity 0.15s",
        }}>
          <div style={{ fontSize: "15px", fontWeight: 800, color: textPrimary, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <FaChair style={{ fontSize: "13px" }} /> {hoveredSeat.seat_number}
            {hoveredSeat.is_active === false && <span style={{ fontSize: "10px", background: darkMode ? "#334155" : "#e2e8f0", color: textMuted, padding: "2px 8px", borderRadius: "4px" }}>INACTIVE</span>}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
            {hoveredSeat.floor && <span style={{ fontSize: "11px", background: darkMode ? "#334155" : "#f1f5f9", color: textMuted, padding: "2px 8px", borderRadius: "4px" }}>Floor: {hoveredSeat.floor}</span>}
            {hoveredSeat.room && <span style={{ fontSize: "11px", background: darkMode ? "#334155" : "#f1f5f9", color: textMuted, padding: "2px 8px", borderRadius: "4px" }}>Room: {hoveredSeat.room}</span>}
            {hoveredSeat.section && <span style={{ fontSize: "11px", background: darkMode ? "#334155" : "#f1f5f9", color: textMuted, padding: "2px 8px", borderRadius: "4px" }}>Section: {hoveredSeat.section}</span>}
          </div>
          {hoveredSeat.occupied_shifts && hoveredSeat.occupied_shifts.length > 0 ? (
            <div style={{ borderTop: `1px solid ${border}`, paddingTop: "8px", marginTop: "4px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Allocated Shifts ({hoveredSeat.occupied_shifts.length})
              </div>
              {hoveredSeat.occupied_shifts.map((o, i) => (
                <div key={i} style={{ fontSize: "12px", color: textPrimary, marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                  <span>
                    <span style={{ fontWeight: 700 }}>{o.student_name}</span>
                    <span style={{ color: textMuted, marginLeft: "4px" }}>({o.student_code})</span>
                  </span>
                  <span style={{ color: textMuted, fontSize: "11px" }}>
                    {o.shift_name} · {formatTime(o.start_time, timeFormat)} - {formatTime(o.end_time, timeFormat)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ borderTop: `1px solid ${border}`, paddingTop: "8px", marginTop: "4px", fontSize: "12px", color: textMuted, fontStyle: "italic" }}>
              No shifts allocated
            </div>
          )}
        </div>
      )}

      <div className="page-title-row">
        <div>
          <h1>Seats Control</h1>
          <p>Generate and manage library seats.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary-btn" onClick={handleRenumber} disabled={actionLoading === "renumber"} style={{ color: "#f59e0b", display: "flex", alignItems: "center", gap: "6px" }}>
            {actionLoading === "renumber" ? "Renumbering..." : <><FaHashtag /> Renumber</>}
          </button>
          <button
            className="secondary-btn"
            data-delete-control="true"
            onClick={() => {
              setDeleteMode(prev => !prev);
              setSelectedSeatIds([]);
              setSelectedSeat(null);
            }}
            style={{ color: deleteMode ? "#fff" : "#ef4444", background: deleteMode ? "#ef4444" : undefined, border: deleteMode ? "none" : undefined, display: "flex", alignItems: "center", gap: "6px" }}
          >
            {deleteMode ? <><FaTimes /> Cancel Delete</> : <><FaTrash /> Delete Seats</>}
          </button>
          <button className="primary-btn" onClick={handleOpenGenModal} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaBolt /> Add Seats (Batch)
          </button>
        </div>
      </div>

      <div className="seats-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "Total Seats", value: totalCount, color: "#3b82f6", bg: darkMode ? "rgba(59,130,246,0.12)" : "#eff6ff", border: "rgba(59,130,246,0.25)", icon: <FaChair style={{ color: "#3b82f6" }} /> },
          { label: "Available", value: availableCount, color: "#22c55e", bg: darkMode ? "rgba(34,197,94,0.12)" : "#f0fdf4", border: "rgba(34,197,94,0.25)", icon: <FaCheckCircle style={{ color: "#22c55e" }} /> },
          { label: "Occupied", value: occupiedCount, color: "#ef4444", bg: darkMode ? "rgba(239,68,68,0.12)" : "#fef2f2", border: "rgba(239,68,68,0.25)", icon: <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} /> },
          { label: "Inactive", value: inactiveCount, color: "#94a3b8", bg: darkMode ? "rgba(148,163,184,0.12)" : "#f8fafc", border: "rgba(148,163,184,0.25)", icon: <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#94a3b8" }} /> },
        ].map(item => (
          <div key={item.label} className="seats-stat-card" style={{
            background: item.bg, borderRadius: "14px", padding: "18px 20px",
            border: `1px solid ${item.border}`, display: "flex", alignItems: "center", gap: "14px",
          }}>
            <div style={{ fontSize: "26px" }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
              <div style={{ fontSize: "12px", color: textMuted, fontWeight: 600, marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {totalCount > 0 && (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "12px", padding: "16px 20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: textPrimary }}>Occupancy Rate</span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: occupancyPct > 80 ? "#ef4444" : occupancyPct > 50 ? "#f59e0b" : "#22c55e" }}>
              {occupancyPct}%
            </span>
          </div>
          <div style={{ background: darkMode ? "#334155" : "#e2e8f0", borderRadius: "999px", height: "10px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "999px", width: `${occupancyPct}%`, transition: "width 0.5s ease",
              background: occupancyPct > 80 ? "linear-gradient(90deg,#ef4444,#dc2626)"
                : occupancyPct > 50 ? "linear-gradient(90deg,#f59e0b,#d97706)"
                : "linear-gradient(90deg,#22c55e,#16a34a)",
            }} />
          </div>
          <div style={{ fontSize: "12px", color: textMuted, marginTop: "6px" }}>
            {occupiedCount} of {totalCount} seats occupied · {availableCount} available
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap", alignItems: "center" }}>
        {["all", "available", "occupied", "inactive"].map(f => (
          <button key={f} data-seat-filter="true" onClick={() => setFilter(f)} style={{
            padding: "7px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            border: `2px solid ${filter === f ? "#3b82f6" : border}`,
            background: filter === f ? "#eff6ff" : card,
            color: filter === f ? "#2563eb" : textMuted,
            transition: "all 0.15s", textTransform: "capitalize",
          }}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        {deleteMode && (
          <div data-delete-control="true" style={{ marginLeft: "auto", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button onClick={() => setSelectedSeatIds(filteredSeats.filter(s => !s.is_occupied).map(s => s.id))} style={{
              padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              border: `2px solid ${border}`, background: card, color: textMuted, transition: "all 0.15s",
            }}>
              Select Available
            </button>
            {selectedSeatIds.length > 0 && (
              <button onClick={() => setSelectedSeatIds([])} style={{
                padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                border: "2px solid #ef4444", background: darkMode ? "rgba(239,68,68,0.12)" : "#fef2f2", color: "#ef4444", transition: "all 0.15s",
              }}>
                Clear ({selectedSeatIds.length})
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "14px", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: "12px", color: textMuted, marginBottom: "4px", fontWeight: "600" }}>Floor</label>
          <select data-seat-filter="true" value={filterFloor} onChange={e => {
            const newFloor = e.target.value;
            setFilterFloor(newFloor);
            const roomsForNewFloor = [...new Set(seats.filter(s => {
              const sf = String(s.floor || "").trim().toLowerCase();
              const tf = String(newFloor).trim().toLowerCase();
              return sf === tf || sf === `floor ${tf}` || `floor ${sf}` === tf;
            }).map(s => s.room).filter(Boolean))].sort();
            setFilterRoom(roomsForNewFloor[0] || "A1");
          }} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: inputBg, color: textPrimary, fontSize: "14px", fontWeight: "600", outline: "none", boxSizing: "border-box", cursor: "pointer" }}>
            {uniqueFloors.map(f => (
              <option key={f} value={f}>{f.toLowerCase().includes("floor") ? f : `Floor ${f}`}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: "12px", color: textMuted, marginBottom: "4px", fontWeight: "600" }}>Room</label>
          <select data-seat-filter="true" value={filterRoom} onChange={e => setFilterRoom(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: inputBg, color: textPrimary, fontSize: "14px", fontWeight: "600", outline: "none", boxSizing: "border-box", cursor: "pointer" }}>
            {uniqueRooms.map(r => (
              <option key={r} value={r}>{r.toLowerCase().includes("room") ? r : `Room ${r}`}</option>
            ))}
          </select>
        </div>
        <div data-seat-filter="true" style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: card, border: `1px solid ${border}`, borderRadius: "10px",
          padding: "7px 14px", flex: 1, maxWidth: "260px",
        }}>
          <FaSearch style={{ color: textMuted, fontSize: "13px" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search seat number..."
            style={{ border: "none", outline: "none", background: "transparent", fontSize: "14px", color: textPrimary, width: "100%" }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              title="Clear search"
              style={{ border: "none", background: "transparent", color: textMuted, cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }}
            >
              <FaTimes />
            </button>
          )}
        </div>
        <span style={{ fontSize: "13px", color: textMuted, marginLeft: "auto" }}>
          Showing {filteredSeats.length} of {totalCount} seats
        </span>
      </div>

      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "14px", padding: "20px" }}>
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px", fontSize: "12px", flexWrap: "wrap" }}>
          {[
            { label: "0 shifts (Vacant)", bg: darkMode ? "rgba(34,197,94,0.12)" : "#f0fdf4", border: "#22c55e", color: "#16a34a" },
            { label: "1 shift booked", bg: darkMode ? "rgba(139,92,246,0.12)" : "#f5f3ff", border: "#8b5cf6", color: "#7c3aed" },
            { label: "2 shifts booked", bg: darkMode ? "rgba(59,130,246,0.12)" : "#eff6ff", border: "#3b82f6", color: "#2563eb" },
            { label: "3 shifts booked", bg: darkMode ? "rgba(239,68,68,0.12)" : "#fef2f2", border: "#ef4444", color: "#dc2626" },
            { label: "4 shifts (Full Shift) booked", bg: darkMode ? "rgba(249,115,22,0.12)" : "#fff7ed", border: "#f97316", color: "#ea580c" },
            { label: "Inactive seat", bg: darkMode ? "#1e293b" : "#f1f5f9", border: darkMode ? "#475569" : "#94a3b8", color: darkMode ? "#94a3b8" : "#64748b" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "14px", height: "14px", background: l.bg, border: `2px solid ${l.border}`, borderRadius: "4px" }} />
              <span style={{ color: textMuted, fontWeight: 600 }}>{l.label}</span>
            </div>
          ))}
          <span style={{ color: textMuted, marginLeft: "auto", fontStyle: "italic" }}>Hover for details · Click to select</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: textMuted }}>Loading seats...</div>
        ) : filteredSeats.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>&#128186;</div>
            <div style={{ color: textMuted, fontSize: "15px" }}>{totalCount === 0 ? "No seats yet. Generate some above!" : "No seats match your filter."}</div>
          </div>
        ) : (
          <div>
            {Object.entries(seatGroups).map(([rowLetter, rowSeats]) => {
              const hasSections = rowSeats.some(s => s.section);
              if (hasSections) {
                const sectionGroups = {};
                rowSeats.forEach(seat => {
                  const sec = (seat.section || "OTHER").toUpperCase();
                  if (!sectionGroups[sec]) sectionGroups[sec] = [];
                  sectionGroups[sec].push(seat);
                });
                return (
                  <div key={rowLetter} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ background: darkMode ? "#334155" : "#e2e8f0", padding: "2px 10px", borderRadius: "6px" }}>{rowLetter} Row</span>
                    </div>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      {Object.entries(sectionGroups).map(([sec, secSeats]) => {
                        const sc = getSectionColor(sec);
                        return (
                          <div key={sec} style={{
                            background: sc.bg, border: `2px solid ${sc.border}`, borderRadius: "12px",
                            padding: "12px", flex: 1, minWidth: "200px",
                          }}>
                            <div style={{
                              fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px",
                              color: sc.border, marginBottom: "10px", padding: "3px 10px", background: sc.labelBg,
                              borderRadius: "6px", display: "inline-block",
                            }}>
                              Section {sec}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: "6px" }}>
                              {secSeats.map(seat => {
                                const s = getSeatColor(seat);
                                const isSelected = selectedSeat?.id === seat.id;
                                const isMultiSelected = selectedSeatIds.includes(seat.id);
                                const isLoading = actionLoading === seat.id;
                                return (
                                  <div
                                    key={seat.id}
                                    data-seat-item="true"
                                    onClick={() => {
                                      if (deleteMode) { toggleSeatSelect(seat.id); }
                                      else { setSelectedSeat(isSelected ? null : seat); }
                                    }}
                                    onMouseEnter={e => { setHoveredSeat(seat); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                                    onMouseMove={e => setTooltipPos({ x: e.clientX, y: e.clientY })}
                                    onMouseLeave={() => setHoveredSeat(null)}
                                    style={{
                                      height: "56px", borderRadius: "8px", display: "flex", flexDirection: "column",
                                      alignItems: "center", justifyContent: "center", gap: "2px", position: "relative",
                                      background: isSelected ? (darkMode ? "#1d4ed8" : "#2563eb") : deleteMode && isMultiSelected ? (darkMode ? "rgba(239,68,68,0.22)" : "#fef2f2") : s.bg,
                                      border: `2px solid ${isSelected ? "#2563eb" : deleteMode && isMultiSelected ? "#ef4444" : s.border}`,
                                      color: isSelected ? "#fff" : deleteMode && isMultiSelected ? (darkMode ? "#fca5a5" : "#ef4444") : s.color,
                                      cursor: "pointer", transition: "all 0.15s",
                                      opacity: isLoading ? 0.5 : 1,
                                      transform: isSelected ? "scale(1.08)" : "scale(1)",
                                      boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.4)" : deleteMode && isMultiSelected ? "0 2px 8px rgba(239,68,68,0.3)" : "none",
                                    }}
                                  >
                                    {deleteMode && (
                                      <div style={{
                                        position: "absolute", top: "3px", right: "3px",
                                        width: "15px", height: "15px", borderRadius: "4px",
                                        background: isMultiSelected ? "#ef4444" : (darkMode ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)"),
                                        border: `1.5px solid ${isMultiSelected ? "#ef4444" : (darkMode ? "#94a3b8" : "#64748b")}`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "8px", color: "#fff", fontWeight: 700,
                                      }}>
                                        {isMultiSelected && <FaCheck style={{ fontSize: "8px" }} />}
                                      </div>
                                    )}
                                    <FaChair style={{ fontSize: "13px" }} />
                                    <span style={{ fontSize: "10px", fontWeight: 700 }}>{seat.seat_number}</span>
                                    {seat.is_active === false && <span style={{ fontSize: "8px", opacity: 0.7 }}>OFF</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return (
                <div key={rowLetter} style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ background: darkMode ? "#334155" : "#e2e8f0", padding: "2px 10px", borderRadius: "6px" }}>{rowLetter} Row</span>
                    <span style={{ fontSize: "11px", fontWeight: 500, color: textMuted }}>({rowSeats.length} seats)</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: "6px" }}>
                    {rowSeats.map(seat => {
                      const s = getSeatColor(seat);
                      const isSelected = selectedSeat?.id === seat.id;
                      const isMultiSelected = selectedSeatIds.includes(seat.id);
                      const isLoading = actionLoading === seat.id;
                      return (
                        <div
                          key={seat.id}
                          data-seat-item="true"
                          onClick={() => {
                            if (deleteMode) { toggleSeatSelect(seat.id); }
                            else { setSelectedSeat(isSelected ? null : seat); }
                          }}
                          onMouseEnter={e => { setHoveredSeat(seat); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                          onMouseMove={e => setTooltipPos({ x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setHoveredSeat(null)}
                          style={{
                            height: "56px", borderRadius: "8px", display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center", gap: "2px", position: "relative",
                            background: isSelected ? (darkMode ? "#1d4ed8" : "#2563eb") : deleteMode && isMultiSelected ? (darkMode ? "rgba(239,68,68,0.22)" : "#fef2f2") : s.bg,
                            border: `2px solid ${isSelected ? "#2563eb" : deleteMode && isMultiSelected ? "#ef4444" : s.border}`,
                            color: isSelected ? "#fff" : deleteMode && isMultiSelected ? (darkMode ? "#fca5a5" : "#ef4444") : s.color,
                            cursor: "pointer", transition: "all 0.15s",
                            opacity: isLoading ? 0.5 : 1,
                            transform: isSelected ? "scale(1.08)" : "scale(1)",
                            boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.4)" : deleteMode && isMultiSelected ? "0 2px 8px rgba(239,68,68,0.3)" : "none",
                          }}
                        >
                          {deleteMode && (
                            <div style={{
                              position: "absolute", top: "3px", right: "3px",
                              width: "15px", height: "15px", borderRadius: "4px",
                              background: isMultiSelected ? "#ef4444" : (darkMode ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)"),
                              border: `1.5px solid ${isMultiSelected ? "#ef4444" : (darkMode ? "#94a3b8" : "#64748b")}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "8px", color: "#fff", fontWeight: 700,
                            }}>
                              {isMultiSelected && <FaCheck style={{ fontSize: "8px" }} />}
                            </div>
                          )}
                          <FaChair style={{ fontSize: "13px" }} />
                          <span style={{ fontSize: "10px", fontWeight: 700 }}>{seat.seat_number}</span>
                          {seat.is_active === false && <span style={{ fontSize: "8px", opacity: 0.7 }}>OFF</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedSeat && !deleteMode && (
        <div
          data-seat-bar="true"
          className="seats-floating-bar"
          style={{
            position: "fixed", left: "50%", transform: "translateX(-50%)",
            background: darkMode ? "#1e293b" : "#fff",
            border: `1px solid ${border}`,
            borderRadius: "16px", padding: "18px 24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", gap: "20px",
            maxWidth: "95vw", minWidth: 0, flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: textPrimary }}>Seat {selectedSeat.seat_number}</div>
            <div style={{ fontSize: "13px", color: textMuted }}>
              {selectedSeat.is_occupied
                ? `Occupied · ${selectedSeat.occupied_by?.map(o => o.student_name).join(", ") || selectedSeat.occupied_shifts?.map(o => o.student_name).join(", ")}`
                : selectedSeat.is_active === false ? "Inactive" : "Available"}
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
              {selectedSeat.floor && <span style={{ fontSize: "11px", background: darkMode ? "#334155" : "#f1f5f9", color: textMuted, padding: "2px 8px", borderRadius: "4px" }}>{selectedSeat.floor}</span>}
              {selectedSeat.room && <span style={{ fontSize: "11px", background: darkMode ? "#334155" : "#f1f5f9", color: textMuted, padding: "2px 8px", borderRadius: "4px" }}>Room {selectedSeat.room}</span>}
              {selectedSeat.section && <span style={{ fontSize: "11px", background: darkMode ? "#334155" : "#f1f5f9", color: textMuted, padding: "2px 8px", borderRadius: "4px" }}>Sec {selectedSeat.section}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginLeft: "auto", flexWrap: "wrap" }}>
            {selectedSeat.is_occupied || (selectedSeat.occupied_shifts && selectedSeat.occupied_shifts.length > 0) ? (
              <button
                disabled={true}
                title="Allocated seat cannot be disabled while assigned to a student"
                style={{
                  padding: "9px 18px", borderRadius: "9px", border: "none",
                  cursor: "not-allowed",
                  background: darkMode ? "#334155" : "#cbd5e1",
                  color: darkMode ? "#94a3b8" : "#64748b",
                  fontWeight: 700, fontSize: "13px",
                  display: "flex", alignItems: "center", gap: "7px",
                  opacity: 0.7,
                }}
              >
                <FaToggleOff /> Disable (Allocated)
              </button>
            ) : (
              <button
                onClick={() => handleToggleActive(selectedSeat)}
                disabled={actionLoading === selectedSeat.id}
                style={{
                  padding: "9px 18px", borderRadius: "9px", border: "none", cursor: "pointer",
                  background: selectedSeat.is_active === false ? "#22c55e" : "#f59e0b",
                  color: "#fff", fontWeight: 700, fontSize: "13px",
                  display: "flex", alignItems: "center", gap: "7px",
                }}
              >
                {selectedSeat.is_active === false ? <><FaToggleOn /> Enable</> : <><FaToggleOff /> Disable</>}
              </button>
            )}
            {!selectedSeat.is_occupied && (
              <button
                onClick={() => handleDelete(selectedSeat)}
                disabled={actionLoading === selectedSeat.id}
                style={{
                  padding: "9px 18px", borderRadius: "9px", border: "none", cursor: "pointer",
                  background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: "13px",
                  display: "flex", alignItems: "center", gap: "7px",
                }}
              >
                <FaTrash style={{ fontSize: "11px" }} /> Delete
              </button>
            )}
            <button onClick={() => setSelectedSeat(null)} style={{
              padding: "9px 12px", borderRadius: "9px", cursor: "pointer",
              background: "transparent", border: `1px solid ${border}`, color: textMuted,
            }}>
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {deleteMode && (
        <div
          data-delete-control="true"
          className="seats-floating-bar"
          style={{
            position: "fixed", left: "50%", transform: "translateX(-50%)",
            background: darkMode ? "#1e293b" : "#fff",
            border: `1.5px solid ${selectedSeatIds.length > 0 ? "#ef4444" : border}`,
            borderRadius: "16px", padding: "14px 20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
            display: "flex", alignItems: "center", gap: "16px",
            maxWidth: "95vw", minWidth: 0, flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "10px",
              background: darkMode ? "rgba(239,68,68,0.18)" : "#fef2f2",
              color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", flexShrink: 0,
            }}>
              <FaTrash />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: textPrimary }}>
                {selectedSeatIds.length > 0
                  ? `${selectedSeatIds.length} seat(s) selected`
                  : "Select seats to delete"}
              </div>
              <div style={{ fontSize: "11px", color: textMuted }}>
                Tap seats to select · Click outside or Cancel to close
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginLeft: "auto", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setSelectedSeatIds(filteredSeats.filter(s => !s.is_occupied).map(s => s.id))}
              style={{
                padding: "8px 14px", borderRadius: "9px",
                border: `1px solid ${border}`,
                background: darkMode ? "#0f172a" : "#f8fafc",
                color: textPrimary, fontWeight: 600, fontSize: "12.5px", cursor: "pointer",
              }}
            >
              Select Available
            </button>
            {selectedSeatIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSeatIds([])}
                style={{
                  padding: "8px 12px", borderRadius: "9px",
                  border: "1px solid #fecaca",
                  background: darkMode ? "rgba(239,68,68,0.12)" : "#fef2f2",
                  color: "#ef4444", fontWeight: 600, fontSize: "12.5px", cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={actionLoading === "bulk-delete" || selectedSeatIds.length === 0}
              title={selectedSeatIds.length === 0 ? "Select at least one seat to delete" : "Delete selected seats"}
              style={{
                padding: "8px 16px", borderRadius: "9px", border: "none",
                cursor: selectedSeatIds.length === 0 ? "not-allowed" : "pointer",
                background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: "13px",
                display: "flex", alignItems: "center", gap: "6px",
                opacity: selectedSeatIds.length === 0 ? 0.45 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <FaTrash style={{ fontSize: "11px" }} />{" "}
              {actionLoading === "bulk-delete"
                ? "Deleting..."
                : selectedSeatIds.length > 0
                  ? `Delete Selected (${selectedSeatIds.length})`
                  : "Delete Selected"}
            </button>
            <button
              type="button"
              onClick={() => { setDeleteMode(false); setSelectedSeatIds([]); }}
              style={{
                padding: "8px 14px", borderRadius: "9px", cursor: "pointer",
                background: "transparent", border: `1px solid ${border}`, color: textMuted,
                fontWeight: 600, fontSize: "12.5px", display: "flex", alignItems: "center", gap: "5px",
              }}
            >
              <FaTimes style={{ fontSize: "11px" }} /> Cancel
            </button>
          </div>
        </div>
      )}

      {showGenModal && (
        <div onClick={() => setShowGenModal(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: card, border: `1px solid ${border}`, borderRadius: "18px",
            padding: "32px", width: "95vw", maxWidth: "520px", boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: textPrimary, margin: 0 }}>+ Add Seats (Batch Builder)</h2>
              </div>
              <button onClick={() => setShowGenModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: "18px" }}>
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="responsive-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted, marginBottom: "6px", display: "block" }}>Prefix</label>
                  <input
                    type="text" maxLength={4}
                    value={genPrefix} onChange={e => handleGenPrefixChange(e.target.value)}
                    placeholder="A"
                    style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", width: "100%", boxSizing: "border-box", textTransform: "uppercase" }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted, marginBottom: "6px", display: "block" }}>Start #</label>
                  <input type="number" min="1" value={genStart} onChange={e => setGenStart(e.target.value)}
                    placeholder="1"
                    style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted, marginBottom: "6px", display: "block" }}>Count</label>
                  <input type="number" min="1" max="200" value={genCount} onChange={e => setGenCount(e.target.value)}
                    placeholder="50"
                    style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>

              {Object.keys(allUsedPrefixesMap).length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: textMuted }}>Continue row:</span>
                  {Object.keys(allUsedPrefixesMap).sort((a, b) => a.localeCompare(b)).map(pfx => {
                    const info = allUsedPrefixesMap[pfx];
                    const nextNum = info.maxNum + 1;
                    const isActive = genPreview.prefixUp === pfx;
                    return (
                      <button
                        key={pfx}
                        type="button"
                        onClick={() => handleGenPrefixChange(pfx)}
                        style={{
                          padding: "3px 9px",
                          borderRadius: "6px",
                          border: `1px solid ${isActive ? "#2563eb" : border}`,
                          background: isActive ? (darkMode ? "rgba(37,99,235,0.25)" : "#eff6ff") : (darkMode ? "#0f172a" : "#f8fafc"),
                          color: isActive ? "#2563eb" : textPrimary,
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {pfx} (from {pfx}{nextNum})
                      </button>
                    );
                  })}
                </div>
              )}

              {genPreview.isValid && (
                <div style={{
                  background: darkMode ? "rgba(59,130,246,0.1)" : "#eff6ff",
                  border: "1px solid rgba(59,130,246,0.3)", borderRadius: "10px", padding: "10px 14px",
                }}>
                  <div style={{ fontSize: "13px", color: "#2563eb", fontWeight: 600 }}>
                    Preview: {genPreview.prefixUp}{genPreview.startNum} → {genPreview.prefixUp}{genPreview.endNum}
                  </div>
                  {genPreview.existingGroup && !genPreview.hasOverlap && (
                    <div style={{ fontSize: "12px", color: darkMode ? "#93c5fd" : "#1d4ed8", marginTop: "4px" }}>
                      Existing prefix "{genPreview.prefixUp}" has {genPreview.existingGroup.count} seat(s) (up to {genPreview.prefixUp}{genPreview.existingGroup.maxNum}). Continuing from {genPreview.prefixUp}{genPreview.nextAvailableStart}.
                    </div>
                  )}
                </div>
              )}

              {genPreview.isValid && genPreview.hasOverlap && (
                <div style={{
                  background: darkMode ? "rgba(239,68,68,0.1)" : "#fef2f2",
                  border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 14px",
                }}>
                  <div style={{ fontSize: "13px", color: "#dc2626", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaExclamationTriangle /> Seat(s) already exist: {genPreview.overlappingSeats.slice(0, 5).join(", ")}{genPreview.overlappingSeats.length > 5 ? ` +${genPreview.overlappingSeats.length - 5} more` : ""}
                  </div>
                  <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontWeight: 500 }}>
                    Prefix "{genPreview.prefixUp}" already has seats up to {genPreview.prefixUp}{genPreview.existingGroup?.maxNum}. Start from {genPreview.prefixUp}{genPreview.nextAvailableStart} onwards.
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => setGenStart(String(genPreview.nextAvailableStart))}
                      style={{
                        padding: "5px 12px", borderRadius: "6px", border: "none",
                        background: "#2563eb", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer"
                      }}
                    >
                      Start from {genPreview.prefixUp}{genPreview.nextAvailableStart}
                    </button>
                    {unusedPrefixesList.slice(0, 6).map(letter => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => handleGenPrefixChange(letter)}
                        style={{
                          padding: "4px 10px", borderRadius: "6px", border: `1px solid ${border}`,
                          background: darkMode ? "#1e293b" : "#fff", color: textMuted, fontSize: "12px", fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        New: {letter}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="responsive-grid-1-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted, marginBottom: "4px", display: "block" }}>Seat Type</label>
                  <select
                    value={genSeatType} onChange={e => setGenSeatType(e.target.value)}
                    style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", width: "100%", boxSizing: "border-box", cursor: "pointer" }}
                  >
                    <option value="Regular">Regular</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted, marginBottom: "4px", display: "block" }}>Floor</label>
                  {showNewFloor ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input type="text" value={newFloorName} onChange={e => setNewFloorName(e.target.value)}
                        autoFocus placeholder="Floor name"
                        onKeyDown={e => { if (e.key === "Enter" && newFloorName.trim()) { const v = newFloorName.trim(); setGenFloor(v); const roomDefaults = { "1": "F1", "2": "S1", "3": "T3" }; setGenRoom(roomDefaults[v] || genRoom); setShowNewFloor(false); setNewFloorName(""); } if (e.key === "Escape") { setShowNewFloor(false); setNewFloorName(""); } }}
                        style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", flex: 1, boxSizing: "border-box" }} />
                      <button onClick={() => { if (newFloorName.trim()) { const v = newFloorName.trim(); setGenFloor(v); const roomDefaults = { "1": "F1", "2": "S1", "3": "T3" }; setGenRoom(roomDefaults[v] || genRoom); setShowNewFloor(false); setNewFloorName(""); } }}
                        style={{ padding: "10px 12px", borderRadius: "8px", border: "none", background: "#22c55e", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center" }}><FaCheck /></button>
                      <button onClick={() => { setShowNewFloor(false); setNewFloorName(""); }}
                        style={{ padding: "10px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: "transparent", color: textMuted, cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}><FaTimes /></button>
                    </div>
                  ) : (
                    <select value={genFloor} onChange={e => { if (e.target.value === "__new__") { setShowNewFloor(true); } else { const f = e.target.value; setGenFloor(f); const roomDefaults = { "1": "F1", "2": "S1", "3": "T3" }; setGenRoom(roomDefaults[f] || genRoom); } }}
                      style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", width: "100%", boxSizing: "border-box", cursor: "pointer" }}>
                      {allFloors.map(f => <option key={f} value={f}>{f}</option>)}
                      <option value="__new__">+ Add New Floor...</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: 600, color: textMuted, marginBottom: "4px", display: "block" }}>Room</label>
                {showNewRoom ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input type="text" value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
                      autoFocus placeholder="Room name"
                      onKeyDown={e => { if (e.key === "Enter" && newRoomName.trim()) { setGenRoom(newRoomName.trim()); setShowNewRoom(false); setNewRoomName(""); } if (e.key === "Escape") { setShowNewRoom(false); setNewRoomName(""); } }}
                      style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", flex: 1, boxSizing: "border-box" }} />
                    <button onClick={() => { if (newRoomName.trim()) { setGenRoom(newRoomName.trim()); setShowNewRoom(false); setNewRoomName(""); } }}
                      style={{ padding: "10px 12px", borderRadius: "8px", border: "none", background: "#22c55e", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center" }}><FaCheck /></button>
                    <button onClick={() => { setShowNewRoom(false); setNewRoomName(""); }}
                      style={{ padding: "10px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: "transparent", color: textMuted, cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}><FaTimes /></button>
                  </div>
                ) : (
                  <select value={genRoom} onChange={e => { if (e.target.value === "__new__") { setShowNewRoom(true); } else { setGenRoom(e.target.value); } }}
                    style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", width: "100%", boxSizing: "border-box", cursor: "pointer" }}>
                    {allRoomsForFloor.map(r => <option key={r} value={r}>{r}</option>)}
                    {genRoom && !allRoomsForFloor.includes(genRoom) && <option value={genRoom}>{genRoom} (current)</option>}
                    <option value="__new__">+ Add New Room...</option>
                  </select>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button className="secondary-btn" onClick={() => setShowGenModal(false)}>Cancel</button>
              <button
                className="primary-btn"
                onClick={handleBulkGenerate}
                disabled={generating || !genPreview.isValid || genPreview.hasOverlap}
                style={{ flex: 1, justifyContent: "center", opacity: (!genPreview.isValid || genPreview.hasOverlap) ? 0.5 : 1 }}
              >
                {generating ? "Generating..." : `Add ${genPreview.isValid ? genPreview.countNum : ""} Seats`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .seats-floating-bar {
          bottom: 24px;
          z-index: 1001;
        }
        @media (max-width: 768px) {
          .seats-floating-bar {
            bottom: 72px;
            width: calc(100vw - 24px);
            padding: 12px 14px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Seats;
