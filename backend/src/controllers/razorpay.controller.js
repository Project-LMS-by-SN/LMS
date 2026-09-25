const Razorpay = require("razorpay");
const crypto = require("crypto");
const prisma = require("../config/prisma");
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

const tierPricing = {
  STARTER:   { monthly: 150, quarterly: 450, halfYearly: 900 },
  PRO_100:   { monthly: 200, quarterly: 600, halfYearly: 1100 },
  PRO_200:   { monthly: 300, quarterly: 900, halfYearly: 1600 },
  ENTERPRISE:{ monthly: 400, quarterly: 1000, halfYearly: 2000 },
};

const validateCouponEndpoint = async (req, res) => {
  try {
    const { couponCode, tier } = req.body;
    if (!couponCode) {
      return res.status(400).json({ success: false, message: "Please enter a coupon code" });
    }
    const result = couponService.validateCoupon(req.user.id, couponCode, tier);
    if (!result.valid) {
      return res.status(400).json({ success: false, ...result });
    }
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Coupon validation endpoint error:", error);
    return res.status(500).json({ success: false, message: "Failed to validate coupon" });
  }
};

const getCouponStatusEndpoint = async (req, res) => {
  try {
    const hasUsed = couponService.hasUserUsedCoupon(req.user.id, "PRO1");
    return res.json({ success: true, hasUsedProCoupon: hasUsed });
  } catch (error) {
    console.error("Coupon status error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch coupon status" });
  }
};

const createOrder = async (req, res) => {
  try {
    const { tier, billing, couponCode } = req.body;
    if (!tier || !tierPricing[tier]) {
      return res.status(400).json({ success: false, message: "Invalid subscription tier selected" });
    }

    let isCouponApplied = false;
    let finalAmount;

    if (couponCode) {
      const validation = couponService.validateCoupon(req.user.id, couponCode, tier);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message, alreadyUsed: validation.alreadyUsed });
      }
      isCouponApplied = true;
      finalAmount = 1; // 1 Rupee for PRO plans with coupon!
    } else {
      const isHalfYearly = billing === "halfyearly" && tierPricing[tier].halfYearly;
      const isQuarterly = billing === "quarterly" && tierPricing[tier].quarterly;
      finalAmount = isHalfYearly ? tierPricing[tier].halfYearly : isQuarterly ? tierPricing[tier].quarterly : tierPricing[tier].monthly;
    }

    const options = {
      amount: finalAmount * 100,
      currency: "INR",
      receipt: `receipt_user_${req.user.id}_${Date.now()}`,
      notes: {
        userId: String(req.user.id),
        tier: tier,
        billing: billing || "monthly",
        couponCode: couponCode || ""
      }
    };

    const client = getRazorpayClient();
    if (!client) {
      return res.status(500).json({ success: false, message: "Payment gateway credentials are not configured" });
    }

    const order = await client.orders.create(options);

    // Record order in subscription history as PENDING
    subscriptionHistoryService.recordSubscriptionHistory({
      userId: req.user.id,
      orderId: order.id,
      tier,
      billing: billing || "monthly",
      amount: finalAmount,
      status: "PENDING",
      couponCode: isCouponApplied ? couponCode : null,
    });

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      couponApplied: isCouponApplied,
      discountedAmount: finalAmount
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({ success: false, message: "Failed to initiate payment" });
  }
};

