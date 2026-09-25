// Lightweight in-memory rate limiter middleware
// Prevents brute-forcing, spamming, and DoS attacks on public endpoints

const createRateLimiter = ({
  windowMs = 60 * 1000, // 1 minute default
  max = 60,              // max requests per windowMs
  message = "Too many requests from this IP, please try again later."
} = {}) => {
  const hits = new Map();

  // Periodic cleanup of expired entries every 2 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.startTime > windowMs) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 60000));

  // Ensure interval does not prevent process exit
  if (cleanupInterval.unref) cleanupInterval.unref();

  return (req, res, next) => {
    // Get client IP address
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown-ip";

    const now = Date.now();
    let record = hits.get(clientIp);

    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      hits.set(clientIp, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetTimeSeconds = Math.ceil((record.startTime + windowMs - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetTimeSeconds);

    if (record.count > max) {
      res.setHeader("Retry-After", resetTimeSeconds);
      return res.status(429).json({
        success: false,
        code: "TOO_MANY_REQUESTS",
        message,
        retryAfterSeconds: resetTimeSeconds
      });
    }

    next();
  };
};

module.exports = {
  createRateLimiter,
  publicAttendanceLimiter: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 60,             // 60 scans/min per IP
    message: "Too many attendance scan requests. Please wait a few seconds before trying again."
  }),
  loginLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 15 : 200, // Relaxed for local dev
    message: "Too many login attempts from this IP. Please wait 15 minutes before trying again."
  }),
  admissionLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,                  // 15 admission form submissions per 15 minutes
    message: "Too many admission requests submitted. Please try again later."
  })
};
