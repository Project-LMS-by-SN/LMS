const Database = require("better-sqlite3");
const path = require("path");
const prisma = require("../config/prisma");

const dbPath = path.resolve(__dirname, "../../prisma/dev.db");
const db = new Database(dbPath);

// Initialize subscription_history table & index
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_id TEXT NOT NULL,
      payment_id TEXT,
      tier TEXT NOT NULL,
      billing TEXT DEFAULT 'monthly',
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'COMPLETED',
      coupon_code TEXT,
      subscription_expiry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_sub_history_user ON subscription_history(user_id);
  `);
} catch (err) {
  console.error("Error initializing subscription_history table:", err);
}

/**
 * Record a subscription purchase / order
 */
const recordSubscriptionHistory = ({
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
    const stmt = db.prepare(`
      INSERT INTO subscription_history 
        (user_id, order_id, payment_id, tier, billing, amount, currency, status, coupon_code, subscription_expiry, created_at)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const expiryStr = subscriptionExpiry ? new Date(subscriptionExpiry).toISOString() : null;
    const result = stmt.run(
      userId,
      orderId,
      paymentId,
      tier,
      billing,
      amount,
      currency,
      status,
      couponCode,
      expiryStr
    );
    return result.lastInsertRowid;
  } catch (err) {
    console.error("Error recording subscription history:", err);
    return null;
  }
};

/**
 * Update an existing subscription order status (e.g. from PENDING to COMPLETED)
 */
const updateSubscriptionHistoryStatus = ({ orderId, paymentId, status = "COMPLETED", subscriptionExpiry = null }) => {
  try {
    const expiryStr = subscriptionExpiry ? new Date(subscriptionExpiry).toISOString() : null;
    const stmt = db.prepare(`
      UPDATE subscription_history 
      SET payment_id = COALESCE(?, payment_id),
          status = ?,
          subscription_expiry = COALESCE(?, subscription_expiry)
      WHERE order_id = ?
    `);
    stmt.run(paymentId, status, expiryStr, orderId);
  } catch (err) {
    console.error("Error updating subscription history status:", err);
  }
};

/**
 * Fetch subscription history and current status for a given user
 */
const getSubscriptionHistoryForUser = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
          }
        },
      },
    });

    if (!user) return null;

    // Fetch records from subscription_history
    const historyRows = db.prepare(`
      SELECT * FROM subscription_history 
      WHERE user_id = ? 
      ORDER BY id DESC
    `).all(userId);

    // Calculate remaining days for current plan
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
      history: historyRows.map(r => ({
        id: r.id,
        orderId: r.order_id,
        paymentId: r.payment_id,
        tier: r.tier,
        billing: r.billing,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        couponCode: r.coupon_code,
        subscriptionExpiry: r.subscription_expiry,
        createdAt: r.created_at,
      })),
    };
  } catch (err) {
    console.error("Error fetching subscription history for user:", err);
    throw err;
  }
};

module.exports = {
  recordSubscriptionHistory,
  updateSubscriptionHistoryStatus,
  getSubscriptionHistoryForUser,
};
