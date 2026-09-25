const prisma = require("../config/prisma");
const { autoSuspendExpiredStudents } = require("./student.controller");
const { formatDateStr, formatDateTimeStr } = require("../utils/format");

const parseSeatNumber = (seatNumber) => {
  const match = seatNumber.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return { prefix: seatNumber, num: 0 };
  return { prefix: match[1].toUpperCase(), num: parseInt(match[2], 10) };
};

const getDashboardStats = async (req, res) => {
  try {
    await autoSuspendExpiredStudents(req.user.branchId);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const next7DaysObj = new Date();
    next7DaysObj.setDate(next7DaysObj.getDate() + 7);
    next7DaysObj.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(todayStart.getTime() - 20 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(todayStart.getTime() - 15 * 24 * 60 * 60 * 1000);

    const branchId = req.user.branchId;

    const [
      totalStudents,
      activeStudents,
      suspendedStudentsCount,
      inactiveMembersCount,
      activeValidities,
      expiringSoon,
      totalPayments,
      totalRevenueAgg,
      todayPresentRecords,
      todayAbsentRecords,
      activeShifts,
      totalSeats,
      activeShiftAssignments,
      allStudentsWithValidities,
      totalExpensesAgg,
    ] = await Promise.all([
      prisma.student.count({ where: { deletedAt: null, branchId } }),
      prisma.student.count({ where: { accountStatus: "ACTIVE", deletedAt: null, branchId } }),
      prisma.student.count({ where: { accountStatus: "SUSPENDED", deletedAt: null, branchId } }),
      prisma.student.count({ where: { accountStatus: { in: ["INACTIVE", "DISABLED"] }, deletedAt: null, branchId } }),
      prisma.studentValidity.count({
        where: {
          startDate: { lte: todayEnd },
          endDate: { gte: todayStart },
          student: { deletedAt: null, accountStatus: "ACTIVE", branchId },
        },
      }),
      prisma.studentValidity.count({
        where: {
          endDate: { gte: todayStart, lte: next7DaysObj },
          student: { deletedAt: null, accountStatus: "ACTIVE", branchId },
        },
      }),
      prisma.payment.count({
        where: {
          validity: { student: { branchId } },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amountReceived: true },
        where: {
          validity: { student: { branchId } },
        },
      }),
      prisma.attendance.findMany({
        where: {
          attendanceDate: { gte: todayStart, lte: todayEnd },
          status: "PRESENT",
          shiftAssignment: {
            validity: { student: { branchId } },
          },
        },
        include: {
          shiftAssignment: { include: { validity: true } },
        },
      }),
      prisma.attendance.findMany({
        where: {
          attendanceDate: { gte: todayStart, lte: todayEnd },
          status: "ABSENT",
          shiftAssignment: {
            validity: { student: { branchId } },
          },
        },
        include: {
          shiftAssignment: { include: { validity: true } },
        },
      }),
      prisma.shift.count({ where: { isActive: true, branchId } }),
      prisma.seat.count({ where: { isActive: true, branchId } }),
      prisma.studentShiftAssignment.count({
        where: {
          assignmentStatus: "ACTIVE",
          validity: {
            accessType: "RESERVED",
            student: { deletedAt: null, branchId },
          },
          seatId: { not: null },
        },
      }),
      prisma.student.findMany({
        where: { deletedAt: null, accountStatus: "ACTIVE", branchId },
        include: {
          validities: {
            include: { payments: true, feePlan: true },
          },
        },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { branchId },
      }),
    ]);

    const presentStudentIds = new Set(
      (todayPresentRecords || [])
        .map((r) => r.shiftAssignment?.validity?.studentId)
        .filter(Boolean)
    );
    const todayPresent = presentStudentIds.size;

    const absentStudentIds = new Set(
      (todayAbsentRecords || [])
        .map((r) => r.shiftAssignment?.validity?.studentId)
        .filter((id) => Boolean(id) && !presentStudentIds.has(id))
    );
    const todayAbsent = absentStudentIds.size;

    let inactiveMembers = 0;
    let unpaidStudents = 0;

    allStudentsWithValidities.forEach((student) => {
      student.validities.forEach((validity) => {
        const totalPaid = validity.payments.reduce((sum, p) => sum + Number(p.amountReceived || 0), 0);
        const dueAmount = Number(validity.totalAmount) - totalPaid;

        if (dueAmount > 0) {
          const planExpiry = new Date(validity.endDate);
          planExpiry.setHours(0, 0, 0, 0);

          if (planExpiry < fifteenDaysAgo) {
            inactiveMembers++;
          } else if (planExpiry < todayStart) {
            unpaidStudents++;
          }
        }
      });
    });

    const totalRevenue = totalRevenueAgg._sum.amountReceived
      ? Number(totalRevenueAgg._sum.amountReceived)
      : 0;

    const totalExpenses = totalExpensesAgg._sum.amount
      ? Number(totalExpensesAgg._sum.amount)
      : 0;

    res.json({
      success: true,
      data: {
        total_students: totalStudents,
        active_students: activeStudents,
        suspended_students: suspendedStudentsCount,
        unpaid_students: unpaidStudents,
        active_validities: activeValidities,
        inactive_members: inactiveMembersCount,
        expiring_soon: expiringSoon,
        total_payments: totalPayments,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: totalRevenue - totalExpenses,
        today_present: todayPresent,
        today_absent: todayAbsent,
        active_shifts: activeShifts,
        total_seats: totalSeats,
        active_shift_assignments: activeShiftAssignments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};

const getRevenueByYear = async (req, res) => {
  try {
    const { year } = req.query;
    const selectedYear = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
    const endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
        validity: {
          student: { branchId: req.user.branchId },
        },
      },
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
    }));

    payments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const monthIdx = d.getMonth();
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyData[monthIdx].revenue += p.amountReceived ? Number(p.amountReceived) : 0;
      }
    });

    res.json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue data",
      error: error.message,
    });
  }
};

