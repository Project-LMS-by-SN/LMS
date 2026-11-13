const subscriptionPlanService = require("../services/subscriptionPlan.service");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoClient = require("../config/mongoClient");
const authUtil = require("../utils/auth");
const cache = require("../utils/cache");
const { generateUniqueLibraryCode, ensureAllBranchesHaveCode } = require("../utils/libraryCode");
const { generateSecureToken, ensureAllBranchesHaveTokens } = require("../utils/branchTokens");
const { Resend } = require("resend");
const emailService = require("../services/email.service");
let resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
let resendOverride;
const getResendClient = () => {
  if (resendOverride !== undefined) return resendOverride;
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};
const getEmailFrom = () => emailService.getEmailFrom();

// Parse owner configuration from owner_emails.csv or .env fallback
const getOwnerEmails = () => {
  try {
    const csvPath = path.join(__dirname, "../../owner_emails.csv");
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, "utf8");
      return content
        .split(/\r?\n/)
        .map(line => line.trim().toLowerCase())
        .filter(line => line && !line.startsWith("#"));
    }
  } catch (err) {
    console.error("Error reading owner_emails.csv:", err);
  }
  return (process.env.OWNER_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
};

// Seed default branch and admin user on startup
// Run seedAdminUser only once per server process
let seedAdminUserRan = false;
const seedAdminUser = async () => {
  if (seedAdminUserRan) return;
  seedAdminUserRan = true;
  if (mongoClient.mongoose && mongoClient.mongoose.connection && mongoClient.mongoose.connection.readyState !== 1) {
    console.log("ℹ️ MongoDB connection pending, seedAdminUser will execute once connected.");
    seedAdminUserRan = false;
    return;
  }
  try {
    const branchesConfig = [
      { id: 1, name: "Main Branch", address: "123 Library Head Office, Sector 62, Noida, UP", code: "MB543210" },
      { id: 2, name: "Library Branch 100", address: "Sector 18, Noida, UP", code: "ML354862" },
      { id: 3, name: "Library Branch 200", address: "Connaught Place, New Delhi", code: "LB100003" },
    ];

    for (const bConfig of branchesConfig) {
      const existingBranch = await mongoClient.branch.findFirst({ where: { id: bConfig.id } });
      if (!existingBranch) {
        await mongoClient.branch.create({
          data: {
            id: bConfig.id,
            code: bConfig.code,
            name: bConfig.name,
            address: bConfig.address,
            isActive: true,
          },
        });
        console.log(`✅ Branch ${bConfig.id} (${bConfig.name}) seeded successfully with code ${bConfig.code}`);
      } else if (!existingBranch.code) {
        await mongoClient.branch.update({
          where: { id: existingBranch.id },
          data: { code: bConfig.code },
        });
      }
    }

    await ensureAllBranchesHaveCode(mongoClient);

    // Initial password hash for new accounts (only used if account does not exist)
    const initialAdminHash = authUtil.hashPassword("password24");

    // 1. Seed admin@admin.com -> Branch 1
    const adminEmail = "admin@admin.com";
    const adminUser = await mongoClient.user.findFirst({ where: { email: adminEmail } });
    if (adminUser) {
      await mongoClient.user.update({
        where: { id: adminUser.id },
        data: {
          branchId: 1,
          failedLoginAttempts: 0,
          lockedUntil: null,
          isActive: true,
        },
      });
      console.log("🔓 admin@admin.com verified and linked to Branch 1");
    } else {
      await mongoClient.user.create({
        data: {
          name: "Admin User",
          email: adminEmail,
          passwordHash: initialAdminHash,
          role: "OWNER",
          isActive: true,
          mustChangePassword: false,
          branchId: 1,
          isLoggedIn: false,
          subscriptionTier: "FREE",
          subscriptionExpiry: null,
        },
      });
      console.log("👤 admin@admin.com created with initial password");
    }

    // 2. Seed admin100@admin.com -> Branch 2
    const email100 = "admin100@admin.com";
    const user100 = await mongoClient.user.findFirst({ where: { email: email100 } });
    if (!user100) {
      await mongoClient.user.create({
        data: {
          name: "Owner Pro 100",
          email: email100,
          passwordHash: initialAdminHash,
          role: "OWNER",
          isActive: true,
          mustChangePassword: false,
          branchId: 2,
          isLoggedIn: false,
          subscriptionTier: "FREE",
          subscriptionExpiry: null,
        },
      });
      console.log("👤 admin100@admin.com created with initial password");
    } else {
      await mongoClient.user.update({
        where: { id: user100.id },
        data: {
          branchId: 2,
          failedLoginAttempts: 0,
          lockedUntil: null,
          isActive: true,
        },
      });
      console.log("🔓 admin100@admin.com verified and linked to Branch 2");
    }

    // 3. Seed admin200@admin.com -> Branch 3
    const email200 = "admin200@admin.com";
    const user200 = await mongoClient.user.findFirst({ where: { email: email200 } });
    if (!user200) {
      await mongoClient.user.create({
        data: {
          name: "Owner Pro 200",
          email: email200,
          passwordHash: initialAdminHash,
          role: "OWNER",
          isActive: true,
          mustChangePassword: false,
          branchId: 3,
          isLoggedIn: false,
          subscriptionTier: "FREE",
          subscriptionExpiry: null,
        },
      });
      console.log("👤 admin200@admin.com created with initial password");
    } else {
      await mongoClient.user.update({
        where: { id: user200.id },
        data: {
          branchId: 3,
          failedLoginAttempts: 0,
          lockedUntil: null,
          isActive: true,
        },
      });
      console.log("🔓 admin200@admin.com verified and linked to Branch 3");
    }

    // 4. Ensure each branch has default seats, shifts, and fee plans seeded
    for (const bId of [1, 2, 3]) {
      // Seats
      const seatCount = await mongoClient.seat.count({ where: { branchId: bId } });
      if (seatCount === 0) {
        const prefixes = ["A", "B", "C"];
        for (const prefix of prefixes) {
          for (let i = 1; i <= 5; i++) {
            await mongoClient.seat.create({
              data: {
                seatNumber: `${prefix}${i}`,
                isActive: true,
                branchId: bId,
                floor: "1",
                room: "A1",
              },
            });
          }
        }
        console.log(`🪑 Default seats (A1-C5) seeded for Branch ${bId}`);
      }

      // Shifts
      const shiftCount = await mongoClient.shift.count({ where: { branchId: bId } });
      if (shiftCount === 0) {
        await mongoClient.shift.createMany({
          data: [
            { shiftName: "Morning Shift", startTime: "08:00:00", endTime: "14:00:00", isActive: true, branchId: bId },
            { shiftName: "Evening Shift", startTime: "14:00:00", endTime: "20:00:00", isActive: true, branchId: bId },
            { shiftName: "Night Shift", startTime: "20:00:00", endTime: "02:00:00", isActive: true, branchId: bId },
          ],
        });
        console.log(`⏰ Default shifts seeded for Branch ${bId}`);
      }

      // Fee Plans
      const planCount = await mongoClient.feePlan.count({ where: { branchId: bId } });
      if (planCount === 0) {
        await mongoClient.feePlan.createMany({
          data: [
            { planName: "Monthly Plan (Reserved)", durationDays: 30, amount: 1000, isActive: true, branchId: bId, planType: "RESERVED" },
            { planName: "Quarterly Plan (Reserved)", durationDays: 90, amount: 2700, isActive: true, branchId: bId, planType: "RESERVED" },
            { planName: "Monthly Plan (Unreserved)", durationDays: 30, amount: 800, isActive: true, branchId: bId, planType: "UNRESERVED" },
          ],
        });
        console.log(`💳 Default fee plans seeded for Branch ${bId}`);
      }
    }
    await ensureAllBranchesHaveTokens(mongoClient);
    seedAdminUserRan = true;
  } catch (err) {
    console.error("❌ Failed to seed default branches / admin users:", err.message);
  }
};

