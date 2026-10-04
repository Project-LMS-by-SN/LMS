const express = require("express");
const router = express.Router();
const controller = require("../controllers/admissionRequest.controller");
const { admissionLimiter } = require("../middleware/rateLimiter");

// Public endpoints
router.get("/branch-info", controller.getBranchInfoByToken);
router.post("/", admissionLimiter, controller.createRequest);

// Authenticated endpoints
router.get("/", controller.getRequests);
router.get("/:id", controller.getRequestById);
router.delete("/:id", controller.deleteRequest);

module.exports = router;
