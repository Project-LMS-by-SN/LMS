const authUtil = require("../utils/auth");
const prisma = require("../config/prisma");

module.exports = async (req, res, next) => {
  // Allow OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    return next();
  }

  // Allow public endpoints without token
  const path = req.path;
  const originalUrl = req.originalUrl || "";
  const isPublic =
    path === "/" ||
    path === "/login" ||
    path === "/users/login" ||
    path === "/users/forgot-password" ||
    path === "/users/reset-password" ||
    ((path === "/admission-requests" || originalUrl.startsWith("/api/admission-requests")) && req.method === "POST") ||
    path.startsWith("/attendance/public") ||
    originalUrl.startsWith("/api/attendance/public") ||
    originalUrl.startsWith("/api/users/login") ||
    originalUrl.startsWith("/api/users/forgot-password") ||
    originalUrl.startsWith("/api/users/reset-password");

  if (isPublic) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = authUtil.verifyToken(token);
    
    // Fetch active user from DB
    const user = await prisma.user.findFirst({
      where: { id: decoded.id, isActive: true, deletedAt: null },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account is inactive or does not exist",
      });
    }

    const cleanUserEmail = user.email.toLowerCase().trim();
    const isAdmin = cleanUserEmail === "admin@admin.com";

    // Device validation to prevent exceeding concurrent session limits
    if (decoded.deviceId && !isAdmin) {
      const activeSession = await prisma.userSession.findFirst({
        where: {
          userId: decoded.id,
          deviceId: decoded.deviceId,
          isActive: true,
        },
      });
      if (!activeSession) {
        return res.status(401).json({
          success: false,
          code: "DEVICE_LOGGED_OUT",
          message: "This session has been terminated because the device session limit has been exceeded or you logged out. Use your main account."
        });
      }
    }

    // Lockout check
    if (!isAdmin && user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: "Account is temporarily locked. Try again later.",
      });
    }

    // Force password change constraint
    if (user.mustChangePassword && user.role === "OWNER") {
      const allowedPaths = [
        "/api/users/change-password",
        "/users/change-password",
        "/api/users/profile",
        "/users/profile"
      ];
      if (!allowedPaths.includes(req.path)) {
        return res.status(403).json({
          success: false,
          mustChangePassword: true,
          message: "You must change your default password before accessing other endpoints.",
        });
      }
    }

    // Subscription expiry check - block non-dashboard routes when expired (for both OWNER and STAFF)
    let effectiveTier = user.subscriptionTier;
    let effectiveExpiry = user.subscriptionExpiry;
    let planHolder = user;

    if (user.role === "STAFF" && user.branchId) {
      const branchOwner = await prisma.user.findFirst({
        where: { branchId: user.branchId, role: "OWNER", isActive: true, deletedAt: null },
        select: { id: true, subscriptionTier: true, subscriptionExpiry: true, pendingTier: true, pendingExpiryDays: true }
      });
      if (branchOwner) {
        effectiveTier = branchOwner.subscriptionTier;
        effectiveExpiry = branchOwner.subscriptionExpiry;
        planHolder = branchOwner;
      }
    }

    if (effectiveTier !== "FREE" && effectiveExpiry) {
      const expiry = new Date(effectiveExpiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        // Auto-activate pending purchased plan if available on expiry!
        if (planHolder.pendingTier) {
          const days = planHolder.pendingExpiryDays || 30;
          const newExpiry = new Date();
          newExpiry.setDate(newExpiry.getDate() + days);

          const activatedTier = planHolder.pendingTier;

          await prisma.user.update({
            where: { id: planHolder.id },
            data: {
              subscriptionTier: activatedTier,
              subscriptionExpiry: newExpiry,
              pendingTier: null,
              pendingExpiryDays: null,
              updatedAt: new Date()
            }
          });

          user.subscriptionTier = activatedTier;
          user.subscriptionExpiry = newExpiry;
          user.pendingTier = null;
          user.pendingExpiryDays = null;
        } else {
          const allowedWhenExpired = [
            "/api/dashboard",
            "/dashboard",
            "/api/users/profile",
            "/api/users/logout",
            "/api/users/subscription",
            "/api/users/login",
            "/api/subscription",
            "/users/profile",
            "/users/logout",
            "/users/subscription"
          ];
          const isAllowed = allowedWhenExpired.some(p => req.path.startsWith(p));
          if (!isAllowed) {
            return res.status(403).json({
              success: false,
              code: "SUBSCRIPTION_EXPIRED",
              message: user.role === "STAFF"
                ? "Your library's subscription has expired. Please contact the library owner to renew."
                : "Your subscription has expired. Please renew to continue.",
            });
          }
        }
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      deviceId: decoded.deviceId,
      branchId: user.branchId || 1,
      subscriptionTier: user.subscriptionTier,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
