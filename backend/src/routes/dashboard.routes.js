const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getRevenueByYear,
  getRecentPayments,
  getSeatAvailability,
  getNotifications,
  getStudentsByMetric,
} = require("../controllers/dashboard.controller");

router.get("/stats", getDashboardStats);
router.get("/revenue", getRevenueByYear);
router.get("/recent-payments", getRecentPayments);
router.get("/seat-availability", getSeatAvailability);
router.get("/notifications", getNotifications);
router.get("/stats-students", getStudentsByMetric);

module.exports = router;