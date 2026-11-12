const subscriptionPlanService = require("../services/subscriptionPlan.service");
const mongoClient = require("../config/mongoClient");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM || "noreply@dashurl.in";
const {
  formatDateStr,
  formatDateTimeStr,
  parsePaymentDate,
  generateInvoiceNo,
  getISTTimeParts,
  addDaysToYmd,
} = require("../utils/format");
const clearStatsCache = () => {
  try {
    const dashboardController = require("./dashboard.controller");
    if (typeof dashboardController?.clearStatsCache === "function") {
      dashboardController.clearStatsCache();
    }
  } catch (e) {}
};
const cache = require("../utils/cache");
const { evaluateStudentLifecycle } = require("../utils/studentStatus");
const {
  releaseStudentSeats,
  reconcileInactiveStudentSeats,
  attemptSeatRecoveryOnReactivation,
} = require("../utils/seatLifecycle");

const formatStudent = (s) => ({
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
});

const logAction = async (action, tableName, recordId, oldValues, newValues, userId, branchId) => {
  try {
    cache.invalidateBranch(branchId);
    clearStatsCache();
    await mongoClient.auditLog.create({
      data: {
        action,
        tableName,
        recordId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        userId: userId || null,
      },
    });
  } catch (err) {
    console.error("❌ Audit log failed:", err.message);
  }
};

// Throttle auto-suspend to run at most once per 5 minutes per branch
const lastAutoSuspendRun = new Map();
const AUTO_SUSPEND_INTERVAL_MS = 5 * 60 * 1000;

const resetAutoSuspendThrottle = (branchId) => {
  if (branchId === undefined) {
    lastAutoSuspendRun.clear();
  } else {
    lastAutoSuspendRun.delete(branchId || "all");
  }
};

const autoSuspendExpiredStudents = async (branchId, { force = false } = {}) => {
  try {
    const key = branchId || "all";
    const nowMs = Date.now();
    const lastRun = lastAutoSuspendRun.get(key) || 0;
    if (!force && nowMs - lastRun < AUTO_SUSPEND_INTERVAL_MS) return;
    lastAutoSuspendRun.set(key, nowMs);

    const now = new Date();
    const students = await mongoClient.student.findMany({
      where: {
        accountStatus: { in: ["ACTIVE", "SUSPENDED", "INACTIVE"] },
        deletedAt: null,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        validities: {
          include: {
            payments: true,
          },
        },
      },
    });

    const studentsToSuspend = [];
    const studentsToInactive = [];
    const studentsToActivate = [];

    for (const student of students) {
      const lifecycle = evaluateStudentLifecycle(student, now);
      const targetStatus = lifecycle.targetAccountStatus;

      if (targetStatus === "INACTIVE" && student.accountStatus !== "INACTIVE") {
        studentsToInactive.push({
          id: student.id,
          from: student.accountStatus,
          branchId: student.branchId || branchId || 1,
        });
      } else if (targetStatus === "SUSPENDED" && student.accountStatus !== "SUSPENDED") {
        studentsToSuspend.push({
          id: student.id,
          from: student.accountStatus,
          branchId: student.branchId || branchId || 1,
        });
      } else if (
        targetStatus === "ACTIVE" &&
        (student.accountStatus === "SUSPENDED" || student.accountStatus === "INACTIVE")
      ) {
        studentsToActivate.push({
          id: student.id,
          from: student.accountStatus,
          branchId: student.branchId || branchId || 1,
          validity:
            student.validities && student.validities.length > 0
              ? student.validities[student.validities.length - 1]
              : null,
        });
      }
    }

    if (studentsToActivate.length > 0) {
      await mongoClient.student.updateMany({
        where: { id: { in: studentsToActivate.map((s) => s.id) } },
        data: { accountStatus: "ACTIVE", updatedAt: now },
      });
      for (const s of studentsToActivate) {
        if (s.from === "INACTIVE") {
          await attemptSeatRecoveryOnReactivation({
            client: mongoClient,
            validity: s.validity,
            studentId: s.id,
            previousStatus: s.from,
            newStatus: "ACTIVE",
            branchId: s.branchId,
          });
        }
        await logAction("AUTO_REACTIVATE_STUDENT", "students", s.id, { accountStatus: s.from }, { accountStatus: "ACTIVE" }, null, s.branchId);
      }
    }

    if (studentsToSuspend.length > 0) {
      await mongoClient.student.updateMany({
        where: { id: { in: studentsToSuspend.map((s) => s.id) } },
        data: { accountStatus: "SUSPENDED", updatedAt: now },
      });
      for (const s of studentsToSuspend) {
        await logAction("AUTO_SUSPEND_STUDENT", "students", s.id, { accountStatus: s.from }, { accountStatus: "SUSPENDED" }, null, s.branchId);
      }
    }

    if (studentsToInactive.length > 0) {
      const inactiveIds = studentsToInactive.map((s) => s.id);
      const { releasedCount } = await releaseStudentSeats(inactiveIds);
      await mongoClient.student.updateMany({
        where: { id: { in: inactiveIds } },
        data: { accountStatus: "INACTIVE", updatedAt: now },
      });
      for (const s of studentsToInactive) {
        await logAction(
          "AUTO_INACTIVE_STUDENT",
          "students",
          s.id,
          { accountStatus: s.from },
          { accountStatus: "INACTIVE", seatsReleased: releasedCount > 0 },
          null,
          s.branchId
        );
      }
    }

    // Reconcile any legacy INACTIVE or DISABLED records that still have lingering non-null seatId
    const reconciled = await reconcileInactiveStudentSeats(branchId);
    if (reconciled > 0) {
      cache.invalidateBranch(branchId || 1);
      clearStatsCache();
    }
  } catch (err) {
    console.error("Auto suspend/inactive error:", err);
  }
};