const verifySignature = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, tier, billing, couponCode } = req.body;
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

    // Verify cryptographic signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment signature verification failed" });
    }

    // Fetch the actual order from Razorpay to prevent client-side tier/price tampering
    const order = await client.orders.fetch(razorpay_order_id);
    if (!order) {
      return res.status(400).json({ success: false, message: "Order not found in payment gateway" });
    }

    // Security Check: Verify order belongs to the currently logged in user
    if (order.notes?.userId && order.notes.userId !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Security violation: Order was created for a different account" });
    }

    // Use authoritative tier and billing stored on the order notes
    const effectiveTier = order.notes?.tier || tier;
    const effectiveBilling = order.notes?.billing || billing;
    const effectiveCoupon = order.notes?.couponCode || couponCode;

    // If a coupon code was used, record the coupon usage to guarantee one-time redemption per user ID
    if (effectiveCoupon) {
      couponService.recordCouponUsage(req.user.id, effectiveCoupon, effectiveTier, 1);
    }

    const existingUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isSameTier = existingUser && existingUser.subscriptionTier === effectiveTier;
    const isExpired = !existingUser?.subscriptionExpiry || new Date(existingUser.subscriptionExpiry) <= new Date();

    const isHalfYearly = effectiveBilling === "halfyearly" && tierPricing[effectiveTier] && tierPricing[effectiveTier].halfYearly;
    const isQuarterly = effectiveBilling === "quarterly" && tierPricing[effectiveTier] && tierPricing[effectiveTier].quarterly;
    // Coupon PRO1 gives strictly 3 months (90 days)
    const daysToAdd = effectiveCoupon ? 90 : (isHalfYearly ? 180 : isQuarterly ? 90 : 30);

    if (!isSameTier && existingUser?.subscriptionTier !== "FREE" && !isExpired) {
      if (existingUser.pendingTier && existingUser.pendingTier !== effectiveTier) {
        // Don't silently overwrite — tell user a different plan is already pending
        return res.json({
          success: true,
          isPendingActivation: true,
          warning: true,
          message: `You already have a pending ${existingUser.pendingTier} plan. Your new ${effectiveTier} purchase has been recorded. Contact support to resolve conflicting plans.`,
          pendingTier: existingUser.pendingTier,
          pendingExpiryDays: existingUser.pendingExpiryDays,
          couponApplied: !!effectiveCoupon
        });
      }
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          pendingTier: effectiveTier,
          pendingExpiryDays: daysToAdd
        }
      });
      return res.json({
        success: true,
        isPendingActivation: true,
        message: effectiveCoupon
          ? `Payment of ₹1 successful! 3 Months Plan ${effectiveTier} is purchased with coupon and ready for activation.`
          : `Payment successful! Plan ${effectiveTier} is purchased and ready for activation. Click "Activate Plan" when you are ready to switch!`,
        pendingTier: effectiveTier,
        pendingExpiryDays: daysToAdd,
        couponApplied: !!effectiveCoupon
      });
    }

    const baseDate = (isSameTier && existingUser?.subscriptionExpiry && new Date(existingUser.subscriptionExpiry) > new Date())
      ? new Date(existingUser.subscriptionExpiry)
      : new Date();
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const expiryDate = baseDate;

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        subscriptionTier: effectiveTier,
        subscriptionExpiry: expiryDate,
        pendingTier: null,
        pendingExpiryDays: null
      }
    });

    await prisma.securityEvent.create({
      data: {
        eventType: "RAZORPAY_SUBSCRIPTION_ACTIVATED",
        email: existingUser.email,
        userId: existingUser.id,
        ipAddress: req.ip || "unknown",
        userAgent: `Razorpay Payment ID: ${razorpay_payment_id} | Order: ${razorpay_order_id} | Tier: ${effectiveTier}`,
      }
    }).catch(() => {});

    // Update subscription history to COMPLETED
    subscriptionHistoryService.updateSubscriptionHistoryStatus({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      status: "COMPLETED",
      subscriptionExpiry: expiryDate
    });

    return res.json({
      success: true,
      message: effectiveCoupon
        ? `Payment of ₹1 successful! 3 Months Subscription upgraded to ${effectiveTier} using coupon.`
        : `Subscription successfully upgraded to ${effectiveTier}!`,
      subscriptionExpiry: expiryDate,
      couponApplied: !!effectiveCoupon
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
  getSubscriptionHistory
};

