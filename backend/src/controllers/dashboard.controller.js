const mongoClient = require("../config/mongoClient");
const { autoSuspendExpiredStudents } = require("./student.controller");
const { formatDateStr, formatDateTimeStr, getISTDayBounds, addDaysToYmd } = require("../utils/format");
const {
  DERIVED_STATUS,
  diffDaysBetweenYmd,
  evaluateStudentLifecycle,
} = require("../utils/studentStatus");

const isStudentExpiredGrace = (student, now = new Date()) => {
  if (!student || student.accountStatus !== "ACTIVE") return false;
  return evaluateStudentLifecycle(student, now).derivedStatus === DERIVED_STATUS.EXPIRED_GRACE;
};

const parseSeatNumber = (seatNumber) => {
  const match = seatNumber.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return { prefix: seatNumber, num: 0 };
  return { prefix: match[1].toUpperCase(), num: parseInt(match[2], 10) };
};

const statsCache = new Map();
const STATS_CACHE_TTL = 20000; // 20 seconds cache for rapid page navigation

const getDashboardStats = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const cacheKey = `stats_${branchId || 1}`;
    const cached = statsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < STATS_CACHE_TTL) {
      return res.json({
        success: true,
        data: cached.data,
      });
    }

    await autoSuspendExpiredStudents(req.user.branchId);
    const now = new Date();
    const { start: todayStart, end: todayEnd, ymd: todayYmd } = getISTDayBounds(now);
    const tenDaysAgoYmd = addDaysToYmd(todayYmd, -10);
    const twentyDaysAgoYmd = addDaysToYmd(todayYmd, -20);

    const [
      totalStudents,
      activeStudents,
      suspendedStudentsCount,
      inactiveMembersCount,
      disabledMembersCount,
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
      mongoClient.student.count({ where: { deletedAt: null, branchId } }),
      mongoClient.student.count({ where: { accountStatus: "ACTIVE", deletedAt: null, branchId } }),
      mongoClient.student.count({ where: { accountStatus: "SUSPENDED", deletedAt: null, branchId } }),
      mongoClient.student.count({ where: { accountStatus: "INACTIVE", deletedAt: null, branchId } }),
      mongoClient.student.count({ where: { accountStatus: "DISABLED", deletedAt: null, branchId } }),
      mongoClient.payment.count({
        where: {
          validity: { student: { branchId } },
        },
      }),
      mongoClient.payment.aggregate({
        _sum: { amountReceived: true },
        where: {
          validity: { student: { branchId } },
        },
      }),
      mongoClient.attendance.findMany({
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
      mongoClient.attendance.findMany({
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
      mongoClient.shift.count({ where: { isActive: true, branchId } }),
      mongoClient.seat.count({ where: { isActive: true, branchId } }),
      mongoClient.studentShiftAssignment.count({
        where: {
          assignmentStatus: "ACTIVE",
          validity: {
            accessType: "RESERVED",
            student: {
              deletedAt: null,
              branchId,
              accountStatus: { in: ["ACTIVE", "SUSPENDED"] },
            },
          },
          seatId: { not: null },
        },
      }),
      mongoClient.student.findMany({
        where: { deletedAt: null, accountStatus: "ACTIVE", branchId },
        include: {
          validities: {
            include: { payments: true, feePlan: true },
          },
        },
      }),
      mongoClient.expense.aggregate({
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

    const expiredStudentsList = [];
    let unpaidStudents = 0;
    let activeValidities = 0;
    let expiringSoon = 0;

    allStudentsWithValidities.forEach((student) => {
      const validities = student.validities || [];
      const latestValidity = validities.length > 0 ? validities[validities.length - 1] : null;
      if (!latestValidity) return;

      const lifecycle = evaluateStudentLifecycle(student, now);
      const dueAmount = lifecycle.dueAmount;
      const endYmd = lifecycle.endYmd;
      const effectiveStartYmd = formatDateStr(latestValidity.lastRenewedAt || latestValidity.startDate);

      if (endYmd && !lifecycle.isExpired) {
        activeValidities++;
      }

      if (lifecycle.derivedStatus === DERIVED_STATUS.EXPIRING_SOON) {
        expiringSoon++;
      }

      if (lifecycle.derivedStatus === DERIVED_STATUS.EXPIRED_GRACE) {
        expiredStudentsList.push({
          id: student.id,
          student_code: student.studentCode,
          reg_no: student.regNo,
          full_name: student.fullName,
          mobile: student.mobile,
          email: student.email,
          admission_date: formatDateStr(student.admissionDate),
          account_status: student.accountStatus,
          derived_status: lifecycle.derivedStatus,
          access_type: latestValidity.accessType || null,
          plan_name: latestValidity.feePlan?.planName || null,
          end_date: endYmd,
          days_overdue: lifecycle.daysOverdue,
          due_amount: dueAmount,
        });
      }

      if (dueAmount > 0 && endYmd && endYmd < todayYmd && endYmd >= twentyDaysAgoYmd) {
        unpaidStudents++;
      } else if (
        dueAmount > 0 &&
        (!endYmd || endYmd >= todayYmd) &&
        effectiveStartYmd &&
        effectiveStartYmd < todayYmd &&
        effectiveStartYmd >= tenDaysAgoYmd
      ) {
        unpaidStudents++;
      }
    });

    expiredStudentsList.sort(
      (a, b) => (b.days_overdue - a.days_overdue) || (a.full_name || "").localeCompare(b.full_name || "")
    );

    const totalRevenue = totalRevenueAgg._sum.amountReceived
      ? Number(totalRevenueAgg._sum.amountReceived)
      : 0;

    const totalExpenses = totalExpensesAgg._sum.amount
      ? Number(totalExpensesAgg._sum.amount)
      : 0;

    const responseData = {
      total_students: totalStudents,
      active_students: activeStudents,
      suspended_students: suspendedStudentsCount,
      expired_students: expiredStudentsList.length,
      expired_students_list: expiredStudentsList,
      unpaid_students: unpaidStudents,
      active_validities: activeValidities,
      inactive_members: inactiveMembersCount,
      disabled_members: disabledMembersCount,
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
    };

    statsCache.set(cacheKey, { timestamp: Date.now(), data: responseData });

    res.json({
      success: true,
      data: responseData,
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

    const payments = await mongoClient.payment.findMany({
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

    const payments = await mongoClient.payment.findMany({
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
      mongoClient.shift.findMany({
        where: { isActive: true, branchId: req.user.branchId },
        orderBy: { startTime: "asc" },
      }),
      mongoClient.seat.findMany({
        where: { isActive: true, branchId: req.user.branchId },
        orderBy: { id: "asc" },
      }),
      mongoClient.studentShiftAssignment.findMany({
        where: {
          assignmentStatus: "ACTIVE",
          validity: {
            accessType: "RESERVED",
            student: {
              deletedAt: null,
              branchId: req.user.branchId,
              accountStatus: { in: ["ACTIVE", "SUSPENDED"] },
            },
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

      const assignmentsList = shiftAssignments
        .filter((a) => a.seat)
        .map((a) => ({
          seat_number: a.seat?.seatNumber || "",
          student_name: a.validity?.student?.fullName || "Student",
          student_code: a.validity?.student?.studentCode || "",
        }));

      // Sort assignments by seat number
      assignmentsList.sort((a, b) => (a.seat_number || "").localeCompare(b.seat_number || ""));

      // Build per-shift seat status for cross-shift blocking
      const shiftSeatStatus = {};
      assignments.forEach((a) => {
        if (!a.seat) return;
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
    const daysCount = parseInt(req.query.days) || 7;
    const cutoffDate = new Date(Date.now() - daysCount * 24 * 60 * 60 * 1000);

    // Ensure status transitions (suspended/inactive) are evaluated for branch
    if (req.user && req.user.branchId) {
      await autoSuspendExpiredStudents(req.user.branchId);
    }

    const [inactiveStudents, admissionRequests, forceLoginEvents, newStudents] = await Promise.all([
      // 1. Inactive students updated within the last 7 days
      mongoClient.student.findMany({
        where: {
          accountStatus: { in: ["INACTIVE", "DISABLED", "SUSPENDED"] },
          deletedAt: null,
          branchId: req.user.branchId,
          updatedAt: { gte: cutoffDate },
        },
        orderBy: { updatedAt: "desc" },
      }),
      // 2. Admission requests created within the last 7 days
      mongoClient.admissionRequest.findMany({
        where: {
          createdAt: { gte: cutoffDate },
          OR: [
            { branchId: req.user.branchId },
            { branchId: null },
          ],
        },
        orderBy: { id: "desc" },
      }),
      // 3. Security events occurred within the last 7 days
      mongoClient.securityEvent.findMany({
        where: {
          eventType: "FORCE_LOGIN_LOGOUT",
          createdAt: { gte: cutoffDate },
          ...(req.user.email ? { email: req.user.email } : {}),
        },
        orderBy: { id: "desc" },
        take: 30,
      }),
      // 4. Newly admitted students within the last 7 days
      mongoClient.student.findMany({
        where: {
          deletedAt: null,
          branchId: req.user.branchId,
          admissionDate: { gte: cutoffDate },
        },
        orderBy: { id: "desc" },
        take: 30,
      }),
    ]);

    const requestNotifications = admissionRequests.map((r) => ({
      type: "ADMISSION_REQUEST",
      id: `admission-${r.id}`,
      raw_id: r.id,
      full_name: r.fullName,
      email: r.email,
      mobile: r.mobile,
      status: r.status,
      message: r.status === "PENDING"
        ? `New Online Admission Request from ${r.fullName} (${r.mobile})`
        : `Admission application for ${r.fullName} is ${r.status}`,
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    }));

    const newStudentNotifications = newStudents.map((s) => ({
      type: "NEW_ADMISSION",
      id: `new-student-${s.id}`,
      raw_id: s.id,
      full_name: s.fullName,
      student_code: s.studentCode,
      mobile: s.mobile || null,
      message: `New Student Admission: ${s.fullName} (${s.studentCode}) enrolled successfully.`,
      created_at: s.admissionDate ? s.admissionDate.toISOString() : (s.createdAt ? s.createdAt.toISOString() : new Date().toISOString()),
    }));

    const forceLoginNotifications = forceLoginEvents.map((e) => ({
      type: "LOGIN_ALERT",
      id: `security-${e.id}`,
      raw_id: e.id,
      email: e.email,
      message: `New login from ${e.userAgent || "unknown"} (IP: ${e.ipAddress || "unknown"}). Previous session for ${e.email} has been logged out.`,
      created_at: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
    }));

    const inactiveNotifications = inactiveStudents.map((s) => ({
      type: "INACTIVE_STUDENT",
      id: `inactive-${s.id}`,
      raw_id: s.id,
      full_name: s.fullName,
      student_code: s.studentCode,
      mobile: s.mobile || null,
      message: s.accountStatus === "SUSPENDED"
        ? `Student ${s.fullName} (${s.studentCode}) has unpaid dues (11–20 days overdue). Marked as SUSPENDED.`
        : s.accountStatus === "DISABLED"
          ? `Student ${s.fullName} (${s.studentCode}) disabled manually by admin (seat unassigned).`
          : `Student ${s.fullName} (${s.studentCode}) moved to Inactive (unpaid > 20 days, seat unassigned).`,
      created_at: s.updatedAt ? s.updatedAt.toISOString() : new Date().toISOString(),
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

    const allCombined = [
      ...libraryNotifications,
      ...requestNotifications,
      ...newStudentNotifications,
      ...inactiveNotifications,
      ...forceLoginNotifications,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      success: true,
      timeframeDays: daysCount,
      data: allCombined,
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

    const now = new Date();
    const { start: todayStart, end: todayEnd } = getISTDayBounds(now);

    const branchId = req.user.branchId;
    let students = [];

    const validityMetricInclude = {
      validities: {
        include: {
          feePlan: true,
          payments: true,
        },
      },
    };

    if (metric === "total_students") {
      students = await mongoClient.student.findMany({
        where: { deletedAt: null, branchId },
        include: validityMetricInclude,
        orderBy: { fullName: "asc" },
      });
    } else if (metric === "active_students") {
      students = await mongoClient.student.findMany({
        where: {
          accountStatus: "ACTIVE",
          deletedAt: null,
          branchId,
        },
        include: validityMetricInclude,
        orderBy: { fullName: "asc" },
      });
    } else if (metric === "expired") {
      const activeWithValidities = await mongoClient.student.findMany({
        where: {
          accountStatus: "ACTIVE",
          deletedAt: null,
          branchId,
        },
        include: validityMetricInclude,
        orderBy: { fullName: "asc" },
      });
      students = activeWithValidities.filter((s) =>
        isStudentExpiredGrace(s, now)
      );
    } else if (metric === "inactive") {
      students = await mongoClient.student.findMany({
        where: { accountStatus: "INACTIVE", deletedAt: null, branchId },
        include: validityMetricInclude,
        orderBy: { fullName: "asc" },
      });
    } else if (metric === "disabled") {
      students = await mongoClient.student.findMany({
        where: { accountStatus: "DISABLED", deletedAt: null, branchId },
        include: validityMetricInclude,
        orderBy: { fullName: "asc" },
      });
    } else if (metric === "expiring_soon") {
      const activeWithValidities = await mongoClient.student.findMany({
        where: {
          accountStatus: "ACTIVE",
          deletedAt: null,
          branchId,
        },
        include: validityMetricInclude,
        orderBy: { fullName: "asc" },
      });
      students = activeWithValidities.filter(
        (s) => evaluateStudentLifecycle(s, now).derivedStatus === DERIVED_STATUS.EXPIRING_SOON
      );
    } else if (metric === "suspended" || metric === "unpaid") {
      students = await mongoClient.student.findMany({
        where: { accountStatus: "SUSPENDED", deletedAt: null, branchId },
        include: validityMetricInclude,
        orderBy: { fullName: "asc" },
      });
    } else if (metric === "today_present") {
      const attendances = await mongoClient.attendance.findMany({
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
                    include: validityMetricInclude,
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

    const formattedStudents = students.map((s) => {
      const latestVal = s.validities && s.validities.length > 0 ? s.validities[s.validities.length - 1] : null;
      const lifecycle = evaluateStudentLifecycle(s, now);
      return {
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
        derived_status: lifecycle.derivedStatus,
        access_type: latestVal ? latestVal.accessType : null,
        plan_name: latestVal?.feePlan?.planName || null,
        end_date: lifecycle.endYmd,
        days_remaining: lifecycle.daysRemaining,
        days_overdue: lifecycle.daysOverdue,
        due_amount: lifecycle.dueAmount,
      };
    });

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
  clearStatsCache: () => statsCache.clear(),
};