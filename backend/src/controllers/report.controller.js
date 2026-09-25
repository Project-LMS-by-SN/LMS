const prisma = require("../config/prisma");
const { formatDateStr } = require("../utils/format");

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
        result.push({
          student_code: first.shiftAssignment.validity.student.studentCode,
          full_name: first.shiftAssignment.validity.student.fullName,
          reg_no: first.shiftAssignment.validity.student.regNo,
          shift_name: first.shiftAssignment.shift.shiftName,
          seat_number: first.shiftAssignment.seat ? first.shiftAssignment.seat.seatNumber : null,
          check_in_time: first.checkInTime ? first.checkInTime.substring(0, 5) : null,
          check_out_time: first.checkOutTime ? first.checkOutTime.substring(0, 5) : null,
          status: first.status,
          attendance_date: formatDateStr(first.attendanceDate),
        });
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
          student_code: first.shiftAssignment.validity.student.studentCode,
          full_name: first.shiftAssignment.validity.student.fullName,
          reg_no: first.shiftAssignment.validity.student.regNo,
          shift_name: `${block.length} Shifts (${shiftNames.join(", ")})`,
          seat_number: seatNumber,
          check_in_time: earliestCheckIn,
          check_out_time: latestCheckOut,
          status: block.some((b) => b.status === "PRESENT") ? "PRESENT" : first.status,
          attendance_date: formatDateStr(first.attendanceDate),
        });
      }
    });
  });

  return result;
};

const getDailyAttendanceReport = async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getDayBounds(date);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: start,
          lte: end,
        },
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
            seat: true,
            validity: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    const formattedData = groupAttendanceRecords(attendanceRecords);

    // Sort: shift_name ASC, check_in_time NULLS LAST
    formattedData.sort((a, b) => {
      const shiftCompare = a.shift_name.localeCompare(b.shift_name);
      if (shiftCompare !== 0) return shiftCompare;

      if (!a.check_in_time && b.check_in_time) return 1;
      if (a.check_in_time && !b.check_in_time) return -1;
      if (!a.check_in_time && !b.check_in_time) return 0;
      return a.check_in_time.localeCompare(b.check_in_time);
    });

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily attendance report",
      error: error.message,
    });
  }
};

const getRevenueReport = async (req, res) => {
  try {
    const { from_year, from_month, to_year, to_month } = req.query;

    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const fYear = parseInt(from_year) || defaultFrom.getFullYear();
    const fMonth = parseInt(from_month) || defaultFrom.getMonth() + 1;
    const tYear = parseInt(to_year) || now.getFullYear();
    const tMonth = parseInt(to_month) || now.getMonth() + 1;

    // Filter by dates using standard JS Date objects
    const startDate = new Date(fYear, fMonth - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(tYear, tMonth, 0, 23, 59, 59, 999); // last day of toMonth

    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: {
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
          validity: {
            student: { branchId: req.user.branchId },
          },
        },
      }),
      prisma.expense.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          branchId: req.user.branchId,
        },
      }),
    ]);

    // Group and aggregate in JS
    const monthlyMap = {};
    payments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const key = `${yr}-${mo}`;
      const amount = p.amountReceived ? Number(p.amountReceived) : 0;
      monthlyMap[key] = (monthlyMap[key] || 0) + amount;
    });

    const expensesMap = {};
    expenses.forEach((e) => {
      const d = new Date(e.date);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const key = `${yr}-${mo}`;
      const amount = e.amount ? Number(e.amount) : 0;
      expensesMap[key] = (expensesMap[key] || 0) + amount;
    });

    const monthlyData = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    let curYear = fYear;
    let curMonth = fMonth;
    while (curYear < tYear || (curYear === tYear && curMonth <= tMonth)) {
      const key = `${curYear}-${curMonth}`;
      const rev = monthlyMap[key] || 0;
      const exp = expensesMap[key] || 0;
      const profit = rev - exp;

      monthlyData.push({
        year: curYear,
        month: curMonth,
        revenue: rev,
        expenses: exp,
        profit,
      });

      totalRevenue += rev;
      totalExpenses += exp;

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }

    res.json({
      success: true,
      data: {
        monthlyData,
        totalRevenue,
        totalExpenses,
        totalProfit: totalRevenue - totalExpenses,
        fromYear: fYear,
        fromMonth: fMonth,
        toYear: tYear,
        toMonth: tMonth,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue report",
      error: error.message,
    });
  }
};

module.exports = { getDailyAttendanceReport, getRevenueReport };
