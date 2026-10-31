const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const backendEnvPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}
const rootEnvPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
dotenv.config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
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
const supportRoutes = require("./routes/support.routes");

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
    // Allow Vercel preview and production deployments automatically
    try {
      const url = new URL(origin);
      if (url.hostname.endsWith(".vercel.app")) {
        return callback(null, true);
      }
    } catch (_) {}
    return callback(null, true); // Fallback to allowing in serverless/cross-domain context to prevent hard crash
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Device-Id", "x-device-id", "Accept", "Origin"]
}));
app.use(express.json());

// Incoming request logger
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.originalUrl}`);
  next();
});

// Serverless-ready database connection middleware
app.use(async (req, res, next) => {
  if (req.path === "/" || req.path === "/favicon.ico") return next();
  try {
    const mongoose = require("mongoose");
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB Atlas connection is not active");
    }
    next();
  } catch (err) {
    return res.status(503).json({
      success: false,
      code: "DB_NOT_CONNECTED",
      message: "MongoDB Atlas database connection failed. Please ensure MONGODB_URI is properly set in environment variables.",
      error: err?.message
    });
  }
});

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
app.use("/api/support", supportRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  console.log(`❌ [404 NOT MATCHED] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});
module.exports = app;