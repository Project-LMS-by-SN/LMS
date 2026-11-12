const mongoClient = require("../config/mongoClient");
const { formatDateStr, getISTTimeParts, getISTDayBounds, addDaysToYmd } = require("../utils/format");
const { clearStatsCache } = require("./dashboard.controller");
const cache = require("../utils/cache");
const { getValidityEndInstantIST } = require("../utils/studentStatus");
const { attemptSeatRecoveryOnReactivation } = require("../utils/seatLifecycle");

const formatValidity = (sv) => {
  const totalPaid = (sv.payments || []).reduce((sum, p) => sum + Number(p.amountReceived || 0), 0);
  const dueAmount = Number(sv.totalAmount || 0) - totalPaid;
  return {
    id: sv.id,
    student_id: sv.studentId,
    full_name: sv.student?.fullName,
    student_code: sv.student?.studentCode,
    fee_plan_id: sv.feePlanId,
    plan_name: sv.feePlan?.planName,
    start_date: formatDateStr(sv.startDate),
    end_date: formatDateStr(sv.endDate),
    total_amount: sv.totalAmount ? Number(sv.totalAmount) : 0,
    total_paid: totalPaid,
    due_amount: dueAmount,
    access_type: sv.accessType,
  };
};

const getStudentValidities = async (req, res) => {
  try {
    const validities = await mongoClient.studentValidity.findMany({
      where: {
        student: {
          deletedAt: null,
          branchId: req.user.branchId,
        },
      },
      include: {
        student: true,
        feePlan: true,
        payments: true,
      },
      orderBy: { id: "desc" },
    });

    res.json({
      success: true,
      data: validities.map(formatValidity),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch student validities",
      error: error.message,
    });
  }
};

const createOrUpdateStudentValidity = async (req, res) => {
  try {
    const { student_id, fee_plan_id, start_date, access_type, custom_amount } = req.body;

    if (!student_id || !fee_plan_id || !start_date || !access_type) {
      return res.status(400).json({
        success: false,
        message: "student_id, fee_plan_id, start_date, and access_type are required",
      });
    }

    const sId = parseInt(student_id);
    const fpId = parseInt(fee_plan_id);

    // Verify student exists and is active
    const student = await mongoClient.student.findFirst({
      where: { id: sId, deletedAt: null, branchId: req.user.branchId },
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: "Invalid student_id",
      });
    }

    // Verify fee plan is active
    const feePlan = await mongoClient.feePlan.findFirst({
      where: { id: fpId, isActive: true, branchId: req.user.branchId },
    });

    if (!feePlan) {
      return res.status(404).json({
        success: false,
        message: "Fee plan not found or inactive",
      });
    }

    if (access_type !== "RESERVED" && access_type !== "UNRESERVED") {
      return res.status(400).json({
        success: false,
        message: "Invalid access_type. Use RESERVED or UNRESERVED",
      });
    }

    // Calculate end date based on plan duration in IST (start_date + duration_days - 1, expiring at 23:59:59.999 IST)
    const startYmd = getISTDayBounds(start_date).ymd;
    const durationDays = Math.max(1, Number(feePlan.durationDays || 30));
    const endYmd = addDaysToYmd(startYmd, durationDays - 1);
    const startDateObj = new Date(`${startYmd}T00:00:00+05:30`);
    const endDateObj = new Date(`${endYmd}T23:59:59.999+05:30`);

    const finalAmount = custom_amount !== undefined && custom_amount !== null && custom_amount !== "" ? parseFloat(custom_amount) : feePlan.amount;

    const validity = await mongoClient.studentValidity.upsert({
      where: { studentId: sId },
      update: {
        feePlanId: fpId,
        startDate: startDateObj,
        endDate: endDateObj,
        lastRenewedAt: startDateObj,
        totalAmount: finalAmount,
        accessType: access_type,
        updatedAt: new Date(),
      },
      create: {
        studentId: sId,
        feePlanId: fpId,
        startDate: startDateObj,
        endDate: endDateObj,
        totalAmount: finalAmount,
        accessType: access_type,
      },
      include: {
        student: true,
        feePlan: true,
        payments: true,
      },
    });

    const todayYmd = getISTTimeParts().ymd;
    const graceCutoffYmd = addDaysToYmd(todayYmd, -10);
    const totalPaid = (validity.payments || []).reduce((sum, p) => sum + Number(p.amountReceived || 0), 0);
    const dueAmount = Number(validity.totalAmount || 0) - totalPaid;
    const endInstant = getValidityEndInstantIST(endYmd);
    const notExpired = Boolean(endInstant && Date.now() <= endInstant.getTime());

    const previousStatus = student.accountStatus;
    let reactivated = false;
    let seatRecovery = {
      status: "NONE",
      seat_reassignment_required: false,
      restored_seat_number: null,
      previous_seat_number: null,
      seat_prompt: null,
    };

    if (
      (previousStatus === "SUSPENDED" || previousStatus === "INACTIVE") &&
      notExpired &&
      (dueAmount <= 0 || startYmd >= graceCutoffYmd)
    ) {
      await mongoClient.student.update({
        where: { id: sId },
        data: { accountStatus: "ACTIVE", updatedAt: new Date() },
      });
      if (validity.student) validity.student.accountStatus = "ACTIVE";
      reactivated = true;
      if (previousStatus === "INACTIVE") {
        seatRecovery = await attemptSeatRecoveryOnReactivation({
          client: mongoClient,
          validity,
          studentId: sId,
          previousStatus,
          newStatus: "ACTIVE",
          branchId: req.user.branchId,
        });
      }
    }

    try {
      clearStatsCache();
      cache.invalidateBranch(req.user ? req.user.branchId : 1);
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: seatRecovery.seat_prompt || "Student validity saved successfully",
      data: {
        ...formatValidity(validity),
        reactivated,
        account_status: validity.student ? validity.student.accountStatus : previousStatus,
        seat_status: seatRecovery.status,
        seat_reassignment_required: seatRecovery.seat_reassignment_required,
        restored_seat_number: seatRecovery.restored_seat_number,
        previous_seat_number: seatRecovery.previous_seat_number,
        seat_prompt: seatRecovery.seat_prompt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save student validity",
      error: error.message,
    });
  }
};

module.exports = {
  getStudentValidities,
  createOrUpdateStudentValidity,
};