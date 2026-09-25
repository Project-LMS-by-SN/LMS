const prisma = require("../config/prisma");
const { formatDateStr, formatDateTimeStr } = require("../utils/format");

const getDayBounds = (dateInput) => {
  let d;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === "string" && dateInput.includes("-")) {
    const [y, m, day] = dateInput.split("T")[0].split("-").map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(dateInput);
  }
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const formatAttendance = (a) => ({
  id: a.id,
  shift_assignment_id: a.shiftAssignmentId,
  attendance_date: formatDateStr(a.attendanceDate),
  status: a.status,
  check_in_time: a.checkInTime ? a.checkInTime.substring(0, 5) : null,
  check_out_time: a.checkOutTime ? a.checkOutTime.substring(0, 5) : null,
  student_code: a.shiftAssignment?.validity?.student?.studentCode,
  full_name: a.shiftAssignment?.validity?.student?.fullName,
  shift_name: a.shiftAssignment?.shift?.shiftName,
  seat_number: a.shiftAssignment?.seat?.seatNumber || null,
});

const cleanupOldAttendance = async () => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    cutoff.setHours(0, 0, 0, 0);

    const deleted = await prisma.attendance.deleteMany({
      where: {
        attendanceDate: {
          lt: cutoff,
        },
      },
    });
    if (deleted.count > 0) {
      console.log(`Successfully cleaned up ${deleted.count} old attendance records (>30 days).`);
    }
  } catch (error) {
    console.error("Cleanup old attendance error:", error);
  }
};

