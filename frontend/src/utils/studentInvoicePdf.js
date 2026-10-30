import { jsPDF } from "jspdf";

/**
 * Format Indian Currency for display in plain text or PDF
 */
export const formatCurrency = (amt) => {
  const num = Number(amt) || 0;
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Convert number to words in Indian numbering system
 */
function numberToWords(amount) {
  const num = Math.floor(Number(amount) || 0);
  if (num === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n) {
    if (n === 0) return "";
    if (n < 20) return a[n] + " ";
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "") + " ";
    if (n < 1000) {
      return inWords(Math.floor(n / 100)) + "Hundred " + (n % 100 !== 0 ? inWords(n % 100) : "");
    }
    if (n < 100000) {
      return inWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? inWords(n % 1000) : "");
    }
    if (n < 10000000) {
      return inWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? inWords(n % 100000) : "");
    }
    return inWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? inWords(n % 10000000) : "");
  }

  return inWords(num).trim() + " Rupees Only";
}

/**
 * Generate and download a vector PDF Fee Receipt / Invoice for a student payment
 *
 * @param {Object} payment - Payment details object
 * @param {Object} libraryInfo - Library / Branch / User profile object
 */
export const generateStudentInvoicePdf = (payment, libraryInfo = {}) => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // Library Info
    const libName = libraryInfo?.library_name || libraryInfo?.branch_name || "Library Management System";
    const libAddress = libraryInfo?.address || libraryInfo?.branch_address || "Library Campus";
    const libPhone = libraryInfo?.contact || libraryInfo?.phone || libraryInfo?.branch_phone || "";
    const libEmail = libraryInfo?.email || "";
    const libCode = libraryInfo?.library_code || libraryInfo?.branch_code || "";

    // Payment Info
    const invoiceNo = payment?.invoice_no || `INV-${Date.now()}`;
    const rawDate = payment?.payment_date || "";
    const dateOnly = rawDate ? rawDate.split(" ")[0] : new Date().toLocaleDateString("en-IN");
    const timeOnly = rawDate && rawDate.split(" ").length > 1 ? rawDate.split(" ").slice(1).join(" ") : "";
    const studentName = payment?.full_name || payment?.student_name || "Student Member";
    const studentCode = payment?.student_code || "N/A";
    const studentMobile = payment?.mobile || payment?.phone || "N/A";
    const studentEmail = payment?.email || "N/A";
    const planName = payment?.plan_name || payment?.fee_plan_name || "";
    const validityPeriod =
      payment?.start_date && payment?.end_date ? `${payment.start_date} to ${payment.end_date}` : "";
    const modeName = payment?.mode_name || "Cash";
    const utrNumber = payment?.utr_number || "";
    const remarks = payment?.remarks || "Library Membership Fee";
    const amountNum = Number(payment?.amount_received) || 0;
    const amountFormatted = formatCurrency(amountNum);

    // ==========================================
    // 1. TOP HEADER BANNER (Navy #1e293b)
    // ==========================================
    doc.setFillColor(30, 41, 59); // #1e293b
    doc.rect(margin, margin, contentWidth, 38, "F");

    // Accent line below banner
    doc.setFillColor(59, 130, 246); // #3b82f6 Primary Blue
    doc.rect(margin, margin + 38, contentWidth, 2, "F");

    // Header Text - Library Brand
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(libName.toUpperCase(), margin + 8, margin + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // #cbd5e1
    let subY = margin + 18;
    if (libAddress) {
      doc.text(libAddress, margin + 8, subY);
      subY += 4.5;
    }
    const contactParts = [];
    if (libPhone) contactParts.push(`Phone: ${libPhone}`);
    if (libEmail) contactParts.push(`Email: ${libEmail}`);
    if (libCode) contactParts.push(`Branch Code: ${libCode}`);
    if (contactParts.length > 0) {
      doc.text(contactParts.join("  |  "), margin + 8, subY);
    }

    // Header Right - Invoice Title & Badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("FEE RECEIPT", pageWidth - margin - 8, margin + 13, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // #94a3b8
    doc.text("ORIGINAL STUDENT COPY", pageWidth - margin - 8, margin + 19, { align: "right" });

    // "PAID" Stamp Badge in Banner
    doc.setFillColor(22, 163, 74); // #16a34a Green
    doc.roundedRect(pageWidth - margin - 36, margin + 24, 28, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("PAID", pageWidth - margin - 22, margin + 29.5, { align: "center" });

    // ==========================================
    // 2. METADATA STRIP (Invoice #, Date, Time)
    // ==========================================
    let currentY = margin + 44;
    doc.setFillColor(248, 250, 252); // #f8fafc
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // #475569
    doc.text("INVOICE NO:", margin + 6, currentY + 9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(invoiceNo, margin + 30, currentY + 9);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("DATE:", margin + 95, currentY + 9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(`${dateOnly} ${timeOnly ? `(${timeOnly})` : ""}`, margin + 107, currentY + 9);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("STATUS:", margin + 150, currentY + 9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74);
    doc.text("SUCCESSFUL", margin + 167, currentY + 9);

    // ==========================================
    // 3. STUDENT & PAYMENT DETAILS CARDS
    // ==========================================
    currentY += 19;
    const cardWidth = (contentWidth - 6) / 2;
    const cardHeight = 44;

    // Left Card: Student Info
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, "FD");

    // Header of Left Card
    doc.setFillColor(241, 245, 249); // #f1f5f9
    doc.rect(margin, currentY, cardWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("STUDENT / MEMBER DETAILS", margin + 5, currentY + 5.5);

    doc.setFontSize(9);
    let lY = currentY + 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Full Name:", margin + 5, lY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(studentName, margin + 32, lY);

    lY += 6.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Student ID:", margin + 5, lY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text(studentCode, margin + 32, lY);

    lY += 6.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Mobile:", margin + 5, lY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(studentMobile, margin + 32, lY);

    lY += 6.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Email:", margin + 5, lY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(studentEmail || "—", margin + 32, lY);

    // Right Card: Payment Summary
    const rightCardX = margin + cardWidth + 6;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(rightCardX, currentY, cardWidth, cardHeight, 2, 2, "FD");

    // Header of Right Card
    doc.setFillColor(241, 245, 249);
    doc.rect(rightCardX, currentY, cardWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("PAYMENT & PLAN INFO", rightCardX + 5, currentY + 5.5);

    let rY = currentY + 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Payment Mode:", rightCardX + 5, rY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(modeName, rightCardX + 34, rY);

    rY += 6.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("UTR / Ref No:", rightCardX + 5, rY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(utrNumber || "—", rightCardX + 34, rY);

    rY += 6.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Plan:", rightCardX + 5, rY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(planName || "General Membership", rightCardX + 34, rY);

    rY += 6.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Validity:", rightCardX + 5, rY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(validityPeriod || "Active Term", rightCardX + 34, rY);

    // ==========================================
    // 4. PARTICULARS / LINE ITEMS TABLE
    // ==========================================
    currentY += cardHeight + 8;

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, currentY, contentWidth, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("#", margin + 4, currentY + 5.5);
    doc.text("ITEM / DESCRIPTION", margin + 16, currentY + 5.5);
    doc.text("PLAN / DURATION", margin + 92, currentY + 5.5);
    doc.text("MODE", margin + 138, currentY + 5.5);
    doc.text("AMOUNT (INR)", pageWidth - margin - 4, currentY + 5.5, { align: "right" });

    // Table Row 1
    currentY += 8;
    const rowHeight = 16;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, rowHeight, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("1", margin + 4, currentY + 7);

    // Description & remarks
    doc.setFont("helvetica", "bold");
    doc.text(remarks || planName || "Library Fee Payment", margin + 16, currentY + 6.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Receipt ID: ${invoiceNo} | Student: ${studentCode}`, margin + 16, currentY + 11.5);

    // Plan & Duration
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(planName || "Membership Fee", margin + 92, currentY + 7);
    if (validityPeriod) {
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(validityPeriod, margin + 92, currentY + 11.5);
    }

    // Mode
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(modeName, margin + 138, currentY + 9);

    // Amount
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${amountFormatted}`, pageWidth - margin - 4, currentY + 9, { align: "right" });

    // ==========================================
    // 5. TOTALS & AMOUNT IN WORDS
    // ==========================================
    currentY += rowHeight;

    // Left: Amount in words
    const totalBoxHeight = 28;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth * 0.58, totalBoxHeight, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("AMOUNT IN WORDS:", margin + 5, currentY + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const words = numberToWords(amountNum);
    doc.text(words, margin + 5, currentY + 14, { maxWidth: contentWidth * 0.55 });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Payment received in full. Thank you!", margin + 5, currentY + 22);

    // Right: Total Calculation Box
    const calcBoxX = margin + contentWidth * 0.58;
    const calcBoxWidth = contentWidth * 0.42;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(calcBoxX, currentY, calcBoxWidth, totalBoxHeight, "FD");

    let calcY = currentY + 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Sub Total:", calcBoxX + 6, calcY);
    doc.text(`Rs. ${amountFormatted}`, pageWidth - margin - 5, calcY, { align: "right" });

    calcY += 5.5;
    doc.text("Tax / GST (Exempt):", calcBoxX + 6, calcY);
    doc.text("Rs. 0.00", pageWidth - margin - 5, calcY, { align: "right" });

    // Grand Total Bar
    calcY += 4.5;
    doc.setFillColor(240, 253, 244); // #f0fdf4
    doc.setDrawColor(187, 247, 208); // #bbf7d0
    doc.rect(calcBoxX, calcY, calcBoxWidth, 12, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(22, 163, 74); // #16a34a
    doc.text("TOTAL RECEIVED:", calcBoxX + 6, calcY + 7.5);
    doc.setFontSize(11);
    doc.text(`Rs. ${amountFormatted}`, pageWidth - margin - 5, calcY + 7.5, { align: "right" });

    // ==========================================
    // 6. TERMS & SIGNATURE BLOCK
    // ==========================================
    currentY += totalBoxHeight + 10;

    // Terms & Conditions (Left)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("TERMS & CONDITIONS:", margin, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("1. Fees once paid are non-refundable and non-transferable under any circumstances.", margin, currentY + 4.5);
    doc.text("2. Please retain this official fee receipt for future membership renewal & desk verification.", margin, currentY + 8.5);
    doc.text("3. Library management reserves the right of admission and seat allocation.", margin, currentY + 12.5);
    doc.text("4. This is an electronically generated receipt; no physical signature is required.", margin, currentY + 16.5);

    // Authorized Signature Box (Right)
    const signX = pageWidth - margin - 55;
    doc.setDrawColor(203, 213, 225);
    doc.line(signX, currentY + 15, pageWidth - margin, currentY + 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("AUTHORIZED SIGNATORY", signX + 27.5, currentY + 19, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(libName, signX + 27.5, currentY + 23, { align: "center" });

    // ==========================================
    // 7. FOOTER BAR
    // ==========================================
    const footerY = pageHeight - margin - 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated via ${libName} Portal  |  Powered by Library Management System`, margin, footerY);

    const nowStr = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    doc.text(`Printed: ${nowStr}`, pageWidth - margin, footerY, { align: "right" });

    // Download PDF
    const cleanInvoiceNo = invoiceNo.replace(/[^a-zA-Z0-9_-]/g, "_");
    doc.save(`Invoice_${cleanInvoiceNo}.pdf`);
    return true;
  } catch (error) {
    console.error("Failed to generate student invoice PDF:", error);
    alert("Invoice PDF generate karne me samasya aayi. Kripya punah prayas karein.");
    return false;
  }
};

/**
 * Format and send official payment receipt via WhatsApp
 *
 * @param {Object} payment - Payment record
 * @param {string} studentMobile - Student's phone number
 * @param {Object} libraryInfo - Library / User profile
 */
export const sendInvoiceOnWhatsApp = (payment, studentMobile, libraryInfo = {}) => {
  try {
    // Determine mobile number
    let rawPhone = studentMobile || payment?.mobile || payment?.phone || "";

    if (!rawPhone || !rawPhone.trim()) {
      const enteredPhone = window.prompt(
        `Student "${payment?.full_name || "Member"}" ka WhatsApp number enter karein (10 digits):`,
        ""
      );
      if (!enteredPhone || !enteredPhone.trim()) {
        return false;
      }
      rawPhone = enteredPhone;
    }

    // Clean phone number: remove non-digits
    let cleanPhone = String(rawPhone).replace(/\D/g, "");

    // Normalize Indian phone numbers
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
      cleanPhone = `91${cleanPhone.slice(1)}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      // already valid format
    } else if (cleanPhone.length < 10) {
      alert("Kripya valid 10-digit mobile number enter karein.");
      return false;
    }

    const libName = libraryInfo?.library_name || libraryInfo?.branch_name || "Library Main Branch";
    const libPhone = libraryInfo?.contact || libraryInfo?.phone || libraryInfo?.branch_phone || "";
    const libAddress = libraryInfo?.address || libraryInfo?.branch_address || "";

    const studentName = payment?.full_name || payment?.student_name || "Student Member";
    const studentCode = payment?.student_code || "N/A";
    const invoiceNo = payment?.invoice_no || `INV-${Date.now()}`;
    const amountNum = Number(payment?.amount_received) || 0;
    const amountFormatted = amountNum.toLocaleString("en-IN");
    const rawDate = payment?.payment_date || "";
    const dateOnly = rawDate ? rawDate.split(" ")[0] : new Date().toLocaleDateString("en-IN");
    const modeName = payment?.mode_name || "Cash";
    const planName = payment?.plan_name || payment?.fee_plan_name || "";
    const validityStr =
      payment?.start_date && payment?.end_date ? `${payment.start_date} to ${payment.end_date}` : "";
    const remarks = payment?.remarks || "Library Membership Fee";
    const utrNumber = payment?.utr_number || "";

    // Build WhatsApp formatted message
    let msg = `🧾 *FEE PAYMENT RECEIPT / INVOICE*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏛️ *${libName}*\n`;
    if (libAddress) msg += `📍 ${libAddress}\n`;
    if (libPhone) msg += `📞 Contact: ${libPhone}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `*Invoice No:* ${invoiceNo}\n`;
    msg += `*Date:* ${dateOnly}\n`;
    msg += `*Status:* ✅ *PAID*\n\n`;

    msg += `👤 *STUDENT DETAILS*\n`;
    msg += `• *Name:* ${studentName}\n`;
    msg += `• *Student Code:* ${studentCode}\n`;
    if (studentMobile || payment?.mobile) {
      msg += `• *Mobile:* ${studentMobile || payment?.mobile}\n`;
    }
    msg += `\n`;

    msg += `💳 *PAYMENT DETAILS*\n`;
    msg += `• *Amount Received:* ₹${amountFormatted}\n`;
    msg += `• *Payment Mode:* ${modeName}\n`;
    if (utrNumber) {
      msg += `• *UTR / Ref No:* ${utrNumber}\n`;
    }
    if (planName) {
      msg += `• *Plan:* ${planName}\n`;
    }
    if (validityStr) {
      msg += `• *Validity:* ${validityStr}\n`;
    }
    msg += `• *Remarks:* ${remarks}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🙏 *Thank you for your payment!*\n`;
    msg += `This is a computer generated confirmation receipt.`;

    const encoded = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(whatsappUrl, "_blank");
    return true;
  } catch (error) {
    console.error("Failed to share invoice on WhatsApp:", error);
    alert("WhatsApp par invoice bhejne me samasya aayi.");
    return false;
  }
};

