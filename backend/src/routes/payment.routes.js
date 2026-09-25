const express = require("express");
const router = express.Router();

const {
  getPayments,
  createPayment,
  recordPayment,
} = require("../controllers/payment.controller");

const {
  createOrder,
  verifySignature,
  validateCouponEndpoint,
  getCouponStatusEndpoint,
  getSubscriptionHistory,
} = require("../controllers/razorpay.controller");

router.get("/", getPayments);
router.post("/", createPayment);
router.post("/create", createPayment);
router.post("/record", recordPayment);

// Razorpay subscription routes
router.post("/razorpay/create-order", createOrder);
router.post("/razorpay/verify-signature", verifySignature);
router.post("/razorpay/validate-coupon", validateCouponEndpoint);
router.get("/razorpay/coupon-status", getCouponStatusEndpoint);
router.get("/razorpay/subscription-history", getSubscriptionHistory);

module.exports = router;