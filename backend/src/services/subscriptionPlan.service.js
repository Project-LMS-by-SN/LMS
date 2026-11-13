const mongoose = require("mongoose");
const models = require("../models");

/**
 * Canonical Subscription Plans as defined by product specifications
 */
const CANONICAL_PLANS = [
  {
    id: "plan-free",
    name: "Free",
    dbTier: "FREE",
    tierKey: "FREE",
    monthlyPrice: 0,
    quarterlyPrice: 0,
    halfYearPrice: 0,
    annualPrice: 0,
    limit: "Up to 50",
    seatLimit: "Up to 50",
    studentLimit: "Up to 50",
    studentCapacityNum: 50,
    staffCount: 0,
    deviceLimit: 1,
    attendance: "Basic Manual",
    admissionProcess: "QR / Manual",
    feeManagement: "Basic",
    supportLevel: "Community Support",
    planPriceLabel: "Null",
    discountPercent: 0,
    description: "Essential library management for small reading rooms",
    features: [
      "Up to 50 active students",
      "0 Staff accounts (Owner only)",
      "1 Device login limit",
      "Basic Manual Attendance",
      "QR / Manual Admission",
      "Basic Fee Management",
      "Community Support",
    ],
    popular: false,
    badge: "",
    isActive: true,
  },
  {
    id: "plan-basic",
    name: "Basic",
    dbTier: "BASIC",
    tierKey: "BASIC",
    monthlyPrice: 150,
    quarterlyPrice: 450,
    halfYearPrice: 900,
    annualPrice: 1800,
    limit: "Up to 200",
    seatLimit: "Up to 200",
    studentLimit: "Up to 200",
    studentCapacityNum: 200,
    staffCount: 2,
    deviceLimit: 2,
    attendance: "QR / Manual",
    admissionProcess: "QR / Manual",
    feeManagement: "Invoicing & Receipts",
    supportLevel: "Standard Email",
    planPriceLabel: "150",
    discountPercent: 0,
    description: "Complete management solution for growing libraries",
    features: [
      "Up to 200 active students",
      "2 Staff member accounts",
      "2 Device login limits",
      "QR / Manual Attendance",
      "QR / Manual Admission",
      "Invoicing & Fee Receipts",
      "Standard Email Support",
    ],
    popular: false,
    badge: "",
    isActive: true,
  },
  {
    id: "plan-pro",
    name: "Pro",
    dbTier: "PRO",
    tierKey: "PRO",
    monthlyPrice: 250,
    quarterlyPrice: 750,
    halfYearPrice: 1500,
    annualPrice: 3000,
    limit: "Up to 500",
    seatLimit: "Up to 500",
    studentLimit: "Up to 500",
    studentCapacityNum: 500,
    staffCount: 3,
    deviceLimit: 3,
    attendance: "QR / Manual",
    admissionProcess: "QR / Manual",
    feeManagement: "Invoicing & Receipts",
    supportLevel: "Priority Email & Chat",
    planPriceLabel: "250",
    discountPercent: 0,
    description: "Advanced performance and priority support for busy libraries",
    features: [
      "Up to 500 active students",
      "3 Staff member accounts",
      "3 Device login limits",
      "QR / Manual Attendance",
      "QR / Manual Admission",
      "Invoicing & Fee Receipts",
      "Priority Email & Chat Support",
    ],
    popular: true,
    badge: "Most Popular",
    isActive: true,
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    dbTier: "ENTERPRISE",
    tierKey: "ENTERPRISE",
    monthlyPrice: 0,
    quarterlyPrice: 0,
    halfYearPrice: 0,
    annualPrice: 0,
    isCustom: true,
    limit: "Unlimited",
    seatLimit: "Unlimited",
    studentLimit: "Unlimited",
    studentCapacityNum: 999999,
    staffCount: 5,
    deviceLimit: 5,
    attendance: "Advanced Custom Integration",
    admissionProcess: "Custom Workflow & Portal",
    feeManagement: "Full ERP & Multi-Branch",
    supportLevel: "24/7 Dedicated Account Manager",
    planPriceLabel: "According To Features",
    discountPercent: 0,
    description: "Multi-branch ERP and custom workflows for large institutions",
    features: [
      "Unlimited active students",
      "5 Staff member accounts",
      "5 Device login limits",
      "Advanced Custom Integration Attendance",
      "Custom Workflow & Portal Admission",
      "Full ERP & Multi-Branch Management",
      "24/7 Dedicated Account Manager",
    ],
    popular: false,
    badge: "Custom",
    isActive: true,
  },
];

/**
 * Normalizes any raw plan document from portal_overrides (admin project) or subscription_plans collection
 */
