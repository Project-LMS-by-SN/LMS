const mongoose = require("mongoose");

// Counter for auto-increment numeric IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const getNextSequence = async (name) => {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );
  return counter.seq;
};

const ensureCounterAtLeast = async (name, minVal) => {
  if (typeof minVal !== "number" || isNaN(minVal)) return;
  await Counter.updateOne(
    { _id: name },
    { $max: { seq: minVal } },
    { upsert: true }
  );
};

// Helper to attach auto-increment ID pre-save hook
const autoIncrement = (schema, modelName) => {
  schema.pre("save", async function () {
    if (this.isNew) {
      if (this.id === undefined || this.id === null) {
        this.id = await getNextSequence(modelName);
      } else {
        await ensureCounterAtLeast(modelName, this.id);
      }
    }
  });
};

// 1. Branch
const branchSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    code: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, unique: true },
    address: { type: String, default: null },
    phone: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    admissionToken: { type: String, unique: true, sparse: true, index: true },
    attendanceToken: { type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(branchSchema, "Branch");

// 2. User
const userSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["OWNER", "STAFF"], default: "STAFF" },
    isActive: { type: Boolean, default: true },
    branchId: { type: Number, default: null, index: true },

    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    firstLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    mustChangePassword: { type: Boolean, default: false },

    isLoggedIn: { type: Boolean, default: false },
    ipAddress: { type: String, default: null },
    os: { type: String, default: null },
    browser: { type: String, default: null },
    deviceId: { type: String, default: null },

    subscriptionTier: { type: String, default: "FREE" },
    subscriptionExpiry: { type: Date, default: null },
    pendingTier: { type: String, default: null },
    pendingExpiryDays: { type: Number, default: null },

    passwordResetToken: { type: String, default: null },
    passwordResetExpiry: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(userSchema, "User");

// 3. UserSession
const userSessionSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    deviceId: { type: String, required: true, unique: true },
    ipAddress: { type: String, default: null },
    os: { type: String, default: null },
    browser: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);
autoIncrement(userSessionSchema, "UserSession");

