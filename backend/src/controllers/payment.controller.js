const mongoClient = require("../config/mongoClient");
const {
  formatDateStr,
  formatDateTimeStr,
  parsePaymentDate,
  getISTTimeParts,
  getISTDayBounds,
  addDaysToYmd,
} = require("../utils/format");
const { clearStatsCache } = require("./dashboard.controller");
const cache = require("../utils/cache");
const { getValidityEndInstantIST } = require("../utils/studentStatus");
const { attemptSeatRecoveryOnReactivation } = require("../utils/seatLifecycle");

const applyValidityAndReactivation = async ({
  tx,
  validity,
  student,
  amtReceived,
  branchId,
  renewPlan,
}) => {
  const todayYmd = getISTTimeParts().ymd;

  const feePlan = validity.feePlanId
    ? await tx.feePlan.findFirst({
        where: { id: validity.feePlanId, branchId },
      })
    : null;

  const allPayments = await tx.payment.findMany({
    where: { validityId: validity.id },
  });
  const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amountReceived || 0), 0);
  const currentTotalAmount = Number(validity.totalAmount || 0);
  const prevPaid = totalPaid - amtReceived;
  const overpayment = totalPaid - currentTotalAmount;

  let renewalFee = 0;
  if (feePlan) {
    const assignments = await tx.studentShiftAssignment.findMany({
      where: { validityId: validity.id, assignmentStatus: "ACTIVE" },
    });
    const shiftCount =
      validity.accessType === "UNRESERVED" && assignments.length > 1
        ? assignments.length
        : 1;
    renewalFee = Number(feePlan.amount) * shiftCount;
  }

  // Trigger renewal either when previous period had no due (prevPaid >= currentTotalAmount),
  // OR when one combined payment clears pending due AND also covers/opts into renewal.
  const isCombinedDueAndRenewal =
    prevPaid < currentTotalAmount &&
    ((renewPlan === true && overpayment > 0) ||
      (renewalFee > 0 && overpayment >= renewalFee));

  const isRenewal = Boolean(feePlan) && (prevPaid >= currentTotalAmount || isCombinedDueAndRenewal);

  let finalTotalAmount = currentTotalAmount;
  let finalEndYmd = formatDateStr(validity.endDate);

  if (isRenewal) {
    finalTotalAmount = currentTotalAmount + renewalFee;
    const extendFromYmd =
      finalEndYmd && finalEndYmd >= todayYmd
        ? addDaysToYmd(finalEndYmd, 1)
        : todayYmd;
    const durationDays = Math.max(1, Number(feePlan.durationDays || 30));
    const newEndYmd = addDaysToYmd(extendFromYmd, durationDays - 1);

    await tx.studentValidity.update({
      where: { id: validity.id },
      data: {
        endDate: new Date(`${newEndYmd}T23:59:59.999+05:30`),
        totalAmount: finalTotalAmount,
        lastRenewedAt: new Date(`${extendFromYmd}T00:00:00+05:30`),
        updatedAt: new Date(),
      },
    });

    finalEndYmd = newEndYmd;
  }

  const dueRemaining = Math.max(0, finalTotalAmount - totalPaid);
  const endInstant = getValidityEndInstantIST(finalEndYmd);
  const planExpired = Boolean(!endInstant || Date.now() > endInstant.getTime());

  let reactivated = false;
  const previousStatus = student ? student.accountStatus : null;
  let accountStatus = previousStatus;
  let seatRecovery = {
    status: "NONE",
    seat_reassignment_required: false,
    restored_seat_number: null,
    previous_seat_number: null,
    seat_prompt: null,
  };

  if (
    student &&
    (student.accountStatus === "SUSPENDED" || student.accountStatus === "INACTIVE") &&
    !planExpired &&
    (dueRemaining <= 0 || isRenewal)
  ) {
    await tx.student.update({
      where: { id: student.id },
      data: { accountStatus: "ACTIVE", updatedAt: new Date() },
    });
    reactivated = true;
    accountStatus = "ACTIVE";

    if (previousStatus === "INACTIVE") {
      seatRecovery = await attemptSeatRecoveryOnReactivation({
        client: tx,
        validity,
        studentId: student.id,
        previousStatus,
        newStatus: "ACTIVE",
        branchId,
      });
    }
  }

  return {
    isRenewal,
    finalTotalAmount,
    totalPaid,
    dueRemaining,
    endDate: finalEndYmd,
    planExpired,
    reactivated,
    studentId: student ? student.id : validity.studentId,
    previousStatus,
    accountStatus,
    seat_status: seatRecovery.status,
    seat_reassignment_required: seatRecovery.seat_reassignment_required,
    restored_seat_number: seatRecovery.restored_seat_number,
    previous_seat_number: seatRecovery.previous_seat_number,
    seat_prompt: seatRecovery.seat_prompt,
  };
};

