const prisma = require("../config/prisma");

const parseSeatNumber = (seatNumber) => {
  const match = seatNumber.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return { prefix: seatNumber, num: 0 };
  return { prefix: match[1].toUpperCase(), num: parseInt(match[2], 10) };
};

const renumberAllSeats = async (branchId) => {
  const seats = await prisma.seat.findMany({ where: { branchId }, orderBy: { id: "asc" } });
  if (seats.length === 0) return 0;

  const groups = {};
  seats.forEach((s) => {
    const { prefix } = parseSeatNumber(s.seatNumber);
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(s);
  });

  let renamed = 0;
  const updates = [];

  for (const prefix of Object.keys(groups).sort()) {
    const group = groups[prefix];
    group.sort((a, b) => parseSeatNumber(a.seatNumber).num - parseSeatNumber(b.seatNumber).num);
    for (let i = 0; i < group.length; i++) {
      const newName = `${prefix}${i + 1}`;
      if (group[i].seatNumber !== newName) {
        updates.push({ id: group[i].id, newName, oldName: group[i].seatNumber });
      }
    }
  }

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map((u) =>
        prisma.seat.update({ where: { id: u.id }, data: { seatNumber: u.newName } })
      )
    );
  }

  return updates.length;
};

const getSeats = async (req, res) => {
  try {
    const seats = await prisma.seat.findMany({
      where: { branchId: req.user.branchId },
      include: {
        assignments: {
          where: {
            assignmentStatus: "ACTIVE",
            validity: {
              student: {
                deletedAt: null,
                accountStatus: { in: ["ACTIVE", "SUSPENDED"] },
              },
            },
          },
          include: {
            shift: true,
            validity: {
              include: {
                student: true,
              },
            },
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const formattedData = seats.map((s) => {
      const activeAssignments = s.assignments || [];
      const isOccupied = activeAssignments.length > 0;
      const occupiedShifts = activeAssignments.map((a) => ({
        shift_id: a.shiftId,
        shift_name: a.shift.shiftName,
        start_time: a.shift.startTime ? a.shift.startTime.substring(0, 5) : null,
        end_time: a.shift.endTime ? a.shift.endTime.substring(0, 5) : null,
        student_name: a.validity.student.fullName,
        student_code: a.validity.student.studentCode,
      }));

      return {
        id: s.id,
        seat_number: s.seatNumber,
        floor: s.floor || "1",
        room: s.room || "A1",
        section: s.section || "",
        is_active: s.isActive,
        is_occupied: isOccupied,
        occupied_shifts: occupiedShifts.length > 0 ? occupiedShifts : [],
      };
    });

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch seats",
      error: error.message,
    });
  }
};

const createSeat = async (req, res) => {
  try {
    const { seat_number, floor, room, section } = req.body;

    if (!seat_number) {
      return res.status(400).json({
        success: false,
        message: "seat_number is required",
      });
    }

    if (!floor || !floor.trim()) {
      return res.status(400).json({
        success: false,
        message: "floor is required",
      });
    }

    if (!room || !room.trim()) {
      return res.status(400).json({
        success: false,
        message: "room is required",
      });
    }

    const branchId = req.user.branchId;

    const seatNumTrimmed = seat_number.trim().toUpperCase();
    const match = seatNumTrimmed.match(/^([A-Z]+)\d+$/);
    const prefix = match ? match[1] : null;

    if (prefix) {
      const existingPrefixSeat = await prisma.seat.findFirst({
        where: {
          branchId,
          seatNumber: { startsWith: prefix },
        },
      });

      if (existingPrefixSeat) {
        return res.status(400).json({
          success: false,
          message: `Prefix "${prefix}" is already in use by existing seats (${existingPrefixSeat.seatNumber}). Please select a different prefix letter (e.g. B, C, D...).`,
        });
      }
    }

    const newSeat = await prisma.seat.create({
      data: {
        seatNumber: seatNumTrimmed,
        floor: floor ? floor.trim() : null,
        room: room ? room.trim() : null,
        section: section ? section.trim().toUpperCase() : null,
        branchId: branchId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Seat created successfully",
      data: {
        id: newSeat.id,
        seat_number: newSeat.seatNumber,
        floor: newSeat.floor,
        room: newSeat.room,
        section: newSeat.section,
        is_active: newSeat.isActive,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Seat number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create seat",
      error: error.message,
    });
  }
};

const updateSeat = async (req, res) => {
  try {
    const { id } = req.params;
    const { seat_number, floor, room, section } = req.body;

    const existing = await prisma.seat.findFirst({ where: { id: parseInt(id), branchId: req.user.branchId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Seat not found" });
    }

    const updatedSeat = await prisma.seat.update({
      where: { id: parseInt(id) },
      data: {
        seatNumber: seat_number !== undefined ? seat_number.trim().toUpperCase() : existing.seatNumber,
        floor: floor !== undefined ? (floor ? floor.trim() : null) : existing.floor,
        room: room !== undefined ? (room ? room.trim() : null) : existing.room,
        section: section !== undefined ? (section ? section.trim().toUpperCase() : null) : existing.section,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Seat updated successfully",
      data: {
        id: updatedSeat.id,
        seat_number: updatedSeat.seatNumber,
        floor: updatedSeat.floor,
        room: updatedSeat.room,
        section: updatedSeat.section,
        is_active: updatedSeat.isActive,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Seat number already exists",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update seat",
      error: error.message,
    });
  }
};

const deleteSeat = async (req, res) => {
  try {
    const { id } = req.params;
    const seatId = parseInt(id);

    const existing = await prisma.seat.findFirst({ where: { id: seatId, branchId: req.user.branchId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Seat not found" });
    }

    const deletedSeat = await prisma.seat.delete({
      where: { id: seatId },
    });

    await renumberAllSeats(req.user.branchId);

    res.json({
      success: true,
      message: "Seat deleted and seats renumbered successfully",
      data: {
        id: deletedSeat.id,
        seat_number: deletedSeat.seatNumber,
      },
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete seat",
      error: error.message,
    });
  }
};

const createBulkSeats = async (req, res) => {
  try {
    const { seats, floor, room, section } = req.body;

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A non-empty 'seats' array is required",
      });
    }

    if (!floor || !floor.trim()) {
      return res.status(400).json({
        success: false,
        message: "floor is required",
      });
    }

    if (!room || !room.trim()) {
      return res.status(400).json({
        success: false,
        message: "room is required",
      });
    }

    const branchId = req.user.branchId;

    const firstSeatNum = (seats[0] || "").trim().toUpperCase();
    const match = firstSeatNum.match(/^([A-Z]+)\d+$/);
    const prefix = match ? match[1] : null;

    if (prefix) {
      const existingPrefixSeat = await prisma.seat.findFirst({
        where: {
          branchId,
          seatNumber: { startsWith: prefix },
        },
      });

      if (existingPrefixSeat) {
        return res.status(400).json({
          success: false,
          message: `Prefix "${prefix}" is already in use by existing seats (${existingPrefixSeat.seatNumber}). Please select a different prefix letter (e.g. B, C, D...).`,
        });
      }
    }

    let created = 0;
    let skipped = 0;
    for (const seatNumber of seats) {
      try {
        await prisma.seat.create({
          data: {
            seatNumber: seatNumber.trim().toUpperCase(),
            floor: floor ? floor.trim() : null,
            room: room ? room.trim() : null,
            section: section ? section.trim().toUpperCase() : null,
            branchId: branchId,
          },
        });
        created++;
      } catch (e) {
        if (e.code === "P2002") { skipped++; }
        else throw e;
      }
    }

    const createdSeats = await prisma.seat.findMany({
      where: { seatNumber: { in: seats.map(s => s.trim().toUpperCase()) } },
    });

    const formattedSeats = createdSeats.map((s) => ({
      id: s.id,
      seat_number: s.seatNumber,
      floor: s.floor,
      room: s.room,
      section: s.section,
      is_active: s.isActive,
    }));

    res.status(201).json({
      success: true,
      message: `${created} seats created successfully.${skipped > 0 ? ` ${skipped} duplicates skipped.` : ""}`,
      data: formattedSeats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create bulk seats",
      error: error.message,
    });
  }
};

const toggleSeatActive = async (req, res) => {
  try {
    const { id } = req.params;
    const seatId = parseInt(id);

    const seat = await prisma.seat.findFirst({ where: { id: seatId, branchId: req.user.branchId } });
    if (!seat) {
      return res.status(404).json({ success: false, message: "Seat not found" });
    }

    if (seat.isActive) {
      const activeAssignments = await prisma.studentShiftAssignment.count({
        where: {
          seatId: seatId,
          assignmentStatus: "ACTIVE",
          validity: {
            student: {
              deletedAt: null,
              accountStatus: { in: ["ACTIVE", "SUSPENDED"] },
            },
          },
        },
      });
      if (activeAssignments > 0) {
        return res.status(400).json({
          success: false,
          message: "Allocated seat cannot be disabled. It is currently assigned to an active student.",
        });
      }
    }

    const updated = await prisma.seat.update({
      where: { id: seatId },
      data: { isActive: !seat.isActive, updatedAt: new Date() },
    });

    res.json({
      success: true,
      message: `Seat ${updated.seatNumber} is now ${updated.isActive ? "active" : "inactive"}.`,
      data: { id: updated.id, seat_number: updated.seatNumber, is_active: updated.isActive },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle seat status", error: error.message });
  }
};

const renumberSeats = async (req, res) => {
  try {
    const renamedCount = await renumberAllSeats(req.user.branchId);
    res.json({
      success: true,
      message: renamedCount > 0 ? `${renamedCount} seats renumbered successfully` : "All seats already in sequence",
      data: { renamed: renamedCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to renumber seats", error: error.message });
  }
};

const deleteBulkSeats = async (req, res) => {
  try {
    const { seat_ids } = req.body;

    if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A non-empty 'seat_ids' array is required",
      });
    }

    const ids = seat_ids.map(Number).filter(Boolean);

    const result = await prisma.seat.deleteMany({
      where: { id: { in: ids }, branchId: req.user.branchId },
    });

    await renumberAllSeats(req.user.branchId);

    res.json({
      success: true,
      message: `${result.count} seat(s) deleted and seats renumbered successfully`,
      data: { deleted: result.count },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete seats", error: error.message });
  }
};

module.exports = {
  getSeats,
  createSeat,
  createBulkSeats,
  updateSeat,
  deleteSeat,
  deleteBulkSeats,
  toggleSeatActive,
  renumberSeats,
  renumberAllSeats,
};
