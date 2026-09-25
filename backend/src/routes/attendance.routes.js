const express = require("express");
const router = express.Router();

const {
  getAttendance,
  searchStudentAttendance,
  checkIn,
  checkOut,
  getActiveCheckIns,
  checkoutAllActive,
  publicSearchStudent,
  publicCheckInOrOut,
} = require("../controllers/attendance.controller");

const {
  publicAttendanceLimiter
} = require("../middleware/rateLimiter");

router.get("/public-search", publicAttendanceLimiter, publicSearchStudent);
router.post("/public-checkin", publicAttendanceLimiter, publicCheckInOrOut);

router.get("/", getAttendance);
router.get("/search", searchStudentAttendance);
router.get("/active", getActiveCheckIns);
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.post("/checkout-all", checkoutAllActive);

module.exports = router;