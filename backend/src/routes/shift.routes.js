const express = require("express");
const router = express.Router();

const {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
} = require("../controllers/shift.controller");

router.get("/", getShifts);
router.post("/", createShift);
router.put("/:id", updateShift);
router.delete("/:id", deleteShift);

module.exports = router;