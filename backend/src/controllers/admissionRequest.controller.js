const mongoClient = require("../config/mongoClient");
const { formatDateStr } = require("../utils/format");

const formatRequest = (r) => ({
  id: r.id,
  full_name: r.fullName,
  email: r.email || "",
  mobile: r.mobile,
  gender: r.gender,
  dob: formatDateStr(r.dob),
  address: r.address || "",
  aadhar_number: r.aadharNumber || "",
  profile_photo_url: r.profilePhotoUrl || null,
  preferred_shift_id: r.preferredShiftId || null,
  preferred_fee_plan_id: r.preferredFeePlanId || null,
  remarks: r.remarks || null,
  branch_id: r.branchId,
  status: r.status,
  created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
});

// Public GET /api/admission-requests/branch-info?token=...
const getBranchInfoByToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "Admission QR token is required",
      });
    }

    const branch = await mongoClient.branch.findFirst({
      where: {
        admissionToken: token.trim(),
        isActive: true,
      },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired admission QR code link. Please verify the code or contact the library.",
      });
    }

    // Fetch shifts and fee plans for this branch
    const [shifts, feePlans] = await Promise.all([
      mongoClient.shift.findMany({
        where: { branchId: branch.id, isActive: true },
        orderBy: { startTime: "asc" },
      }),
      mongoClient.feePlan.findMany({
        where: { branchId: branch.id, isActive: true },
        orderBy: { amount: "asc" },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        branch: {
          id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          code: branch.code,
        },
        shifts: shifts.map((s) => ({
          id: s.id,
          name: s.shiftName,
          start_time: s.startTime,
          end_time: s.endTime,
        })),
        feePlans: feePlans.map((p) => ({
          id: p.id,
          name: p.planName,
          amount: p.amount,
          duration_days: p.durationDays,
          seat_type: p.seatType,
        })),
      },
    });
  } catch (error) {
    console.error("Error in getBranchInfoByToken:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve library admission details",
      error: error.message,
    });
  }
};

// Public POST /api/admission-requests
const createRequest = async (req, res) => {
  try {
    const {
      token,
      branchId,
      full_name,
      fullName,
      email,
      mobile,
      gender,
      dob,
      address,
      aadhar_number,
      aadharNumber,
      profile_photo_url,
      profilePhotoUrl,
      preferred_shift_id,
      preferredShiftId,
      preferred_fee_plan_id,
      preferredFeePlanId,
      remarks,
    } = req.body;

    const studentName = (fullName || full_name || "").trim();
    const studentMobile = (mobile || "").trim();
    const studentGender = (gender || "OTHER").toUpperCase();

    if (!studentName) {
      return res.status(400).json({ success: false, message: "Student full name is required." });
    }
    if (!studentMobile) {
      return res.status(400).json({ success: false, message: "Mobile number is required." });
    }

    // Resolve branch strictly via unguessable token
    let targetBranch = null;
    if (token && typeof token === "string" && token.trim()) {
      targetBranch = await mongoClient.branch.findFirst({
        where: { admissionToken: token.trim(), isActive: true },
      });
    }

    if (!targetBranch && branchId) {
      targetBranch = await mongoClient.branch.findFirst({
        where: { id: parseInt(branchId), isActive: true },
      });
    }

    if (!targetBranch) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired admission QR link. Unable to verify library branch.",
      });
    }

    // Check if duplicate pending application exists for this mobile
    const existingPending = await mongoClient.admissionRequest.findFirst({
      where: {
        branchId: targetBranch.id,
        mobile: studentMobile,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: `An admission application with mobile ${studentMobile} is already pending at ${targetBranch.name}.`,
        referenceNumber: `ADM-${String(existingPending.id).padStart(5, "0")}`,
      });
    }

    const newRequest = await mongoClient.admissionRequest.create({
      data: {
        fullName: studentName,
        email: (email || "").trim(),
        mobile: studentMobile,
        gender: ["MALE", "FEMALE", "OTHER"].includes(studentGender) ? studentGender : "OTHER",
        dob: dob ? new Date(dob) : null,
        address: (address || "").trim() || null,
        aadharNumber: (aadharNumber || aadhar_number || "").trim() || null,
        profilePhotoUrl: profilePhotoUrl || profile_photo_url || null,
        branchId: targetBranch.id,
        preferredShiftId: preferredShiftId || preferred_shift_id ? parseInt(preferredShiftId || preferred_shift_id) : null,
        preferredFeePlanId: preferredFeePlanId || preferred_fee_plan_id ? parseInt(preferredFeePlanId || preferred_fee_plan_id) : null,
        remarks: (remarks || "").trim() || null,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      success: true,
      message: `Admission application submitted successfully to ${targetBranch.name}!`,
      data: {
        id: newRequest.id,
        referenceNumber: `ADM-${String(newRequest.id).padStart(5, "0")}`,
        libraryName: targetBranch.name,
        fullName: newRequest.fullName,
      },
    });
  } catch (error) {
    console.error("Admission request submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit admission application",
      error: error.message,
    });
  }
};

// Authenticated GET /api/admission-requests
const getRequests = async (req, res) => {
  try {
    const userBranchId = req.user.branchId || 1;
    const requests = await mongoClient.admissionRequest.findMany({
      where: {
        status: "PENDING",
        OR: [
          { branchId: userBranchId },
          { branchId: null }
        ]
      },
      orderBy: { id: "desc" },
    });

    res.json({
      success: true,
      data: requests.map(formatRequest),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admission requests",
      error: error.message,
    });
  }
};

// Authenticated DELETE /api/admission-requests/:id
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userBranchId = req.user.branchId || 1;
    const existing = await mongoClient.admissionRequest.findFirst({
      where: {
        id: parseInt(id),
        OR: [{ branchId: userBranchId }, { branchId: null }],
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Admission request not found" });
    }

    await mongoClient.admissionRequest.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Admission request rejected/removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete/reject admission request",
      error: error.message,
    });
  }
};

// Authenticated GET /api/admission-requests/:id
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userBranchId = req.user.branchId || 1;
    const request = await mongoClient.admissionRequest.findFirst({
      where: {
        id: parseInt(id),
        OR: [{ branchId: userBranchId }, { branchId: null }],
      },
    });
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Admission request not found",
      });
    }
    res.json({
      success: true,
      data: formatRequest(request),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve request details",
      error: error.message,
    });
  }
};

module.exports = {
  getBranchInfoByToken,
  createRequest,
  getRequests,
  deleteRequest,
  getRequestById,
};