if (mongoClient.mongoose && mongoClient.mongoose.connection) {
  mongoClient.mongoose.connection.on("connected", () => {
    seedAdminUser();
  });
}

// Parse User Agent to extract OS & Browser
const parseUserAgent = (uaString) => {
  if (!uaString) return { os: "Unknown OS", browser: "Unknown Browser" };

  let os = "Unknown OS";
  if (uaString.includes("Windows")) os = "Windows";
  else if (uaString.includes("Macintosh") || uaString.includes("Mac OS")) os = "macOS";
  else if (uaString.includes("Linux")) os = "Linux";
  else if (uaString.includes("Android")) os = "Android";
  else if (uaString.includes("like Mac OS X")) os = "iOS";

  let browser = "Unknown Browser";
  if (uaString.includes("Firefox")) browser = "Firefox";
  else if (uaString.includes("Chrome") && !uaString.includes("Chromium")) browser = "Chrome";
  else if (uaString.includes("Safari") && !uaString.includes("Chrome")) browser = "Safari";
  else if (uaString.includes("Edge")) browser = "Edge";
  else if (uaString.includes("Opera") || uaString.includes("OPR")) browser = "Opera";

  return { os, browser };
};

// Extract client IP address
const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "127.0.0.1";
};

// POST /api/users/login
exports.login = async (req, res) => {
  try {
    const { email, password, deviceId, forceLogin } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    let cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      cleanEmail = `${cleanEmail}@admin.com`;
    }

    const reqIp = getClientIp(req);
    const userAgentStr = req.headers["user-agent"] || "";
    const { os, browser } = parseUserAgent(userAgentStr);
    const reqDeviceId = deviceId || req.headers["x-device-id"] || "unknown_device";

    // Look up user in the DB
    let user = await mongoClient.user.findFirst({ where: { email: cleanEmail, deletedAt: null } });

    if (!user) {
      await mongoClient.securityEvent.create({
        data: {
          eventType: "LOGIN_FAILED_UNKNOWN_USER",
          email: cleanEmail,
          ipAddress: reqIp,
          userAgent: userAgentStr,
        },
      }).catch(() => {});
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // Active check
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact the library administrator."
      });
    }

    // Find owner of the staff's branch if user is STAFF
    let owner = null;
    if (user.role === "STAFF") {
      owner = await mongoClient.user.findFirst({
        where: { role: "OWNER", branchId: user.branchId || 1, deletedAt: null }
      });
      if (!owner) {
        return res.status(403).json({
          success: false,
          message: "This staff account does not belong to an active library owner."
        });
      }
      if (!owner.isActive) {
        return res.status(403).json({
          success: false,
          message: "The library owner's account is inactive. Staff login is disabled."
        });
      }
    } else {
      owner = user;
    }

    // Lockout check
    if (cleanEmail !== "admin@admin.com" && user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // Compare password hash strictly against stored hash
    const valid = authUtil.comparePassword(password, user.passwordHash);

    if (!valid) {
      if (cleanEmail === "admin@admin.com") {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials.",
        });
      }

      const newAttempts = user.failedLoginAttempts + 1;
      const isLocking = newAttempts >= 5;
      const lockedUntil = isLocking ? new Date(Date.now() + 15 * 60000) : null; // 15 mins lock

      await mongoClient.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil,
        },
      });

      await mongoClient.securityEvent.create({
        data: {
          eventType: isLocking ? "ACCOUNT_LOCKED" : "LOGIN_FAILED",
          email: cleanEmail,
          userId: user.id,
          ipAddress: reqIp,
          userAgent: userAgentStr,
        },
      });

      return res.status(401).json({
        success: false,
        message: isLocking
          ? "Too many failed attempts. Your account is locked for 15 minutes."
          : "Invalid credentials",
      });
    }

    // Retrieve active sessions for the user (ordered by oldest lastActive first)
    const dbDeviceId = `${reqDeviceId}_${user.id}`;
    const activeSessions = await mongoClient.userSession.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { lastActive: "asc" }
    });

    const isCurrentDeviceActive = activeSessions.some(s => s.deviceId === dbDeviceId);
    // Staff are always limited to 1 active device; owners use their tier-based limit
    const limit = user.role === "STAFF" ? 1 : await subscriptionPlanService.getDeviceLimitForTier(owner.subscriptionTier);

    if (cleanEmail !== "admin@admin.com" && !isCurrentDeviceActive && activeSessions.length >= limit) {
      if (!forceLogin) {
        return res.status(409).json({
          success: false,
          code: "ALREADY_LOGGED_IN",
          message: `This account has reached its session limit (${limit} active device(s)). Do you want to proceed and log out the oldest active session?`,
        });
      } else {
        // Deactivate the oldest session
        const oldestSession = activeSessions[0];
        await mongoClient.userSession.update({
          where: { id: oldestSession.id },
          data: { isActive: false },
        });

        // Create FORCE_LOGIN_LOGOUT security event to warn the admin/staff
        await mongoClient.securityEvent.create({
          data: {
            eventType: "FORCE_LOGIN_LOGOUT",
            email: user.email,
            ipAddress: oldestSession.ipAddress || reqIp,
            userAgent: `${oldestSession.os || "Unknown OS"} / ${oldestSession.browser || "Unknown Browser"}`,
            userId: user.id,
          },
        });
      }
    }

    // Co-existence logic: Check active sessions on the same physical device/browser
    const physicalSessions = await mongoClient.userSession.findMany({
      where: {
        isActive: true,
        OR: [
          { deviceId: reqDeviceId },
          { deviceId: { startsWith: `${reqDeviceId}_` } }
        ]
      },
      include: {
        user: true
      }
    });

    const activeStaff = physicalSessions.filter(s => s.user?.role === "STAFF");

    if (user.role === "OWNER") {
      // If owner logs in, and there is a staff active on this physical device:
      // "if i'm login as staff and then try to login as owner that should not happen it can happen in preium 200 ok not in starter one"
      const isPremium = cleanEmail === "admin@admin.com" || user.subscriptionTier === "PRO" || user.subscriptionTier === "ENTERPRISE" || user.subscriptionTier === "PRO_200";
      if (!isPremium && activeStaff.length > 0) {
        for (const s of activeStaff) {
          await mongoClient.userSession.update({
            where: { id: s.id },
            data: { isActive: false }
          });
        }
      }
    }

    // Upsert the session for the current device
    await mongoClient.userSession.upsert({
      where: { deviceId: dbDeviceId },
      update: {
        userId: user.id,
        isActive: true,
        lastActive: new Date(),
        ipAddress: reqIp,
        os,
        browser
      },
      create: {
        userId: user.id,
        deviceId: dbDeviceId,
        isActive: true,
        lastActive: new Date(),
        ipAddress: reqIp,
        os,
        browser
      }
    });

    // Reset failed login attempts & update user lastLogin
    const updateData = {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
      isLoggedIn: true,
      ipAddress: reqIp,
      os,
      browser,
      deviceId: dbDeviceId,
    };
    if (!user.firstLoginAt) {
      updateData.firstLoginAt = new Date();
    }
    await mongoClient.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await mongoClient.securityEvent.create({
      data: {
        eventType: "LOGIN_SUCCESS",
        email: cleanEmail,
        userId: user.id,
        ipAddress: reqIp,
        userAgent: userAgentStr,
      },
    });

    const token = authUtil.signToken({ id: user.id, email: user.email, role: user.role, deviceId: dbDeviceId });

    let branchName = null;
    let branchCode = null;
    if (user.branchId) {
      const branch = await mongoClient.branch.findUnique({ where: { id: user.branchId } });
      branchName = branch ? branch.name : null;
      branchCode = branch ? branch.code : null;
    }

    let effTier = user.subscriptionTier;
    let effExpiry = user.subscriptionExpiry;

    if (user.role === "STAFF" && owner) {
      effTier = owner.subscriptionTier;
      effExpiry = owner.subscriptionExpiry;
    }

    if (!effExpiry && effTier !== "FREE") {
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      effExpiry = d;
      await mongoClient.user.update({
        where: { id: user.id },
        data: { subscriptionExpiry: effExpiry }
      });
    }

    return res.json({
      success: true,
      token,
      mustChangePassword: user.role === "STAFF" ? false : user.mustChangePassword,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionTier: effTier,
        subscriptionExpiry: effExpiry,
        branch_name: branchName,
        branch_code: branchCode,
        library_name: branchName,
        library_code: branchCode,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/users/logout
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      // Mark current session inactive
      if (req.user.deviceId) {
        await mongoClient.userSession.updateMany({
          where: { userId: req.user.id, deviceId: req.user.deviceId },
          data: { isActive: false }
        });
      }

      // Check if user has any active sessions remaining
      const activeCount = await mongoClient.userSession.count({
        where: { userId: req.user.id, isActive: true }
      });

      await mongoClient.user.update({
        where: { id: req.user.id },
        data: {
          isLoggedIn: activeCount > 0,
          deviceId: activeCount > 0 ? undefined : null,
          ipAddress: activeCount > 0 ? undefined : null,
          os: activeCount > 0 ? undefined : null,
          browser: activeCount > 0 ? undefined : null,
        },
      });
    }
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await mongoClient.user.findFirst({
      where: { id: req.user.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        subscriptionTier: true,
        subscriptionExpiry: true,
        pendingTier: true,
        pendingExpiryDays: true,
        createdAt: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
            phone: true,
            admissionToken: true,
            attendanceToken: true,
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let branch = user.branch;
    if (!branch && (user.branchId || user.role === "OWNER")) {
      branch = await mongoClient.branch.findFirst({
        where: { id: user.branchId || 1 }
      });
    }

    let libraryCode = branch ? branch.code : null;
    if (branch && !libraryCode) {
      libraryCode = await generateUniqueLibraryCode(branch.name, branch.phone, mongoClient);
      await mongoClient.branch.update({
        where: { id: branch.id },
        data: { code: libraryCode }
      });
    }

    let effTier = user.subscriptionTier;
    let effExpiry = user.subscriptionExpiry;

    if (user.role === "STAFF") {
      const owner = await mongoClient.user.findFirst({
        where: { role: "OWNER", branchId: user.branchId || 1, deletedAt: null }
      });
      if (owner) {
        effTier = owner.subscriptionTier;
        effExpiry = owner.subscriptionExpiry;
      }
    } else if (user.role === "OWNER") {
      const isExpired = !user.subscriptionExpiry || new Date(user.subscriptionExpiry) <= new Date();
      if (isExpired && user.pendingTier) {
        const days = user.pendingExpiryDays || 30;
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + days);

        // Use updateMany with pendingTier condition to prevent double-activation race condition
        const activated = await mongoClient.user.updateMany({
          where: { id: user.id, pendingTier: user.pendingTier },
          data: {
            subscriptionTier: user.pendingTier,
            subscriptionExpiry: newExpiry,
            pendingTier: null,
            pendingExpiryDays: null,
            updatedAt: new Date()
          }
        });

        if (activated.count > 0) {
          effTier = user.pendingTier;
          effExpiry = newExpiry;
        }
        user.pendingTier = null;
        user.pendingExpiryDays = null;
      } else if (!user.subscriptionExpiry && user.subscriptionTier !== "FREE") {
        const fallbackExpiry = new Date();
        fallbackExpiry.setMonth(fallbackExpiry.getMonth() + 3);
        await mongoClient.user.update({
          where: { id: user.id },
          data: { subscriptionExpiry: fallbackExpiry }
        });
        effExpiry = fallbackExpiry;
      }
    }

    let admissionToken = branch ? branch.admissionToken : null;
    let attendanceToken = branch ? branch.attendanceToken : null;
    if (branch && (!admissionToken || !attendanceToken || !admissionToken.startsWith("adm_") || !attendanceToken.startsWith("att_"))) {
      let needsBUpdate = false;
      const bUpdate = {};
      if (!admissionToken || !admissionToken.startsWith("adm_")) {
        admissionToken = generateSecureToken("adm");
        bUpdate.admissionToken = admissionToken;
        needsBUpdate = true;
      }
      if (!attendanceToken || !attendanceToken.startsWith("att_")) {
        attendanceToken = generateSecureToken("att");
        bUpdate.attendanceToken = attendanceToken;
        needsBUpdate = true;
      }
      if (needsBUpdate) {
        await mongoClient.branch.update({
          where: { id: branch.id },
          data: bUpdate
        });
      }
    }

    const responseData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      subscriptionTier: effTier,
      subscriptionExpiry: effExpiry,
      pendingTier: user.pendingTier,
      pendingExpiryDays: user.pendingExpiryDays,
      createdAt: user.createdAt,
      branchId: user.branch ? user.branch.id : (user.branchId || 1),
      branch_id: user.branch ? user.branch.id : (user.branchId || 1),
      library_name: user.branch ? user.branch.name : "Libraryly Main Branch",
      library_code: libraryCode || "LB100001",
      contact: user.role === "STAFF" ? "" : (user.branch ? user.branch.phone || "" : ""),
      address: user.branch ? user.branch.address || "" : "",
      admissionToken,
      attendanceToken,
      admission_token: admissionToken,
      attendance_token: attendanceToken,
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/users/qr-info
exports.getMyBranchQrInfo = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const branchId = req.user.branchId || 1;
    let branch = await mongoClient.branch.findFirst({ where: { id: branchId } });
    if (!branch) {
      branch = await mongoClient.branch.findFirst({ where: { id: 1 } });
    }
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    let { admissionToken, attendanceToken } = branch;
    let needsUpdate = false;
    const bUpdate = {};
    if (!admissionToken || !admissionToken.startsWith("adm_")) {
      admissionToken = generateSecureToken("adm");
      bUpdate.admissionToken = admissionToken;
      needsUpdate = true;
    }
    if (!attendanceToken || !attendanceToken.startsWith("att_")) {
      attendanceToken = generateSecureToken("att");
      bUpdate.attendanceToken = attendanceToken;
      needsUpdate = true;
    }
    if (needsUpdate) {
      await mongoClient.branch.update({
        where: { id: branch.id },
        data: bUpdate,
      });
    }

    return res.json({
      success: true,
      data: {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        address: branch.address,
        phone: branch.phone,
        admissionToken,
        attendanceToken,
      },
    });
  } catch (error) {
    console.error("Error fetching branch QR info:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, email, contact, address, library_name } = req.body;

    const existingUser = await mongoClient.user.findUnique({
      where: { id: req.user.id },
      include: { branch: true }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (existingUser.role === "STAFF") {
      return res.status(403).json({ success: false, message: "Staff accounts are not permitted to edit profile information." });
    }

    if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const cleanEmail = email.toLowerCase().trim();
      const emailExists = await mongoClient.user.findFirst({
        where: {
          email: cleanEmail,
          id: { not: req.user.id },
          deletedAt: null
        }
      });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email is already in use by another account" });
      }

      // Free any stale deleted record holding this email so update succeeds cleanly
      const staleDeleted = await mongoClient.user.findFirst({
        where: {
          email: cleanEmail,
          deletedAt: { not: null }
        }
      });
      if (staleDeleted) {
        await mongoClient.user.update({
          where: { id: staleDeleted.id },
          data: { email: `deleted_${Date.now()}_${staleDeleted.email}` }
        }).catch(() => {});
      }
    }

    const updatedUser = await mongoClient.user.update({
      where: { id: req.user.id },
      data: {
        name: name ? name.trim() : existingUser.name,
        email: email ? email.trim().toLowerCase() : existingUser.email,
      }
    });

    let updatedBranch = existingUser.branch;
    if (existingUser.branchId) {
      // NOTE: library code is permanently unique and strictly non-editable, so code is never modified here!
      updatedBranch = await mongoClient.branch.update({
        where: { id: existingUser.branchId },
        data: {
          name: library_name !== undefined ? (library_name ? library_name.trim() : existingUser.branch.name) : existingUser.branch.name,
          phone: contact !== undefined ? (contact ? contact.trim() : null) : existingUser.branch.phone,
          address: address !== undefined ? (address ? address.trim() : null) : existingUser.branch.address,
        }
      });
    } else if (library_name || contact || address) {
      const newBranchName = library_name ? library_name.trim() : `${updatedUser.name}'s Library`;
      const newLibCode = await generateUniqueLibraryCode(newBranchName, contact, mongoClient);
      updatedBranch = await mongoClient.branch.create({
        data: {
          code: newLibCode,
          name: newBranchName,
          phone: contact ? contact.trim() : null,
          address: address ? address.trim() : null,
        }
      });
      await mongoClient.user.update({
        where: { id: req.user.id },
        data: { branchId: updatedBranch.id }
      });
    }

    const responseData = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      subscriptionTier: updatedUser.subscriptionTier,
      subscriptionExpiry: updatedUser.subscriptionExpiry,
      createdAt: updatedUser.createdAt,
      library_name: updatedBranch ? updatedBranch.name : "Libraryly Main Branch",
      library_code: updatedBranch ? (updatedBranch.code || "LB100001") : "LB100001",
      contact: updatedBranch ? updatedBranch.phone || "" : "",
      address: updatedBranch ? updatedBranch.address || "" : "",
    };

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: responseData
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile: " + error.message });
  }
};

// PUT /api/users/change-password
exports.changePassword = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Old and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }
    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must contain at least one number" });
    }
    if (oldPassword === newPassword) {
      return res.status(400).json({ success: false, message: "New password must be different from current password" });
    }

    const user = await mongoClient.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || user.deletedAt) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "STAFF") {
      return res.status(403).json({ success: false, message: "Staff accounts are not permitted to change passwords. Please contact the library owner." });
    }

    // Verify current/previous password matches strictly
    const valid = authUtil.comparePassword(oldPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Previous password does not match. Please enter your correct current password." });
    }

    const newHash = authUtil.hashPassword(newPassword);
    await mongoClient.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Audit Log entry safely
    try {
      if (mongoClient.auditLog) {
        await mongoClient.auditLog.create({
          data: {
            action: "CHANGE_PASSWORD",
            tableName: "users",
            recordId: user.id,
            userId: user.id,
          },
        });
      }
    } catch (auditErr) {
      console.warn("Audit log skipped:", auditErr.message);
    }

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

