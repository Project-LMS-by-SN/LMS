const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.resolve(__dirname, "../../prisma/dev.db");
const db = new Database(dbPath);

// Initialize coupon_usages table & index
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupon_usages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      coupon_code TEXT NOT NULL,
      tier TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id, coupon_code);
  `);
} catch (err) {
  console.error("Error initializing coupon_usages table:", err);
}

const VALID_COUPONS = ["PRO1", "PRO", "PRO1RUPEE", "SPECIAL1", "OFFER1"];

const isProTier = (tier) => {
  if (!tier) return false;
  const upper = tier.toUpperCase();
  return upper === "PRO_100" || upper === "PRO_200" || upper.includes("PRO");
};

const normalizeCoupon = (code) => {
  if (!code) return "";
  return code.trim().toUpperCase();
};

const hasUserUsedCoupon = (userId, couponCode) => {
  if (!userId) return false;
  try {
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM coupon_usages 
      WHERE user_id = ? AND UPPER(coupon_code) IN ('PRO1', 'PRO', 'PRO1RUPEE', 'SPECIAL1', 'OFFER1')
    `).get(userId);
    return (row?.count || 0) > 0;
  } catch (err) {
    console.error("Error checking coupon usage:", err);
    return false;
  }
};

const validateCoupon = (userId, couponCode, tier) => {
  const normalized = normalizeCoupon(couponCode);
  
  if (!normalized || !VALID_COUPONS.includes(normalized)) {
    return {
      valid: false,
      message: "Invalid coupon code. Please enter a valid coupon (e.g. PRO1)."
    };
  }

  // Check if target tier is a PRO plan
  if (tier && !isProTier(tier)) {
    return {
      valid: false,
      message: "Coupon PRO1 is only applicable on Pro plans (Basic Pro 100 & Pro 200)."
    };
  }

  // Check if user has already redeemed this coupon
  if (hasUserUsedCoupon(userId, normalized)) {
    return {
      valid: false,
      alreadyUsed: true,
      message: "This coupon has already been redeemed by your account. Each ID can only use it once."
    };
  }

  return {
    valid: true,
    couponCode: "PRO1",
    discountedPrice: 1,
    durationMonths: 3,
    durationDays: 90,
    message: "Coupon PRO1 applied! 3 Months Pro subscription for just ₹1."
  };
};

const recordCouponUsage = (userId, couponCode, tier, amount = 1) => {
  if (!userId) return null;
  const normalized = normalizeCoupon(couponCode) || "PRO1";
  try {
    const stmt = db.prepare(`
      INSERT INTO coupon_usages (user_id, coupon_code, tier, amount, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(userId, normalized, tier || "PRO_100", amount);
  } catch (err) {
    console.error("Error recording coupon usage:", err);
    return null;
  }
};

module.exports = {
  VALID_COUPONS,
  isProTier,
  normalizeCoupon,
  hasUserUsedCoupon,
  validateCoupon,
  recordCouponUsage,
};
