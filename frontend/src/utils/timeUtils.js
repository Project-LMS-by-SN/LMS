/**
 * Utility functions for 12-hour (AM/PM) and 24-hour time formatting & conversion.
 */

// Helper to convert any time string (12hr with AM/PM, or 24hr "HH:MM" / "HH:MM:SS") to minutes from midnight
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const raw = String(timeStr).trim().toUpperCase();
  const hasPM = raw.includes("PM");
  const hasAM = raw.includes("AM");

  // Extract digits and colon
  const cleaned = raw.replace(/[^0-9:]/g, "");
  const parts = cleaned.split(":");
  if (parts.length === 0 || parts[0] === "") return null;

  let h = parseInt(parts[0], 10);
  let m = parts[1] ? parseInt(parts[1].slice(0, 2), 10) : 0;
  if (isNaN(h)) return null;
  if (isNaN(m)) m = 0;

  if (hasPM) {
    if (h < 12) h += 12;
  } else if (hasAM) {
    if (h === 12) h = 0;
  }

  return (h * 60 + m) % 1440;
};

export const parse24To12 = (timeStr) => {
  if (!timeStr) return { hour12: "09", minute: "00", period: "AM" };
  const raw = String(timeStr).trim();
  const upper = raw.toUpperCase();
  const hasPM = upper.includes("PM");
  const hasAM = upper.includes("AM");

  // Extract digits and colon
  const timeOnly = raw.replace(/[^0-9:]/g, "");
  const parts = timeOnly.split(":");
  let h = parseInt(parts[0], 10);
  let m = parts[1] ? parts[1].slice(0, 2) : "00";
  if (isNaN(h)) h = 9;
  if (isNaN(parseInt(m, 10))) m = "00";

  let period = "AM";
  let hour12 = h;

  if (hasPM) {
    period = "PM";
    if (h > 12) hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
  } else if (hasAM) {
    period = "AM";
    if (h === 0 || h === 12) hour12 = 12;
    else if (h > 12) hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
  } else {
    // 24-hour input without AM/PM
    period = h >= 12 ? "PM" : "AM";
    hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
  }

  const hourStr = hour12 < 10 ? `0${hour12}` : `${hour12}`;
  const minuteStr = String(m).padStart(2, "0").slice(0, 2);
  return { hour12: hourStr, minute: minuteStr, period };
};

export const compose12To24 = (hour12, minute, period) => {
  let h = parseInt(hour12, 10);
  if (isNaN(h) || h < 1 || h > 12) h = 12;
  let m = minute !== undefined && minute !== null ? String(minute).padStart(2, "0").slice(0, 2) : "00";

  const p = String(period || "").toUpperCase();
  if (p === "AM") {
    if (h === 12) h = 0;
  } else {
    // PM
    if (h !== 12) h += 12;
  }

  const hStr = h < 10 ? `0${h}` : `${h}`;
  return `${hStr}:${m}`;
};

export const formatTimeTo12Hr = (timeStr) => {
  if (!timeStr) return "";
  const { hour12, minute, period } = parse24To12(timeStr);
  return `${hour12}:${minute} ${period}`;
};

export const formatTime = (timeStr, timeFormat = "12hr") => {
  if (!timeStr) return "";
  const raw = String(timeStr).trim();
  const upper = raw.toUpperCase();

  if (timeFormat === "24hr") {
    if (upper.includes("AM") || upper.includes("PM")) {
      const { hour12, minute, period } = parse24To12(raw);
      return compose12To24(hour12, minute, period);
    }
    const clean = raw.slice(0, 5);
    const parts = clean.split(":");
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      return `${h}:${m}`;
    }
    return clean;
  }

  return formatTimeTo12Hr(timeStr);
};

export const formatDateTime = (dateTimeStr, timeFormat = "12hr") => {
  if (!dateTimeStr) return "";
  const str = String(dateTimeStr).trim();

  // If ISO string like 2026-09-24T18:15:00.000Z
  if (str.includes("T")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const datePart = `${year}-${month}-${day}`;
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${datePart} ${formatTime(`${hours}:${mins}`, timeFormat)}`;
    }
  }

  const parts = str.split(" ");
  const date = parts[0] || "";
  const time = parts.slice(1).join(" ");
  if (!time) return date;
  return `${date} ${formatTime(time, timeFormat)}`;
};

export const calculateDuration = (startTime, endTime) => {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  if (startMins === null || endMins === null) return "";

  let diffMins = endMins - startMins;
  if (diffMins <= 0) {
    diffMins += 1440; // Overnight shift
  }

  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (mins === 0) return `${hrs} hrs`;
  return `${hrs}h ${mins}m`;
};
