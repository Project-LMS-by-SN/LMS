const prisma = require("../config/prisma");

const getPaymentModes = async (req, res) => {
  try {
    const modes = await prisma.paymentMode.findMany({
      where: {
        isActive: true,
        OR: [
          { branchId: req.user.branchId },
          { branchId: null },
        ],
      },
      orderBy: { id: "asc" },
    });

    const formattedData = modes.map((m) => ({
      id: m.id,
      mode_name: m.modeName,
      is_active: m.isActive,
    }));

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment modes",
      error: error.message,
    });
  }
};

module.exports = {
  getPaymentModes,
};