const normalizePlan = (rawDoc) => {
  if (!rawDoc) return null;
  const p = rawDoc.patch || rawDoc;

  // Extract tier key
  const rawKey = (p.tier_key || p.tierKey || rawDoc.tierKey || rawDoc.id || "").toUpperCase();
  // Map legacy keys if encountered
  const tierKey = rawKey === "PRO_100" ? "BASIC" : rawKey === "PRO_200" ? "PRO" : rawKey === "STARTER" ? "FREE" : rawKey;

  const canonical = CANONICAL_PLANS.find((c) => c.tierKey === tierKey);
  return canonical ? { ...canonical } : null;
};

const ensureConnection = async () => {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    if (process.env.NODE_ENV === "test" || !process.env.DATABASE_URL) {
      throw new Error("Skipping remote DB connection in test environment");
    }
    const { connectDB } = require("../config/db");
    await Promise.race([
      connectDB(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB connection timeout")), 2000)),
    ]);
  }
};

/**
 * Fetch all subscription plans - strictly returns canonical plans matching specifications
 */
const getSubscriptionPlans = async () => {
  return CANONICAL_PLANS.map((p) => ({ ...p }));
};

/**
 * Return dynamic pricing map from MongoDB Atlas for all subscription plans
 * Output format: { BASIC: { monthly: 150, quarterly: 450, halfYearly: 900, yearly: 1800, annual: 1800 }, ... }
 */
const getDynamicTierPricing = async () => {
  const plans = await getSubscriptionPlans();
  const pricing = {};
  for (const p of plans) {
    pricing[p.tierKey] = {
      monthly: p.monthlyPrice,
      quarterly: p.quarterlyPrice,
      halfYearly: p.halfYearPrice,
      yearly: p.annualPrice,
      annual: p.annualPrice,
    };
  }

  // Guarantee pricing for BASIC and PRO
  if (!pricing.BASIC) {
    pricing.BASIC = { monthly: 150, quarterly: 450, halfYearly: 900, yearly: 1800, annual: 1800 };
  }
  if (!pricing.PRO) {
    pricing.PRO = { monthly: 250, quarterly: 750, halfYearly: 1500, yearly: 3000, annual: 3000 };
  }
  if (!pricing.FREE) {
    pricing.FREE = { monthly: 0, quarterly: 0, halfYearly: 0, yearly: 0, annual: 0 };
  }
  if (!pricing.ENTERPRISE) {
    pricing.ENTERPRISE = { monthly: 0, quarterly: 0, halfYearly: 0, yearly: 0, annual: 0 };
  }

  // Legacy mappings
  pricing.PRO_100 = pricing.BASIC;
  pricing.PRO_200 = pricing.PRO;
  pricing.STARTER = pricing.FREE;

  return pricing;
};

/**
 * Get numerical student limit for a specific tier
 * Free: 50 | Basic: 200 | Pro: 500 | Enterprise: Unlimited (999999)
 */
const getStudentLimitForTier = async (tierKey) => {
  if (!tierKey) return 50;
  const upper = String(tierKey).toUpperCase();

  if (upper === "FREE" || upper === "STARTER") return 50;
  if (upper === "BASIC" || upper === "PRO_100") return 200;
  if (upper === "PRO" || upper === "PRO_200") return 500;
  if (upper === "ENTERPRISE") return 999999;

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
 * Get device limit for a specific tier
 * Free: 1 | Basic: 2 | Pro: 3 | Enterprise: 5
 */
const getDeviceLimitForTier = async (tierKey) => {
  if (!tierKey) return 1;
  const upper = String(tierKey).toUpperCase();

  if (upper === "FREE" || upper === "STARTER") return 1;
  if (upper === "BASIC" || upper === "PRO_100") return 2;
  if (upper === "PRO" || upper === "PRO_200") return 3;
  if (upper === "ENTERPRISE") return 5;

  const studentLimit = await getStudentLimitForTier(upper);
  if (studentLimit >= 999999) return 5;
  if (studentLimit >= 500) return 3;
  if (studentLimit >= 200) return 2;
  return 1;
};

/**
 * Get staff limit for a specific tier
 * Free: 0 | Basic: 2 | Pro: 3 | Enterprise: 5
 */
const getStaffLimitForTier = async (tierKey) => {
  if (!tierKey) return 0;
  const upper = String(tierKey).toUpperCase();

  if (upper === "FREE" || upper === "STARTER") return 0;
  if (upper === "BASIC" || upper === "PRO_100") return 2;
  if (upper === "PRO" || upper === "PRO_200") return 3;
  if (upper === "ENTERPRISE") return 5;

  const studentLimit = await getStudentLimitForTier(upper);
  if (studentLimit >= 999999) return 5;
  if (studentLimit >= 500) return 3;
  if (studentLimit >= 200) return 2;
  return 0;
};

module.exports = {
  CANONICAL_PLANS,
  normalizePlan,
  getSubscriptionPlans,
  getDynamicTierPricing,
  getStudentLimitForTier,
  getDeviceLimitForTier,
  getStaffLimitForTier,
};
