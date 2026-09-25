const express = require("express");
const router = express.Router();

const {
  getPaymentModes,
} = require("../controllers/paymentMode.controller");

router.get("/", getPaymentModes);

module.exports = router;