// DELETE /api/users/account
exports.deleteAccount = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const password = req.body?.password || req.headers["x-account-password"] || req.query?.password;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required to delete account" });
    }

    const user = await mongoClient.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || user.deletedAt) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const valid = authUtil.comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Password is incorrect" });
    }

    // Clean up active sessions
    await mongoClient.userSession.deleteMany({
      where: { userId: user.id }
    }).catch(() => {});

    // Perform soft delete and archive email so it is immediately free for future re-registration
    await mongoClient.user.update({
      where: { id: user.id },
      data: {
        email: `deleted_${Date.now()}_${user.email}`,
        deletedAt: new Date(),
        isActive: false,
        isLoggedIn: false
      },
    });

    // Log security event
    await mongoClient.securityEvent.create({
      data: {
        eventType: "ACCOUNT_DELETED",
        email: user.email,
        userId: user.id,
      },
    });

    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PUT /api/users/subscription - Restricted to Super Admin
exports.updateSubscription = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Security Rule: Direct subscription modifications are completely disabled.
    // All subscription tiers MUST be purchased and verified via Razorpay payment gateway.
    return res.status(403).json({
      success: false,
      message: "Direct subscription modification is restricted. Subscriptions can only be activated after successful payment through Razorpay."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update subscription" });
  }
};


