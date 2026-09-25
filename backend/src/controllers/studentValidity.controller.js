const prisma = require("../config/prisma");
const { formatDateStr } = require("../utils/format");

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
    const validities = await prisma.studentValidity.findMany({
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

    if (access_type !== "RESERVED" && access_type !== "UNRESERVED") {
      return res.status(400).json({
        success: false,
        message: "Invalid access_type. Use RESERVED or UNRESERVED",
      });
    }

    // Calculate end date based on plan duration (start_date + duration_days - 1)
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + (feePlan.durationDays - 1));

    const finalAmount = custom_amount !== undefined && custom_amount !== null && custom_amount !== "" ? parseFloat(custom_amount) : feePlan.amount;

    const validity = await prisma.studentValidity.upsert({
      where: { studentId: sId },
      update: {
        feePlanId: fpId,
        startDate: startDateObj,
        endDate: endDateObj,
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
    });

    res.status(201).json({
      success: true,
      message: "Student validity saved successfully",
      data: formatValidity(validity),
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