const getRecentPayments = async (req, res) => {
  try {
    const { limit } = req.query;
    const takeLimit = parseInt(limit) || 10;

    const payments = await prisma.payment.findMany({
      take: takeLimit,
      where: {
        validity: {
          student: { branchId: req.user.branchId },
        },
      },
      include: {
        paymentMode: true,
        validity: {
          include: {
            student: true,
          },
        },
      },
      orderBy: [
        { paymentDate: "desc" },
        { id: "desc" },
      ],
    });

    const formattedData = payments.map((p) => ({
      id: p.id,
      amount_received: p.amountReceived ? Number(p.amountReceived) : 0,
      payment_date: formatDateTimeStr(p.paymentDate),
      mode_name: p.paymentMode.modeName,
      full_name: p.validity && p.validity.student ? p.validity.student.fullName : null,
      student_code: p.validity && p.validity.student ? p.validity.student.studentCode : null,
    }));

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent payments",
      error: error.message,
    });
  }
};

const getSeatAvailability = async (req, res) => {
  try {
    const [shifts, seats, assignments] = await Promise.all([
      prisma.shift.findMany({
        where: { isActive: true, branchId: req.user.branchId },
        orderBy: { startTime: "asc" },
      }),
      prisma.seat.findMany({
        where: { isActive: true, branchId: req.user.branchId },
        orderBy: { id: "asc" },
      }),
      prisma.studentShiftAssignment.findMany({
        where: {
          assignmentStatus: "ACTIVE",
          validity: {
            accessType: "RESERVED",
            student: { deletedAt: null, branchId: req.user.branchId },
          },
          seatId: { not: null },
        },
        include: {
          seat: true,
          validity: {
            include: {
              student: true,
            },
          },
        },
      }),
    ]);

    const allSeatsList = seats.map((se) => ({
      id: se.id,
      seat_number: se.seatNumber,
      floor: se.floor || "",
      room: se.room || "",
      section: se.section || "",
    }));

    allSeatsList.sort((a, b) => {
      const pa = parseSeatNumber(a.seat_number);
      const pb = parseSeatNumber(b.seat_number);
      if (pa.prefix !== pb.prefix) return pa.prefix.localeCompare(pb.prefix);
      return pa.num - pb.num;
    });

    const formattedShifts = shifts.map((sh) => {
      const shiftAssignments = assignments.filter((a) => a.shiftId === sh.id);
      const occupiedSeatsCount = shiftAssignments.length;

      const assignmentsList = shiftAssignments.map((a) => ({
        seat_number: a.seat.seatNumber,
        student_name: a.validity.student.fullName,
        student_code: a.validity.student.studentCode,
      }));

      // Sort assignments by seat number
      assignmentsList.sort((a, b) => a.seat_number.localeCompare(b.seat_number));

      // Build per-shift seat status for cross-shift blocking
      const shiftSeatStatus = {};
      assignments.forEach((a) => {
        const seatNum = a.seat.seatNumber;
        if (!shiftSeatStatus[seatNum]) {
          shiftSeatStatus[seatNum] = [];
        }
        shiftSeatStatus[seatNum].push({
          shift_id: a.shiftId,
          shift_name: shifts.find(s => s.id === a.shiftId)?.shiftName || "",
          student_name: a.validity.student.fullName,
          student_code: a.validity.student.studentCode,
        });
      });

      return {
        shift_id: sh.id,
        shift_name: sh.shiftName,
        start_time: sh.startTime,
        end_time: sh.endTime,
        total_seats: allSeatsList.length,
        occupied_seats: occupiedSeatsCount,
        assignments: assignmentsList,
        all_seats: allSeatsList,
        shift_seat_status: shiftSeatStatus,
      };
    });

    res.json({
      success: true,
      data: {
        shifts: formattedShifts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch seat availability",
      error: error.message,
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Ensure status transitions (suspended/inactive) are evaluated for branch
    if (req.user && req.user.branchId) {
      await autoSuspendExpiredStudents(req.user.branchId);
    }

    const [inactiveStudents, pendingRequests, forceLoginEvents] = await Promise.all([
      // 1. Inactive students updated within the last 48 hours
      prisma.student.findMany({
        where: {
          accountStatus: { in: ["INACTIVE", "DISABLED"] },
          deletedAt: null,
          branchId: req.user.branchId,
          updatedAt: { gte: fortyEightHoursAgo },
        },
        orderBy: { updatedAt: "desc" },
      }),
      // 2. Admission requests created within the last 48 hours
      prisma.admissionRequest.findMany({
        where: {
          status: "PENDING",
          createdAt: { gte: fortyEightHoursAgo },
          OR: [
            { branchId: req.user.branchId },
            { branchId: null },
          ],
        },
        orderBy: { id: "desc" },
      }),
      // 3. Security events occurred within the last 48 hours
      prisma.securityEvent.findMany({
        where: {
          eventType: "FORCE_LOGIN_LOGOUT",
          createdAt: { gte: fortyEightHoursAgo },
          ...(req.user.email ? { email: req.user.email } : {}),
        },
        orderBy: { id: "desc" },
        take: 10,
      }),
    ]);

    const requestNotifications = pendingRequests.map((r) => ({
      type: "ADMISSION_REQUEST",
      id: `admission-${r.id}`,
      raw_id: r.id,
      full_name: r.fullName,
      email: r.email,
      mobile: r.mobile,
      message: `User ${r.fullName} has requested for admission`,
      created_at: r.createdAt,
    }));

    const forceLoginNotifications = forceLoginEvents.map((e) => ({
      type: "LOGIN_ALERT",
      id: `security-${e.id}`,
      raw_id: e.id,
      email: e.email,
      message: `New login from ${e.userAgent || "unknown"} (IP: ${e.ipAddress || "unknown"}). Previous session for ${e.email} has been logged out.`,
      created_at: e.createdAt,
    }));

    const inactiveNotifications = inactiveStudents.map((s) => ({
      type: "INACTIVE_STUDENT",
      id: `inactive-${s.id}`,
      raw_id: s.id,
      full_name: s.fullName,
      student_code: s.studentCode,
      mobile: s.mobile || null,
      message: `Student ${s.fullName} (${s.studentCode}) moved to Inactive section (unpaid > 20 days).`,
      created_at: s.updatedAt,
    }));

    // Library Plan expiry alert (library owner plan)
    const libraryNotifications = [];
    if (req.user && req.user.subscriptionTier && req.user.subscriptionTier !== "FREE" && req.user.subscriptionExpiry) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const expDate = new Date(req.user.subscriptionExpiry);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        libraryNotifications.push({
          type: "LIBRARY_PLAN",
          id: `lib-plan-${req.user.id}-${new Date().toISOString().slice(0, 10)}`,
          full_name: `${req.user.subscriptionTier} Plan`,
          plan_name: req.user.subscriptionTier,
          days_remaining: diffDays,
          message: diffDays <= 0
            ? "Your library subscription has expired. Please renew your plan."
            : `Your library subscription (${req.user.subscriptionTier}) is expiring in ${diffDays} day${diffDays === 1 ? "" : "s"}.`,
          created_at: new Date().toISOString(),
        });
      }
    }

    res.json({
      success: true,
      data: [
        ...libraryNotifications,
        ...requestNotifications,
        ...inactiveNotifications,
        ...forceLoginNotifications,
      ],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

const getStudentsByMetric = async (req, res) => {
  try {
    const { metric } = req.query;
    await autoSuspendExpiredStudents(req.user.branchId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const next7DaysObj = new Date();
    next7DaysObj.setDate(next7DaysObj.getDate() + 7);
    next7DaysObj.setHours(23, 59, 59, 999);

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    fifteenDaysAgo.setHours(0, 0, 0, 0);

    const branchId = req.user.branchId;
    let students = [];

    if (metric === "total_students") {
      students = await prisma.student.findMany({
        where: { accountStatus: "ACTIVE", deletedAt: null, branchId },
        include: {
          validities: {
            select: {
              accessType: true,
            },
          },
        },
        orderBy: { fullName: "asc" },
      });
    } else if (metric === "active_students") {
      const validities = await prisma.studentValidity.findMany({
        where: {
          startDate: { lte: todayEnd },
          endDate: { gte: todayStart },
          student: { deletedAt: null, accountStatus: "ACTIVE", branchId },
        },
        include: {
          student: {
            include: {
              validities: {
                select: {
                  accessType: true,
                },
              },
            },
          },
        },
        orderBy: { student: { fullName: "asc" } },
      });
      students = validities.map((v) => v.student).filter(Boolean);
    } else if (metric === "inactive") {
      students = await prisma.student.findMany({
        where: { accountStatus: { in: ["INACTIVE", "DISABLED"] }, deletedAt: null, branchId },
        include: {
          validities: {
            select: {
              accessType: true,
            },
          },
        },
        orderBy: { fullName: "asc" },
      });
    } else if (metric === "expiring_soon") {
      const validities = await prisma.studentValidity.findMany({
        where: {
          endDate: { gte: todayStart, lte: next7DaysObj },
          student: { deletedAt: null, accountStatus: "ACTIVE", branchId },
        },
        include: {
          student: {
            include: {
              validities: {
                select: {
                  accessType: true,
                },
              },
            },
          },
        },
        orderBy: { student: { fullName: "asc" } },
      });
      students = validities.map((v) => v.student).filter(Boolean);
    } else if (metric === "suspended" || metric === "unpaid") {
      students = await prisma.student.findMany({
        where: { accountStatus: "SUSPENDED", deletedAt: null, branchId },
        include: {
          validities: {
            select: {
              accessType: true,
            },
          },
        },
        orderBy: { fullName: "asc" },
      });
    } else if (metric === "today_present") {
      const attendances = await prisma.attendance.findMany({
        where: {
          attendanceDate: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: "PRESENT",
          shiftAssignment: {
            validity: {
              student: { branchId },
            },
          },
        },
        include: {
          shiftAssignment: {
            include: {
              validity: {
                include: {
                  student: {
                    include: {
                      validities: {
                        select: {
                          accessType: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const seen = new Set();
      students = [];
      attendances.forEach((a) => {
        const student = a.shiftAssignment?.validity?.student;
        if (student && !seen.has(student.id)) {
          seen.add(student.id);
          students.push(student);
        }
      });
      students.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid metric type requested",
      });
    }

    const formattedStudents = students.map((s) => ({
      id: s.id,
      student_code: s.studentCode,
      reg_no: s.regNo,
      full_name: s.fullName,
      email: s.email,
      mobile: s.mobile,
      gender: s.gender,
      dob: formatDateStr(s.dob),
      address: s.address,
      aadhar_number: s.aadharNumber,
      admission_date: formatDateStr(s.admissionDate),
      profile_photo_url: s.profilePhotoUrl,
      account_status: s.accountStatus,
      access_type: s.validities && s.validities.length > 0 ? s.validities[s.validities.length - 1].accessType : null,
    }));

    res.json({
      success: true,
      data: formattedStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch metric students list",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueByYear,
  getRecentPayments,
  getSeatAvailability,
  getNotifications,
  getStudentsByMetric,
};