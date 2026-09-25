const prisma = require("../config/prisma");

const formatShift = (s) => ({
  id: s.id,
  shift_name: s.shiftName,
  start_time: s.startTime,
  end_time: s.endTime,
  is_active: s.isActive,
});

const checkTimeOverlap = (start1, end1, start2, end2) => {
  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const s1 = toMinutes(start1), e1 = toMinutes(end1);
  const s2 = toMinutes(start2), e2 = toMinutes(end2);
  return s1 < e2 && s2 < e1;
};

const getShifts = async (req, res) => {
  try {
    const shifts = await prisma.shift.findMany({
      where: { branchId: req.user.branchId },
      orderBy: { id: "asc" },
    });

    res.json({
      success: true,
      data: shifts.map(formatShift),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch shifts",
      error: error.message,
    });
  }
};

const createShift = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage shifts" });
    }

    const { shift_name, start_time, end_time } = req.body;

    if (!shift_name || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: "shift_name, start_time, and end_time are required",
      });
    }

    // Check overlap with existing active shifts (same branch only)
    const activeShifts = await prisma.shift.findMany({ where: { isActive: true, branchId: req.user.branchId } });
    for (const existing of activeShifts) {
      if (checkTimeOverlap(start_time, end_time, existing.startTime, existing.endTime)) {
        return res.status(400).json({
          success: false,
          message: `Time overlap with "${existing.shiftName}" (${existing.startTime.slice(0, 5)} - ${existing.endTime.slice(0, 5)})`,
        });
      }
    }

    const newShift = await prisma.shift.create({
      data: {
        shiftName: shift_name,
        startTime: start_time,
        endTime: end_time,
        branchId: req.user.branchId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Shift created successfully",
      data: formatShift(newShift),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Shift name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create shift",
      error: error.message,
    });
  }
};

const deleteShift = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage shifts" });
    }

    const { id } = req.params;
    const shiftId = parseInt(id);

    const shift = await prisma.shift.findFirst({ where: { id: shiftId, branchId: req.user.branchId } });
    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active assignments for active students whose validity has not expired
    const activeAssignments = await prisma.studentShiftAssignment.findMany({
      where: {
        shiftId: shiftId,
        assignmentStatus: "ACTIVE",
        validity: {
          endDate: { gte: today },
          student: {
            accountStatus: "ACTIVE",
            deletedAt: null,
          },
        },
      },
      include: {
        validity: {
          include: {
            student: {
              select: { fullName: true, studentCode: true },
            },
          },
        },
      },
    });

    if (activeAssignments.length > 0) {
      const studentNames = activeAssignments
        .map((a) => `${a.validity?.student?.fullName || "Student"} (${a.validity?.student?.studentCode || ""})`)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: `This shift is currently allocated to active student(s): ${studentNames}. Please reassign or remove them first.`,
      });
    }

    // Clean up all inactive / historical / orphan assignments for this shift so deletion succeeds
    await prisma.studentShiftAssignment.deleteMany({
      where: { shiftId: shiftId },
    });

    const deletedShift = await prisma.shift.delete({
      where: { id: shiftId },
    });

    res.json({
      success: true,
      message: "Shift deleted successfully",
      data: {
        id: deletedShift.id,
        shift_name: deletedShift.shiftName,
      },
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete shift",
      error: error.message,
    });
  }
};

const updateShift = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage shifts" });
    }

    const { id } = req.params;
    const { shift_name, start_time, end_time, is_active } = req.body;

    if (!shift_name || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: "shift_name, start_time, and end_time are required",
      });
    }

    const shiftId = parseInt(id);

    const existingShift = await prisma.shift.findFirst({
      where: { id: shiftId, branchId: req.user.branchId },
    });

    if (!existingShift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    // Check overlap with other active shifts (same branch, excluding itself)
    const otherShifts = await prisma.shift.findMany({
      where: { isActive: true, id: { not: shiftId }, branchId: req.user.branchId },
    });
    for (const other of otherShifts) {
      if (checkTimeOverlap(start_time, end_time, other.startTime, other.endTime)) {
        return res.status(400).json({
          success: false,
          message: `Time overlap with "${other.shiftName}" (${other.startTime.slice(0, 5)} - ${other.endTime.slice(0, 5)})`,
        });
      }
    }

    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        shiftName: shift_name,
        startTime: start_time,
        endTime: end_time,
        isActive: is_active !== undefined ? Boolean(is_active) : existingShift.isActive,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Shift updated successfully",
      data: formatShift(updatedShift),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Shift name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update shift",
      error: error.message,
    });
  }
};

module.exports = {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
};