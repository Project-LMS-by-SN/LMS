const prisma = require("../config/prisma");
const { formatDateStr } = require("../utils/format");

const formatRequest = (r) => ({
  id: r.id,
  full_name: r.fullName,
  email: r.email,
  mobile: r.mobile,
  gender: r.gender,
  dob: formatDateStr(r.dob),
  address: r.address,
  aadhar_number: r.aadharNumber,
  profile_photo_url: r.profilePhotoUrl,
  status: r.status,
  created_at: r.createdAt.toISOString(),
});

// Public POST /api/admission-requests
const createRequest = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Online QR Code admission registration is currently disabled by library administrator.",
  });
};

// Authenticated GET /api/admission-requests
const getRequests = async (req, res) => {
  try {
    const userBranchId = req.user.branchId || 1;
    const requests = await prisma.admissionRequest.findMany({
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
    const existing = await prisma.admissionRequest.findFirst({
      where: { id: parseInt(id), branchId: req.user.branchId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Admission request not found" });
    }

    await prisma.admissionRequest.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Admission request deleted/rejected successfully",
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
    const request = await prisma.admissionRequest.findFirst({
      where: { id: parseInt(id), branchId: req.user.branchId },
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
  createRequest,
  getRequests,
  deleteRequest,
  getRequestById,
};
