const formatDateStr = (dateObj) => {
  if (!dateObj) return null;
  if (typeof dateObj === "string") {
    return dateObj.split("T")[0];
  }
  try {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    return null;
  }
};

const formatDateTimeStr = (dateObj) => {
  if (!dateObj) return null;
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return typeof dateObj === "string" ? dateObj : null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, "0");

  return `${year}-${month}-${day} ${formattedHours}:${minutes} ${ampm}`;
};

const parsePaymentDate = (payment_date) => {
  let payDate = new Date();
  if (payment_date) {
    if (typeof payment_date === "string" && payment_date.length === 10 && payment_date.includes("-")) {
      const [y, m, d] = payment_date.split("-").map(Number);
      const now = new Date();
      payDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
    } else {
      const customDate = new Date(payment_date);
      if (!isNaN(customDate.getTime())) {
        payDate = customDate;
      }
    }
  }
  return payDate;
};

const generateInvoiceNo = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `INV-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${rand}`;
};

module.exports = { formatDateStr, formatDateTimeStr, parsePaymentDate, generateInvoiceNo };