// POST /api/users/activate-pending-plan
exports.activatePendingPlan = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Only owners can activate plans" });
    }

    const user = await mongoClient.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.pendingTier) {
      return res.status(400).json({ success: false, message: "No pending plan found to activate." });
    }

    const days = user.pendingExpiryDays || 30;
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);

    const activatedTier = user.pendingTier;

    await mongoClient.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: activatedTier,
        subscriptionExpiry: newExpiry,
        pendingTier: null,
        pendingExpiryDays: null,
        updatedAt: new Date()
      }
    });

    await mongoClient.securityEvent.create({
      data: {
        eventType: "SUBSCRIPTION_ACTIVATED",
        email: user.email,
        userId: user.id,
        ipAddress: req.ip,
      }
    });

    return res.json({
      success: true,
      message: `Plan ${activatedTier} activated successfully! Valid for ${days} days starting from today.`,
      subscriptionTier: activatedTier,
      subscriptionExpiry: newExpiry
    });
  } catch (error) {
    console.error("Activate pending plan error:", error);
    return res.status(500).json({ success: false, message: "Failed to activate pending plan" });
  }
};

// GET /api/users/staff
exports.getStaff = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage staff" });
    }
    
    const owner = await mongoClient.user.findUnique({
      where: { id: req.user.id }
    });
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    const staff = await mongoClient.user.findMany({
      where: { role: "STAFF", branchId: owner.branchId || 1, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        subscriptionTier: true,
        subscriptionExpiry: true,
        lastLogin: true,
        createdAt: true,
      }
    });

    const staffWithSub = staff.map(s => ({
      ...s,
      subscriptionTier: s.subscriptionTier || owner.subscriptionTier,
      subscriptionExpiry: s.subscriptionExpiry || owner.subscriptionExpiry,
    }));
    
    return res.json({ success: true, data: staffWithSub });
  } catch (error) {
    console.error("Fetch staff error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch staff list" });
  }
};

