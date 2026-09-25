const express = require("express");
const router = express.Router();

const {
  getFeePlans,
  createFeePlan,
  updateFeePlan,
  deactivateFeePlan,
  deleteFeePlan,
} = require("../controllers/feePlan.controller");

router.get("/", getFeePlans);
router.post("/", createFeePlan);
router.put("/:id", updateFeePlan);
router.patch("/:id/deactivate", deactivateFeePlan);
router.delete("/:id", deleteFeePlan);

module.exports = router;