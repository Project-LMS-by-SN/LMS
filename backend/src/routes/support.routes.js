const express = require("express");
const router = express.Router();
const {
  createSupportTicket,
  getSupportTickets,
} = require("../controllers/support.controller");

// Support Ticket endpoints
router.post("/", createSupportTicket);
router.get("/", getSupportTickets);

module.exports = router;