// POST /api/users/staff
exports.createStaff = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage staff" });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one number" });
    }

    const owner = await mongoClient.user.findUnique({
      where: { id: req.user.id }
    });
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }
    
    const limit = await subscriptionPlanService.getStaffLimitForTier(owner.subscriptionTier);

    const staffCount = await mongoClient.user.count({
      where: { role: "STAFF", branchId: owner.branchId || 1, deletedAt: null }
    });

    if (staffCount >= limit) {
      return res.status(403).json({
        success: false,
        message: `Your current plan (${owner.subscriptionTier}) allows up to ${limit} staff member(s). Please upgrade your subscription tier in settings to add more.`
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await mongoClient.user.findFirst({
      where: { email: cleanEmail, deletedAt: null }
    });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    // If an inactive / deleted record still holds this exact email, archive its email so creation never fails
    const staleDeletedUser = await mongoClient.user.findFirst({
      where: { email: cleanEmail, deletedAt: { not: null } }
    });
    if (staleDeletedUser) {
      await mongoClient.user.update({
        where: { id: staleDeletedUser.id },
        data: { email: `deleted_${Date.now()}_${staleDeletedUser.email}` }
      }).catch(() => {});
    }

    const newStaff = await mongoClient.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash: authUtil.hashPassword(password),
        role: "STAFF",
        isActive: true,
        mustChangePassword: false,
        branchId: owner.branchId || 1,
        subscriptionTier: owner.subscriptionTier
      }
    });

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        isActive: newStaff.isActive
      }
    });
  } catch (error) {
    console.error("Create staff error:", error);
    return res.status(500).json({ success: false, message: "Failed to create staff member" });
  }
};

