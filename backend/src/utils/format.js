/**
 * Timezone-aware Date & Time formatting for Indian Standard Time (IST - Asia/Kolkata).
 * Guarantees 100% accurate dates and times on local dev and cloud serverless (Vercel).
 */

const getISTTimeParts = (d = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(d instanceof Date && !isNaN(d) ? d : new Date(d));
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const hour = get("hour") || "00";
  const minute = get("minute") || "00";
  const second = get("second") || "00";
  const hours = parseInt(hour, 10);
  const minutes = parseInt(minute, 10);
  const seconds = parseInt(second, 10);
  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    hours,
    minutes,
    seconds,
    currMin: hours * 60 + minutes,
    timeHHMM: `${hour}:${minute}`,
    timeHHMMSS: `${hour}:${minute}:${second}`,
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
  };
};

const getISTDayBounds = (dateInput) => {
  let ymd;
  if (!dateInput) {
    ymd = getISTTimeParts().ymd;
  } else if (typeof dateInput === "string") {
    ymd = dateInput.split("T")[0];
  } else {
    ymd = getISTTimeParts(dateInput).ymd;
  }
  const start = new Date(`${ymd}T00:00:00+05:30`);
  const end = new Date(`${ymd}T23:59:59.999+05:30`);
  const todayDate = new Date(`${ymd}T00:00:00+05:30`);
  return { start, end, todayDate, ymd };
};

const formatDateStr = (dateObj) => {
  if (!dateObj) return null;
  try {
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) {
      if (typeof dateObj === "string" && dateObj.includes("-")) {
        return dateObj.split("T")[0];
      }
      return null;
    }
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d);
  } catch (e) {
    return null;
  }
};

const formatDateTimeStr = (dateObj) => {
  if (!dateObj) return null;
  try {
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return typeof dateObj === "string" ? dateObj : null;

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const parts = formatter.formatToParts(d);
    const get = (type) => parts.find((p) => p.type === type)?.value;
    const dayPeriod = get("dayPeriod") || (parseInt(get("hour"), 10) >= 12 ? "PM" : "AM");
    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")} ${dayPeriod}`.trim();
  } catch (e) {
    return null;
  }
};

const parsePaymentDate = (payment_date) => {
  if (payment_date) {
    if (typeof payment_date === "string" && payment_date.length === 10 && payment_date.includes("-")) {
      const parts = getISTTimeParts();
      return new Date(`${payment_date}T${parts.timeHHMMSS}+05:30`);
    }
    const customDate = new Date(payment_date);
    if (!isNaN(customDate.getTime())) {
      return customDate;
    }
  }
  return new Date();
};

const generateInvoiceNo = () => {
  const parts = getISTTimeParts();
  const pad = (n) => String(n).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `INV-${parts.year}${pad(parts.month)}${pad(parts.day)}-${pad(parts.hours)}${pad(parts.minutes)}${pad(parts.seconds)}-${rand}`;
};

module.exports = {
  getISTTimeParts,
  getISTDayBounds,
  formatDateStr,
  formatDateTimeStr,
  parsePaymentDate,
  generateInvoiceNo,
};
