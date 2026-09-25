const express = require("express");
const router = express.Router();

const {
  getSeats,
  createSeat,
  createBulkSeats,
  updateSeat,
  deleteSeat,
  deleteBulkSeats,
  toggleSeatActive,
  renumberSeats,
} = require("../controllers/seat.controller");

router.get("/", getSeats);
router.post("/", createSeat);
router.post("/bulk", createBulkSeats);
router.post("/renumber", renumberSeats);
router.post("/delete-bulk", deleteBulkSeats);
router.put("/:id", updateSeat);
router.patch("/:id/toggle-active", toggleSeatActive);
router.delete("/:id", deleteSeat);

module.exports = router;