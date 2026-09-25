const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const authUtil = require("../utils/auth");
const { generateUniqueLibraryCode, ensureAllBranchesHaveCode } = require("../utils/libraryCode");
const { Resend } = require("resend");
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const emailFrom = process.env.EMAIL_FROM || "noreply@dashurl.in";

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

const getDefaultOwnerPassword = () => {
  return process.env.DEFAULT_OWNER_PASSWORD || ("Admin@" + crypto.randomBytes(3).toString("hex") + "!");
};

// Seed default branch and admin user on startup
// Run seedAdminUser only once per server process (not on every first login)
let seedAdminUserRan = false;
const seedAdminUser = async () => {
  if (seedAdminUserRan) return;
  try {
    const branchesConfig = [
      { id: 1, name: "Main Branch", address: "123 Library Head Office, Sector 62, Noida, UP", code: "MB543210" },
      { id: 2, name: "Library Branch 100", address: "Sector 18, Noida, UP", code: "ML354862" },
      { id: 3, name: "Library Branch 200", address: "Connaught Place, New Delhi", code: "LB100003" },
    ];

    for (const bConfig of branchesConfig) {
      const existingBranch = await prisma.branch.findFirst({ where: { id: bConfig.id } });
      if (!existingBranch) {
        await prisma.branch.create({
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
        await prisma.branch.update({
          where: { id: existingBranch.id },
          data: { code: bConfig.code },
        });
      }
    }

    await ensureAllBranchesHaveCode(prisma);

    // 1. Seed admin@admin.com -> Branch 1
    const adminEmail = "admin@admin.com";
    const adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
    const adminHash = authUtil.hashPassword(getDefaultOwnerPassword());
    if (adminUser) {
      await prisma.user.update({
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
      await prisma.user.create({
        data: {
          name: "Admin User",
          email: adminEmail,
          passwordHash: adminHash,
          role: "OWNER",
          isActive: true,
          mustChangePassword: false,
          branchId: 1,
          isLoggedIn: false,
          subscriptionTier: "FREE",
          subscriptionExpiry: null,
        },
      });
      console.log("👤 admin@admin.com created with default FREE tier (upgrades require Razorpay payment)");
    }

    // 2. Seed admin100@admin.com -> Branch 2
    const email100 = "admin100@admin.com";
    const user100 = await prisma.user.findFirst({ where: { email: email100 } });
    if (!user100) {
      await prisma.user.create({
        data: {
          name: "Owner Pro 100",
          email: email100,
          passwordHash: authUtil.hashPassword(getDefaultOwnerPassword()),
          role: "OWNER",
          isActive: true,
          mustChangePassword: true,
          branchId: 2,
          isLoggedIn: false,
          subscriptionTier: "FREE",
          subscriptionExpiry: null,
        },
      });
      console.log("👤 admin100@admin.com created with default FREE tier");
    } else {
      await prisma.user.update({
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
    const user200 = await prisma.user.findFirst({ where: { email: email200 } });
    if (!user200) {
      await prisma.user.create({
        data: {
          name: "Owner Pro 200",
          email: email200,
          passwordHash: authUtil.hashPassword(getDefaultOwnerPassword()),
          role: "OWNER",
          isActive: true,
          mustChangePassword: true,
          branchId: 3,
          isLoggedIn: false,
          subscriptionTier: "FREE",
          subscriptionExpiry: null,
        },
      });
      console.log("👤 admin200@admin.com created with default FREE tier");
    } else {
      await prisma.user.update({
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
      const seatCount = await prisma.seat.count({ where: { branchId: bId } });
      if (seatCount === 0) {
        const prefixes = ["A", "B", "C"];
        for (const prefix of prefixes) {
          for (let i = 1; i <= 5; i++) {
            await prisma.seat.create({
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
      const shiftCount = await prisma.shift.count({ where: { branchId: bId } });
      if (shiftCount === 0) {
        await prisma.shift.createMany({
          data: [
            { shiftName: "Morning Shift", startTime: "08:00:00", endTime: "14:00:00", isActive: true, branchId: bId },
            { shiftName: "Evening Shift", startTime: "14:00:00", endTime: "20:00:00", isActive: true, branchId: bId },
            { shiftName: "Night Shift", startTime: "20:00:00", endTime: "02:00:00", isActive: true, branchId: bId },
          ],
        });
        console.log(`⏰ Default shifts seeded for Branch ${bId}`);
      }

      // Fee Plans
      const planCount = await prisma.feePlan.count({ where: { branchId: bId } });
      if (planCount === 0) {
        await prisma.feePlan.createMany({
          data: [
            { planName: "Monthly Plan (Reserved)", durationDays: 30, amount: 1000, isActive: true, branchId: bId, planType: "RESERVED" },
            { planName: "Quarterly Plan (Reserved)", durationDays: 90, amount: 2700, isActive: true, branchId: bId, planType: "RESERVED" },
            { planName: "Monthly Plan (Unreserved)", durationDays: 30, amount: 800, isActive: true, branchId: bId, planType: "UNRESERVED" },
          ],
        });
        console.log(`💳 Default fee plans seeded for Branch ${bId}`);
      }
    }
    seedAdminUserRan = true;
  } catch (err) {
    console.error("❌ Failed to seed default branches / admin users:", err.message);
  }
};

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
    const ownerEmails = getOwnerEmails();
    const defaultPassword = getDefaultOwnerPassword();

    // Check if email is in the owner whitelist
    const isOwnerWhitelist = ownerEmails.includes(cleanEmail);

    const reqIp = getClientIp(req);
    const userAgentStr = req.headers["user-agent"] || "";
    const { os, browser } = parseUserAgent(userAgentStr);
    const reqDeviceId = deviceId || req.headers["x-device-id"] || "unknown_device";

    // Helper to get device limit for user subscription tier
    const getDeviceLimit = (tier) => {
      if (tier === "STARTER") return 2;
      if (tier === "PRO_100") return 3;
      if (tier === "PRO_200") return 5;
      if (tier === "ENTERPRISE") return 9999;
      return 1; // FREE
    };

    // Look up user in the DB
    let user = await prisma.user.findFirst({ where: { email: cleanEmail, deletedAt: null } });

    // Handle First Login flow for owner
    if (!user) {
      if (isOwnerWhitelist) {
        // Must match the default owner password
        if (password === defaultPassword) {
          // Check duplicate prevention: prevent multiple owner signups from same computer/IP
          const duplicateUser = await prisma.user.findFirst({
            where: {
              OR: [
                { ipAddress: reqIp },
                { deviceId: reqDeviceId }
              ],
              deletedAt: null
            }
          });

          if (cleanEmail !== "admin@admin.com" && duplicateUser && duplicateUser.email !== cleanEmail) {
            return res.status(403).json({
              success: false,
              message: "Account limit/duplicate exploitation protection: Another library user has already registered from this computer/IP. Please use your existing account."
            });
          }

          // Initialize owner account in the database
          // Ensure default branch exists
          await seedAdminUser();

          // Create a new branch for this owner to isolate their data
          const initialBranchName = `Branch - ${cleanEmail}`;
          const newLibraryCode = await generateUniqueLibraryCode(initialBranchName, null, prisma);
          const newBranch = await prisma.branch.create({
            data: {
              code: newLibraryCode,
              name: initialBranchName,
              address: "Default Address",
              isActive: true,
            },
          });

          user = await prisma.user.create({
            data: {
              name: "Owner",
              email: cleanEmail,
              passwordHash: authUtil.hashPassword(defaultPassword),
              role: "OWNER",
              isActive: true,
              mustChangePassword: true,
              branchId: newBranch.id,
              isLoggedIn: true,
              ipAddress: reqIp,
              os,
              browser,
              deviceId: reqDeviceId,
              subscriptionTier: "FREE"
            },
          });

          // Create active user session
          await prisma.userSession.upsert({
            where: { deviceId: `${reqDeviceId}_${user.id}` },
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
              deviceId: `${reqDeviceId}_${user.id}`,
              isActive: true,
              lastActive: new Date(),
              ipAddress: reqIp,
              os,
              browser
            }
          });

          // Log security event
          await prisma.securityEvent.create({
            data: {
              eventType: "OWNER_FIRST_LOGIN",
              email: cleanEmail,
              userId: user.id,
              ipAddress: reqIp,
              userAgent: userAgentStr,
            },
          });

          const token = authUtil.signToken({ id: user.id, email: user.email, role: user.role, deviceId: `${reqDeviceId}_${user.id}` });

          let branchName = null;
          let branchCode = null;
          if (user.branchId) {
            const branch = await prisma.branch.findUnique({ where: { id: user.branchId } });
            branchName = branch ? branch.name : null;
            branchCode = branch ? branch.code : null;
          }

          return res.json({
            success: true,
            token,
            mustChangePassword: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              subscriptionTier: user.subscriptionTier,
              subscriptionExpiry: user.subscriptionExpiry,
              branch_name: branchName,
              branch_code: branchCode,
              library_name: branchName,
              library_code: branchCode,
            },
          });
        } else {
          // Log failed login event
          await prisma.securityEvent.create({
            data: {
              eventType: "LOGIN_FAILED_WHITELIST",
              email: cleanEmail,
              ipAddress: reqIp,
              userAgent: userAgentStr,
            },
          });
          return res.status(401).json({
            success: false,
            message: "Your email is not whitelisted. Please add your email to the OWNER_EMAILS variable in your backend .env file, then log in using the default owner password (we recommend changing it on first login)."
          });
        }
      } else {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
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
      owner = await prisma.user.findFirst({
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

    // Compare password hash
    let valid = authUtil.comparePassword(password, user.passwordHash);

    // Only accept the configured default password for first-time login if password hasn't been changed yet
    if (!valid && user.mustChangePassword && (cleanEmail === "admin@admin.com" || isOwnerWhitelist)) {
      if (defaultPassword && password === defaultPassword) {
        valid = true;
      }
    }

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

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil,
        },
      });

      await prisma.securityEvent.create({
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
    const activeSessions = await prisma.userSession.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { lastActive: "asc" }
    });

    const isCurrentDeviceActive = activeSessions.some(s => s.deviceId === dbDeviceId);
    // Staff are always limited to 1 active device; owners use their tier-based limit
    const limit = user.role === "STAFF" ? 1 : getDeviceLimit(owner.subscriptionTier);

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
        await prisma.userSession.update({
          where: { id: oldestSession.id },
          data: { isActive: false },
        });

        // Create FORCE_LOGIN_LOGOUT security event to warn the admin/staff
        await prisma.securityEvent.create({
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
    const physicalSessions = await prisma.userSession.findMany({
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

    const activeStaff = physicalSessions.filter(s => s.user.role === "STAFF");

    if (user.role === "OWNER") {
      // If owner logs in, and there is a staff active on this physical device:
      // "if i'm login as staff and then try to login as owner that should not happen it can happen in preium 200 ok not in starter one"
      const isPremium = cleanEmail === "admin@admin.com" || user.subscriptionTier === "PRO_200" || user.subscriptionTier === "ENTERPRISE";
      if (!isPremium && activeStaff.length > 0) {
        for (const s of activeStaff) {
          await prisma.userSession.update({
            where: { id: s.id },
            data: { isActive: false }
          });
        }
      }
    }

    // Upsert the session for the current device
    await prisma.userSession.upsert({
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
    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await prisma.securityEvent.create({
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
      const branch = await prisma.branch.findUnique({ where: { id: user.branchId } });
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
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionExpiry: effExpiry }
      });
    }

    return res.json({
      success: true,
      token,
      mustChangePassword: user.mustChangePassword,
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
        await prisma.userSession.updateMany({
          where: { userId: req.user.id, deviceId: req.user.deviceId },
          data: { isActive: false }
        });
      }

      // Check if user has any active sessions remaining
      const activeCount = await prisma.userSession.count({
        where: { userId: req.user.id, isActive: true }
      });

      await prisma.user.update({
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

    const user = await prisma.user.findFirst({
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
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let libraryCode = user.branch ? user.branch.code : null;
    if (user.branch && !libraryCode) {
      libraryCode = await generateUniqueLibraryCode(user.branch.name, user.branch.phone, prisma);
      await prisma.branch.update({
        where: { id: user.branch.id },
        data: { code: libraryCode }
      });
    }

    let effTier = user.subscriptionTier;
    let effExpiry = user.subscriptionExpiry;

    if (user.role === "STAFF") {
      const owner = await prisma.user.findFirst({
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
        const activated = await prisma.user.updateMany({
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
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionExpiry: fallbackExpiry }
        });
        effExpiry = fallbackExpiry;
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
      library_name: user.branch ? user.branch.name : "Libraryly Main Branch",
      library_code: libraryCode || "LB100001",
      contact: user.branch ? user.branch.phone || "" : "",
      address: user.branch ? user.branch.address || "" : "",
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, email, contact, address, library_name } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { branch: true }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: req.user.id }
        }
      });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email is already in use by another account" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name ? name.trim() : existingUser.name,
        email: email ? email.trim().toLowerCase() : existingUser.email,
      }
    });

    let updatedBranch = existingUser.branch;
    if (existingUser.branchId) {
      // NOTE: library code is permanently unique and strictly non-editable, so code is never modified here!
      updatedBranch = await prisma.branch.update({
        where: { id: existingUser.branchId },
        data: {
          name: library_name !== undefined ? (library_name ? library_name.trim() : existingUser.branch.name) : existingUser.branch.name,
          phone: contact !== undefined ? (contact ? contact.trim() : null) : existingUser.branch.phone,
          address: address !== undefined ? (address ? address.trim() : null) : existingUser.branch.address,
        }
      });
    } else if (library_name || contact || address) {
      const newBranchName = library_name ? library_name.trim() : `${updatedUser.name}'s Library`;
      const newLibCode = await generateUniqueLibraryCode(newBranchName, contact, prisma);
      updatedBranch = await prisma.branch.create({
        data: {
          code: newLibCode,
          name: newBranchName,
          phone: contact ? contact.trim() : null,
          address: address ? address.trim() : null,
        }
      });
      await prisma.user.update({
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

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || user.deletedAt) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password hash or default password if they must change password
    const valid = authUtil.comparePassword(oldPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const newHash = authUtil.hashPassword(newPassword);
    await prisma.user.update({
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
      if (prisma.auditLog) {
        await prisma.auditLog.create({
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

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required to delete account" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || user.deletedAt) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const valid = authUtil.comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Password is incorrect" });
    }

    // Perform soft delete to preserve relations & audit trail
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Log security event
    await prisma.securityEvent.create({
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

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.pendingTier) {
      return res.status(400).json({ success: false, message: "No pending plan found to activate." });
    }

    const days = user.pendingExpiryDays || 30;
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);

    const activatedTier = user.pendingTier;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: activatedTier,
        subscriptionExpiry: newExpiry,
        pendingTier: null,
        pendingExpiryDays: null,
        updatedAt: new Date()
      }
    });

    await prisma.securityEvent.create({
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
    
    const owner = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    const staff = await prisma.user.findMany({
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

    const owner = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }
    
    const getStaffLimit = (tier) => {
      if (tier === "STARTER") return 2;
      if (tier === "PRO_100") return 3;
      if (tier === "PRO_200") return 5;
      if (tier === "ENTERPRISE") return 999999;
      return 0; // FREE: no staff allowed
    };

    const limit = getStaffLimit(owner.subscriptionTier);

    const staffCount = await prisma.user.count({
      where: { role: "STAFF", branchId: owner.branchId || 1, deletedAt: null }
    });

    if (staffCount >= limit) {
      return res.status(403).json({
        success: false,
        message: `Your current plan (${owner.subscriptionTier}) allows up to ${limit} staff member(s). Please upgrade your subscription tier in settings to add more.`
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() }
    });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const newStaff = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash: authUtil.hashPassword(password),
        role: "STAFF",
        isActive: true,
        mustChangePassword: true,
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

    const owner = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    const { id } = req.params;
    const staffId = parseInt(id);

    const staff = await prisma.user.findFirst({
      where: { id: staffId, role: "STAFF", branchId: owner.branchId || 1, deletedAt: null }
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    await prisma.user.update({
      where: { id: staffId },
      data: { deletedAt: new Date(), isActive: false }
    });

    return res.json({ success: true, message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Delete staff error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete staff member" });
  }
};

exports.seedAdminUser = seedAdminUser;

// POST /api/users/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), deletedAt: null, isActive: true }
    });

    // Always return 200 to avoid user enumeration
    if (!user) {
      return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry }
    });

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    if (!resend) {
      console.warn("⚠️ Resend client not initialized. Set RESEND_API_KEY in .env.");
      return res.status(500).json({ success: false, message: "Email service is not configured on the server." });
    }

    await resend.emails.send({
      from: emailFrom,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px;">📚</div>
            <h2 style="color: #1e293b; margin: 12px 0 4px;">Library Management System</h2>
            <p style="color: #64748b; margin: 0; font-size: 14px;">Password Reset</p>
          </div>
          <div style="background: white; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="color: #1e293b; margin: 0 0 16px;">Hi <strong>${user.name}</strong>,</p>
            <p style="color: #475569; margin: 0 0 24px;">We received a request to reset your password. Click the button below to reset it. This link expires in <strong>10 minutes</strong>.</p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                Reset My Password
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">If you did not request this, you can safely ignore this email. Your password will not be changed.</p>
          </div>
          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 16px;">Library Management System · Admin Portal</p>
        </div>
      `
    });

    return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Failed to send reset email." });
  }
};

// GET /api/users/reset-password?token=...
exports.resetPassword = async (req, res) => {
  try {
    const token = req.query.token || req.body?.token;
    if (!token) {
      return res.status(400).json({ success: false, message: "Reset token is required." });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
        deletedAt: null,
        isActive: true
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "This reset link is invalid or has expired." });
    }

    // If GET request, only validate token without modifying state
    if (req.method === "GET") {
      return res.json({ success: true, message: "Reset token is valid.", valid: true });
    }

    // POST request: Requires user to supply their new password
    const newPassword = (req.body?.password || "").trim();
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
    }
    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must contain at least one number." });
    }

    const hashedPassword = authUtil.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: false,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: "Password has been successfully updated. You can now log in with your new password."
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

    const owner = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });

    const staffId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }
    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one number" });
    }

    const staff = await prisma.user.findFirst({
      where: { id: staffId, role: "STAFF", branchId: owner.branchId || 1, deletedAt: null }
    });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    await prisma.user.update({
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
