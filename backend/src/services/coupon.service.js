const models = require("../models");

const VALID_COUPONS = {
  PRO1: {
    code: "PRO1",
    tier: "PRO",
    discountedPrice: 1,
    durationMonths: 3,
    durationDays: 90,
    lockBilling: "quarterly",
    description: "3 Months Pro subscription for just ₹1",
  },
  PRO: {
    code: "PRO1",
    tier: "PRO",
    discountedPrice: 1,
    durationMonths: 3,
    durationDays: 90,
    lockBilling: "quarterly",
    description: "3 Months Pro subscription for just ₹1",
  },
  SPECIAL1: {
    code: "PRO1",
    tier: "PRO",
    discountedPrice: 1,
    durationMonths: 3,
    durationDays: 90,
    lockBilling: "quarterly",
    description: "3 Months Pro subscription for just ₹1",
  },
};

const normalizeCoupon = (code) => {
  if (!code) return "";
  return String(code).trim().toUpperCase();
};

const hasUserUsedCoupon = async (userId, couponCode) => {
  if (!userId) return false;
  try {
    const normalized = normalizeCoupon(couponCode);
    const count = await models.CouponUsage.countDocuments({
      userId: Number(userId),
      couponCode: normalized === "PRO1" || normalized === "PRO" || normalized === "SPECIAL1"
        ? { $in: ["PRO1", "PRO", "SPECIAL1"] }
        : normalized,
    });
    return count > 0;
  } catch (err) {
    console.error("Error checking coupon usage in MongoDB:", err.message);
    return false;
  }
};

const validateCoupon = async (userId, couponCode, tier, billing = "monthly") => {
  const normalized = normalizeCoupon(couponCode);
  if (!normalized) {
    return { valid: false, message: "Please enter a coupon code" };
  }

  const coupon = VALID_COUPONS[normalized];
  if (!coupon) {
    return {
      valid: false,
      message: "Invalid coupon code. Please check and try again.",
    };
  }

  // Check tier requirement if coupon is restricted to a tier
  if (coupon.tier && tier) {
    const requestedTier = String(tier).toUpperCase();
    if (requestedTier !== coupon.tier) {
      return {
        valid: false,
        message: `Coupon ${coupon.code} is only valid for the ${coupon.tier} plan.`,
      };
    }
  }

  // Check single-use per account
  const alreadyUsed = await hasUserUsedCoupon(userId, coupon.code);
  if (alreadyUsed) {
    return {
      valid: false,
      alreadyUsed: true,
      message: `Coupon ${coupon.code} has already been redeemed by your account. Single-use only.`,
    };
  }

  return {
    valid: true,
    couponCode: coupon.code,
    discountedPrice: coupon.discountedPrice,
    durationMonths: coupon.durationMonths,
    durationDays: coupon.durationDays,
    lockBilling: coupon.lockBilling,
    message: `Coupon ${coupon.code} applied! ${coupon.description}.`,
  };
};

const recordCouponUsage = async (userId, couponCode, tier, amount = 1) => {
  if (!userId) return null;
  const normalized = normalizeCoupon(couponCode) || "PRO1";
  try {
    return await models.CouponUsage.create({
      userId: Number(userId),
      couponCode: normalized,
      tier: tier || "PRO",
      amount: Number(amount) || 1,
    });
  } catch (err) {
    console.error("Error recording coupon usage in MongoDB:", err.message);
    return null;
  }
};

module.exports = {
  VALID_COUPONS,
  normalizeCoupon,
  hasUserUsedCoupon,
  validateCoupon,
  recordCouponUsage,
};

