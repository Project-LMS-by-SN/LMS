const express = require("express");
const cors = require("cors");
const reportRoutes = require("./routes/report.routes");
const paymentModeRoutes = require("./routes/paymentMode.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const studentShiftAssignmentRoutes = require("./routes/studentShiftAssignment.routes");
const seatRoutes = require("./routes/seat.routes");
const shiftRoutes = require("./routes/shift.routes");
const paymentRoutes = require("./routes/payment.routes");
const studentValidityRoutes = require("./routes/studentValidity.routes");
const feePlanRoutes = require("./routes/feePlan.routes");
const studentRoutes = require("./routes/student.routes");
const userRoutes = require("./routes/user.routes");
const admissionRequestRoutes = require("./routes/admissionRequest.routes");
const expenseRoutes = require("./routes/expense.routes");

const authMiddleware = require("./middleware/auth");

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:5174,http://localhost:3000")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      return callback(null, true);
    }
    if (/^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS policy violation: Access not allowed from this origin"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Device-Id", "x-device-id", "Accept", "Origin"]
}));
app.use(express.json());

// Protect all routes under /api with authMiddleware
app.use("/api", authMiddleware);

app.get("/", (req, res) => {
  res.send("Library Management Backend is running");
});
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/fee-plans", feePlanRoutes);
app.use("/api/student-validities", studentValidityRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/student-shift-assignments", studentShiftAssignmentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payment-modes", paymentModeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admission-requests", admissionRequestRoutes);
app.use("/api/expenses", expenseRoutes);
module.exports = app;