const getStudents = async (req, res) => {
  try {
    const branchId = req.user.branchId || 1;
    const cacheKey = `branch_${branchId}_students`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
      });
    }

    await autoSuspendExpiredStudents(req.user.branchId);

    // Fetch active shifts so "Full Day" reflects ALL active shifts in this branch (e.g. 3 of 3, or 4 of 4)
    const activeShifts = await mongoClient.shift.findMany({
      where: { isActive: true, deletedAt: null, branchId: req.user.branchId },
      select: { id: true },
    });
    const activeShiftIds = activeShifts.map((s) => s.id);
    const activeShiftsCount = activeShiftIds.length;

    const students = await mongoClient.student.findMany({
      where: { deletedAt: null, branchId: req.user.branchId },
      include: {
        validities: {
          include: {
            feePlan: true,
            payments: true,
            assignments: {
              where: { assignmentStatus: "ACTIVE" },
              include: {
                shift: true,
                seat: true,
              },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    const formatted = students.map((s) => {
      const validity = s.validities && s.validities.length > 0 ? s.validities[s.validities.length - 1] : null;
      
      let seatNumber = null;
      let shiftName = null;
      let planName = null;
      let endDate = null;
      let totalAmount = 0;
      let totalPaid = 0;

      if (validity) {
        planName = validity.feePlan ? validity.feePlan.planName : null;
        endDate = formatDateStr(validity.endDate);
        totalAmount = validity.totalAmount ? Number(validity.totalAmount) : 0;
        
        if (validity.payments) {
          validity.payments.forEach((p) => {
            totalPaid += p.amountReceived ? Number(p.amountReceived) : 0;
          });
        }

        const activeAssignments = validity.assignments || [];
        if (activeAssignments.length > 0) {
          const assignmentWithSeat = activeAssignments.find(a => a.seat) || activeAssignments[0];
          seatNumber = assignmentWithSeat.seat ? assignmentWithSeat.seat.seatNumber : null;

          const uniqueAssignedShiftIds = new Set(activeAssignments.map((a) => a.shiftId));
          const assignedCount = uniqueAssignedShiftIds.size;
          const isFullDay =
            activeShiftsCount > 1 &&
            activeShiftIds.every((sid) => uniqueAssignedShiftIds.has(sid));

          if (assignedCount === 1) {
            shiftName = activeAssignments[0].shift ? activeAssignments[0].shift.shiftName : null;
          } else if (isFullDay) {
            shiftName = "Full Day";
          } else if (assignedCount > 1) {
            shiftName = `${assignedCount} Shift`;
          } else {
            shiftName = null;
          }
        }
      }

      const dueAmount = totalAmount - totalPaid;
      const lifecycle = evaluateStudentLifecycle(s);

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
        days_overdue: lifecycle.daysOverdue,
        days_remaining: lifecycle.daysRemaining,
        access_type: validity ? validity.accessType : null,
        seat_number: seatNumber,
        seat_reassignment_needed: Boolean(
          s.accountStatus === "ACTIVE" &&
          validity &&
          validity.accessType === "RESERVED" &&
          !seatNumber
        ),
        shift_name: shiftName,
        plan_name: planName,
        end_date: endDate,
        due_amount: dueAmount > 0 ? dueAmount : 0,
      };
    });

    cache.set(cacheKey, formatted, 25000);

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      error: error.message,
    });
  }
};

const getStudentById = async (req, res) => {
  try {
    await autoSuspendExpiredStudents(req.user.branchId);
    const { id } = req.params;

    const student = await mongoClient.student.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
        branchId: req.user.branchId,
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      data: formatStudent(student),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch student",
      error: error.message,
    });
  }
};

const validateStudentFieldsAndDuplicates = async ({ mobile, email, aadharNumber, branchId, excludeStudentId = null }) => {
  // 1. Mobile validation (10 digits)
  const cleanMobile = String(mobile || "").trim();
  if (!/^\d{10}$/.test(cleanMobile)) {
    return "Mobile number must be exactly 10 digits.";
  }

  // 2. Email validation
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return "Please enter a valid email address.";
  }

  // 3. Aadhar validation (optional, but 12 digits if provided)
  const cleanAadhar = aadharNumber ? String(aadharNumber).trim() : "";
  if (cleanAadhar && !/^\d{12}$/.test(cleanAadhar)) {
    return "Aadhar card number must be exactly 12 digits.";
  }

  // 4. Branch-scoped Duplicate checks
  const targetBranchId = branchId || 1;

  // Mobile duplicate in same branch
  const mobileDuplicate = await mongoClient.student.findFirst({
    where: {
      mobile: cleanMobile,
      branchId: targetBranchId,
      deletedAt: null,
      ...(excludeStudentId ? { NOT: { id: excludeStudentId } } : {}),
    },
  });
  if (mobileDuplicate) {
    return `Mobile number (${cleanMobile}) is already registered in this library branch.`;
  }

  // Email duplicate in same branch
  const emailDuplicate = await mongoClient.student.findFirst({
    where: {
      email: cleanEmail,
      branchId: targetBranchId,
      deletedAt: null,
      ...(excludeStudentId ? { NOT: { id: excludeStudentId } } : {}),
    },
  });
  if (emailDuplicate) {
    return `Email address (${cleanEmail}) is already registered in this library branch.`;
  }

  // Aadhar duplicate in same branch (only if Aadhar was provided)
  if (cleanAadhar) {
    const aadharDuplicate = await mongoClient.student.findFirst({
      where: {
        aadharNumber: cleanAadhar,
        branchId: targetBranchId,
        deletedAt: null,
        ...(excludeStudentId ? { NOT: { id: excludeStudentId } } : {}),
      },
    });
    if (aadharDuplicate) {
      return `Aadhar card number (${cleanAadhar}) is already registered in this library branch.`;
    }
  }

  return null;
};

