const prisma = require("../config/prisma");
const { formatDateStr, formatDateTimeStr, parsePaymentDate } = require("../utils/format");

const logAction = async (action, tableName, recordId, oldValues, newValues, userId) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        tableName,
        recordId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        userId: userId || null,
      },
    });
  } catch (err) {
    console.error("❌ Audit log failed:", err.message);
  }
};

const getPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        validity: {
          student: {
            branchId: req.user.branchId,
          },
        },
      },
      include: {
        validity: {
          include: {
            student: true,
          },
        },
        paymentMode: true,
      },
      orderBy: { id: "desc" },
    });

    const formattedData = payments.map((p) => ({
      id: p.id,
      validity_id: p.validityId,
      full_name: p.validity && p.validity.student ? p.validity.student.fullName : null,
      student_code: p.validity && p.validity.student ? p.validity.student.studentCode : null,
      payment_mode_id: p.paymentModeId,
      mode_name: p.paymentMode.modeName,
      invoice_no: p.invoiceNo,
      amount_received: p.amountReceived ? Number(p.amountReceived) : 0,
      remarks: p.remarks,
      utr_number: p.utrNumber,
      payment_date: formatDateTimeStr(p.paymentDate),
    }));

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

const createPayment = async (req, res) => {
  try {
    const {
      validity_id,
      payment_mode_id,
      invoice_no,
      amount_received,
      payment_date,
      remarks,
      utr_number,
      payment_type = "fee", // "fee" (due/renewal) | "registration" (one-time, no validity change)
    } = req.body;

    if (!validity_id || !payment_mode_id || !invoice_no || !amount_received) {
      return res.status(400).json({
        success: false,
        message: "validity_id, payment_mode_id, invoice_no, and amount_received are required",
      });
    }

    const amtReceived = parseFloat(amount_received);
    if (amtReceived <= 0) {
      return res.status(400).json({
        success: false,
        message: "amount_received must be greater than 0",
      });
    }

    const valId = parseInt(validity_id);
    const pmId = parseInt(payment_mode_id);

    // Verify validity exists
    const validity = await prisma.studentValidity.findFirst({
      where: { id: valId, student: { branchId: req.user.branchId } },
    });

    if (!validity) {
      return res.status(400).json({
        success: false,
        message: "Invalid validity_id",
      });
    }

    // Verify payment mode is active
    const paymentMode = await prisma.paymentMode.findFirst({
      where: { id: pmId, isActive: true },
    });

    if (!paymentMode) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive payment mode",
      });
    }

    const remarksValue = remarks || (utr_number ? `UTR: ${utr_number}` : null);
    const payDate = parsePaymentDate(payment_date);

    let newPayment = null;

    await prisma.$transaction(async (tx) => {
      newPayment = await tx.payment.create({
        data: {
          validityId: valId,
          paymentModeId: pmId,
          invoiceNo: invoice_no,
          amountReceived: amtReceived,
          paymentDate: payDate,
          remarks: remarksValue,
          utrNumber: utr_number || null,
        },
      });

      // Registration fee is a one-time payment — never touches validity/amounts
      if (payment_type === "registration") return;

      const feePlan = await tx.feePlan.findFirst({
        where: { id: validity.feePlanId, isActive: true, branchId: req.user.branchId },
      });

      if (!feePlan) return;

      // Calculate renewal fee (strictly fee plan amount, NO registration fee)
      const assignments = await tx.studentShiftAssignment.findMany({
        where: { validityId: valId, assignmentStatus: "ACTIVE" },
      });
      const shiftCount = (validity.accessType === "UNRESERVED" && assignments.length > 1)
        ? assignments.length
        : 1;
      const renewalFee = Number(feePlan.amount) * shiftCount;

      // Calculate total paid across all payments BEFORE this one
      const allPayments = await tx.payment.findMany({
        where: { validityId: valId },
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amountReceived || 0), 0);
      const currentTotalAmount = Number(validity.totalAmount || 0);

      const prevPaid = totalPaid - amtReceived;
      // Renewal only if the previous period was already fully paid before this payment
      // (i.e. there was no pending due) — due-clearing payments never extend validity
      const isRenewal = prevPaid >= currentTotalAmount;

      if (isRenewal) {
        const newTotalAmount = currentTotalAmount + renewalFee;

        const currentEnd = new Date(validity.endDate);
        currentEnd.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const extendFrom = currentEnd > today
          ? new Date(currentEnd.getTime() + 86400000)
          : today;

        const newEndDate = new Date(extendFrom);
        newEndDate.setDate(extendFrom.getDate() + (feePlan.durationDays - 1));

        await tx.studentValidity.update({
          where: { id: valId },
          data: {
            endDate: newEndDate,
            totalAmount: newTotalAmount,
          },
        });
      }
      // Due-clearing payments: only record the payment, no validity change
    });

    // Audit Log
    await logAction("CREATE_PAYMENT", "payments", newPayment.id, null, newPayment, req.user ? req.user.id : null);

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: {
        id: newPayment.id,
        validity_id: newPayment.validityId,
        payment_mode_id: newPayment.paymentModeId,
        invoice_no: newPayment.invoiceNo,
        amount_received: Number(newPayment.amountReceived),
        remarks: newPayment.remarks,
        payment_date: formatDateTimeStr(newPayment.paymentDate),
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Invoice number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message,
    });
  }
};

