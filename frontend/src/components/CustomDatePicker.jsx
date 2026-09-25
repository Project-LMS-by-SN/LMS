import React, { useState, useEffect, useRef } from "react";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaTimes, FaCheck } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const padZero = (n) => String(n).padStart(2, "0");

const formatDateISO = (year, month, day) => {
  return `${year}-${padZero(month + 1)}-${padZero(day)}`;
};

export const CustomDatePicker = ({
  value,
  onChange,
  name,
  id,
  min,
  max,
  align = "auto",
  readOnly = false,
  disabled = false,
  placeholder = "Select date",
  required = false,
  style = {},
  className = "",
}) => {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial value (YYYY-MM-DD)
  const parseInitialDate = () => {
    if (value && typeof value === "string" && value.includes("-")) {
      const parts = value.split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    return new Date();
  };

  const initialDate = parseInitialDate();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-indexed
  const [alignRight, setAlignRight] = useState(false);

  // Auto-detect boundary overflow to flip alignment to right if needed
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popupWidth = 310;
      if (rect.left + popupWidth > window.innerWidth - 16) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [isOpen]);

  // When value prop changes, update view year/month
  useEffect(() => {
    if (value && typeof value === "string" && value.includes("-")) {
      const parts = value.split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day) => {
    if (readOnly || disabled) return;
    const dateStr = formatDateISO(viewYear, viewMonth, day);
    
    // Check min/max bounds
    if (min && dateStr < min) return;
    if (max && dateStr > max) return;

    if (onChange) {
      // Support both direct value or synthetic event for form handlers
      onChange({
        target: { name: name || id || "date", value: dateStr },
        value: dateStr,
      });
    }
    setIsOpen(false);
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    if (readOnly || disabled) return;
    const now = new Date();
    const dateStr = formatDateISO(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (min && dateStr < min) return;
    if (max && dateStr > max) return;

    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());

    if (onChange) {
      onChange({
        target: { name: name || id || "date", value: dateStr },
        value: dateStr,
      });
    }
    setIsOpen(false);
  };

  // Generate Year Options (-70 to +10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear - 70; y <= currentYear + 10; y++) {
    yearOptions.push(y);
  }

  // Days in current month
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // First day of current month (0 = Sun, 1 = Mon...)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  // Days in previous month
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Days array for grid
  const days = [];
  // Pad previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      monthType: "prev",
    });
  }
  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    days.push({
      day: d,
      monthType: "current",
      dateStr: formatDateISO(viewYear, viewMonth, d),
    });
  }
  // Fill remaining slots up to next multiple of 7 (or 42)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      day: i,
      monthType: "next",
    });
  }

  // Formatted display text
  const getDisplayDate = () => {
    if (!value) return "";
    const parts = String(value).split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const d = parts[2];
      const m = MONTH_SHORT[parts[1] - 1] || "";
      const y = parts[0];
      return `${d} ${m} ${y}`;
    }
    return value;
  };

  const todayStr = formatDateISO(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  // Colors based on theme
  const bg = darkMode ? "#1e293b" : "#ffffff";
  const border = darkMode ? "#334155" : "#cbd5e1";
  const textPrimary = darkMode ? "#f8fafc" : "#1e293b";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const primaryColor = "#3b82f6";

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", ...style }}
      className={`custom-datepicker-wrap ${className}`}
    >
      {/* Date Trigger Box */}
      <div
        onClick={() => {
          if (!readOnly && !disabled) {
            setIsOpen((prev) => !prev);
          }
        }}
        tabIndex={disabled ? -1 : 0}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 13px",
          background: readOnly || disabled ? (darkMode ? "rgba(255,255,255,0.04)" : "#f8fafc") : bg,
          border: `1px solid ${isOpen ? primaryColor : border}`,
          borderRadius: "8px",
          cursor: readOnly || disabled ? "not-allowed" : "pointer",
          color: textPrimary,
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: isOpen ? `0 0 0 3px rgba(59, 130, 246, 0.15)` : "none",
          transition: "all 0.2s ease",
          userSelect: "none",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <FaCalendarAlt style={{ color: readOnly || disabled ? textMuted : primaryColor, fontSize: "14px" }} />
          <span style={{ color: value ? textPrimary : textMuted, fontWeight: value ? "600" : "400" }}>
            {getDisplayDate() || placeholder}
          </span>
        </div>

        {value && !readOnly && !disabled && !required && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (onChange) {
                onChange({ target: { name: name || id, value: "" }, value: "" });
              }
            }}
            title="Clear date"
            style={{ color: textMuted, cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = textMuted)}
          >
            <FaTimes style={{ fontSize: "11px" }} />
          </span>
        )}
      </div>

      {/* Hidden input for HTML form compliance */}
      <input
        type="hidden"
        name={name}
        id={id}
        value={value || ""}
        required={required}
      />

      {/* Popup Calendar Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            ...(align === "right" || (align === "auto" && alignRight)
              ? { right: 0, left: "auto" }
              : { left: 0, right: "auto" }),
            zIndex: 9999,
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: "14px",
            boxShadow: darkMode
              ? "0 14px 35px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.06)"
              : "0 14px 35px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0,0,0,0.04)",
            padding: "16px",
            width: "300px",
            maxWidth: "calc(100vw - 24px)",
            boxSizing: "border-box",
            animation: "customDateFadeIn 0.18s ease-out",
          }}
        >
          {/* Header with Month/Year Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              style={{
                background: "transparent",
                border: `1px solid ${border}`,
                borderRadius: "8px",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: textPrimary,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
            >
              <FaChevronLeft style={{ fontSize: "10px" }} />
            </button>

            {/* Month & Year Selectors */}
            <div style={{ display: "flex", gap: "6px" }}>
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                style={{
                  background: darkMode ? "#0f172a" : "#f1f5f9",
                  border: `1px solid ${border}`,
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: textPrimary,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                style={{
                  background: darkMode ? "#0f172a" : "#f1f5f9",
                  border: `1px solid ${border}`,
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: textPrimary,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              style={{
                background: "transparent",
                border: `1px solid ${border}`,
                borderRadius: "8px",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: textPrimary,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
            >
              <FaChevronRight style={{ fontSize: "10px" }} />
            </button>
          </div>

          {/* Days of week header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            {DAYS_SHORT.map((d, idx) => (
              <span
                key={d}
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: idx === 0 || idx === 6 ? "#ef4444" : textMuted,
                  padding: "4px 0",
                }}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Calendar Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "4px",
            }}
          >
            {days.map((item, index) => {
              if (item.monthType !== "current") {
                return (
                  <div
                    key={index}
                    style={{
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      color: darkMode ? "#475569" : "#cbd5e1",
                      userSelect: "none",
                    }}
                  >
                    {item.day}
                  </div>
                );
              }

              const isSelected = item.dateStr === value;
              const isToday = item.dateStr === todayStr;
              const isDisabled =
                (min && item.dateStr < min) || (max && item.dateStr > max);

              return (
                <button
                  key={index}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(item.day)}
                  style={{
                    height: "32px",
                    width: "32px",
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: isSelected || isToday ? "700" : "500",
                    borderRadius: "8px",
                    border: isToday && !isSelected ? `1.5px solid ${primaryColor}` : "none",
                    background: isSelected
                      ? primaryColor
                      : "transparent",
                    color: isSelected
                      ? "#ffffff"
                      : isDisabled
                      ? darkMode
                        ? "#475569"
                        : "#cbd5e1"
                      : isToday
                      ? primaryColor
                      : textPrimary,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isDisabled) {
                      e.currentTarget.style.background = darkMode
                        ? "rgba(59, 130, 246, 0.2)"
                        : "#eff6ff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isDisabled) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer with Today Quick Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: `1px solid ${border}`,
            }}
          >
            <button
              type="button"
              onClick={handleSelectToday}
              style={{
                background: "transparent",
                border: "none",
                color: primaryColor,
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: textMuted,
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
