const models = require("../models");
const mongoClient = require("../config/mongoClient");

/**
 * Record a subscription purchase / order
 */
const recordSubscriptionHistory = async ({
  userId,
  orderId,
  paymentId = null,
  tier,
  billing = "monthly",
  amount,
  currency = "INR",
  status = "COMPLETED",
  couponCode = null,
  subscriptionExpiry = null,
}) => {
  try {
    const doc = await models.SubscriptionHistory.create({
      userId: Number(userId),
      orderId: String(orderId),
      paymentId: paymentId ? String(paymentId) : null,
      tier: String(tier),
      billing: billing || "monthly",
      amount: Number(amount) || 0,
      currency: currency || "INR",
      status: status || "COMPLETED",
      couponCode: couponCode ? String(couponCode) : null,
      subscriptionExpiry: subscriptionExpiry ? new Date(subscriptionExpiry) : null,
    });
    return doc.id;
  } catch (err) {
    console.error("Error recording subscription history in MongoDB:", err.message);
    return null;
  }
};

/**
 * Update an existing subscription order status (e.g. from PENDING to COMPLETED)
 */
const updateSubscriptionHistoryStatus = async ({
  orderId,
  paymentId,
  status = "COMPLETED",
  subscriptionExpiry = null,
}) => {
  try {
    const updateData = { status };
    if (paymentId) updateData.paymentId = String(paymentId);
    if (subscriptionExpiry) updateData.subscriptionExpiry = new Date(subscriptionExpiry);

    await models.SubscriptionHistory.updateOne(
      { orderId: String(orderId) },
      { $set: updateData }
    );
  } catch (err) {
    console.error("Error updating subscription history status in MongoDB:", err.message);
  }
};

/**
 * Auto-cancel PENDING orders older than 24 hours
 */
const cancelExpiredPendingOrders = async () => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await models.SubscriptionHistory.updateMany(
      { status: "PENDING", createdAt: { $lt: yesterday } },
      { $set: { status: "CANCELLED" } }
    );
  } catch (err) {
    console.error("Error auto-cancelling expired pending orders in MongoDB:", err.message);
  }
};

/**
 * Fetch subscription history and current status for a given user
 */
const getSubscriptionHistoryForUser = async (userId) => {
  try {
    await cancelExpiredPendingOrders();

    const user = await mongoClient.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionTier: true,
        subscriptionExpiry: true,
        pendingTier: true,
        pendingExpiryDays: true,
        createdAt: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!user) return null;

    const historyRows = await models.SubscriptionHistory.find({ userId: Number(userId) })
      .sort({ id: -1 })
      .lean()
      .exec();

    let daysRemaining = null;
    let isExpired = false;
    if (user.subscriptionExpiry) {
      const expDate = new Date(user.subscriptionExpiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      daysRemaining = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      isExpired = daysRemaining <= 0;
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        currentTier: user.subscriptionTier,
        subscriptionExpiry: user.subscriptionExpiry,
        library_name: user.branch?.name || "Library Main Branch",
        library_address: user.branch?.address || "",
        library_phone: user.branch?.phone || "",
        daysRemaining,
        isExpired,
        pendingTier: user.pendingTier,
      },
      history: historyRows.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        paymentId: r.paymentId,
        tier: r.tier,
        billing: r.billing,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        couponCode: r.couponCode,
        subscriptionExpiry: r.subscriptionExpiry,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      })),
    };
  } catch (err) {
    console.error("Error fetching subscription history for user in MongoDB:", err.message);
    throw err;
  }
};

module.exports = {
  recordSubscriptionHistory,
  updateSubscriptionHistoryStatus,
  getSubscriptionHistoryForUser,
  cancelExpiredPendingOrders,
};