// 4. Student
const studentSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    studentCode: { type: String, required: true },
    regNo: { type: String, default: null },
    fullName: { type: String, required: true },
    email: { type: String, default: "" },
    mobile: { type: String, required: true, index: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"], required: true },
    dob: { type: Date, default: null },
    address: { type: String, default: null },
    aadharNumber: { type: String, default: null },
    admissionDate: { type: Date, required: true },
    profilePhotoUrl: { type: String, default: null },
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "INACTIVE", "DISABLED", "DELETED"],
      default: "ACTIVE",
      index: true,
    },
    createdBy: { type: Number, default: null },
    branchId: { type: Number, default: null, index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(studentSchema, "Student");

// 5. FeePlan
const feePlanSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    planName: { type: String, required: true },
    durationDays: { type: Number, required: true },
    amount: { type: Number, required: true },
    registrationFee: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    branchId: { type: Number, default: null, index: true },
    planType: { type: String, default: "RESERVED" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(feePlanSchema, "FeePlan");

// 6. LibrarySetting
const librarySettingSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, default: 1 },
    libraryName: { type: String, required: true },
    address: { type: String, default: null },
    phone: { type: String, default: null },
    email: { type: String, default: null },
    logoUrl: { type: String, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

// 7. PaymentMode
const paymentModeSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    modeName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    branchId: { type: Number, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(paymentModeSchema, "PaymentMode");

// 8. StudentValidity
const studentValiditySchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    studentId: { type: Number, required: true, unique: true, index: true },
    feePlanId: { type: Number, default: null },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    accessType: { type: String, enum: ["RESERVED", "UNRESERVED"], default: "UNRESERVED" },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(studentValiditySchema, "StudentValidity");

// 9. Payment
const paymentSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    validityId: { type: Number, required: true, index: true },
    paymentModeId: { type: Number, required: true },
    invoiceNo: { type: String, required: true, unique: true },
    amountReceived: { type: Number, required: true },
    paymentDate: { type: Date, required: true, index: true },
    remarks: { type: String, default: null },
    utrNumber: { type: String, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(paymentSchema, "Payment");

// 10. Seat
const seatSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    seatNumber: { type: String, required: true },
    floor: { type: String, default: null },
    room: { type: String, default: null },
    section: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    branchId: { type: Number, default: null, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(seatSchema, "Seat");

// 11. Shift
const shiftSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    shiftName: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    branchId: { type: Number, default: null, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(shiftSchema, "Shift");

// 12. StudentShiftAssignment
const studentShiftAssignmentSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    validityId: { type: Number, required: true, index: true },
    shiftId: { type: Number, required: true, index: true },
    seatId: { type: Number, default: null, index: true },
    assignmentStatus: { type: String, enum: ["ACTIVE", "ENDED"], default: "ACTIVE", index: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(studentShiftAssignmentSchema, "StudentShiftAssignment");

// 13. Attendance
const attendanceSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    shiftAssignmentId: { type: Number, required: true, index: true },
    attendanceDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ["PRESENT", "ABSENT"], default: "PRESENT" },
    checkInTime: { type: String, default: null },
    checkOutTime: { type: String, default: null },
    shiftStartTime: { type: String, default: null },
    shiftEndTime: { type: String, default: null },
    remarks: { type: String, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(attendanceSchema, "Attendance");

// 14. AuditLog
const auditLogSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    action: { type: String, required: true },
    tableName: { type: String, required: true },
    recordId: { type: Number, required: true },
    oldValues: { type: String, default: null },
    newValues: { type: String, default: null },
    userId: { type: Number, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);
autoIncrement(auditLogSchema, "AuditLog");

// 15. SecurityEvent
const securityEventSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    eventType: { type: String, required: true },
    email: { type: String, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    userId: { type: Number, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);
autoIncrement(securityEventSchema, "SecurityEvent");

// 16. AdmissionRequest
const admissionRequestSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, default: "" },
    mobile: { type: String, required: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"], default: "OTHER" },
    dob: { type: Date, default: null },
    address: { type: String, default: null },
    aadharNumber: { type: String, default: null },
    profilePhotoUrl: { type: String, default: null },
    branchId: { type: Number, default: null, index: true },
    preferredShiftId: { type: Number, default: null },
    preferredFeePlanId: { type: Number, default: null },
    remarks: { type: String, default: null },
    status: { type: String, default: "PENDING", index: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(admissionRequestSchema, "AdmissionRequest");

// 17. Expense
const expenseSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    category: { type: String, required: true },
    description: { type: String, required: false, default: "" },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    branchId: { type: Number, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);
autoIncrement(expenseSchema, "Expense");

// 18. CouponUsage
const couponUsageSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    couponCode: { type: String, required: true },
    tier: { type: String, required: true },
    amount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);
autoIncrement(couponUsageSchema, "CouponUsage");

// 19. SubscriptionHistory
const subscriptionHistorySchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    orderId: { type: String, required: true },
    paymentId: { type: String, default: null },
    tier: { type: String, required: true },
    billing: { type: String, default: "monthly" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, default: "COMPLETED" },
    couponCode: { type: String, default: null },
    subscriptionExpiry: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);
autoIncrement(subscriptionHistorySchema, "SubscriptionHistory");

// Models map
const models = {
  Branch: mongoose.models.Branch || mongoose.model("Branch", branchSchema),
  User: mongoose.models.User || mongoose.model("User", userSchema),
  UserSession: mongoose.models.UserSession || mongoose.model("UserSession", userSessionSchema),
  Student: mongoose.models.Student || mongoose.model("Student", studentSchema),
  FeePlan: mongoose.models.FeePlan || mongoose.model("FeePlan", feePlanSchema),
  LibrarySetting: mongoose.models.LibrarySetting || mongoose.model("LibrarySetting", librarySettingSchema),
  PaymentMode: mongoose.models.PaymentMode || mongoose.model("PaymentMode", paymentModeSchema),
  StudentValidity: mongoose.models.StudentValidity || mongoose.model("StudentValidity", studentValiditySchema),
  Payment: mongoose.models.Payment || mongoose.model("Payment", paymentSchema),
  Seat: mongoose.models.Seat || mongoose.model("Seat", seatSchema),
  Shift: mongoose.models.Shift || mongoose.model("Shift", shiftSchema),
  StudentShiftAssignment: mongoose.models.StudentShiftAssignment || mongoose.model("StudentShiftAssignment", studentShiftAssignmentSchema),
  Attendance: mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema),
  AuditLog: mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema),
  SecurityEvent: mongoose.models.SecurityEvent || mongoose.model("SecurityEvent", securityEventSchema),
  AdmissionRequest: mongoose.models.AdmissionRequest || mongoose.model("AdmissionRequest", admissionRequestSchema),
  Expense: mongoose.models.Expense || mongoose.model("Expense", expenseSchema),
  CouponUsage: mongoose.models.CouponUsage || mongoose.model("CouponUsage", couponUsageSchema),
  SubscriptionHistory: mongoose.models.SubscriptionHistory || mongoose.model("SubscriptionHistory", subscriptionHistorySchema),
  Counter,
  getNextSequence,
  ensureCounterAtLeast,
};

module.exports = models;
