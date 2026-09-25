const express = require("express");
const router = express.Router();
const controller = require("../controllers/admissionRequest.controller");
const { admissionLimiter } = require("../middleware/rateLimiter");

router.post("/", admissionLimiter, controller.createRequest);
router.get("/", controller.getRequests);
router.get("/:id", controller.getRequestById);
router.delete("/:id", controller.deleteRequest);

module.exports = router;
