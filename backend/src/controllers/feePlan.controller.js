const prisma = require("../config/prisma");

const formatFeePlan = (fp) => ({
  id: fp.id,
  plan_name: fp.planName,
  duration_days: fp.durationDays,
  amount: fp.amount ? Number(fp.amount) : 0,
  is_active: fp.isActive,
  plan_type: fp.planType || "RESERVED",
});

const getFeePlans = async (req, res) => {
  try {
    // Ensure default Registration Fee plan exists (100 INR demo plan)
    let regPlan = await prisma.feePlan.findFirst({
      where: { planType: "REGISTRATION", branchId: req.user.branchId },
    });

    if (!regPlan) {
      await prisma.feePlan.create({
        data: {
          planName: "Registration Fee",
          durationDays: 36500,
          amount: 100,
          registrationFee: 0,
          planType: "REGISTRATION",
          isActive: true,
          branchId: req.user.branchId,
        },
      });
    }

    const plans = await prisma.feePlan.findMany({
      where: { branchId: req.user.branchId },
      orderBy: [
        { isActive: "desc" },
        { id: "desc" },
      ],
    });

    res.json({
      success: true,
      data: plans.map(formatFeePlan),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch fee plans",
      error: error.message,
    });
  }
};

const createFeePlan = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage fee plans" });
    }

    const { plan_name, duration_days = 365, amount, plan_type = "RESERVED" } = req.body;

    if (!plan_name || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "plan_name and amount are required",
      });
    }

    const validPlanTypes = ["RESERVED", "UNRESERVED"];
    const finalPlanType = validPlanTypes.includes(plan_type) ? plan_type : "RESERVED";

    const durationDaysInt = parseInt(duration_days) || 365;
    const amountFloat = parseFloat(amount);

    if (durationDaysInt <= 0 || amountFloat < 0) {
      return res.status(400).json({
        success: false,
        message: "duration_days must be greater than 0 and amounts cannot be negative",
      });
    }

    const newPlan = await prisma.feePlan.create({
      data: {
        planName: plan_name,
        durationDays: durationDaysInt,
        amount: amountFloat,
        registrationFee: 0,
        planType: finalPlanType,
        branchId: req.user.branchId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Fee plan created successfully",
      data: formatFeePlan(newPlan),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An active fee plan with this name already exists. Deactivate old plan first.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create fee plan",
      error: error.message,
    });
  }
};

const updateFeePlan = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage fee plans" });
    }

    const { id } = req.params;
    const { plan_name, duration_days = 365, amount, plan_type = "RESERVED" } = req.body;

    if (!plan_name || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "plan_name and amount are required",
      });
    }

    const existingPlan = await prisma.feePlan.findFirst({
      where: { id: parseInt(id), branchId: req.user.branchId },
    });

    if (!existingPlan) {
      return res.status(404).json({ success: false, message: "Fee plan not found" });
    }

    const validPlanTypes = ["RESERVED", "UNRESERVED"];
    const finalPlanType = validPlanTypes.includes(plan_type) ? plan_type : "RESERVED";

    const durationDaysInt = parseInt(duration_days) || 365;
    const amountFloat = parseFloat(amount);

    if (durationDaysInt <= 0 || amountFloat < 0) {
      return res.status(400).json({
        success: false,
        message: "duration_days must be greater than 0 and amounts cannot be negative",
      });
    }

    const updatedPlan = await prisma.feePlan.update({
      where: { id: parseInt(id) },
      data: {
        planName: plan_name,
        durationDays: durationDaysInt,
        amount: amountFloat,
        registrationFee: 0,
        planType: finalPlanType,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Fee plan updated and activated successfully",
      data: formatFeePlan(updatedPlan),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Another active fee plan with this name already exists.",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Fee plan not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update fee plan",
      error: error.message,
    });
  }
};

const deactivateFeePlan = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage fee plans" });
    }

    const { id } = req.params;
    const fpId = parseInt(id);

    const existing = await prisma.feePlan.findFirst({
      where: { id: fpId, branchId: req.user.branchId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Fee plan not found",
      });
    }

    const newStatus = !existing.isActive;

    const updated = await prisma.feePlan.update({
      where: { id: fpId },
      data: {
        isActive: newStatus,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `Fee plan ${newStatus ? "activated" : "deactivated"} successfully`,
      data: formatFeePlan(updated),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update fee plan status",
      error: error.message,
    });
  }
};

const deleteFeePlan = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage fee plans" });
    }

    const { id } = req.params;
    const fpId = parseInt(id);

    const existing = await prisma.feePlan.findFirst({
      where: { id: fpId, branchId: req.user.branchId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Fee plan not found" });
    }

    const deleted = await prisma.feePlan.delete({
      where: { id: fpId },
    });

    res.json({
      success: true,
      message: "Fee plan deleted permanently",
      data: {
        id: deleted.id,
        plan_name: deleted.planName,
      },
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Fee plan not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete fee plan",
      error: error.message,
    });
  }
};

module.exports = {
  getFeePlans,
  createFeePlan,
  updateFeePlan,
  deactivateFeePlan,
  deleteFeePlan,
};