const recordPayment = async (req, res) => {
  try {
    const {
      student_id,
      fee_plan_id,
      start_date,
      access_type = "UNRESERVED",
      payment_mode_id,
      payment_date,
      invoice_no,
      amount_received,
      utr_number,
      remarks,
    } = req.body;

    if (
      !student_id ||
      !fee_plan_id ||
      !start_date ||
      !payment_mode_id ||
      !invoice_no ||
      !amount_received
    ) {
      return res.status(400).json({
        success: false,
        message: "student_id, fee_plan_id, start_date, payment_mode_id, invoice_no, and amount_received are required",
      });
    }

    const amtReceived = parseFloat(amount_received);
    if (amtReceived <= 0) {
      return res.status(400).json({
        success: false,
        message: "amount_received must be greater than 0",
      });
    }

    const sId = parseInt(student_id);
    const fpId = parseInt(fee_plan_id);
    const pmId = parseInt(payment_mode_id);

    // Verify student exists and is active
    const student = await prisma.student.findFirst({
      where: { id: sId, deletedAt: null, branchId: req.user.branchId },
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: "Invalid student_id",
      });
    }

    // Verify fee plan is active
    const feePlan = await prisma.feePlan.findFirst({
      where: { id: fpId, isActive: true, branchId: req.user.branchId },
    });

    if (!feePlan) {
      return res.status(404).json({
        success: false,
        message: "Fee plan not found or inactive",
      });
    }

    // Verify payment mode is active
    const paymentMode = await prisma.paymentMode.findFirst({
      where: { id: pmId, isActive: true },
    });

    if (!paymentMode) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive payment mode",
      });
    }

    // Calculate end date — extend from existing validity if present
    const existingValidity = await prisma.studentValidity.findUnique({
      where: { studentId: sId },
    });

    let startDateObj;
    let endDateObj;
    let validity;
    let payment;

    if (existingValidity) {
      // Validity already exists: just append the payment, do NOT reset dates/amounts
      validity = existingValidity;
      const payDate = parsePaymentDate(payment_date);
      payment = await prisma.$transaction(async (tx) => {
        return tx.payment.create({
          data: {
            validityId: existingValidity.id,
            paymentModeId: pmId,
            invoiceNo: invoice_no,
            amountReceived: amtReceived,
            paymentDate: payDate,
            remarks: remarks || (utr_number ? `UTR: ${utr_number}` : null),
            utrNumber: utr_number || null,
          },
        });
      });
    } else {
      startDateObj = new Date(start_date);
      endDateObj = new Date(startDateObj);
      endDateObj.setDate(startDateObj.getDate() + (feePlan.durationDays - 1));

      // totalAmount is based on the FEE PLAN (so dues are tracked correctly),
      // not on however much was received
      const planAmount = Number(feePlan.amount);

      await prisma.$transaction(async (tx) => {
        validity = await tx.studentValidity.create({
          data: {
            studentId: sId,
            feePlanId: fpId,
            startDate: startDateObj,
            endDate: endDateObj,
            totalAmount: planAmount,
            accessType: access_type,
          },
        });

        const payDate = parsePaymentDate(payment_date);
        payment = await tx.payment.create({
          data: {
            validityId: validity.id,
            paymentModeId: pmId,
            invoiceNo: invoice_no,
            amountReceived: amtReceived,
            paymentDate: payDate,
            remarks: remarks || (utr_number ? `UTR: ${utr_number}` : null),
            utrNumber: utr_number || null,
          },
        });
      });
    }

    // Audit Log
    await logAction("RECORD_PAYMENT", "payments", payment.id, null, payment, req.user ? req.user.id : null);

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        id: payment.id,
        validity_id: payment.validityId,
        payment_mode_id: payment.paymentModeId,
        invoice_no: payment.invoiceNo,
        amount_received: Number(payment.amountReceived),
        remarks: payment.remarks,
        payment_date: formatDateTimeStr(payment.paymentDate),
        full_name: student.fullName,
        student_code: student.studentCode,
        start_date: formatDateStr(validity.startDate),
        end_date: formatDateStr(validity.endDate),
        total_amount: Number(validity.totalAmount),
        plan_name: feePlan.planName,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Invoice number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to record payment",
      error: error.message,
    });
  }
};

module.exports = {
  getPayments,
  createPayment,
  recordPayment,
};