const createStudent = async (req, res) => {
  try {
    const {
      student_code,
      reg_no,
      full_name,
      email,
      mobile,
      gender,
      dob,
      address,
      aadhar_number,
      profile_photo_url,
      requestId,
    } = req.body;

    if (!student_code || !full_name || !email || !mobile || !gender) {
      return res.status(400).json({
        success: false,
        message: "student_code, full_name, email, mobile, and gender are required",
      });
    }

    const branchId = req.user ? req.user.branchId : 1;

    // Validate fields & branch-scoped duplicates
    const validationError = await validateStudentFieldsAndDuplicates({
      mobile,
      email,
      aadharNumber: aadhar_number,
      branchId,
    });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Enforce student limit by subscription tier
    if (req.user) {
      const creator = await mongoClient.user.findUnique({
        where: { id: req.user.id }
      });
      if (creator) {
        const activeCount = await mongoClient.student.count({
          where: { accountStatus: "ACTIVE", deletedAt: null, branchId: req.user.branchId }
        });
        const limit = await subscriptionPlanService.getStudentLimitForTier(creator.subscriptionTier);
        if (activeCount >= limit) {
          return res.status(403).json({
            success: false,
            message: `Active student limit reached (${limit} students). Please upgrade your subscription in Settings page to add more members.`
          });
        }
      }
    }

    const todayYmd = getISTTimeParts().ymd;
    const today = new Date(`${todayYmd}T00:00:00+05:30`);

    const newStudent = await mongoClient.student.create({
      data: {
        studentCode: student_code,
        regNo: reg_no || null,
        fullName: full_name,
        email: email,
        mobile: mobile,
        gender: gender.toUpperCase(),
        dob: dob ? new Date(dob) : null,
        address: address || null,
        aadharNumber: aadhar_number || null,
        profilePhotoUrl: profile_photo_url || null,
        admissionDate: today,
        accountStatus: "ACTIVE",
        createdBy: req.user ? req.user.id : null,
        branchId: req.user ? req.user.branchId : 1,
      },
    });

    // If this was from an admission request, approve it
    if (requestId) {
      await mongoClient.admissionRequest.update({
        where: { id: parseInt(requestId) },
        data: { status: "APPROVED" },
      });
    }

    // Audit Log
    await logAction("CREATE_STUDENT", "students", newStudent.id, null, newStudent, req.user ? req.user.id : null, branchId);

    // Send email notifications if created by a STAFF member
    if (req.user && req.user.role === "STAFF") {
      (async () => {
        try {
          const creator = await mongoClient.user.findUnique({
            where: { id: req.user.id }
          });

          // 1. Send Welcome Email to student
          if (newStudent.email) {
            await resend.emails.send({
              from: emailFrom,
              to: newStudent.email,
              subject: "Welcome to Library Management System!",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <h2 style="color: #2563eb;">Welcome, ${newStudent.fullName}!</h2>
                  <p>We are excited to inform you that your admission to the library has been successfully processed.</p>
                  <p>Here are your enrollment details:</p>
                  <ul>
                    <li><strong>Student Code:</strong> ${newStudent.studentCode}</li>
                    <li><strong>Registration No:</strong> ${newStudent.regNo || "N/A"}</li>
                    <li><strong>Mobile:</strong> ${newStudent.mobile}</li>
                    <li><strong>Admission Date:</strong> ${new Date(newStudent.admissionDate).toLocaleDateString()}</li>
                  </ul>
                  <p>Feel free to visit the library and start your sessions!</p>
                  <br />
                  <p style="font-size: 12px; color: #64748b;">Best Regards,<br/>Library Management Team</p>
                </div>
              `
            });
            console.log(`Welcome email successfully sent to student: ${newStudent.email}`);
          }

          // 2. Fetch all OWNER users of the branch to notify them
          const owners = await mongoClient.user.findMany({
            where: { role: "OWNER", branchId: newStudent.branchId || 1, deletedAt: null }
          });

          const ownerEmails = owners.map(owner => owner.email).filter(Boolean);
          if (ownerEmails.length > 0) {
            await resend.emails.send({
              from: emailFrom,
              to: ownerEmails,
              subject: "New Student Admission Enrolled by Staff",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <h2 style="color: #0f172a;">New Admission Notification</h2>
                  <p>A new student has been registered in your library branch by a staff member.</p>
                  <h3>Student Details:</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; width: 150px;">Full Name:</td>
                      <td style="padding: 6px 0;">${newStudent.fullName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Student Code:</td>
                      <td style="padding: 6px 0;">${newStudent.studentCode}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Email:</td>
                      <td style="padding: 6px 0;">${newStudent.email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Mobile:</td>
                      <td style="padding: 6px 0;">${newStudent.mobile}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Admitted By (Staff):</td>
                      <td style="padding: 6px 0;">${creator ? creator.name : "Staff ID: " + req.user.id} (${creator ? creator.email : ""})</td>
                    </tr>
                  </table>
                  <br />
                  <p style="font-size: 12px; color: #64748b;">This is an automated notification from your Library Management System.</p>
                </div>
              `
            });
            console.log(`Notification email successfully sent to owners: ${ownerEmails.join(", ")}`);
          }
        } catch (emailErr) {
          console.error("Resend notification error:", emailErr);
        }
      })();
    }

    if (requestId) {
      try {
        await mongoClient.admissionRequest.update({
          where: { id: parseInt(requestId) },
          data: { status: "APPROVED" },
        });
      } catch (e) {}
    }

    try {
      clearStatsCache();
      cache.invalidateBranch(branchId);
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: formatStudent(newStudent),
    });
  } catch (error) {
    // Rollback / cleanup if partial records were created before failure
    if (createdStudentId) {
      try {
        if (createdPaymentId) {
          await mongoClient.payment.delete({ where: { id: createdPaymentId } }).catch(() => {});
        }
        await mongoClient.studentShiftAssignment.deleteMany({
          where: { validityId: createdValidityId }
        }).catch(() => {});
        if (createdValidityId) {
          await mongoClient.studentValidity.delete({ where: { id: createdValidityId } }).catch(() => {});
        }
        await mongoClient.student.delete({ where: { id: createdStudentId } }).catch(() => {});
      } catch (cleanupErr) {
        console.error("Rollback cleanup error after failed admission:", cleanupErr);
      }
    }

    if (error.code === "P2002" || error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Student code or registration number already exists in this library branch",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create student",
      error: error.message,
    });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      student_code,
      reg_no,
      full_name,
      email,
      mobile,
      gender,
      dob,
      address,
      aadhar_number,
      admission_date,
      account_status,
      profile_photo_url,
    } = req.body;

    const studentId = parseInt(id);

    const existing = await mongoClient.student.findFirst({
      where: { id: studentId, deletedAt: null, branchId: req.user.branchId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Validate fields & branch-scoped duplicates if changing mobile, email, or aadhar
    const targetMobile = mobile !== undefined ? mobile : existing.mobile;
    const targetEmail = email !== undefined ? email : existing.email;
    const targetAadhar = aadhar_number !== undefined ? aadhar_number : existing.aadharNumber;

    const validationError = await validateStudentFieldsAndDuplicates({
      mobile: targetMobile,
      email: targetEmail,
      aadharNumber: targetAadhar,
      branchId: existing.branchId || req.user.branchId,
      excludeStudentId: studentId,
    });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (account_status !== undefined && account_status.toUpperCase() !== existing.accountStatus) {
      if (!req.user || req.user.role !== "OWNER") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Staff members cannot suspend or change member account status manually"
        });
      }
    }

    let nextAccountStatus = account_status !== undefined ? account_status.toUpperCase() : existing.accountStatus;
    const branchIdResolved = existing.branchId || req.user.branchId;

    if (
      (existing.accountStatus === "SUSPENDED" || existing.accountStatus === "INACTIVE") &&
      nextAccountStatus === "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message: `${
          existing.accountStatus === "SUSPENDED" ? "Suspended" : "Inactive"
        } members can only be activated after clearing pending fees in Collect Fee.`,
      });
    }

    let statusNotice = null;
    if (existing.accountStatus === "DISABLED" && nextAccountStatus === "ACTIVE") {
      if (
        mongoClient.studentValidity &&
        typeof mongoClient.studentValidity.findMany === "function"
      ) {
        try {
          const validities = await mongoClient.studentValidity.findMany({
            where: { studentId },
            include: { payments: true },
            orderBy: { id: "asc" },
          });
          if (Array.isArray(validities) && validities.length > 0) {
            const latestVal = validities[validities.length - 1];
            const hasCompleteMeta =
              latestVal &&
              (latestVal.endDate !== undefined || latestVal.startDate !== undefined) &&
              Array.isArray(latestVal.payments);
            if (hasCompleteMeta) {
              const lifecycle = evaluateStudentLifecycle(
                { ...existing, accountStatus: "ACTIVE", validities },
                new Date()
              );
              if (lifecycle.targetAccountStatus === "SUSPENDED" || lifecycle.targetAccountStatus === "INACTIVE") {
                nextAccountStatus = lifecycle.targetAccountStatus;
                statusNotice =
                  lifecycle.targetAccountStatus === "SUSPENDED"
                    ? "Member moved from Disabled to Suspended because pending fees are overdue. Clear dues in Collect Fee to activate."
                    : "Member moved from Disabled to Inactive because fees are overdue (>20 days). Renew fee plan in Collect Fee to activate.";
              }
            }
          }
        } catch (e) {}
      }
    }

    if ((nextAccountStatus === "DISABLED" || nextAccountStatus === "INACTIVE") && existing.accountStatus !== nextAccountStatus) {
      await releaseStudentSeats([studentId]);
    }

    const updated = await mongoClient.student.update({
      where: { id: studentId },
      data: {
        studentCode: student_code !== undefined ? student_code : existing.studentCode,
        regNo: reg_no !== undefined ? reg_no : existing.regNo,
        fullName: full_name !== undefined ? full_name : existing.fullName,
        email: email !== undefined ? email : existing.email,
        mobile: mobile !== undefined ? mobile : existing.mobile,
        gender: gender !== undefined ? gender.toUpperCase() : existing.gender,
        dob: dob !== undefined ? (dob ? new Date(dob) : null) : existing.dob,
        address: address !== undefined ? address : existing.address,
        aadharNumber: aadhar_number !== undefined ? aadhar_number : existing.aadharNumber,
        admissionDate: admission_date !== undefined ? (admission_date ? new Date(admission_date) : existing.admissionDate) : existing.admissionDate,
        accountStatus: nextAccountStatus,
        profilePhotoUrl: profile_photo_url !== undefined ? profile_photo_url : existing.profilePhotoUrl,
        updatedAt: new Date(),
      },
    });

    let seatRecovery = {
      status: "NONE",
      seat_reassignment_required: false,
      restored_seat_number: null,
      previous_seat_number: null,
      seat_prompt: null,
    };
    if (
      (existing.accountStatus === "INACTIVE" || existing.accountStatus === "DISABLED") &&
      nextAccountStatus === "ACTIVE"
    ) {
      seatRecovery = await attemptSeatRecoveryOnReactivation({
        client: mongoClient,
        studentId,
        previousStatus: existing.accountStatus,
        newStatus: "ACTIVE",
        branchId: branchIdResolved,
      });
    }

    // Audit Log
    await logAction("UPDATE_STUDENT", "students", studentId, existing, updated, req.user ? req.user.id : null, branchIdResolved);

    try {
      clearStatsCache();
      cache.invalidateBranch(existing.branchId || (req.user ? req.user.branchId : 1));
    } catch (e) {}

    res.json({
      success: true,
      message: statusNotice || seatRecovery.seat_prompt || "Student updated successfully",
      data: {
        ...formatStudent(updated),
        seat_reassignment_required: seatRecovery.seat_reassignment_required,
        restored_seat_number: seatRecovery.restored_seat_number,
        previous_seat_number: seatRecovery.previous_seat_number,
        seat_prompt: seatRecovery.seat_prompt,
      },
    });
  } catch (error) {
    if (error.code === "P2002" || error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Student code or registration number already exists in this library branch",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update student",
      error: error.message,
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only owners can delete admissions"
      });
    }
    const { id } = req.params;
    const studentId = parseInt(id);

    const existing = await mongoClient.student.findFirst({
      where: { id: studentId, deletedAt: null, branchId: req.user.branchId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const deleted = await mongoClient.student.update({
      where: { id: studentId },
      data: {
        accountStatus: "DELETED",
        deletedAt: new Date(),
        studentCode: `${existing.studentCode}_DEL_${studentId}`,
        regNo: existing.regNo ? `${existing.regNo}_DEL_${studentId}` : null,
        updatedAt: new Date(),
      },
    });

    // Release any active seat shift assignments
    await mongoClient.studentShiftAssignment.updateMany({
      where: { validity: { studentId: studentId }, assignmentStatus: "ACTIVE" },
      data: {
        assignmentStatus: "ENDED",
        seatId: null,
        previousSeatId: null,
        seatReleasedAt: new Date(),
      },
    });

    // Audit Log
    await logAction("DELETE_STUDENT", "students", studentId, existing, deleted, req.user ? req.user.id : null, existing.branchId || req.user.branchId);

    res.json({
      success: true,
      message: "Student deleted successfully",
      data: {
        id: deleted.id,
        student_code: deleted.studentCode,
        full_name: deleted.fullName,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete student",
      error: error.message,
    });
  }
};

const getNextStudentCode = async (req, res) => {
  try {
    const targetBranchId = req.user?.branchId || (req.query.branchId ? parseInt(req.query.branchId) : 1);
    
    // Find all active (non-deleted) students in branch to determine highest STD sequence
    const activeStudents = await mongoClient.student.findMany({
      where: { branchId: targetBranchId, deletedAt: null },
      select: { studentCode: true },
    });

    let maxSeq = 0;
    for (const s of activeStudents) {
      if (s.studentCode && !s.studentCode.includes("_DEL_")) {
        const num = parseInt(s.studentCode.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    let nextSeq = maxSeq + 1;
    let studentCode = `STD${String(nextSeq).padStart(5, "0")}`;

    // Loop until we find a studentCode that is completely free in database for this branch
    while (await mongoClient.student.findFirst({ where: { studentCode, branchId: targetBranchId } })) {
      nextSeq++;
      studentCode = `STD${String(nextSeq).padStart(5, "0")}`;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    let regNo = `REG${year}${month}${String(nextSeq).padStart(5, "0")}`;

    while (await mongoClient.student.findFirst({ where: { regNo, branchId: targetBranchId } })) {
      nextSeq++;
      studentCode = `STD${String(nextSeq).padStart(5, "0")}`;
      regNo = `REG${year}${month}${String(nextSeq).padStart(5, "0")}`;
    }

    res.json({
      success: true,
      data: {
        student_code: studentCode,
        reg_no: regNo,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate next code",
      error: error.message,
    });
  }
};

const searchStudents = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: [] });
    }

    const term = q.trim();

    const students = await mongoClient.student.findMany({
      where: {
        deletedAt: null,
        branchId: req.user.branchId,
        OR: [
          { studentCode: { contains: term } },
          { regNo: { contains: term } },
          { fullName: { contains: term } },
          { mobile: { contains: term } },
        ],
      },
      include: {
        validities: {
          select: {
            accessType: true,
          },
        },
      },
      take: 20,
    });

    // Custom sorting in JS
    students.sort((a, b) => {
      const termLower = term.toLowerCase();
      const aCode = a.studentCode.toLowerCase() === termLower;
      const bCode = b.studentCode.toLowerCase() === termLower;
      if (aCode && !bCode) return -1;
      if (!aCode && bCode) return 1;

      const aReg = (a.regNo || "").toLowerCase() === termLower;
      const bReg = (b.regNo || "").toLowerCase() === termLower;
      if (aReg && !bReg) return -1;
      if (!aReg && bReg) return 1;

      return a.fullName.localeCompare(b.fullName);
    });

    res.json({
      success: true,
      data: students.map(formatStudent),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search students",
      error: error.message,
    });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    await autoSuspendExpiredStudents(req.user.branchId);
    const { id } = req.params;
    const studentId = parseInt(id);

    const student = await mongoClient.student.findFirst({
      where: { id: studentId, deletedAt: null, branchId: req.user.branchId },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get latest validity
    const latestValidity = await mongoClient.studentValidity.findFirst({
      where: { studentId: studentId },
      include: {
        feePlan: true,
        payments: true,
      },
      orderBy: { id: "desc" },
    });

    let shiftAssignments = [];
    if (latestValidity) {
      const assignments = await mongoClient.studentShiftAssignment.findMany({
        where: { validityId: latestValidity.id, assignmentStatus: "ACTIVE" },
        include: {
          shift: true,
          seat: true,
          previousSeat: true,
        },
        orderBy: { shift: { startTime: "asc" } },
      });

      shiftAssignments = assignments
        .map((a) => ({
          id: a.id,
          shift_id: a.shiftId,
          shift_name: a.shift.shiftName,
          start_time: a.shift.startTime ? a.shift.startTime.substring(0, 5) : null,
          end_time: a.shift.endTime ? a.shift.endTime.substring(0, 5) : null,
          seat_id: a.seatId,
          seat_number: a.seat ? a.seat.seatNumber : null,
          previous_seat_id: a.previousSeatId || null,
          previous_seat_number: a.previousSeat ? a.previousSeat.seatNumber : null,
          floor: a.seat ? a.seat.floor : null,
          room: a.seat ? a.seat.room : null,
          assignment_status: a.assignmentStatus,
        }))
        .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    }

    // Get all payments related to this student
    const payments = await mongoClient.payment.findMany({
      where: {
        validity: {
          studentId: studentId,
        },
      },
      include: {
        paymentMode: true,
      },
      orderBy: { paymentDate: "desc" },
    });

    const formattedPayments = payments.map((p) => ({
      id: p.id,
      invoice_no: p.invoiceNo,
      amount_received: p.amountReceived ? Number(p.amountReceived) : 0, // Decimal to Number
      mode_name: p.paymentMode.modeName,
      remarks: p.remarks,
      utr_number: p.utrNumber || null,
      payment_date: formatDateTimeStr(p.paymentDate),
    }));

    const formattedValidity = latestValidity
      ? {
          id: latestValidity.id,
          fee_plan_id: latestValidity.feePlanId,
          plan_name: latestValidity.feePlan ? latestValidity.feePlan.planName : null,
          plan_amount: latestValidity.feePlan ? Number(latestValidity.feePlan.amount) : (latestValidity.totalAmount ? Number(latestValidity.totalAmount) : 0),
          duration_days: latestValidity.feePlan ? latestValidity.feePlan.durationDays : null,
          start_date: formatDateStr(latestValidity.startDate),
          end_date: formatDateStr(latestValidity.endDate),
          total_amount: latestValidity.totalAmount ? Number(latestValidity.totalAmount) : 0, // Decimal to Number
          access_type: latestValidity.accessType,
        }
      : null;

    // Get attendance records for this student (through all shift assignments, active & ended)
    const studentAssignments = await mongoClient.studentShiftAssignment.findMany({
      where: {
        validity: {
          studentId: studentId
        }
      },
      select: { id: true }
    });
    const allAssignmentIds = studentAssignments.map((a) => a.id);
    let attendanceRecords = [];
    if (allAssignmentIds.length > 0) {
      const rawAttendance = await mongoClient.attendance.findMany({
        where: { shiftAssignmentId: { in: allAssignmentIds } },
        include: {
          shiftAssignment: {
            include: { shift: true },
          },
        },
        orderBy: [{ attendanceDate: "desc" }, { id: "desc" }],
        take: 60,
      });

      attendanceRecords = rawAttendance.map((a) => ({
        id: a.id,
        attendance_date: formatDateStr(a.attendanceDate),
        status: a.status,
        check_in_time: a.checkInTime,
        check_out_time: a.checkOutTime,
        shift_name: a.shiftAssignment?.shift?.shiftName || "—",
      }));
    }

    const profileLifecycle = evaluateStudentLifecycle({
      ...student,
      validities: latestValidity ? [latestValidity] : [],
    });
    const hasAssignedSeat = shiftAssignments.some((a) => Boolean(a.seat_number || a.seat_id));

    res.json({
      success: true,
      data: {
        ...formatStudent(student),
        derived_status: profileLifecycle.derivedStatus,
        days_overdue: profileLifecycle.daysOverdue,
        days_remaining: profileLifecycle.daysRemaining,
        seat_reassignment_needed: Boolean(
          student.accountStatus === "ACTIVE" &&
          latestValidity &&
          latestValidity.accessType === "RESERVED" &&
          !hasAssignedSeat
        ),
        validity: formattedValidity,
        shift_assignments: shiftAssignments,
        shift_assignment: shiftAssignments.length > 0 ? shiftAssignments[0] : null,
        payments: formattedPayments,
        attendance: attendanceRecords,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch student profile",
      error: error.message,
    });
  }
};

const updateStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { shift_ids, seat_id, fee_plan_id, access_type } = req.body;
    const studentId = parseInt(id);

    const student = await mongoClient.student.findFirst({
      where: { id: studentId, deletedAt: null, branchId: req.user.branchId },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const validity = await mongoClient.studentValidity.findFirst({
      where: { studentId },
      include: {
        assignments: {
          where: { assignmentStatus: "ACTIVE" },
        },
      },
    });

    if (!validity) {
      return res.status(404).json({ success: false, message: "No active validity found for this student" });
    }

    const finalShiftIds = (shift_ids !== undefined && Array.isArray(shift_ids))
      ? [...new Set(shift_ids.map(Number).filter(Boolean))]
      : validity.assignments.map(a => a.shiftId);

    const isReserved = (access_type !== undefined)
      ? (access_type.toUpperCase() === "RESERVED")
      : (validity.accessType === "RESERVED");

    const finalSeatId = !isReserved
      ? null
      : (seat_id !== undefined
        ? (seat_id ? parseInt(seat_id) : null)
        : (validity.assignments.find(a => a.seatId !== null)?.seatId || null));

    // Disabled seats must not be allocatable
    if (finalSeatId) {
      const seat = await mongoClient.seat.findFirst({
        where: { id: finalSeatId, isActive: true, branchId: req.user.branchId },
      });
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: "Selected seat is inactive or not available for allocation",
        });
      }
    }

    if (isReserved && finalSeatId && finalShiftIds.length > 0) {
      const conflict = await mongoClient.studentShiftAssignment.findFirst({
        where: {
          seatId: finalSeatId,
          shiftId: { in: finalShiftIds },
          assignmentStatus: "ACTIVE",
          validity: {
            student: {
              branchId: req.user.branchId,
              deletedAt: null,
              accountStatus: { in: ["ACTIVE", "SUSPENDED"] },
              id: { not: studentId },
            },
          }
        },
        include: {
          shift: true,
          seat: true,
          validity: {
            include: {
              student: true
            }
          }
        }
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Seat ${conflict.seat ? conflict.seat.seatNumber : finalSeatId} is already occupied by ${conflict.validity.student.fullName} in ${conflict.shift.shiftName}.`
        });
      }
    }

    const updates = {};

    if (fee_plan_id !== undefined) {
      updates.feePlanId = fee_plan_id ? parseInt(fee_plan_id) : null;
    }
    if (access_type !== undefined) {
      updates.accessType = access_type.toUpperCase();
    }

    if (Object.keys(updates).length > 0) {
      await mongoClient.studentValidity.update({
        where: { id: validity.id },
        data: updates,
      });
    }

    if (shift_ids !== undefined && Array.isArray(shift_ids)) {
      const newShiftIds = [...new Set(shift_ids.map(Number).filter(Boolean))];
      const existingAssignments = validity.assignments;
      const existingShiftIds = existingAssignments.map(a => a.shiftId);

      const toEnd = existingAssignments.filter(a => !newShiftIds.includes(a.shiftId));
      const toKeep = existingAssignments.filter(a => newShiftIds.includes(a.shiftId));
      const toCreate = newShiftIds.filter(sid => !existingShiftIds.includes(sid));

      for (const assignment of toEnd) {
        await mongoClient.studentShiftAssignment.update({
          where: { id: assignment.id },
          data: { assignmentStatus: "ENDED" },
        });
      }

      for (const assignment of toKeep) {
        if (finalSeatId !== undefined) {
          await mongoClient.studentShiftAssignment.update({
            where: { id: assignment.id },
            data: { seatId: finalSeatId, previousSeatId: null, seatReleasedAt: null },
          });
        }
      }

      for (const shiftId of toCreate) {
        await mongoClient.studentShiftAssignment.create({
          data: {
            validityId: validity.id,
            shiftId: shiftId,
            seatId: finalSeatId !== undefined ? finalSeatId : null,
            previousSeatId: null,
            seatReleasedAt: null,
          },
        });
      }
    } else if (shift_ids === undefined && (seat_id !== undefined || !isReserved)) {
      const activeAssignments = validity.assignments.filter(a => a.assignmentStatus === "ACTIVE");
      for (const assignment of activeAssignments) {
        if (!isReserved && assignment.seatId === null && assignment.previousSeatId === null && seat_id === undefined) {
          continue;
        }
        await mongoClient.studentShiftAssignment.update({
          where: { id: assignment.id },
          data: {
            seatId: isReserved ? (seat_id ? parseInt(seat_id) : null) : null,
            previousSeatId: null,
            seatReleasedAt: null,
          },
        });
      }
    }

    try {
      clearStatsCache();
      cache.invalidateBranch(req.user ? req.user.branchId : 1);
    } catch (e) {}

    res.json({ success: true, message: "Student details updated successfully" });
  } catch (error) {
    console.error("Update student details error:", error);
    res.status(500).json({ success: false, message: "Failed to update student details", error: error.message });
  }
};

