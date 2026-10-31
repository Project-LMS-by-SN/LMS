const models = require("../models");

/**
 * Create a new support ticket in MongoDB Atlas
 * POST /api/support
 */
const createSupportTicket = async (req, res) => {
  try {
    const { name, phone, category, subject, message, priority } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a description for your issue or inquiry.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide your name or library name.",
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide your contact phone number.",
      });
    }

    const userId = req.user?.id || null;
    const branchId = req.user?.branchId || null;

    const shortSubject = subject && subject.trim()
      ? subject.trim()
      : message.trim().slice(0, 70) + (message.trim().length > 70 ? "..." : "");

    const ticket = new models.SupportTicket({
      userId,
      branchId,
      name: name.trim(),
      phone: phone.trim(),
      category: category || "General Inquiry",
      subject: shortSubject,
      message: message.trim(),
      priority: priority === "Urgent" ? "Urgent" : "Normal",
      status: "OPEN",
    });

    await ticket.save();

    return res.status(201).json({
      success: true,
      message: "Support request logged successfully! Our team will contact you shortly.",
      ticket: {
        id: ticket.id,
        _id: ticket._id,
        userId: ticket.userId,
        branchId: ticket.branchId,
        name: ticket.name,
        phone: ticket.phone,
        category: ticket.category,
        subject: ticket.subject,
        message: ticket.message,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error("Create support ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record support request. Please try again or reach out via WhatsApp/Phone.",
      error: error.message,
    });
  }
};

/**
 * Get support tickets for the current user or branch
 * GET /api/support
 */
const getSupportTickets = async (req, res) => {
  try {
    const filter = {};

    // If user is logged in and not a super admin, filter by branchId or userId
    if (req.user) {
      if (req.user.role !== "ADMIN") {
        if (req.user.branchId) {
          filter.$or = [{ branchId: req.user.branchId }, { userId: req.user.id }];
        } else {
          filter.userId = req.user.id;
        }
      }
    } else if (req.query.phone) {
      filter.phone = req.query.phone;
    }

    const tickets = await models.SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Get support tickets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch support tickets.",
      error: error.message,
    });
  }
};

module.exports = {
  createSupportTicket,
  getSupportTickets,
};
