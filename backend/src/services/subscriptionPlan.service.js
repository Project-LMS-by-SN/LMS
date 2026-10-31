const mongoose = require("mongoose");
const models = require("../models");

/**
 * Normalizes any raw plan document from portal_overrides (admin project) or subscription_plans collection
 */
const normalizePlan = (rawDoc) => {
  if (!rawDoc) return null;
  const p = rawDoc.patch || rawDoc;

  // Extract student/seat limit
  const seatLimitRaw = p.seat_limit || p.seatLimit || p.studentLimit || p.limit || "Unlimited active students";
  
  // Extract tier key
  const tierKey = (p.tier_key || p.tierKey || rawDoc.tierKey || rawDoc.id || "").toUpperCase();

  // Extract prices
  const monthlyPrice = Number(p.monthly_price ?? p.monthlyPrice ?? 0);
  const quarterlyPrice = Number(p.quarterly_price ?? p.quarterlyPrice ?? (monthlyPrice * 3));
  const halfYearPrice = Number(p.half_yearly_price ?? p.halfYearPrice ?? (monthlyPrice * 6));
  const annualPrice = Number(p.annual_price ?? p.annualPrice ?? (monthlyPrice * 12));

  return {
    id: rawDoc.id || p.id || `plan-${tierKey.toLowerCase()}`,
    name: p.name || tierKey || "Subscription Plan",
    dbTier: tierKey,
    tierKey: tierKey,
    monthlyPrice,
    quarterlyPrice,
    halfYearPrice,
    annualPrice,
    limit: seatLimitRaw,
    seatLimit: seatLimitRaw,
    studentLimit: seatLimitRaw,
    discountPercent: Number(p.discount_percent ?? p.discountPercent ?? 0),
    description: p.description || "",
    features: Array.isArray(p.features) ? p.features : [],
    popular: Boolean(p.popular || p.badge === "Most Popular"),
    badge: p.badge || (p.popular ? "Most Popular" : ""),
    isActive: p.is_active !== false && p.isActive !== false,
  };
};

const ensureConnection = async () => {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    const { connectDB } = require("../config/db");
    await connectDB();
  }
};

/**
 * Fetch all subscription plans directly from MongoDB Atlas collections
 * Priority:
 * 1. Check `portal_overrides` collection (where entity is "feePlan" or "subscriptionPlan")
 * 2. Fall back to `subscription_plans` collection
 */
const getSubscriptionPlans = async () => {
  await ensureConnection();

  // 1. Try portal_overrides (admin project schema)
  let portalOverrides = [];
  try {
    if (models.PortalOverride) {
      portalOverrides = await models.PortalOverride.find({
        entity: { $in: ["feePlan", "subscriptionPlan"] }
      }).lean();
    }
  } catch (err) {
    console.error("Error fetching portal_overrides:", err.message);
  }

  if (portalOverrides.length > 0) {
    const plans = portalOverrides
      .map(normalizePlan)
      .filter((p) => p && p.isActive && p.tierKey);

    if (plans.length > 0) {
      return plans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    }
  }

  // 2. Try subscription_plans collection
  let subPlans = [];
  try {
    if (models.SubscriptionPlan) {
      subPlans = await models.SubscriptionPlan.find({
        isActive: { $ne: false }
      }).lean();
    }
  } catch (err) {
    console.error("Error fetching subscription_plans:", err.message);
  }

  if (subPlans.length > 0) {
    const plans = subPlans
      .map(normalizePlan)
      .filter((p) => p && p.tierKey);

    return plans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
  }

  return [];
};

/**
 * Return dynamic pricing map from MongoDB Atlas for all subscription plans
 * Output format: { STARTER: { monthly: 150, quarterly: 450, halfYearly: 900, annual: 1800 }, ... }
 */
const getDynamicTierPricing = async () => {
  const plans = await getSubscriptionPlans();
  const pricing = {};
  for (const p of plans) {
    pricing[p.tierKey] = {
      monthly: p.monthlyPrice,
      quarterly: p.quarterlyPrice,
      halfYearly: p.halfYearPrice,
      annual: p.annualPrice,
    };
  }
  return pricing;
};

/**
 * Get numerical student limit for a specific tier by querying MongoDB Atlas dynamically
 */
const getStudentLimitForTier = async (tierKey) => {
  if (!tierKey || tierKey === "FREE") return 50;
  const upper = String(tierKey).toUpperCase();

  const plans = await getSubscriptionPlans();
  const matchedPlan = plans.find((p) => p.tierKey === upper || p.dbTier === upper);

  if (!matchedPlan) {
    return 50;
  }

  const limitStr = String(matchedPlan.limit || matchedPlan.seatLimit || "").toLowerCase();
  if (limitStr.includes("unlimited")) {
    return 999999;
  }

  const match = limitStr.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }

  return 999999;
};

/**
 * Get device limit for a specific tier by querying MongoDB Atlas dynamically
 */
const getDeviceLimitForTier = async (tierKey) => {
  if (!tierKey || tierKey === "FREE") return 1;
  const upper = String(tierKey).toUpperCase();

  const studentLimit = await getStudentLimitForTier(upper);
  if (studentLimit >= 999999) return 9999;
  if (studentLimit >= 500) return 5;
  if (studentLimit >= 250) return 3;
  return 2;
};

/**
 * Get staff limit for a specific tier by querying MongoDB Atlas dynamically
 */
const getStaffLimitForTier = async (tierKey) => {
  if (!tierKey || tierKey === "FREE") return 0;
  const upper = String(tierKey).toUpperCase();

  const studentLimit = await getStudentLimitForTier(upper);
  if (studentLimit >= 999999) return 999999;
  if (studentLimit >= 500) return 5;
  if (studentLimit >= 250) return 3;
  return 2;
};

module.exports = {
  normalizePlan,
  getSubscriptionPlans,
  getDynamicTierPricing,
  getStudentLimitForTier,
  getDeviceLimitForTier,
  getStaffLimitForTier,
};
