const express = require("express");
const router = express.Router();

const {
  getStudentValidities,
  createOrUpdateStudentValidity,
} = require("../controllers/studentValidity.controller");

router.get("/", getStudentValidities);
router.post("/", createOrUpdateStudentValidity);

module.exports = router;