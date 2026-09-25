const express = require("express");
const router = express.Router();

const {
  getDailyAttendanceReport,
  getRevenueReport,
} = require("../controllers/report.controller");

router.get("/daily-attendance", getDailyAttendanceReport);
router.get("/revenue", getRevenueReport);

module.exports = router;
