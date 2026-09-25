const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/student.controller");

router.get("/next-code", getNextStudentCode);
router.get("/search", searchStudents);
router.get("/shifts", getAllShifts);
router.get("/fee-plans", getAllFeePlans);
router.get("/seats/:shiftId", getShiftSeats);
router.get("/", getStudents);
router.get("/:id/profile", getStudentProfile);
router.get("/:id", getStudentById);
router.post("/admit", admitStudent);
router.post("/", createStudent);
router.put("/:id/details", updateStudentDetails);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

module.exports = router;