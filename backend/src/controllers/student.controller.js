const prisma = require("../config/prisma");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM || "noreply@dashurl.in";
const { formatDateStr, formatDateTimeStr, parsePaymentDate, generateInvoiceNo } = require("../utils/format");

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

const logAction = async (action, tableName, recordId, oldValues, newValues, userId) => {
  try {
    await prisma.auditLog.create({
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

const autoSuspendExpiredStudents = async (branchId) => {
  try {
    const key = branchId || "all";
    const now = Date.now();
    const lastRun = lastAutoSuspendRun.get(key) || 0;
    if (now - lastRun < AUTO_SUSPEND_INTERVAL_MS) return;
    lastAutoSuspendRun.set(key, now);

    const nowDate = new Date();
    const sevenDaysAgo = new Date(nowDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(nowDate.getTime() - 20 * 24 * 60 * 60 * 1000);

    const students = await prisma.student.findMany({
      where: {
        accountStatus: { in: ["ACTIVE", "SUSPENDED"] },
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

    for (const student of students) {
      const validity = student.validities && student.validities.length > 0 ? student.validities[student.validities.length - 1] : null;
      if (!validity) {
        if (student.admissionDate < twentyDaysAgo) {
          studentsToInactive.push(student.id);
        } else if (student.admissionDate < sevenDaysAgo) {
          studentsToSuspend.push(student.id);
        }
      } else {
        const totalAmount = Number(validity.totalAmount || 0);
        let totalPaid = 0;
        if (validity.payments) {
          validity.payments.forEach((p) => {
            totalPaid += Number(p.amountReceived || 0);
          });
        }
        const dueAmount = totalAmount - totalPaid;

        const endDate = new Date(validity.endDate);
        const startDate = new Date(validity.startDate);
        const isExpired = endDate < now;
        const hasDue = dueAmount > 0;

        if (hasDue || isExpired) {
          const refDate = isExpired ? endDate : startDate;
          if (refDate < twentyDaysAgo) {
            studentsToInactive.push(student.id);
          } else if (refDate < sevenDaysAgo) {
            studentsToSuspend.push(student.id);
          }
        }
      }
    }

    if (studentsToSuspend.length > 0) {
      await prisma.student.updateMany({
        where: { id: { in: studentsToSuspend } },
        data: { accountStatus: "SUSPENDED" },
      });
      for (const id of studentsToSuspend) {
        await logAction("AUTO_SUSPEND_STUDENT", "students", id, { accountStatus: "ACTIVE" }, { accountStatus: "SUSPENDED" }, null);
      }
    }

    if (studentsToInactive.length > 0) {
      await prisma.student.updateMany({
        where: { id: { in: studentsToInactive } },
        data: { accountStatus: "INACTIVE" },
      });
      for (const id of studentsToInactive) {
        await logAction("AUTO_INACTIVE_STUDENT", "students", id, { accountStatus: "SUSPENDED" }, { accountStatus: "INACTIVE" }, null);
      }
    }
  } catch (err) {
    console.error("Auto suspend/inactive error:", err);
  }
};

const getStudents = async (req, res) => {
  try {
    await autoSuspendExpiredStudents(req.user.branchId);

    // Fetch total active shifts count
    const activeShiftsCount = await prisma.shift.count({
      where: { isActive: true, deletedAt: null, branchId: req.user.branchId }
    });

    const students = await prisma.student.findMany({
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

          const assignedCount = activeAssignments.length;
          if (assignedCount === 1) {
            shiftName = activeAssignments[0].shift ? activeAssignments[0].shift.shiftName : null;
          } else if (assignedCount === 2) {
            if (activeShiftsCount === 2) {
              shiftName = "Full Day";
            } else {
              shiftName = "2 Shift";
            }
          } else if (assignedCount >= 3 || assignedCount === activeShiftsCount) {
            shiftName = "Full Day";
          } else {
            shiftName = null;
          }
        }
      }

      const dueAmount = totalAmount - totalPaid;

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
        access_type: validity ? validity.accessType : null,
        seat_number: seatNumber,
        shift_name: shiftName,
        plan_name: planName,
        end_date: endDate,
        due_amount: dueAmount > 0 ? dueAmount : 0,
      };
    });

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

    const student = await prisma.student.findFirst({
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
  const mobileDuplicate = await prisma.student.findFirst({
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
  const emailDuplicate = await prisma.student.findFirst({
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
    const aadharDuplicate = await prisma.student.findFirst({
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
      const creator = await prisma.user.findUnique({
        where: { id: req.user.id }
      });
      if (creator) {
        const activeCount = await prisma.student.count({
          where: { accountStatus: "ACTIVE", deletedAt: null, branchId: req.user.branchId }
        });
        const getStudentLimit = (tier) => {
          if (tier === "STARTER") return 150;
          if (tier === "PRO_100") return 250;
          if (tier === "PRO_200") return 500;
          if (tier === "ENTERPRISE") return 999999;
          return 0; // FREE - no students allowed
        };
        const limit = getStudentLimit(creator.subscriptionTier);
        if (activeCount >= limit) {
          return res.status(403).json({
            success: false,
            message: `Active student limit reached (${limit} students). Please upgrade your subscription in Settings page to add more members.`
          });
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newStudent = await prisma.student.create({
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
      await prisma.admissionRequest.update({
        where: { id: parseInt(requestId) },
        data: { status: "APPROVED" },
      });
    }

    // Audit Log
    await logAction("CREATE_STUDENT", "students", newStudent.id, null, newStudent, req.user ? req.user.id : null);

    // Send email notifications if created by a STAFF member
    if (req.user && req.user.role === "STAFF") {
      (async () => {
        try {
          const creator = await prisma.user.findUnique({
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
          const owners = await prisma.user.findMany({
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

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: formatStudent(newStudent),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Student code or registration number already exists",
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
      account_status,
      profile_photo_url,
    } = req.body;

    const studentId = parseInt(id);

    const existing = await prisma.student.findFirst({
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

    const updated = await prisma.student.update({
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
        accountStatus: account_status !== undefined ? account_status.toUpperCase() : existing.accountStatus,
        profilePhotoUrl: profile_photo_url !== undefined ? profile_photo_url : existing.profilePhotoUrl,
        updatedAt: new Date(),
      },
    });

    // Audit Log
    await logAction("UPDATE_STUDENT", "students", studentId, existing, updated, req.user ? req.user.id : null);

    res.json({
      success: true,
      message: "Student updated successfully",
      data: formatStudent(updated),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Student code or registration number already exists",
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

    const existing = await prisma.student.findFirst({
      where: { id: studentId, deletedAt: null, branchId: req.user.branchId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const deleted = await prisma.student.update({
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
    await prisma.studentShiftAssignment.updateMany({
      where: { validity: { studentId: studentId }, assignmentStatus: "ACTIVE" },
      data: { assignmentStatus: "ENDED" },
    });

    // Audit Log
    await logAction("DELETE_STUDENT", "students", studentId, existing, deleted, req.user ? req.user.id : null);

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
    const activeStudents = await prisma.student.findMany({
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
    while (await prisma.student.findFirst({ where: { studentCode, branchId: targetBranchId } })) {
      nextSeq++;
      studentCode = `STD${String(nextSeq).padStart(5, "0")}`;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    let regNo = `REG${year}${month}${String(nextSeq).padStart(5, "0")}`;

    while (await prisma.student.findFirst({ where: { regNo, branchId: targetBranchId } })) {
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

    const students = await prisma.student.findMany({
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

    const student = await prisma.student.findFirst({
      where: { id: studentId, deletedAt: null, branchId: req.user.branchId },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get latest validity
    const latestValidity = await prisma.studentValidity.findFirst({
      where: { studentId: studentId },
      include: {
        feePlan: true,
      },
      orderBy: { id: "desc" },
    });

    let shiftAssignments = [];
    if (latestValidity) {
      const assignments = await prisma.studentShiftAssignment.findMany({
        where: { validityId: latestValidity.id, assignmentStatus: "ACTIVE" },
        include: {
          shift: true,
          seat: true,
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
          floor: a.seat ? a.seat.floor : null,
          room: a.seat ? a.seat.room : null,
          assignment_status: a.assignmentStatus,
        }))
        .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    }

    // Get all payments related to this student
    const payments = await prisma.payment.findMany({
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
    const studentAssignments = await prisma.studentShiftAssignment.findMany({
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
      const rawAttendance = await prisma.attendance.findMany({
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

    res.json({
      success: true,
      data: {
        ...formatStudent(student),
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

    const student = await prisma.student.findFirst({
      where: { id: studentId, deletedAt: null, branchId: req.user.branchId },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const validity = await prisma.studentValidity.findFirst({
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

    const finalSeatId = (seat_id !== undefined)
      ? (seat_id ? parseInt(seat_id) : null)
      : (validity.assignments.find(a => a.seatId !== null)?.seatId || null);

    // Disabled seats must not be allocatable
    if (finalSeatId) {
      const seat = await prisma.seat.findFirst({
        where: { id: finalSeatId, isActive: true, branchId: req.user.branchId },
      });
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: "Selected seat is inactive or not available for allocation",
        });
      }
    }

    const isReserved = (access_type !== undefined)
      ? (access_type.toUpperCase() === "RESERVED")
      : (validity.accessType === "RESERVED");

    if (isReserved && finalSeatId && finalShiftIds.length > 0) {
      const conflict = await prisma.studentShiftAssignment.findFirst({
        where: {
          seatId: finalSeatId,
          shiftId: { in: finalShiftIds },
          assignmentStatus: "ACTIVE",
          validity: {
            student: {
              branchId: req.user.branchId,
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
      await prisma.studentValidity.update({
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
        await prisma.studentShiftAssignment.update({
          where: { id: assignment.id },
          data: { assignmentStatus: "ENDED" },
        });
      }

      for (const assignment of toKeep) {
        if (finalSeatId !== undefined) {
          await prisma.studentShiftAssignment.update({
            where: { id: assignment.id },
            data: { seatId: finalSeatId },
          });
        }
      }

      for (const shiftId of toCreate) {
        await prisma.studentShiftAssignment.create({
          data: {
            validityId: validity.id,
            shiftId: shiftId,
            seatId: finalSeatId !== undefined ? finalSeatId : null,
          },
        });
      }
    } else if (shift_ids === undefined && seat_id !== undefined) {
      const activeAssignments = validity.assignments.filter(a => a.assignmentStatus === "ACTIVE");
      for (const assignment of activeAssignments) {
        await prisma.studentShiftAssignment.update({
          where: { id: assignment.id },
          data: { seatId: seat_id ? parseInt(seat_id) : null },
        });
      }
    }

    res.json({ success: true, message: "Student details updated successfully" });
  } catch (error) {
    console.error("Update student details error:", error);
    res.status(500).json({ success: false, message: "Failed to update student details", error: error.message });
  }
};

const getAllShifts = async (req, res) => {
  try {
    const shifts = await prisma.shift.findMany({
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
    const plans = await prisma.feePlan.findMany({
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
    const seats = await prisma.seat.findMany({
      where: { isActive: true, deletedAt: null, branchId: req.user.branchId },
      orderBy: { seatNumber: "asc" },
    });

    const assignedSeatIds = await prisma.studentShiftAssignment.findMany({
      where: {
        shiftId: parseInt(shiftId),
        assignmentStatus: "ACTIVE",
        seatId: { not: null },
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

    // Verify seat is active (disabled seats must not be allocatable)
    if (seat_id) {
      const seat = await prisma.seat.findFirst({
        where: { id: parseInt(seat_id), isActive: true, branchId: req.user.branchId },
      });
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: "Selected seat is inactive or not available for allocation",
        });
      }
    }

    // Verify fee plan is active
    const feePlan = await prisma.feePlan.findFirst({
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
      const creator = await prisma.user.findUnique({
        where: { id: req.user.id }
      });
      if (creator) {
        const activeCount = await prisma.student.count({
          where: { accountStatus: "ACTIVE", deletedAt: null, branchId: req.user.branchId }
        });
        const getStudentLimit = (tier) => {
          if (tier === "STARTER") return 150;
          if (tier === "PRO_100") return 250;
          if (tier === "PRO_200") return 500;
          if (tier === "ENTERPRISE") return 999999;
          return 0;
        };
        const limit = getStudentLimit(creator.subscriptionTier);
        if (activeCount >= limit) {
          return res.status(403).json({
            success: false,
            message: `Active student limit reached (${limit} students). Please upgrade your subscription in Settings page to add more members.`
          });
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDateObj = today;
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + (feePlan.durationDays - 1));

    const finalAmount = custom_amount !== undefined && custom_amount !== null && custom_amount !== "" ? parseFloat(custom_amount) : feePlan.amount;

    // Run full admission in ONE transaction so student is NEVER created without validity & shift assignments!
    const result = await prisma.$transaction(async (tx) => {
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

    res.status(201).json({
      success: true,
      message: "Student admitted with shifts & seat allocated successfully",
      data: {
        ...formatStudent(result.student),
        invoice_no: result.payment ? result.payment.invoiceNo : null,
      },
    });

  } catch (error) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
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
};