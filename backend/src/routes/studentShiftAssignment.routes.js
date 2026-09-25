const express = require("express");
const router = express.Router();

const {
  getStudentShiftAssignments,
  createStudentShiftAssignment,
  createBulkShiftAssignments,
} = require("../controllers/studentShiftAssignment.controller");

router.get("/", getStudentShiftAssignments);
router.post("/", createStudentShiftAssignment);
router.post("/bulk", createBulkShiftAssignments);

module.exports = router;