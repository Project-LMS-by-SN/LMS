const prisma = require("../config/prisma");

const formatAssignment = (a) => ({
  id: a.id,
  validity_id: a.validityId,
  student_id: a.validity ? a.validity.studentId : undefined,
  full_name: a.validity && a.validity.student ? a.validity.student.fullName : undefined,
  student_code: a.validity && a.validity.student ? a.validity.student.studentCode : undefined,
  shift_id: a.shiftId,
  shift_name: a.shift ? a.shift.shiftName : undefined,
  start_time: a.shift ? a.shift.startTime : undefined,
  end_time: a.shift ? a.shift.endTime : undefined,
  seat_id: a.seatId,
  seat_number: a.seat ? a.seat.seatNumber : undefined,
  access_type: a.validity ? a.validity.accessType : undefined,
  assignment_status: a.assignmentStatus,
});

const getStudentShiftAssignments = async (req, res) => {
  try {
    const assignments = await prisma.studentShiftAssignment.findMany({
      where: {
        validity: {
          student: {
            deletedAt: null,
            accountStatus: { in: ["ACTIVE", "SUSPENDED"] },
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
        shift: true,
        seat: true,
      },
      orderBy: { id: "desc" },
    });

    res.json({
      success: true,
      data: assignments.map(formatAssignment),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch shift assignments",
      error: error.message,
    });
  }
};

const createStudentShiftAssignment = async (req, res) => {
  try {
    const { validity_id, shift_id, seat_id } = req.body;

    if (!validity_id || !shift_id) {
      return res.status(400).json({
        success: false,
        message: "validity_id and shift_id are required",
      });
    }

    const valId = parseInt(validity_id);
    const shId = parseInt(shift_id);
    const stId = seat_id ? parseInt(seat_id) : null;

    // Check validity (must belong to same branch)
    const validity = await prisma.studentValidity.findFirst({
      where: { id: valId, student: { branchId: req.user.branchId } },
    });

    if (!validity) {
      return res.status(400).json({
        success: false,
        message: "Invalid validity_id",
      });
    }

    const accessType = validity.accessType;

    if (accessType === "RESERVED" && !stId) {
      return res.status(400).json({
        success: false,
        message: "seat_id is required for RESERVED access type",
      });
    }

    if (accessType === "UNRESERVED" && stId) {
      return res.status(400).json({
        success: false,
        message: "seat_id should not be given for UNRESERVED access type",
      });
    }

    // Check if shift is active (same branch)
    const shift = await prisma.shift.findFirst({
      where: { id: shId, isActive: true, branchId: req.user.branchId },
    });

    if (!shift) {
      return res.status(400).json({
        success: false,
        message: "Invalid/inactive shift or seat",
      });
    }

    // Check if seat is active (same branch)
    if (stId) {
      const seat = await prisma.seat.findFirst({
        where: { id: stId, isActive: true, branchId: req.user.branchId },
      });
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: "Invalid/inactive shift or seat",
        });
      }

      // Enforce same seat for all shifts
      const existingSeatAssignment = await prisma.studentShiftAssignment.findFirst({
        where: {
          validityId: valId,
          assignmentStatus: "ACTIVE",
          seatId: { not: null },
        },
        include: { seat: true },
      });

      if (existingSeatAssignment && existingSeatAssignment.seatId !== stId) {
        return res.status(400).json({
          success: false,
          message: `Student already has seat ${existingSeatAssignment.seat.seatNumber} assigned for another shift. They must use the same seat for all shifts.`,
        });
      }
    }

    // Check if assignment already exists
    const existing = await prisma.studentShiftAssignment.findFirst({
      where: {
        validityId: valId,
        shiftId: shId,
        assignmentStatus: "ACTIVE",
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This shift is already assigned to this validity or this seat is already booked for this shift",
      });
    }

    // Check if seat already booked for this shift
    if (stId) {
      const seatBooked = await prisma.studentShiftAssignment.findFirst({
        where: {
          shiftId: shId,
          seatId: stId,
          assignmentStatus: "ACTIVE",
        },
      });

      if (seatBooked) {
        return res.status(409).json({
          success: false,
          message: "This shift is already assigned to this validity or this seat is already booked for this shift",
        });
      }
    }

    const assignment = await prisma.studentShiftAssignment.create({
      data: {
        validityId: valId,
        shiftId: shId,
        seatId: stId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Shift assigned successfully",
      data: {
        id: assignment.id,
        validity_id: assignment.validityId,
        shift_id: assignment.shiftId,
        seat_id: assignment.seatId,
        assignment_status: assignment.assignmentStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assign shift",
      error: error.message,
    });
  }
};

const createBulkShiftAssignments = async (req, res) => {
  try {
    const { validity_id, shift_ids, seat_id } = req.body;

    if (!validity_id || !shift_ids || !Array.isArray(shift_ids) || shift_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "validity_id and a non-empty shift_ids array are required",
      });
    }

    const valId = parseInt(validity_id);
    const stId = seat_id ? parseInt(seat_id) : null;

    // Check validity (must belong to same branch)
    const validity = await prisma.studentValidity.findFirst({
      where: { id: valId, student: { branchId: req.user.branchId } },
    });

    if (!validity) {
      return res.status(400).json({
        success: false,
        message: "Invalid validity_id",
      });
    }

    const accessType = validity.accessType;

    if (stId && accessType === "UNRESERVED") {
      return res.status(400).json({
        success: false,
        message: "Cannot assign seat for UNRESERVED access type",
      });
    }

    if (!stId && accessType === "RESERVED") {
      return res.status(400).json({
        success: false,
        message: "seat_id is required for RESERVED access type",
      });
    }

    // Enforce same seat for all shifts
    if (stId) {
      const existingSeatAssignment = await prisma.studentShiftAssignment.findFirst({
        where: {
          validityId: valId,
          assignmentStatus: "ACTIVE",
          seatId: { not: null },
        },
        include: { seat: true },
      });

      if (existingSeatAssignment && existingSeatAssignment.seatId !== stId) {
        return res.status(400).json({
          success: false,
          message: `Student already has seat ${existingSeatAssignment.seat.seatNumber} assigned for another shift. They must use the same seat for all shifts.`,
        });
      }
    }

    // Run transaction
    const results = [];
    await prisma.$transaction(async (tx) => {
      for (const shiftId of shift_ids) {
        const shId = parseInt(shiftId);

        // Check if shift is active (same branch)
        const shift = await tx.shift.findFirst({
          where: { id: shId, isActive: true, branchId: req.user.branchId },
        });

        if (!shift) {
          throw new Error(`Invalid or inactive shift_id: ${shiftId}`);
        }

        // Check if seat is active (same branch)
        if (stId) {
          const seat = await tx.seat.findFirst({
            where: { id: stId, isActive: true, branchId: req.user.branchId },
          });
          if (!seat) {
            throw new Error("Invalid or inactive seat");
          }
        }

        // Check duplicate
        const existing = await tx.studentShiftAssignment.findFirst({
          where: {
            validityId: valId,
            shiftId: shId,
            assignmentStatus: "ACTIVE",
          },
        });

        if (existing) {
          const err = new Error("A shift assignment already exists for one of the selected shifts");
          err.code = "DUPLICATE";
          throw err;
        }

        // Check seat availability
        if (stId) {
          const seatBooked = await tx.studentShiftAssignment.findFirst({
            where: {
              shiftId: shId,
              seatId: stId,
              assignmentStatus: "ACTIVE",
            },
          });

          if (seatBooked) {
            const err = new Error("Seat is already booked for this shift");
            err.code = "DUPLICATE";
            throw err;
          }
        }

        const assignment = await tx.studentShiftAssignment.create({
          data: {
            validityId: valId,
            shiftId: shId,
            seatId: stId,
          },
        });

        results.push({
          id: assignment.id,
          validity_id: assignment.validityId,
          shift_id: assignment.shiftId,
          seat_id: assignment.seatId,
          assignment_status: assignment.assignmentStatus,
        });
      }
    });

    res.status(201).json({
      success: true,
      message: `${results.length} shift(s) assigned successfully`,
      data: results,
    });
  } catch (error) {
    if (error.code === "DUPLICATE" || error.message.includes("exists") || error.message.includes("booked")) {
      return res.status(409).json({
        success: false,
        message: "A shift assignment already exists for one of the selected shifts or the seat is booked",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to assign shifts",
      error: error.message,
    });
  }
};

module.exports = {
  getStudentShiftAssignments,
  createStudentShiftAssignment,
  createBulkShiftAssignments,
};