// DELETE /api/users/staff/:id
exports.deleteStaff = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage staff" });
    }

    const owner = await mongoClient.user.findUnique({
      where: { id: req.user.id }
    });
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    const { id } = req.params;
    const staffId = parseInt(id);

    const staff = await mongoClient.user.findFirst({
      where: { id: staffId, role: "STAFF", branchId: owner.branchId || 1, deletedAt: null }
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // Clean up active sessions
    await mongoClient.userSession.deleteMany({
      where: { userId: staffId }
    }).catch(() => {});

    // Soft delete and archive the email address so the email is immediately free to be reused
    await mongoClient.user.update({
      where: { id: staffId },
      data: {
        email: `deleted_${Date.now()}_${staff.email}`,
        deletedAt: new Date(),
        isActive: false,
        isLoggedIn: false
      }
    });

    return res.json({ success: true, message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Delete staff error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete staff member" });
  }
};

exports.seedAdminUser = seedAdminUser;

// Escape plain text before interpolating into HTML email templates
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// POST /api/users/forgot-password
// Sends a 6-digit OTP to an active user (or provisions a first-time whitelisted owner for Set Password)
exports.forgotPassword = async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    if (!rawEmail || !String(rawEmail).trim()) {
      return res.status(400).json({ success: false, message: "Email address is required" });
    }

    const cleanEmail = String(rawEmail).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    let user = await mongoClient.user.findFirst({
      where: { email: cleanEmail, deletedAt: null },
    });

    const isWhitelistedOwner = !user && getOwnerEmails().includes(cleanEmail);

    // Avoid user enumeration for unknown or inactive emails
    if ((!user && !isWhitelistedOwner) || (user && !user.isActive)) {
      return res.json({
        success: true,
        message: "If an account exists with this email, a 6-digit OTP has been sent.",
      });
    }

    const canSendEmail = Boolean(
      resendOverride !== undefined ||
      emailService.getTransporter() ||
      emailService.getResendClient()
    );
    if (!canSendEmail) {
      console.warn("⚠️ Email service not configured. Check EMAIL_FROM and RESEND_API_KEY/SMTP settings in .env.");
      return res.status(500).json({ success: false, message: "Email service is not configured on the server." });
    }

    // Provision authorized first-time Owner (Set Password flow) only after confirming email service is ready
    if (!user && isWhitelistedOwner) {
      const staleDeletedOwner = await mongoClient.user.findFirst({
        where: { email: cleanEmail, deletedAt: { not: null } },
      });
      if (staleDeletedOwner) {
        await mongoClient.user.update({
          where: { id: staleDeletedOwner.id },
          data: { email: `deleted_${Date.now()}_${staleDeletedOwner.email}` },
        }).catch(() => {});
      }

      await seedAdminUser();

      const baseBranchName = `Branch - ${cleanEmail}`;
      const existingBranchName = await mongoClient.branch.findFirst({
        where: { name: baseBranchName },
      });
      const initialBranchName = existingBranchName ? `${baseBranchName} (${Date.now()})` : baseBranchName;
      const newLibraryCode = await generateUniqueLibraryCode(initialBranchName, null, mongoClient);
      const newBranch = await mongoClient.branch.create({
        data: {
          code: newLibraryCode,
          name: initialBranchName,
          address: "Default Address",
          isActive: true,
        },
      });

      user = await mongoClient.user.create({
        data: {
          name: "Owner",
          email: cleanEmail,
          passwordHash: authUtil.hashPassword(crypto.randomBytes(32).toString("hex")),
          role: "OWNER",
          isActive: true,
          mustChangePassword: true,
          branchId: newBranch.id,
          isLoggedIn: false,
          subscriptionTier: "FREE",
        },
      });

      await mongoClient.securityEvent.create({
        data: {
          eventType: "OWNER_SET_PASSWORD_INIT",
          email: cleanEmail,
          userId: user.id,
          ipAddress: getClientIp(req),
          userAgent: req.headers["user-agent"] || "",
        },
      }).catch(() => {});
    }

    // Generate cryptographically secure 6-digit OTP valid for 10 minutes
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = authUtil.hashOtp(user.id, otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await mongoClient.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtpHash: otpHash,
        passwordResetOtpExpiry: otpExpiry,
        passwordResetOtpAttempts: 0,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    const safeName = escapeHtml(user.name || "User");
    const otpEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px;">📚</div>
            <h2 style="color: #1e293b; margin: 12px 0 4px;">Library Management System</h2>
            <p style="color: #64748b; margin: 0; font-size: 14px;">Set / Reset Password OTP</p>
          </div>
          <div style="background: white; border-radius: 10px; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="color: #1e293b; margin: 0 0 12px;">Hi <strong>${safeName}</strong>,</p>
            <p style="color: #475569; margin: 0 0 20px; line-height: 1.5;">
              Use the 6-digit verification code below to set or reset your password. This OTP is valid for <strong>10 minutes</strong>.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <div style="display: inline-block; background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 10px; padding: 14px 28px;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: monospace;">${otp}</span>
              </div>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
              Do not share this OTP with anyone. If you did not request a password change, you can safely ignore this email.
            </p>
          </div>
          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 16px;">Library Management System · Admin Portal</p>
        </div>
      `;

    try {
      if (resendOverride) {
        const sendRes = await resendOverride.emails.send({
          from: getEmailFrom(),
          to: user.email,
          subject: "Your 6-Digit Password Verification OTP",
          html: otpEmailHtml,
        });
        if (sendRes && sendRes.error) {
          throw new Error(sendRes.error.message || "Resend email delivery failed");
        }
      } else {
        await emailService.sendEmail({
          from: getEmailFrom(),
          to: user.email,
          subject: "Your 6-Digit Password Verification OTP",
          html: otpEmailHtml,
        });
      }
    } catch (sendErr) {
      console.error("OTP email delivery error:", sendErr);
      await mongoClient.user.update({
        where: { id: user.id },
        data: {
          passwordResetOtpHash: null,
          passwordResetOtpExpiry: null,
          passwordResetOtpAttempts: 0,
        },
      }).catch(() => {});
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please verify your email or try again later.",
      });
    }

    await mongoClient.securityEvent.create({
      data: {
        eventType: "PASSWORD_OTP_SENT",
        email: user.email,
        userId: user.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || "",
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: "If an account exists with this email, a 6-digit OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Failed to send verification OTP." });
  }
};

// POST /api/users/verify-reset-otp
exports.verifyResetOtp = async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    const rawOtp = req.body?.otp;

    if (!rawEmail || !String(rawEmail).trim()) {
      return res.status(400).json({ success: false, message: "Email address is required." });
    }

    const cleanEmail = String(rawEmail).trim().toLowerCase();
    const cleanOtp = String(rawOtp || "").replace(/\s+/g, "");

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ success: false, message: "Please enter a valid 6-digit OTP." });
    }

    const user = await mongoClient.user.findFirst({
      where: { email: cleanEmail, deletedAt: null, isActive: true },
    });

    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiry) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please request a new one." });
    }

    if (new Date(user.passwordResetOtpExpiry) <= new Date()) {
      await mongoClient.user.update({
        where: { id: user.id },
        data: {
          passwordResetOtpHash: null,
          passwordResetOtpExpiry: null,
          passwordResetOtpAttempts: 0,
        },
      }).catch(() => {});
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new 6-digit OTP." });
    }

    const currentAttempts = user.passwordResetOtpAttempts || 0;
    if (currentAttempts >= 5) {
      await mongoClient.user.update({
        where: { id: user.id },
        data: {
          passwordResetOtpHash: null,
          passwordResetOtpExpiry: null,
          passwordResetOtpAttempts: 0,
        },
      }).catch(() => {});
      return res.status(429).json({
        success: false,
        message: "Too many incorrect OTP attempts. Please request a new 6-digit OTP.",
      });
    }

    const isMatch = authUtil.verifyOtpHash(user.id, cleanOtp, user.passwordResetOtpHash);
    if (!isMatch) {
      const nextAttempts = currentAttempts + 1;
      const exhausted = nextAttempts >= 5;
      await mongoClient.user.update({
        where: { id: user.id },
        data: exhausted
          ? {
              passwordResetOtpHash: null,
              passwordResetOtpExpiry: null,
              passwordResetOtpAttempts: 0,
            }
          : { passwordResetOtpAttempts: nextAttempts },
      }).catch(() => {});

      const remaining = Math.max(0, 5 - nextAttempts);
      return res.status(exhausted ? 429 : 400).json({
        success: false,
        message: exhausted
          ? "Too many incorrect OTP attempts. Please request a new 6-digit OTP."
          : `Invalid 6-digit OTP. ${remaining} attempt(s) remaining.`,
      });
    }

    // Consume OTP and mint short-lived single-use reset token for the New Password screen
    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = authUtil.hashResetToken(rawResetToken);
    const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await mongoClient.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpiry: resetExpiry,
        passwordResetOtpHash: null,
        passwordResetOtpExpiry: null,
        passwordResetOtpAttempts: 0,
      },
    });

    await mongoClient.securityEvent.create({
      data: {
        eventType: "PASSWORD_OTP_VERIFIED",
        email: user.email,
        userId: user.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || "",
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: "OTP verified successfully. You can now set your new password.",
      resetToken: rawResetToken,
      email: user.email,
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
};

// GET /api/users/reset-password?token=...  |  POST /api/users/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const token = req.query.token || req.body?.token;
    if (!token || !String(token).trim()) {
      return res.status(400).json({ success: false, message: "Reset token is required." });
    }

    const tokenHash = authUtil.hashResetToken(String(token).trim());

    const user = await mongoClient.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiry: { gt: new Date() },
        deletedAt: null,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This password reset session is invalid or has expired.",
      });
    }

    // If GET request, only validate reset token without modifying state
    if (req.method === "GET") {
      return res.json({
        success: true,
        message: "Reset session is valid.",
        valid: true,
        email: user.email,
      });
    }

    // POST request: Requires user to supply their new password
    const newPassword = typeof req.body?.password === "string" ? req.body.password : "";
    if (!newPassword.trim() || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
    }
    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must contain at least one number." });
    }

    const hashedPassword = authUtil.hashPassword(newPassword);

    await mongoClient.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        passwordResetToken: null,
        passwordResetExpiry: null,
        passwordResetOtpHash: null,
        passwordResetOtpExpiry: null,
        passwordResetOtpAttempts: 0,
        failedLoginAttempts: 0,
        lockedUntil: null,
        isLoggedIn: false,
        updatedAt: new Date(),
      },
    });

    await mongoClient.userSession.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    }).catch(() => {});

    cache.invalidateUser(user.id);

    await mongoClient.securityEvent.create({
      data: {
        eventType: "PASSWORD_RESET_SUCCESS",
        email: user.email,
        userId: user.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || "",
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: "Password has been successfully updated. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};


// PUT /api/users/staff/:id/password
exports.changeStaffPassword = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can change staff passwords" });
    }

    const owner = await mongoClient.user.findUnique({ where: { id: req.user.id } });
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });

    const staffId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }
    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one number" });
    }

    const staff = await mongoClient.user.findFirst({
      where: { id: staffId, role: "STAFF", branchId: owner.branchId || 1, deletedAt: null }
    });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    await mongoClient.user.update({
      where: { id: staffId },
      data: {
        passwordHash: authUtil.hashPassword(newPassword),
        mustChangePassword: false,
        lockedUntil: null,
        failedLoginAttempts: 0,
        updatedAt: new Date()
      }
    });

    return res.json({ success: true, message: "Staff password updated successfully" });
  } catch (error) {
    console.error("Change staff password error:", error);
    return res.status(500).json({ success: false, message: "Failed to update staff password" });
  }
};

exports._setResendClientForTest = (client) => {
  resendOverride = client;
};
