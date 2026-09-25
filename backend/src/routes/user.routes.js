const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { loginLimiter } = require("../middleware/rateLimiter");

router.post("/login", loginLimiter, userController.login);
router.post("/logout", userController.logout);
router.post("/forgot-password", loginLimiter, userController.forgotPassword);
router.get("/reset-password", userController.resetPassword);
router.post("/reset-password", userController.resetPassword);
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.put("/change-password", userController.changePassword);
router.delete("/account", userController.deleteAccount);
router.put("/subscription", userController.updateSubscription);
router.post("/activate-pending-plan", userController.activatePendingPlan);

// Staff management routes
router.get("/staff", userController.getStaff);
router.post("/staff", userController.createStaff);
router.put("/staff/:id/password", userController.changeStaffPassword);
router.delete("/staff/:id", userController.deleteStaff);

module.exports = router;
