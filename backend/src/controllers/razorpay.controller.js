const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoClient = require("../config/mongoClient");
const couponService = require("../services/coupon.service");
const subscriptionHistoryService = require("../services/subscriptionHistory.service");

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const subscriptionPlanService = require("../services/subscriptionPlan.service");

const getEffectivePricing = async () => {
  return await subscriptionPlanService.getDynamicTierPricing();
};

const getSubscriptionPlansEndpoint = async (req, res) => {
  try {
    const plans = await subscriptionPlanService.getSubscriptionPlans();
    return res.json({ success: true, plans });
  } catch (error) {
    console.error("Fetch subscription plans error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch subscription plans" });
  }
};

const updateSubscriptionPlansEndpoint = async (req, res) => {
  try {
    const { plans } = req.body;
    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ success: false, message: "Plans array is required in request body" });
    }
    for (const p of plans) {
      if (p.id) {
        await mongoClient.portalOverride.upsert({
          where: { entity: "feePlan", id: String(p.id) },
          update: { patch: p, updated_at: new Date() },
          create: { entity: "feePlan", id: String(p.id), patch: p, updated_at: new Date() },
        });
      }
    }
    return res.json({ success: true, message: "Subscription plans updated successfully in MongoDB Atlas" });
  } catch (error) {
    console.error("Update subscription plans error:", error);
    return res.status(500).json({ success: false, message: "Failed to update subscription plans", error: error.message });
  }
};

const validateCouponEndpoint = async (req, res) => {
  try {
    const { couponCode, tier, billing } = req.body;
    if (!couponCode) {
      return res.status(400).json({ success: false, message: "Please enter a coupon code" });
    }
    const result = await couponService.validateCoupon(req.user.id, couponCode, tier, billing);
    if (!result.valid) {
      return res.status(400).json({ success: false, ...result });
    }
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return res.status(500).json({ success: false, message: "Failed to validate coupon" });
  }
};

const getCouponStatusEndpoint = async (req, res) => {
  try {
    const hasUsed = await couponService.hasUserUsedCoupon(req.user.id, "PRO1");
    return res.json({ success: true, hasUsedProCoupon: hasUsed });
  } catch (error) {
    console.error("Coupon status error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch coupon status" });
  }
};

const createOrder = async (req, res) => {
  try {
    const { tier, billing, couponCode } = req.body;
    const tierPricing = await getEffectivePricing();
    if (!tier || !tierPricing[tier]) {
      return res.status(400).json({ success: false, message: "Invalid subscription tier selected" });
    }

    if (tier === "FREE" || tier === "ENTERPRISE") {
      return res.status(400).json({ success: false, message: "This tier does not require online checkout." });
    }

    let effectiveBilling = billing || "monthly";
    const isYearly = (effectiveBilling === "yearly" || effectiveBilling === "annual") && (tierPricing[tier].yearly || tierPricing[tier].annual);
    const isHalfYearly = effectiveBilling === "halfyearly" && tierPricing[tier].halfYearly;
    const isQuarterly = effectiveBilling === "quarterly" && tierPricing[tier].quarterly;
    let finalAmount = isYearly
      ? (tierPricing[tier].yearly || tierPricing[tier].annual)
      : isHalfYearly
        ? tierPricing[tier].halfYearly
        : isQuarterly
          ? tierPricing[tier].quarterly
          : tierPricing[tier].monthly;

    let appliedCouponData = null;
    if (couponCode) {
      const couponValidation = await couponService.validateCoupon(req.user.id, couponCode, tier, effectiveBilling);
      if (!couponValidation.valid) {
        return res.status(400).json({ success: false, message: couponValidation.message });
      }
      appliedCouponData = couponValidation;
      finalAmount = couponValidation.discountedPrice;
      if (couponValidation.lockBilling) {
        effectiveBilling = couponValidation.lockBilling;
      }
    }

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid plan pricing for checkout" });
    }

    const options = {
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: `receipt_user_${req.user.id}_${Date.now()}`,
      notes: {
        userId: String(req.user.id),
        tier: tier,
        billing: effectiveBilling,
        couponCode: appliedCouponData ? appliedCouponData.couponCode : "",
      }
    };

    const client = getRazorpayClient();
    if (!client) {
      return res.status(500).json({ success: false, message: "Payment gateway credentials are not configured" });
    }

    const order = await client.orders.create(options);

    // Record order in subscription history as PENDING
    await subscriptionHistoryService.recordSubscriptionHistory({
      userId: req.user.id,
      orderId: order.id,
      tier,
      billing: effectiveBilling,
      amount: finalAmount,
      status: "PENDING",
      couponCode: appliedCouponData ? appliedCouponData.couponCode : null,
    });

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      finalAmount,
      couponCode: appliedCouponData ? appliedCouponData.couponCode : undefined,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({ success: false, message: "Failed to initiate payment" });
  }
};

