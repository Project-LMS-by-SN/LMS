const mongoClient = require("../config/mongoClient");
const cache = require("../utils/cache");

// Per-branch mutex so concurrent double-click requests cannot race past overlap/duplicate checks
const branchShiftLocks = new Map();
const withBranchShiftLock = async (branchId, task) => {
  const key = String(branchId ?? "default");
  const prev = branchShiftLocks.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const chained = prev.then(() => current);
  branchShiftLocks.set(key, chained);
  await prev;
  try {
    return await task();
  } finally {
    release();
    if (branchShiftLocks.get(key) === chained) {
      branchShiftLocks.delete(key);
    }
  }
};

const formatShift = (s) => ({
  id: s.id,
  shift_name: s.shiftName,
  start_time: s.startTime,
  end_time: s.endTime,
  is_active: s.isActive,
});

const parseShiftMinutes = (t) => {
  if (!t) return null;
  const raw = String(t).trim().toUpperCase();
  const hasPM = raw.includes("PM");
  const hasAM = raw.includes("AM");
  const cleaned = raw.replace(/[^0-9:]/g, "");
  const parts = cleaned.split(":");
  if (parts.length < 2 || parts[0] === "" || parts[1] === "") return null;

  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1].slice(0, 2), 10);
  if (isNaN(h) || isNaN(m) || m < 0 || m > 59) return null;

  if (hasPM || hasAM) {
    if (h < 1 || h > 12) return null;
    if (hasPM && h < 12) h += 12;
    if (hasAM && h === 12) h = 0;
  } else if (h < 0 || h > 23) {
    return null;
  }

  return h * 60 + m;
};

const formatShiftTime12Hr = (t) => {
  const mins = parseShiftMinutes(t);
  if (mins === null) return String(t || "").slice(0, 5);
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

const checkTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = parseShiftMinutes(start1);
  const e1Raw = parseShiftMinutes(end1);
  const s2 = parseShiftMinutes(start2);
  const e2Raw = parseShiftMinutes(end2);
  if (s1 === null || e1Raw === null || s2 === null || e2Raw === null) return false;
  if (s1 === e1Raw || s2 === e2Raw) return true;

  const e1 = e1Raw > s1 ? e1Raw : e1Raw + 1440;
  const e2 = e2Raw > s2 ? e2Raw : e2Raw + 1440;

  for (const offset of [-1440, 0, 1440]) {
    const oStart = s2 + offset;
    const oEnd = e2 + offset;
    if (s1 < oEnd && oStart < e1) {
      return true;
    }
  }
  return false;
};

const getShifts = async (req, res) => {
  try {
    const branchId = req.user.branchId || 1;
    const cacheKey = `branch_${branchId}_shifts`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
      });
    }

    const shifts = await mongoClient.shift.findMany({
      where: { branchId: req.user.branchId },
      orderBy: { id: "asc" },
    });

    const formatted = shifts.map(formatShift);
    cache.set(cacheKey, formatted, 30000);

    res.json({
      success: true,
      data: formatted,
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

    const startMins = parseShiftMinutes(start_time);
    const endMins = parseShiftMinutes(end_time);
    if (startMins === null || endMins === null) {
      return res.status(400).json({
        success: false,
        message: "Invalid start_time or end_time format",
      });
    }
    if (startMins === endMins) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time cannot be the same",
      });
    }

    const newShift = await withBranchShiftLock(req.user.branchId, async () => {
      // Re-check inside per-branch lock so concurrent requests cannot race past overlap/duplicate checks
      const activeShifts = await mongoClient.shift.findMany({ where: { isActive: true, branchId: req.user.branchId } });
      const trimmedName = String(shift_name).trim().toLowerCase();
      for (const existing of activeShifts) {
        if (String(existing.shiftName || "").trim().toLowerCase() === trimmedName) {
          const dupErr = new Error("Shift name already exists in this branch");
          dupErr.statusCode = 409;
          throw dupErr;
        }
        if (checkTimeOverlap(start_time, end_time, existing.startTime, existing.endTime)) {
          const overlapErr = new Error(
            `Time overlap with "${existing.shiftName}" (${formatShiftTime12Hr(existing.startTime)} - ${formatShiftTime12Hr(existing.endTime)})`
          );
          overlapErr.statusCode = 400;
          throw overlapErr;
        }
      }

      return mongoClient.shift.create({
        data: {
          shiftName: String(shift_name).trim(),
          startTime: start_time,
          endTime: end_time,
          branchId: req.user.branchId,
        },
      });
    });

    cache.invalidateBranch(req.user.branchId);

    res.status(201).json({
      success: true,
      message: "Shift created successfully",
      data: formatShift(newShift),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    if (error.code === "P2002" || error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Shift name already exists in this branch",
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

    const shift = await mongoClient.shift.findFirst({ where: { id: shiftId, branchId: req.user.branchId } });
    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active assignments for active students whose validity has not expired
    const activeAssignments = await mongoClient.studentShiftAssignment.findMany({
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
    await mongoClient.studentShiftAssignment.deleteMany({
      where: { shiftId: shiftId },
    });

    const deletedShift = await mongoClient.shift.delete({
      where: { id: shiftId },
    });

    cache.invalidateBranch(req.user.branchId);

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

    const startMins = parseShiftMinutes(start_time);
    const endMins = parseShiftMinutes(end_time);
    if (startMins === null || endMins === null) {
      return res.status(400).json({
        success: false,
        message: "Invalid start_time or end_time format",
      });
    }
    if (startMins === endMins) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time cannot be the same",
      });
    }

    const shiftId = parseInt(id);

    const updatedShift = await withBranchShiftLock(req.user.branchId, async () => {
      const existingShift = await mongoClient.shift.findFirst({
        where: { id: shiftId, branchId: req.user.branchId },
      });

      if (!existingShift) {
        const notFoundErr = new Error("Shift not found");
        notFoundErr.statusCode = 404;
        throw notFoundErr;
      }

      const willBeActive = is_active !== undefined ? Boolean(is_active) : existingShift.isActive;

      // Check overlap with other active shifts (same branch, excluding itself)
      if (willBeActive) {
        const otherShifts = await mongoClient.shift.findMany({
          where: { isActive: true, id: { not: shiftId }, branchId: req.user.branchId },
        });
        for (const other of otherShifts) {
          if (checkTimeOverlap(start_time, end_time, other.startTime, other.endTime)) {
            const overlapErr = new Error(
              `Time overlap with "${other.shiftName}" (${formatShiftTime12Hr(other.startTime)} - ${formatShiftTime12Hr(other.endTime)})`
            );
            overlapErr.statusCode = 400;
            throw overlapErr;
          }
        }
      }

      return mongoClient.shift.update({
        where: { id: shiftId },
        data: {
          shiftName: String(shift_name).trim(),
          startTime: start_time,
          endTime: end_time,
          isActive: is_active !== undefined ? Boolean(is_active) : existingShift.isActive,
          updatedAt: new Date(),
        },
      });
    });

    cache.invalidateBranch(req.user.branchId);

    res.json({
      success: true,
      message: "Shift updated successfully",
      data: formatShift(updatedShift),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    if (error.code === "P2002" || error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Shift name already exists in this branch",
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
  checkTimeOverlap,
  parseShiftMinutes,
};