const getAllShifts = async (req, res) => {
  try {
    const shifts = await mongoClient.shift.findMany({
      where: { isActive: true, branchId: req.user.branchId },
      orderBy: { startTime: "asc" },
    });
    res.json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch shifts" });
  }
};

const getAllFeePlans = async (req, res) => {
  try {
    const plans = await mongoClient.feePlan.findMany({
      where: { isActive: true, branchId: req.user.branchId },
      orderBy: { amount: "asc" },
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch fee plans" });
  }
};

const getShiftSeats = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const seats = await mongoClient.seat.findMany({
      where: { isActive: true, deletedAt: null, branchId: req.user.branchId },
      orderBy: { seatNumber: "asc" },
    });

    const assignedSeatIds = await mongoClient.studentShiftAssignment.findMany({
      where: {
        shiftId: parseInt(shiftId),
        assignmentStatus: "ACTIVE",
        seatId: { not: null },
        validity: {
          student: {
            deletedAt: null,
            branchId: req.user.branchId,
            accountStatus: { in: ["ACTIVE", "SUSPENDED"] },
          },
        },
      },
      select: { seatId: true },
    });

    const takenIds = new Set(assignedSeatIds.map(a => a.seatId));
    const available = seats.filter(s => !takenIds.has(s.id));

    res.json({ success: true, data: available });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch seats" });
  }
};