const getConsecutiveAssignments = (targetAssignment, allAssignments) => {
  // Sort assignments by start time
  const sorted = [...allAssignments].sort((a, b) => {
    return a.shift.startTime.localeCompare(b.shift.startTime);
  });

  const areConsecutive = (s1, s2) => {
    const [h1, m1] = s1.shift.endTime.split(":").map(Number);
    const [h2, m2] = s2.shift.startTime.split(":").map(Number);
    const end1 = h1 * 60 + m1;
    const start2 = h2 * 60 + m2;
    const gap = start2 - end1;
    // consecutive if gap is between 0 and 15 mins (inclusive)
    return gap >= 0 && gap <= 15;
  };

  const targetIdx = sorted.findIndex(a => a.id === targetAssignment.id);
  if (targetIdx === -1) return [targetAssignment];

  const block = [targetAssignment];

  // Traverse forwards from target
  let curr = targetAssignment;
  for (let i = targetIdx + 1; i < sorted.length; i++) {
    if (areConsecutive(curr, sorted[i])) {
      block.push(sorted[i]);
      curr = sorted[i];
    } else {
      break;
    }
  }

  // Traverse backwards from target
  curr = targetAssignment;
  for (let i = targetIdx - 1; i >= 0; i--) {
    if (areConsecutive(sorted[i], curr)) {
      block.unshift(sorted[i]);
      curr = sorted[i];
    } else {
      break;
    }
  }

  return block;
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

const formatMinutesTo12Hr = (totalMinutes) => {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  let hours = Math.floor(m / 60);
  const mins = m % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${ampm}`;
};

const formatTime12Hr = (time24) => {
  if (!time24) return "";
  return formatMinutesTo12Hr(timeToMinutes(time24));
};

const getShiftBlocks = (activeAssignments) => {
  if (!activeAssignments || activeAssignments.length === 0) return [];
  const sorted = [...activeAssignments].sort((a, b) => {
    return (a.shift?.startTime || "").localeCompare(b.shift?.startTime || "");
  });

  const areConsecutive = (s1, s2) => {
    if (!s1?.shift || !s2?.shift) return false;
    const end1 = timeToMinutes(s1.shift.endTime);
    const start2 = timeToMinutes(s2.shift.startTime);
    let gap = start2 - end1;
    if (gap < 0 && end1 > start2) {
      gap = (start2 + 1440) - end1;
    }
    return gap >= 0 && gap <= 15;
  };

  const rawBlocks = [];
  let current = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = current[current.length - 1];
    if (areConsecutive(prev, sorted[i])) {
      current.push(sorted[i]);
    } else {
      rawBlocks.push(current);
      current = [sorted[i]];
    }
  }
  if (current.length > 0) rawBlocks.push(current);

  return rawBlocks.map((b) => {
    const first = b[0].shift;
    const last = b[b.length - 1].shift;
    const startMin = timeToMinutes(first.startTime);
    const endMin = timeToMinutes(last.endTime);
    const crossesMidnight = endMin < startMin;
    const allowedStartMin = (startMin - 30 + 1440) % 1440;

    return {
      assignments: b,
      assignmentIds: b.map((x) => x.id),
      firstShift: first,
      lastShift: last,
      shiftNames: b.map((x) => x.shift.shiftName).join(", "),
      startMin,
      endMin,
      allowedStartMin,
      crossesMidnight,
      isTimeInside(currMin) {
        if (crossesMidnight) {
          return currMin >= allowedStartMin || currMin <= endMin;
        } else {
          return currMin >= allowedStartMin && currMin <= endMin;
        }
      },
    };
  });
};

const groupAttendanceRecords = (attendanceRecords) => {
  if (!attendanceRecords || attendanceRecords.length === 0) return [];

  const groups = {};

  attendanceRecords.forEach((a) => {
    const studentId = a.shiftAssignment?.validity?.studentId || a.shiftAssignment?.validity?.student?.id;
    const dateStr = formatDateStr(a.attendanceDate);
    const key = `${studentId}_${dateStr}`;

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(a);
  });

  const result = [];

  Object.values(groups).forEach((studentDateRecords) => {
    // Sort records by shift startTime
    const sorted = [...studentDateRecords].sort((r1, r2) => {
      const t1 = r1.shiftAssignment?.shift?.startTime || "00:00";
      const t2 = r2.shiftAssignment?.shift?.startTime || "00:00";
      return t1.localeCompare(t2);
    });

    const areConsecutive = (r1, r2) => {
      const s1 = r1.shiftAssignment?.shift;
      const s2 = r2.shiftAssignment?.shift;
      if (!s1 || !s2) return false;
      const [h1, m1] = s1.endTime.split(":").map(Number);
      const [h2, m2] = s2.startTime.split(":").map(Number);
      const end1 = h1 * 60 + m1;
      const start2 = h2 * 60 + m2;
      const gap = start2 - end1;
      return gap >= 0 && gap <= 15;
    };

    const blocks = [];
    let currentBlock = [];

    sorted.forEach((rec) => {
      if (currentBlock.length === 0) {
        currentBlock.push(rec);
      } else {
        const lastRec = currentBlock[currentBlock.length - 1];
        if (areConsecutive(lastRec, rec)) {
          currentBlock.push(rec);
        } else {
          blocks.push(currentBlock);
          currentBlock = [rec];
        }
      }
    });
    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }

    blocks.forEach((block) => {
      const first = block[0];

      if (block.length === 1) {
        result.push(formatAttendance(first));
      } else {
        const shiftNames = block.map((b) => b.shiftAssignment?.shift?.shiftName).filter(Boolean);

        const checkInTimes = block
          .map((b) => b.checkInTime)
          .filter(Boolean)
          .sort();
        const earliestCheckIn = checkInTimes.length > 0 ? checkInTimes[0].substring(0, 5) : null;

        const hasUncheckedOut = block.some((b) => b.checkInTime && !b.checkOutTime);
        let latestCheckOut = null;
        if (!hasUncheckedOut) {
          const checkOutTimes = block
            .map((b) => b.checkOutTime)
            .filter(Boolean)
            .sort();
          if (checkOutTimes.length > 0) {
            latestCheckOut = checkOutTimes[checkOutTimes.length - 1].substring(0, 5);
          }
        }

        const seatNumber = block.find((b) => b.shiftAssignment?.seat?.seatNumber)?.shiftAssignment?.seat?.seatNumber || null;

        result.push({
          id: first.id,
          shift_assignment_id: first.shiftAssignmentId,
          attendance_date: formatDateStr(first.attendanceDate),
          status: block.some((b) => b.status === "PRESENT") ? "PRESENT" : first.status,
          check_in_time: earliestCheckIn,
          check_out_time: latestCheckOut,
          student_code: first.shiftAssignment?.validity?.student?.studentCode,
          full_name: first.shiftAssignment?.validity?.student?.fullName,
          shift_name: `${block.length} Shifts (${shiftNames.join(", ")})`,
          seat_number: seatNumber,
        });
      }
    });
  });

  result.sort((a, b) => {
    if (a.attendance_date !== b.attendance_date) {
      return b.attendance_date.localeCompare(a.attendance_date);
    }
    return b.id - a.id;
  });

  return result;
};

const getAttendance = async (req, res) => {
  try {
    await cleanupOldAttendance();
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        shiftAssignment: {
          validity: {
            student: {
              deletedAt: null,
              branchId: req.user.branchId,
            },
          },
        },
      },
      include: {
        shiftAssignment: {
          include: {
            validity: {
              include: {
                student: true,
              },
            },
            shift: true,
            seat: true,
          },
        },
      },
      orderBy: [
        { attendanceDate: "desc" },
        { id: "desc" },
      ],
    });

    const grouped = groupAttendanceRecords(attendanceRecords);

    res.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.log("Get attendance error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};

const searchStudentAttendance = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const term = q.trim();

    // Find student by code, reg no, or name
    const student = await prisma.student.findFirst({
      where: {
        deletedAt: null,
        branchId: req.user.branchId,
        OR: [
          { studentCode: { contains: term } },
          { regNo: { contains: term } },
          { fullName: { contains: term } },
        ],
      },
    });

    if (!student) {
      return res.json({
        success: true,
        data: null,
        message: "No student found",
      });
    }

    const formattedStudent = {
      id: student.id,
      student_code: student.studentCode,
      reg_no: student.regNo,
      full_name: student.fullName,
      account_status: student.accountStatus,
    };

    // Get all active assignments
    const assignments = await prisma.studentShiftAssignment.findMany({
      where: {
        validity: {
          studentId: student.id,
        },
        assignmentStatus: "ACTIVE",
      },
      include: {
        shift: true,
        seat: true,
        validity: true,
      },
      orderBy: {
        shift: {
          startTime: "asc",
        },
      },
    });

    const formattedAssignments = assignments.map((a) => ({
      assignment_id: a.id,
      assignment_status: a.assignmentStatus,
      shift_id: a.shiftId,
      shift_name: a.shift.shiftName,
      start_time: a.shift.startTime,
      end_time: a.shift.endTime,
      seat_number: a.seat ? a.seat.seatNumber : null,
      access_type: a.validity.accessType,
      validity_start: formatDateStr(a.validity.startDate),
      validity_end: formatDateStr(a.validity.endDate),
      total_amount: a.validity.totalAmount ? Number(a.validity.totalAmount) : 0,
    }));

    // Get today's attendance
    const { start, end } = getDayBounds();
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        shiftAssignment: {
          validity: {
            studentId: student.id,
          },
        },
        attendanceDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        shiftAssignment: true,
      },
      orderBy: { id: "asc" },
    });

    const formattedTodayAttendance = todayAttendance.map((a) => ({
      id: a.id,
      shift_assignment_id: a.shiftAssignmentId,
      attendance_date: formatDateStr(a.attendanceDate),
      status: a.status,
      check_in_time: a.checkInTime ? a.checkInTime.substring(0, 5) : null,
      check_out_time: a.checkOutTime ? a.checkOutTime.substring(0, 5) : null,
      shift_id: a.shiftAssignment.shiftId,
    }));

    // Get payment history for this student
    const payments = await prisma.payment.findMany({
      where: {
        validity: {
          studentId: student.id,
        },
      },
      include: {
        paymentMode: true,
      },
      orderBy: { paymentDate: "desc" },
      take: 10,
    });

    const formattedPayments = payments.map((p) => ({
      id: p.id,
      invoice_no: p.invoiceNo,
      amount_received: p.amountReceived ? Number(p.amountReceived) : 0,
      mode_name: p.paymentMode.modeName,
      payment_date: formatDateTimeStr(p.paymentDate),
    }));

    res.json({
      success: true,
      data: {
        student: formattedStudent,
        assignments: formattedAssignments,
        todayAttendance: formattedTodayAttendance,
        payments: formattedPayments,
      },
    });
  } catch (error) {
    console.log("Search student attendance error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to search student",
      error: error.message,
    });
  }
};

const checkIn = async (req, res) => {
  try {
    await cleanupOldAttendance();
    const { student_id, shift_id } = req.body;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "student_id is required",
      });
    }

    const sId = parseInt(student_id);
    const shId = shift_id ? parseInt(shift_id) : null;

    // Find active assignment
    const assignmentWhere = {
      assignmentStatus: "ACTIVE",
      validity: {
        studentId: sId,
        student: {
          deletedAt: null,
          branchId: req.user.branchId,
        },
      },
    };

    if (shId) {
      assignmentWhere.shiftId = shId;
    }

    const assignments = await prisma.studentShiftAssignment.findMany({
      where: assignmentWhere,
      include: {
        shift: true,
        validity: {
          include: {
            student: true,
          },
        },
      },
      orderBy: {
        shift: {
          startTime: "asc",
        },
      },
    });

    if (assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active shift assignment found for this student",
      });
    }

    const now = new Date();
    const currMin = now.getHours() * 60 + now.getMinutes();

    let assignment = assignments[0];
    if (!shId && assignments.length > 1) {
      const blocks = getShiftBlocks(assignments);
      const activeBlock = blocks.find((b) => b.isTimeInside(currMin));
      if (activeBlock) {
        assignment = activeBlock.assignments[0];
      }
    }

    const shift = assignment.shift;
    const student = assignment.validity.student;

    if (student.accountStatus === "DISABLED") {
      return res.status(403).json({
        success: false,
        message: "Check-in failed: Student account is suspended.",
      });
    }

    // Get ALL active assignments and compute consecutive block BEFORE timing check
    const allActiveAssignments = await prisma.studentShiftAssignment.findMany({
      where: {
        validityId: assignment.validityId,
        assignmentStatus: "ACTIVE",
      },
      include: {
        shift: true,
      },
    });

    const consecutiveBlock = getConsecutiveAssignments(assignment, allActiveAssignments);

    const firstShift = consecutiveBlock[0].shift;
    const lastShift = consecutiveBlock[consecutiveBlock.length - 1].shift;
    const startMin = timeToMinutes(firstShift.startTime);
    const endMin = timeToMinutes(lastShift.endTime);
    const allowedStartMin = (startMin - 30 + 1440) % 1440;
    const crossesMidnight = endMin < startMin;

    const isAllowed = crossesMidnight
      ? currMin >= allowedStartMin || currMin <= endMin
      : currMin >= allowedStartMin && currMin <= endMin;

    if (!isAllowed) {
      const shiftStart12 = formatMinutesTo12Hr(startMin);
      const shiftEnd12 = formatMinutesTo12Hr(endMin);
      const allowedStart12 = formatMinutesTo12Hr(allowedStartMin);
      const currTime12 = formatMinutesTo12Hr(currMin);

      return res.status(400).json({
        success: false,
        message: `Check-in not allowed. Your shift block starts at ${shiftStart12} and ends at ${shiftEnd12}. You can check in from ${allowedStart12} (30 mins before shift). Current time is ${currTime12}.`,
      });
    }

    const checkInTimes = [];
    const createdAttendances = [];

    const { start, end } = getDayBounds();
    const currentCheckInTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (const blockAss of consecutiveBlock) {
      // Check if already checked in today
      const existing = await prisma.attendance.findFirst({
        where: {
          shiftAssignmentId: blockAss.id,
          attendanceDate: {
            gte: start,
            lte: end,
          },
        },
      });

      if (!existing) {
        const newAtt = await prisma.attendance.create({
          data: {
            shiftAssignmentId: blockAss.id,
            attendanceDate: todayDate,
            status: "PRESENT",
            checkInTime: currentCheckInTime,
            shiftStartTime: blockAss.shift.startTime,
            shiftEndTime: blockAss.shift.endTime,
          },
        });
        createdAttendances.push(newAtt);
        checkInTimes.push(blockAss.shift.shiftName);
      }
    }

    if (createdAttendances.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Already checked in today for all shifts in this block.`,
      });
    }

    res.status(201).json({
      success: true,
      message: `${student.fullName} (${student.studentCode}) checked in successfully for ${checkInTimes.join(", ")}`,
      data: {
        id: createdAttendances[0].id,
        attendance_date: formatDateStr(createdAttendances[0].attendanceDate),
        status: createdAttendances[0].status,
        check_in_time: createdAttendances[0].checkInTime ? createdAttendances[0].checkInTime.substring(0, 5) : null,
        check_out_time: null,
      },
    });
  } catch (error) {
    console.log("Check-in error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to check in",
      error: error.message,
    });
  }
};

