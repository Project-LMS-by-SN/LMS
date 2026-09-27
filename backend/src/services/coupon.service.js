const models = require("../models");

const VALID_COUPONS = ["PRO1", "PRO", "PRO1RUPEE", "SPECIAL1", "OFFER1"];

const isProTier = (tier) => {
  if (!tier) return false;
  const upper = String(tier).toUpperCase();
  return upper === "PRO_100" || upper === "PRO_200" || upper.includes("PRO");
};

const normalizeCoupon = (code) => {
  if (!code) return "";
  return String(code).trim().toUpperCase();
};

const hasUserUsedCoupon = async (userId, couponCode) => {
  if (!userId) return false;
  try {
    const count = await models.CouponUsage.countDocuments({
      userId: Number(userId),
      couponCode: { $in: VALID_COUPONS },
    });
    return count > 0;
  } catch (err) {
    console.error("Error checking coupon usage in MongoDB:", err.message);
    return false;
  }
};

const validateCoupon = async (userId, couponCode, tier) => {
  const normalized = normalizeCoupon(couponCode);

  if (!normalized || !VALID_COUPONS.includes(normalized)) {
    return {
      valid: false,
      message: "Invalid coupon code. Please enter a valid coupon (e.g. PRO1).",
    };
  }

  // Check if target tier is a PRO plan
  if (tier && !isProTier(tier)) {
    return {
      valid: false,
      message: "Coupon PRO1 is only applicable on Pro plans (Basic Pro 100 & Pro 200).",
    };
  }

  // Check if user has already redeemed this coupon
  const alreadyUsed = await hasUserUsedCoupon(userId, normalized);
  if (alreadyUsed) {
    return {
      valid: false,
      alreadyUsed: true,
      message: "This coupon has already been redeemed by your account. Each ID can only use it once.",
    };
  }

  return {
    valid: true,
    couponCode: "PRO1",
    discountedPrice: 1,
    durationMonths: 3,
    durationDays: 90,
    message: "Coupon PRO1 applied! 3 Months Pro subscription for just ₹1.",
  };
};

const recordCouponUsage = async (userId, couponCode, tier, amount = 1) => {
  if (!userId) return null;
  const normalized = normalizeCoupon(couponCode) || "PRO1";
  try {
    return await models.CouponUsage.create({
      userId: Number(userId),
      couponCode: normalized,
      tier: tier || "PRO_100",
      amount: Number(amount) || 1,
    });
  } catch (err) {
    console.error("Error recording coupon usage in MongoDB:", err.message);
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