const logAction = async (action, tableName, recordId, oldValues, newValues, userId) => {
  try {
    await mongoClient.auditLog.create({
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
    const payments = await mongoClient.payment.findMany({
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
            feePlan: true,
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
      mobile: p.validity && p.validity.student ? p.validity.student.mobile : null,
      email: p.validity && p.validity.student ? p.validity.student.email : null,
      plan_name: p.validity && p.validity.feePlan ? p.validity.feePlan.planName : null,
      start_date: p.validity?.startDate ? formatDateStr(p.validity.startDate) : null,
      end_date: p.validity?.endDate ? formatDateStr(p.validity.endDate) : null,
      payment_mode_id: p.paymentModeId,
      mode_name: p.paymentMode?.modeName || "Unknown",
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
      renew_plan = false,
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

    const branchId = req.user ? req.user.branchId : 1;
    const valId = parseInt(validity_id);
    const pmId = parseInt(payment_mode_id);

    // Verify validity exists (include student so we can reactivate SUSPENDED/INACTIVE members)
    const validity = await mongoClient.studentValidity.findFirst({
      where: { id: valId, student: { branchId } },
      include: { student: true },
    });

    if (!validity) {
      return res.status(400).json({
        success: false,
        message: "Invalid validity_id",
      });
    }

    // Verify payment mode is active
    const paymentMode = await mongoClient.paymentMode.findFirst({
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
    let validityResult = {
      isRenewal: false,
      finalTotalAmount: Number(validity.totalAmount || 0),
      totalPaid: 0,
      dueRemaining: 0,
      endDate: formatDateStr(validity.endDate),
      planExpired: false,
      reactivated: false,
      studentId: validity.studentId,
      previousStatus: validity.student ? validity.student.accountStatus : null,
      accountStatus: validity.student ? validity.student.accountStatus : null,
      seat_status: "NONE",
      seat_reassignment_required: false,
      restored_seat_number: null,
      previous_seat_number: null,
      seat_prompt: null,
    };

    await mongoClient.$transaction(async (tx) => {
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

      validityResult = await applyValidityAndReactivation({
        tx,
        validity,
        student: validity.student,
        amtReceived,
        branchId,
        renewPlan: renew_plan === true || renew_plan === "true",
      });
    });

    // Audit Log
    await logAction("CREATE_PAYMENT", "payments", newPayment.id, null, newPayment, req.user ? req.user.id : null);

    if (validityResult.reactivated) {
      await logAction(
        "REACTIVATE_STUDENT",
        "students",
        validityResult.studentId,
        { accountStatus: validityResult.previousStatus },
        { accountStatus: "ACTIVE", paymentId: newPayment.id, invoiceNo: newPayment.invoiceNo },
        req.user ? req.user.id : null
      );
    }

    try {
      clearStatsCache();
      cache.invalidateBranch(branchId);
    } catch (e) {}

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
        is_renewal: validityResult.isRenewal,
        reactivated: validityResult.reactivated,
        plan_expired: validityResult.planExpired,
        due_remaining: validityResult.dueRemaining,
        end_date: validityResult.endDate,
        account_status: validityResult.accountStatus,
        seat_status: validityResult.seat_status || "NONE",
        seat_reassignment_required: Boolean(validityResult.seat_reassignment_required),
        restored_seat_number: validityResult.restored_seat_number || null,
        previous_seat_number: validityResult.previous_seat_number || null,
        seat_prompt: validityResult.seat_prompt || null,
      },
    });
  } catch (error) {
    if (error.code === "P2002" || error.code === 11000) {
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
      renew_plan = false,
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

    const branchId = req.user ? req.user.branchId : 1;
    const sId = parseInt(student_id);
    const fpId = parseInt(fee_plan_id);
    const pmId = parseInt(payment_mode_id);

    // Verify student exists (and is not soft-deleted)
    const student = await mongoClient.student.findFirst({
      where: { id: sId, deletedAt: null, branchId },
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: "Invalid student_id",
      });
    }

    // Verify fee plan is active
    const feePlan = await mongoClient.feePlan.findFirst({
      where: { id: fpId, isActive: true, branchId },
    });

    if (!feePlan) {
      return res.status(404).json({
        success: false,
        message: "Fee plan not found or inactive",
      });
    }

    // Verify payment mode is active
    const paymentMode = await mongoClient.paymentMode.findFirst({
      where: { id: pmId, isActive: true },
    });

    if (!paymentMode) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive payment mode",
      });
    }

    const existingValidity = await mongoClient.studentValidity.findUnique({
      where: { studentId: sId },
    });

    let validity;
    let payment;
    let validityResult = null;

    if (existingValidity) {
      // Validity already exists: append payment, renew if eligible, and reactivate if due cleared & unexpired
      validity = existingValidity;
      const payDate = parsePaymentDate(payment_date);
      await mongoClient.$transaction(async (tx) => {
        payment = await tx.payment.create({
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

        validityResult = await applyValidityAndReactivation({
          tx,
          validity: existingValidity,
          student,
          amtReceived,
          branchId,
          renewPlan: renew_plan === true || renew_plan === "true",
        });
      });
    } else {
      const startYmd = getISTDayBounds(start_date).ymd;
      const durationDays = Math.max(1, Number(feePlan.durationDays || 30));
      const endYmd = addDaysToYmd(startYmd, durationDays - 1);
      const startDateObj = new Date(`${startYmd}T00:00:00+05:30`);
      const endDateObj = new Date(`${endYmd}T23:59:59.999+05:30`);

      // totalAmount is based on the FEE PLAN (so dues are tracked correctly),
      // not on however much was received
      const planAmount = Number(feePlan.amount);
      const todayYmd = getISTTimeParts().ymd;
      const graceCutoffYmd = addDaysToYmd(todayYmd, -10);
      const dueRemaining = Math.max(0, planAmount - amtReceived);
      const endInstant = getValidityEndInstantIST(endYmd);
      const planExpired = Boolean(!endInstant || Date.now() > endInstant.getTime());

      let reactivated = false;
      const previousStatus = student.accountStatus;
      let accountStatus = previousStatus;
      let seatRecovery = {
        status: "NONE",
        seat_reassignment_required: false,
        restored_seat_number: null,
        previous_seat_number: null,
        seat_prompt: null,
      };

      await mongoClient.$transaction(async (tx) => {
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

        if (
          (student.accountStatus === "SUSPENDED" || student.accountStatus === "INACTIVE") &&
          !planExpired &&
          (dueRemaining <= 0 || startYmd >= graceCutoffYmd)
        ) {
          await tx.student.update({
            where: { id: student.id },
            data: { accountStatus: "ACTIVE", updatedAt: new Date() },
          });
          reactivated = true;
          accountStatus = "ACTIVE";
          if (previousStatus === "INACTIVE") {
            seatRecovery = await attemptSeatRecoveryOnReactivation({
              client: tx,
              validity,
              studentId: student.id,
              previousStatus,
              newStatus: "ACTIVE",
              branchId,
            });
          }
        }
      });

      validityResult = {
        isRenewal: false,
        finalTotalAmount: planAmount,
        totalPaid: amtReceived,
        dueRemaining,
        endDate: endYmd,
        planExpired,
        reactivated,
        studentId: student.id,
        previousStatus,
        accountStatus,
        seat_status: seatRecovery.status,
        seat_reassignment_required: seatRecovery.seat_reassignment_required,
        restored_seat_number: seatRecovery.restored_seat_number,
        previous_seat_number: seatRecovery.previous_seat_number,
        seat_prompt: seatRecovery.seat_prompt,
      };
    }

    // Audit Log
    await logAction("RECORD_PAYMENT", "payments", payment.id, null, payment, req.user ? req.user.id : null);

    if (validityResult && validityResult.reactivated) {
      await logAction(
        "REACTIVATE_STUDENT",
        "students",
        validityResult.studentId,
        { accountStatus: validityResult.previousStatus },
        { accountStatus: "ACTIVE", paymentId: payment.id, invoiceNo: payment.invoiceNo },
        req.user ? req.user.id : null
      );
    }

    try {
      clearStatsCache();
      cache.invalidateBranch(branchId);
    } catch (e) {}

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
        end_date: validityResult ? validityResult.endDate : formatDateStr(validity.endDate),
        total_amount: validityResult ? validityResult.finalTotalAmount : Number(validity.totalAmount),
        plan_name: feePlan.planName,
        is_renewal: validityResult ? validityResult.isRenewal : false,
        reactivated: validityResult ? validityResult.reactivated : false,
        plan_expired: validityResult ? validityResult.planExpired : false,
        due_remaining: validityResult ? validityResult.dueRemaining : 0,
        account_status: validityResult ? validityResult.accountStatus : student.accountStatus,
        seat_status: validityResult ? (validityResult.seat_status || "NONE") : "NONE",
        seat_reassignment_required: Boolean(validityResult && validityResult.seat_reassignment_required),
        restored_seat_number: validityResult ? (validityResult.restored_seat_number || null) : null,
        previous_seat_number: validityResult ? (validityResult.previous_seat_number || null) : null,
        seat_prompt: validityResult ? (validityResult.seat_prompt || null) : null,
      },
    });
  } catch (error) {
    if (error.code === "P2002" || error.code === 11000) {
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