const checkOut = async (req, res) => {
  try {
    const { student_id, shift_id } = req.body;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "student_id is required",
      });
    }

    const sId = parseInt(student_id);
    const shId = shift_id ? parseInt(shift_id) : null;
    const { start, end } = getDayBounds();

    const attendanceWhere = {
      attendanceDate: {
        gte: start,
        lte: end,
      },
      shiftAssignment: {
        validity: {
          studentId: sId,
          student: {
            branchId: req.user.branchId,
          },
        },
      },
    };

    if (shId) {
      attendanceWhere.shiftAssignment.shiftId = shId;
    }

    const records = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        shiftAssignment: {
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
      orderBy: { id: "desc" },
      take: 1,
    });

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No check-in found for today",
      });
    }

    const record = records[0];
    const student = record.shiftAssignment.validity.student;
    const shift = record.shiftAssignment.shift;

    const allActiveAssignments = await prisma.studentShiftAssignment.findMany({
      where: {
        validityId: record.shiftAssignment.validityId,
        assignmentStatus: "ACTIVE",
      },
      include: {
        shift: true,
      },
    });

    const consecutiveBlock = getConsecutiveAssignments(record.shiftAssignment, allActiveAssignments);
    const checkedOutShifts = [];
    let primaryUpdate = null;

    const now = new Date();
    const currentCheckOutTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    for (const blockAss of consecutiveBlock) {
      const activeAttendance = await prisma.attendance.findFirst({
        where: {
          shiftAssignmentId: blockAss.id,
          attendanceDate: {
            gte: start,
            lte: end,
          },
          checkOutTime: null,
        },
      });

      if (activeAttendance) {
        // Validate check-out is after check-in (compare as minutes to avoid string comparison issues)
        if (activeAttendance.checkInTime) {
          const [coH, coM] = currentCheckOutTime.slice(0, 5).split(":").map(Number);
          const [ciH, ciM] = activeAttendance.checkInTime.slice(0, 5).split(":").map(Number);
          const checkoutMinutes = coH * 60 + coM;
          const checkinMinutes = ciH * 60 + ciM;
          if (checkoutMinutes < checkinMinutes) {
            continue;
          }
        }

        const up = await prisma.attendance.update({
          where: { id: activeAttendance.id },
          data: {
            checkOutTime: currentCheckOutTime,
            updatedAt: new Date(),
          },
        });
        if (blockAss.id === record.shiftAssignmentId) {
          primaryUpdate = up;
        } else if (!primaryUpdate) {
          primaryUpdate = up;
        }
        checkedOutShifts.push(blockAss.shift.shiftName);
      }
    }

    if (checkedOutShifts.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Already checked out today for all shifts in this block.`,
      });
    }

    if (!primaryUpdate) {
      return res.status(400).json({
        success: false,
        message: "No attendance record was updated during check-out.",
      });
    }

    res.json({
      success: true,
      message: `${student.fullName} (${student.studentCode}) checked out successfully for ${checkedOutShifts.join(", ")}`,
      data: {
        id: primaryUpdate.id,
        attendance_date: formatDateStr(primaryUpdate.attendanceDate),
        status: primaryUpdate.status,
        check_in_time: primaryUpdate.checkInTime ? primaryUpdate.checkInTime.substring(0, 5) : null,
        check_out_time: primaryUpdate.checkOutTime ? primaryUpdate.checkOutTime.substring(0, 5) : null,
      },
    });
  } catch (error) {
    console.log("Check-out error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to check out",
      error: error.message,
    });
  }
};

const getActiveCheckIns = async (req, res) => {
  try {
    const { start, end } = getDayBounds();

    const activeCheckIns = await prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: start,
          lte: end,
        },
        checkInTime: { not: null },
        checkOutTime: null,
        shiftAssignment: {
          validity: {
            student: {
              deletedAt: null,
              branchId: req.user.branchId,
            },
          },
        },
      },
      include: {
        shiftAssignment: {
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
      orderBy: { checkInTime: "asc" },
    });

    const grouped = groupAttendanceRecords(activeCheckIns);

    const formattedData = grouped.map((a) => ({
      student_code: a.student_code,
      full_name: a.full_name,
      shift_name: a.shift_name,
      check_in_time: a.check_in_time,
      attendance_date: a.attendance_date,
    }));

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.log("Get active check-ins error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active check-ins",
      error: error.message,
    });
  }
};

const checkoutAllActive = async (req, res) => {
  try {
    const { start, end } = getDayBounds();
    const now = new Date();
    const currentCheckOutTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const activeRecords = await prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: start,
          lte: end,
        },
        checkInTime: { not: null },
        checkOutTime: null,
        shiftAssignment: {
          validity: {
            student: {
              deletedAt: null,
              branchId: req.user.branchId,
            },
          },
        },
      },
    });

    if (activeRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active check-ins found to check out",
      });
    }

    const updated = await prisma.attendance.updateMany({
      where: {
        id: { in: activeRecords.map(r => r.id) },
      },
      data: {
        checkOutTime: currentCheckOutTime,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `Successfully checked out all ${updated.count} active student(s).`,
      data: { count: updated.count },
    });
  } catch (error) {
    console.log("Checkout all active error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to check out all active students",
      error: error.message,
    });
  }
};

// Public GET /api/attendance/public-search
const publicSearchStudent = async (req, res) => {
  try {
    const { q, branchId } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: "Search term is required" });
    }
    const targetBranchId = branchId ? parseInt(branchId) : 1;
    const term = q.trim();

    const student = await prisma.student.findFirst({
      where: {
        deletedAt: null,
        branchId: targetBranchId,
        OR: [
          { studentCode: { contains: term } },
          { regNo: { contains: term } },
          { mobile: { contains: term } },
          { fullName: { contains: term } },
        ],
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found in this library branch" });
    }

    const { start, end } = getDayBounds(new Date());
    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        shiftAssignment: {
          validity: { studentId: student.id }
        },
        attendanceDate: { gte: start, lte: end },
        checkOutTime: null
      },
      include: { shiftAssignment: { include: { shift: true } } }
    });

    return res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          student_code: student.studentCode,
          full_name: student.fullName,
          mobile: student.mobile,
          profile_photo_url: student.profilePhotoUrl
        },
        isCheckedIn: !!todayAttendance,
        activeAttendance: todayAttendance ? {
          id: todayAttendance.id,
          check_in_time: todayAttendance.checkInTime,
          shift_name: todayAttendance.shiftAssignment?.shift?.shiftName
        } : null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Public POST /api/attendance/public-checkin
const publicCheckInOrOut = async (req, res) => {
  try {
    const { studentCodeOrMobile, branchId } = req.body;
    if (!studentCodeOrMobile || !studentCodeOrMobile.trim()) {
      return res.status(400).json({ success: false, message: "Student code or mobile number is required" });
    }

    const targetBranchId = branchId ? parseInt(branchId) : 1;
    const term = studentCodeOrMobile.trim();

    const student = await prisma.student.findFirst({
      where: {
        deletedAt: null,
        branchId: targetBranchId,
        OR: [
          { studentCode: term },
          { regNo: term },
          { mobile: term },
          { fullName: { contains: term } }
        ]
      },
      include: {
        validities: {
          include: {
            assignments: {
              where: { assignmentStatus: "ACTIVE" },
              include: { shift: true, seat: true }
            }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found in this library branch. Please verify code or mobile." });
    }

    if (student.accountStatus === "DISABLED") {
      return res.status(403).json({
        success: false,
        message: `Check-in failed for ${student.fullName}: Student account is suspended.`,
      });
    }

    const activeAssignments = [];
    student.validities.forEach(v => {
      if (v.assignments && v.assignments.length > 0) {
        activeAssignments.push(...v.assignments);
      }
    });

    if (activeAssignments.length === 0) {
      return res.status(400).json({ success: false, message: `No active plan/shift assigned to ${student.fullName}.` });
    }

    const now = new Date();
    const { start, end } = getDayBounds(now);
    const currMin = now.getHours() * 60 + now.getMinutes();
    const timeHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const time12HrFormatted = formatMinutesTo12Hr(currMin);

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        shiftAssignment: { validity: { studentId: student.id } },
        attendanceDate: { gte: start, lte: end },
      },
      include: { shiftAssignment: { include: { shift: true } } }
    });

    // Partition all student's assignments into distinct Shift Blocks
    const shiftBlocks = getShiftBlocks(activeAssignments);

    // Check active check-ins (currently inside the library without check-out)
    const activeCheckIns = todayAttendances.filter(a => !a.checkOutTime);

    if (activeCheckIns.length > 0) {
      // Find which block the active check-in belongs to
      const activeAssignmentIds = activeCheckIns.map(a => a.shiftAssignmentId);
      const activeBlock = shiftBlocks.find(b => b.assignments.some(ass => activeAssignmentIds.includes(ass.id)));

      // Check if student forgot to check out of a previous shift and is now arriving for an alternate shift
      const matchingNewBlock = shiftBlocks.find(b => {
        const isDifferentBlock = !activeBlock || b !== activeBlock;
        const isActiveNow = b.isTimeInside(currMin);
        const isNewBlockUnattended = b.assignments.some(ass => !todayAttendances.some(att => att.shiftAssignmentId === ass.id));
        return isDifferentBlock && isActiveNow && isNewBlockUnattended;
      });

      if (matchingNewBlock) {
        // Auto-checkout the old expired shift block
        for (const att of activeCheckIns) {
          const shiftEnd = att.shiftAssignment?.shift?.endTime ? att.shiftAssignment.shift.endTime.slice(0, 5) : timeHHMM;
          await prisma.attendance.update({
            where: { id: att.id },
            data: { checkOutTime: shiftEnd }
          });
        }

        // And check-in to the new alternate shift block
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        for (const blockAss of matchingNewBlock.assignments) {
          const existing = todayAttendances.find(a => a.shiftAssignmentId === blockAss.id);
          if (!existing) {
            await prisma.attendance.create({
              data: {
                shiftAssignmentId: blockAss.id,
                attendanceDate: todayDate,
                status: "PRESENT",
                checkInTime: timeHHMM,
                shiftStartTime: blockAss.shift.startTime,
                shiftEndTime: blockAss.shift.endTime
              }
            });
          }
        }

        return res.json({
          success: true,
          action: "CHECK_IN",
          message: `Welcome to ${matchingNewBlock.shiftNames}, ${student.fullName}! 📚✨`,
          subMessage: `Previous shift checked out. Check-In recorded at ${time12HrFormatted} for ${matchingNewBlock.shiftNames}.`,
          time: time12HrFormatted,
          checkInTime: time12HrFormatted,
          student: { full_name: student.fullName, student_code: student.studentCode, shift_name: matchingNewBlock.shiftNames }
        });
      }

      // Normal CHECK-OUT
      for (const att of activeCheckIns) {
        await prisma.attendance.update({
          where: { id: att.id },
          data: { checkOutTime: timeHHMM }
        });
      }

      const firstAtt = activeCheckIns[0];
      const checkIn12Hr = formatTime12Hr(firstAtt.checkInTime);
      const checkedOutShiftNames = activeBlock ? activeBlock.shiftNames : (firstAtt.shiftAssignment?.shift?.shiftName || "Shift");

      return res.json({
        success: true,
        action: "CHECK_OUT",
        message: `Thank you for studying at our library, ${student.fullName}!`,
        subMessage: `Check-Out recorded at ${time12HrFormatted} for ${checkedOutShiftNames}. Have a great rest of your day! `,
        time: time12HrFormatted,
        checkInTime: checkIn12Hr,
        checkOutTime: time12HrFormatted,
        student: { full_name: student.fullName, student_code: student.studentCode, shift_name: checkedOutShiftNames }
      });
    }

    // CHECK-IN SCENARIO
    // Determine which blocks still have shifts not attended today
    const unattendedBlocks = shiftBlocks.filter(b => {
      return b.assignments.some(ass => !todayAttendances.some(att => att.shiftAssignmentId === ass.id));
    });

    if (unattendedBlocks.length === 0) {
      // All shifts/blocks for today have already been attended
      const lastRecord = todayAttendances[todayAttendances.length - 1];
      const lastIn = lastRecord ? formatTime12Hr(lastRecord.checkInTime) : "";
      const lastOut = lastRecord ? formatTime12Hr(lastRecord.checkOutTime) : "";

      return res.json({
        success: true,
        action: "ALREADY_COMPLETED",
        message: `Thank you, ${student.fullName}!`,
        subMessage: `You have already completed your library attendance for all assigned shifts today.`,
        checkInTime: lastIn,
        checkOutTime: lastOut,
        student: { full_name: student.fullName, student_code: student.studentCode }
      });
    }

    // Find an unattended block whose allowed window contains the current time
    const matchingBlock = unattendedBlocks.find(b => b.isTimeInside(currMin));

    if (!matchingBlock) {
      // Find upcoming shift block today
      const upcomingBlock = unattendedBlocks.find(b => {
        if (b.crossesMidnight) {
          return currMin < b.allowedStartMin && currMin > b.endMin;
        }
        return currMin < b.allowedStartMin;
      });

      if (upcomingBlock) {
        const shiftStart12Hr = formatMinutesTo12Hr(upcomingBlock.startMin);
        const allowedStart12Hr = formatMinutesTo12Hr(upcomingBlock.allowedStartMin);
        return res.status(400).json({
          success: false,
          message: `Check-in not allowed yet for ${student.fullName}. Your next shift (${upcomingBlock.shiftNames}) starts at ${shiftStart12Hr}. Early check-in is allowed from ${allowedStart12Hr} (30 mins before shift). Current time is ${time12HrFormatted}.`
        });
      }

      // If no upcoming block, all unattended blocks ended earlier today
      const pastBlock = unattendedBlocks[unattendedBlocks.length - 1];
      const pastStart12Hr = formatMinutesTo12Hr(pastBlock.startMin);
      const pastEnd12Hr = formatMinutesTo12Hr(pastBlock.endMin);

      return res.status(400).json({
        success: false,
        message: `Check-in not allowed for ${student.fullName}. Your shift (${pastBlock.shiftNames}) was from ${pastStart12Hr} to ${pastEnd12Hr}. Current time is ${time12HrFormatted}.`
      });
    }

    // Check in all shifts in the matchingBlock
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (const blockAss of matchingBlock.assignments) {
      const existingBlockAtt = todayAttendances.find(a => a.shiftAssignmentId === blockAss.id);
      if (!existingBlockAtt) {
        await prisma.attendance.create({
          data: {
            shiftAssignmentId: blockAss.id,
            attendanceDate: todayDate,
            status: "PRESENT",
            checkInTime: timeHHMM,
            shiftStartTime: blockAss.shift.startTime,
            shiftEndTime: blockAss.shift.endTime
          }
        });
      }
    }

    return res.json({
      success: true,
      action: "CHECK_IN",
      message: `Welcome to the library, ${student.fullName}! 📚✨`,
      subMessage: `Check-In recorded at ${time12HrFormatted} for ${matchingBlock.shiftNames}. Wish you a focused & productive study session!`,
      time: time12HrFormatted,
      checkInTime: time12HrFormatted,
      student: { full_name: student.fullName, student_code: student.studentCode, shift_name: matchingBlock.shiftNames }
    });
  } catch (error) {
    console.error("Public attendance error:", error);
    return res.status(500).json({ success: false, message: "Failed to process attendance" });
  }
};

module.exports = {
  getAttendance,
  searchStudentAttendance,
  checkIn,
  checkOut,
  getActiveCheckIns,
  checkoutAllActive,
  publicSearchStudent,
  publicCheckInOrOut,
};