const verifySignature = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, tier, billing } = req.body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing required signature verification parameters" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: "Payment gateway secret not configured" });
    }

    const client = getRazorpayClient();
    if (!client) {
      return res.status(500).json({ success: false, message: "Payment gateway credentials not configured" });
    }

    // 1. Strict HMAC-SHA256 signature verification
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment signature verification failed" });
    }

    // 2. Fetch authoritative order from Razorpay to prevent tampering
    const order = await client.orders.fetch(razorpay_order_id);
    if (!order) {
      return res.status(400).json({ success: false, message: "Order not found in payment gateway" });
    }

    // Security Check: Verify order belongs to the currently logged in user
    if (order.notes?.userId && order.notes.userId !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Security violation: Order was created for a different account" });
    }

    // 3. Strict Razorpay Payment Fetch: Verify payment status is captured or authorized
    try {
      const payment = await client.payments.fetch(razorpay_payment_id);
      if (payment) {
        if (payment.status !== "captured" && payment.status !== "authorized") {
          return res.status(400).json({
            success: false,
            message: `Payment status is ${payment.status}. Plan cannot be upgraded until payment is successfully received.`
          });
        }
        if (payment.order_id && payment.order_id !== razorpay_order_id) {
          return res.status(400).json({ success: false, message: "Payment order ID mismatch" });
        }
      }
    } catch (payErr) {
      console.warn("Payment fetch check warning:", payErr.message);
    }

    // Use authoritative tier and billing stored on order notes
    const effectiveTier = order.notes?.tier || tier;
    const effectiveBilling = order.notes?.billing || billing;
    const notesCoupon = order.notes?.couponCode || req.body?.couponCode;

    const existingUser = await mongoClient.user.findUnique({ where: { id: req.user.id } });
    const isSameTier = existingUser && existingUser.subscriptionTier === effectiveTier;

    let daysToAdd = 30;
    if (notesCoupon && String(notesCoupon).toUpperCase() === "PRO1") {
      daysToAdd = 90; // 3 months promo
    } else if (effectiveBilling === "yearly" || effectiveBilling === "annual") {
      daysToAdd = 365;
    } else if (effectiveBilling === "halfyearly") {
      daysToAdd = 180;
    } else if (effectiveBilling === "quarterly") {
      daysToAdd = 90;
    } else {
      daysToAdd = 30;
    }

    if (notesCoupon) {
      await couponService.recordCouponUsage(req.user.id, notesCoupon, effectiveTier, order.amount / 100);
    }

    // If renewing the same active tier, extend from current expiry date
    const baseDate = (isSameTier && existingUser?.subscriptionExpiry && new Date(existingUser.subscriptionExpiry) > new Date())
      ? new Date(existingUser.subscriptionExpiry)
      : new Date();
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const expiryDate = baseDate;

    await mongoClient.user.update({
      where: { id: req.user.id },
      data: {
        subscriptionTier: effectiveTier,
        subscriptionExpiry: expiryDate,
        pendingTier: null,
        pendingExpiryDays: null
      }
    });

    await mongoClient.securityEvent.create({
      data: {
        eventType: "RAZORPAY_SUBSCRIPTION_ACTIVATED",
        email: existingUser.email,
        userId: existingUser.id,
        ipAddress: req.ip || "unknown",
        userAgent: `Razorpay Payment ID: ${razorpay_payment_id} | Order: ${razorpay_order_id} | Tier: ${effectiveTier} | Coupon: ${notesCoupon || 'none'}`,
      }
    }).catch(() => {});

    // Update subscription history to COMPLETED
    await subscriptionHistoryService.updateSubscriptionHistoryStatus({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      status: "COMPLETED",
      subscriptionExpiry: expiryDate
    });

    return res.json({
      success: true,
      message: `Payment successful! Upgraded to ${effectiveTier} plan.`,
      subscriptionTier: effectiveTier,
      subscriptionExpiry: expiryDate,
      isPendingActivation: false
    });
  } catch (error) {
    console.error("Razorpay signature verification error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during verification" });
  }
};

const getSubscriptionHistory = async (req, res) => {
  try {
    const data = await subscriptionHistoryService.getSubscriptionHistoryForUser(req.user.id);
    if (!data) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.json({ success: true, ...data });
  } catch (error) {
    console.error("Fetch subscription history error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch subscription history" });
  }
};

module.exports = {
  createOrder,
  verifySignature,
  validateCouponEndpoint,
  getCouponStatusEndpoint,
  getSubscriptionHistory,
  getSubscriptionPlansEndpoint,
  updateSubscriptionPlansEndpoint,
};