const admitStudent = async (req, res) => {
  try {
    const branchId = req.user ? req.user.branchId : 1;
    const {
      student_code,
      reg_no,
      full_name,
      email,
      mobile,
      gender,
      dob,
      address,
      aadhar_number,
      profile_photo_url,
      requestId,
      fee_plan_id,
      seat_type,
      shift_ids,
      seat_id,
      payment_mode_id,
      payment_date,
      utr_number,
      remarks,
      custom_amount,
    } = req.body;

    if (!student_code || !full_name || !email || !mobile || !gender) {
      return res.status(400).json({
        success: false,
        message: "student_code, full_name, email, mobile, and gender are required",
      });
    }

    // Validate fields & branch-scoped duplicates
    const validationError = await validateStudentFieldsAndDuplicates({
      mobile,
      email,
      aadharNumber: aadhar_number,
      branchId,
    });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (!fee_plan_id || !seat_type) {
      return res.status(400).json({
        success: false,
        message: "Fee Plan and Seat Type are required for admission",
      });
    }

    if (!shift_ids || !Array.isArray(shift_ids) || shift_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one shift must be selected",
      });
    }

    const effectiveAccessType = seat_type === "Reserved" ? "RESERVED" : "UNRESERVED";

    if (effectiveAccessType === "RESERVED" && !seat_id) {
      return res.status(400).json({
        success: false,
        message: "A seat must be selected for Reserved access type",
      });
    }

    const stId = seat_id ? parseInt(seat_id) : null;
    const parsedShiftIds = (shift_ids || []).map(Number).filter(Boolean);

    // Verify seat is active (disabled seats must not be allocatable)
    if (stId) {
      const seat = await mongoClient.seat.findFirst({
        where: { id: stId, isActive: true, branchId: req.user ? req.user.branchId : branchId },
      });
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: "Selected seat is inactive or not available for allocation",
        });
      }

      // Check upfront if seat is already booked in ANY of the selected shifts BEFORE creating student!
      const conflict = await mongoClient.studentShiftAssignment.findFirst({
        where: {
          seatId: stId,
          shiftId: { in: parsedShiftIds },
          assignmentStatus: "ACTIVE",
          validity: {
            student: {
              branchId: req.user ? req.user.branchId : branchId,
              deletedAt: null,
              accountStatus: { in: ["ACTIVE", "SUSPENDED"] },
            },
          },
        },
        include: {
          shift: true,
          seat: true,
          validity: {
            include: {
              student: true,
            },
          },
        },
      });

      if (conflict) {
        const seatName = conflict.seat ? conflict.seat.seatNumber : ("Seat #" + stId);
        const shiftName = conflict.shift ? conflict.shift.shiftName : "selected shift";
        const studentName = conflict.validity?.student?.fullName || "another member";
        return res.status(409).json({
          success: false,
          message: "Seat " + seatName + " is already occupied by " + studentName + " in " + shiftName + ". Please select an available seat.",
        });
      }
    }

    // Verify fee plan is active
    const feePlan = await mongoClient.feePlan.findFirst({
      where: { id: parseInt(fee_plan_id), isActive: true, branchId: req.user.branchId },
    });

    if (!feePlan) {
      return res.status(404).json({
        success: false,
        message: "Fee plan not found or inactive",
      });
    }

    // Enforce student limit by subscription tier
    if (req.user) {
      const creator = await mongoClient.user.findUnique({
        where: { id: req.user.id }
      });
      if (creator) {
        const activeCount = await mongoClient.student.count({
          where: { accountStatus: "ACTIVE", deletedAt: null, branchId: req.user.branchId }
        });
        const limit = await subscriptionPlanService.getStudentLimitForTier(creator.subscriptionTier);
        if (activeCount >= limit) {
          return res.status(403).json({
            success: false,
            message: `Active student limit reached (${limit} students). Please upgrade your subscription in Settings page to add more members.`
          });
        }
      }
    }

    const todayYmd = getISTTimeParts().ymd;
    const startDateObj = new Date(`${todayYmd}T00:00:00+05:30`);
    const durationDays = Math.max(1, Number(feePlan.durationDays || 30));
    const endYmd = addDaysToYmd(todayYmd, durationDays - 1);
    const endDateObj = new Date(`${endYmd}T23:59:59.999+05:30`);
    const today = startDateObj;

    const finalAmount = custom_amount !== undefined && custom_amount !== null && custom_amount !== "" ? parseFloat(custom_amount) : feePlan.amount;

    // Track created entity IDs for reliable rollback cleanup if any step fails
    let createdStudentId = null;
    let createdValidityId = null;
    let createdPaymentId = null;

    // Run full admission in ONE transaction so student is NEVER created without validity & shift assignments!
    const result = await mongoClient.$transaction(async (tx) => {
      // 1. Create Student
      const newStudent = await tx.student.create({
        data: {
          studentCode: student_code,
          regNo: reg_no || null,
          fullName: full_name,
          email: email,
          mobile: mobile,
          gender: gender.toUpperCase(),
          dob: dob ? new Date(dob) : null,
          address: address || null,
          aadharNumber: aadhar_number || null,
          profilePhotoUrl: profile_photo_url || null,
          admissionDate: today,
          accountStatus: "ACTIVE",
          createdBy: req.user ? req.user.id : null,
          branchId: req.user ? req.user.branchId : 1,
        },
      });

      createdStudentId = newStudent.id;

      // 2. Create Student Validity
      const validity = await tx.studentValidity.create({
        data: {
          studentId: newStudent.id,
          feePlanId: parseInt(fee_plan_id),
          startDate: startDateObj,
          endDate: endDateObj,
          totalAmount: finalAmount,
          accessType: effectiveAccessType,
        },
      });

      // 3. Create Shift Assignments & Seat Assignments
      const stId = seat_id ? parseInt(seat_id) : null;
      for (const shiftId of shift_ids) {
        const shId = parseInt(shiftId);

        // Check if seat is already booked for this shift
        if (stId) {
          const seatBooked = await tx.studentShiftAssignment.findFirst({
            where: {
              shiftId: shId,
              seatId: stId,
              assignmentStatus: "ACTIVE",
              validity: {
                student: {
                  deletedAt: null,
                  branchId: req.user ? req.user.branchId : branchId,
                  accountStatus: { in: ["ACTIVE", "SUSPENDED"] },
                },
              },
            },
          });

          if (seatBooked) {
            const err = new Error("Selected seat is already booked for one of the selected shifts");
            err.code = "SEAT_BOOKED";
            throw err;
          }
        }

        await tx.studentShiftAssignment.create({
          data: {
            validityId: validity.id,
            shiftId: shId,
            seatId: stId,
            assignmentStatus: "ACTIVE",
          },
        });
      }

      createdValidityId = validity.id;

      // 4. Create Payment if payment details provided
      let paymentRecord = null;
      if (payment_mode_id) {
        paymentRecord = await tx.payment.create({
          data: {
            validityId: validity.id,
            paymentModeId: parseInt(payment_mode_id),
            invoiceNo: generateInvoiceNo(),
            amountReceived: finalAmount,
            paymentDate: parsePaymentDate(payment_date),
            utrNumber: utr_number || null,
            remarks: remarks || "(Admission Fee)",
          },
        });
        createdPaymentId = paymentRecord.id;
      }

      // 5. Update Admission Request if applicable
      if (requestId) {
        await tx.admissionRequest.update({
          where: { id: parseInt(requestId) },
          data: { status: "APPROVED" },
        });
      }

      return {
        student: newStudent,
        validity,
        payment: paymentRecord,
      };
    });

    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: emailFrom,
          to: [email],
          subject: "Welcome to Library!",
          html: `<p>Dear ${full_name}, your admission is complete. Student Code: ${student_code}</p>`,
        });
      }
    } catch (e) {
      console.log("Email sending error:", e.message);
    }

    try {
      clearStatsCache();
      cache.invalidateBranch(branchId);
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: "Student admitted with shifts & seat allocated successfully",
      data: {
        ...formatStudent(result.student),
        invoice_no: result.payment ? result.payment.invoiceNo : null,
      },
    });

  } catch (error) {
    if (error.code === "P2002" || error.code === 11000) {
      const target = error.meta?.target || Object.keys(error.keyPattern || {});
      let fieldStr = "student code, mobile, or email";
      if (Array.isArray(target) && target.length > 0) {
        fieldStr = target.join(", ");
      } else if (typeof target === "string" && target.trim()) {
        fieldStr = target;
      }
      if (fieldStr.toLowerCase().includes("invoice")) {
        return res.status(409).json({
          success: false,
          message: "Invoice number already exists. Please try again.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `A student with this ${fieldStr} already exists in this library branch.`,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to complete admission",
      error: error.message,
    });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  getStudentProfile,
  searchStudents,
  getNextStudentCode,
  createStudent,
  admitStudent,
  updateStudent,
  deleteStudent,
  updateStudentDetails,
  getAllShifts,
  getAllFeePlans,
  getShiftSeats,
  autoSuspendExpiredStudents,
  resetAutoSuspendThrottle,
};