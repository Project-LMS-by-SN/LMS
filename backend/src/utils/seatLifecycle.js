const mongoClient = require("../config/mongoClient");

/**
 * Explicitly clears seatId -> null on all active shift assignments for given student IDs
 * while preserving the old seatId in previousSeatId so reactivation can restore it if still free.
 */
const releaseStudentSeats = async (studentIds, client = mongoClient) => {
  const uniqueIds = [...new Set((studentIds || []).map(Number).filter(Boolean))];
  if (uniqueIds.length === 0) return { releasedCount: 0, assignments: [] };

  const validities = await client.studentValidity.findMany({
    where: { studentId: { in: uniqueIds } },
    select: { id: true, studentId: true },
  });
  const validityIds = validities.map((v) => v.id);
  if (validityIds.length === 0) return { releasedCount: 0, assignments: [] };

  const assignments = await client.studentShiftAssignment.findMany({
    where: {
      validityId: { in: validityIds },
      assignmentStatus: "ACTIVE",
      seatId: { not: null },
    },
  });

  if (assignments.length === 0) return { releasedCount: 0, assignments: [] };

  const now = new Date();
  for (const a of assignments) {
    await client.studentShiftAssignment.update({
      where: { id: a.id },
      data: {
        previousSeatId: a.seatId,
        seatId: null,
        seatReleasedAt: now,
        updatedAt: now,
      },
    });
  }

  return { releasedCount: assignments.length, assignments };
};

/**
 * Safety reconciliation: ensures any student already in INACTIVE or DISABLED state
 * does not hold a lingering non-null seatId in StudentShiftAssignment.
 */
const reconcileInactiveStudentSeats = async (branchId, client = mongoClient) => {
  const inactiveOrDisabled = await client.student.findMany({
    where: {
      accountStatus: { in: ["INACTIVE", "DISABLED"] },
      deletedAt: null,
      ...(branchId ? { branchId } : {}),
    },
    select: { id: true },
  });
  if (!inactiveOrDisabled || inactiveOrDisabled.length === 0) return 0;
  const { releasedCount } = await releaseStudentSeats(
    inactiveOrDisabled.map((s) => s.id),
    client
  );
  return releasedCount;
};

/**
 * When a previously INACTIVE or DISABLED student reactivates to ACTIVE:
 * - If accessType is RESERVED and their old seat (previousSeatId) is active & unoccupied
 *   in all of their active shifts, restore seatId automatically.
 * - If the old seat is already occupied (reassigned) or unavailable, leave seatId = null
 *   (Floating / Unassigned) and return seat_reassignment_required: true with an alert prompt.
 */
const attemptSeatRecoveryOnReactivation = async ({
  client = mongoClient,
  validity = null,
  studentId,
  previousStatus,
  newStatus,
  branchId = null,
}) => {
  const emptyResult = {
    status: "NONE",
    seat_reassignment_required: false,
    restored_seat_number: null,
    previous_seat_number: null,
    seat_prompt: null,
  };

  if (newStatus !== "ACTIVE" || !studentId) return emptyResult;

  const resolvedValidity =
    validity ||
    (await client.studentValidity.findFirst({
      where: { studentId },
      orderBy: { id: "desc" },
    }));

  if (!resolvedValidity || resolvedValidity.accessType !== "RESERVED") {
    return { ...emptyResult, status: "UNRESERVED" };
  }

  const activeAssignments = await client.studentShiftAssignment.findMany({
    where: {
      validityId: resolvedValidity.id,
      assignmentStatus: "ACTIVE",
    },
  });

  if (!activeAssignments || activeAssignments.length === 0) {
    return { ...emptyResult, status: "NO_ACTIVE_SHIFTS" };
  }

  const alreadyHasSeat = activeAssignments.some((a) => a.seatId !== null && a.seatId !== undefined);
  if (alreadyHasSeat) {
    return { ...emptyResult, status: "KEPT" };
  }

  // Only INACTIVE or DISABLED members could have released seats; still check previousSeatId cleanly
  if (previousStatus !== "INACTIVE" && previousStatus !== "DISABLED") {
    return {
      status: "FLOATING_UNASSIGNED",
      seat_reassignment_required: true,
      restored_seat_number: null,
      previous_seat_number: null,
      seat_prompt: "Seat was reassigned. Please allocate a new seat.",
    };
  }

  const assignmentWithPrevSeat = activeAssignments.find(
    (a) => a.previousSeatId !== null && a.previousSeatId !== undefined
  );
  const prevSeatId = assignmentWithPrevSeat ? assignmentWithPrevSeat.previousSeatId : null;

  if (!prevSeatId) {
    return {
      status: "FLOATING_UNASSIGNED",
      seat_reassignment_required: true,
      restored_seat_number: null,
      previous_seat_number: null,
      seat_prompt: "Seat was reassigned. Please allocate a new seat.",
    };
  }

  const activeSeat = await client.seat.findFirst({
    where: {
      id: prevSeatId,
      isActive: true,
      deletedAt: null,
      ...(branchId ? { branchId } : {}),
    },
  });

  const anySeatMeta = activeSeat || (await client.seat.findFirst({ where: { id: prevSeatId } }));
  const shiftIds = activeAssignments.map((a) => a.shiftId);

  let conflict = null;
  if (activeSeat) {
    conflict = await client.studentShiftAssignment.findFirst({
      where: {
        seatId: prevSeatId,
        shiftId: { in: shiftIds },
        assignmentStatus: "ACTIVE",
        validity: {
          student: {
            id: { not: studentId },
            deletedAt: null,
            ...(branchId ? { branchId } : {}),
            accountStatus: { in: ["ACTIVE", "SUSPENDED"] },
          },
        },
      },
    });
  }

  const now = new Date();
  if (activeSeat && !conflict) {
    for (const a of activeAssignments) {
      if (a.seatId === null || a.seatId === undefined) {
        await client.studentShiftAssignment.update({
          where: { id: a.id },
          data: {
            seatId: prevSeatId,
            previousSeatId: null,
            seatReleasedAt: null,
            updatedAt: now,
          },
        });
      }
    }
    return {
      status: "REASSIGNED",
      seat_reassignment_required: false,
      restored_seat_number: activeSeat.seatNumber,
      previous_seat_number: activeSeat.seatNumber,
      seat_prompt: null,
    };
  }

  // Seat occupied by another member or seat was removed/deactivated -> keep Floating (seatId = null)
  for (const a of activeAssignments) {
    await client.studentShiftAssignment.update({
      where: { id: a.id },
      data: {
        seatId: null,
        previousSeatId: null,
        updatedAt: now,
      },
    });
  }

  return {
    status: "OCCUPIED_FLOATING",
    seat_reassignment_required: true,
    restored_seat_number: null,
    previous_seat_number: anySeatMeta ? anySeatMeta.seatNumber : null,
    seat_prompt: "Seat was reassigned. Please allocate a new seat.",
  };
};

module.exports = {
  releaseStudentSeats,
  reconcileInactiveStudentSeats,
  attemptSeatRecoveryOnReactivation,
};

