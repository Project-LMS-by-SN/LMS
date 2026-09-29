const mongoClient = require("../config/mongoClient");

/**
 * Ensures a branch has default shifts, fee plans, seats, and payment modes.
 * This guarantees any library owner (admin@admin.com or newly whitelisted email)
 * can immediately admit students and manage seats without manual setup.
 */
const ensureBranchDefaults = async (branchId) => {
  if (!branchId) return;

  try {
    // 1. Ensure Shifts
    const shiftCount = await mongoClient.shift.count({
      where: { branchId, deletedAt: null }
    });

    if (shiftCount === 0) {
      const defaultShifts = [
        { shiftName: "Morning Shift", startTime: "08:00:00", endTime: "14:00:00", isActive: true, branchId },
        { shiftName: "Evening Shift", startTime: "14:00:00", endTime: "20:00:00", isActive: true, branchId },
        { shiftName: "Night Shift", startTime: "20:00:00", endTime: "02:00:00", isActive: true, branchId },
      ];
      for (const s of defaultShifts) {
        await mongoClient.shift.create({ data: s });
      }
      console.log(`✅ Default shifts created for branch ${branchId}`);
    }

    // 2. Ensure Fee Plans
    const planCount = await mongoClient.feePlan.count({
      where: { branchId, deletedAt: null }
    });

    if (planCount === 0) {
      const defaultPlans = [
        { planName: "Monthly Plan (Reserved)", durationDays: 30, amount: 1000, isActive: true, branchId, planType: "RESERVED" },
        { planName: "Quarterly Plan (Reserved)", durationDays: 90, amount: 2700, isActive: true, branchId, planType: "RESERVED" },
        { planName: "Half Yearly Plan (Reserved)", durationDays: 180, amount: 5000, isActive: true, branchId, planType: "RESERVED" },
        { planName: "Monthly Plan (Unreserved)", durationDays: 30, amount: 800, isActive: true, branchId, planType: "UNRESERVED" },
      ];
      for (const p of defaultPlans) {
        await mongoClient.feePlan.create({ data: p });
      }
      console.log(`✅ Default fee plans created for branch ${branchId}`);
    }

    // 3. Ensure Seats (A1 to A25)
    const seatCount = await mongoClient.seat.count({
      where: { branchId, deletedAt: null }
    });

    if (seatCount === 0) {
      for (let i = 1; i <= 25; i++) {
        await mongoClient.seat.create({
          data: {
            seatNumber: `A${i}`,
            floor: "1",
            room: "A1",
            section: "A",
            isActive: true,
            isOccupied: false,
            branchId
          }
        });
      }
      console.log(`✅ 25 default seats (A1-A25) created for branch ${branchId}`);
    }

    // 4. Ensure Global / Branch Payment Modes
    const paymentModeCount = await mongoClient.paymentMode.count({
      where: { isActive: true, deletedAt: null }
    });

    if (paymentModeCount === 0) {
      await mongoClient.paymentMode.create({ data: { modeName: "Cash", isActive: true, branchId: null } });
      await mongoClient.paymentMode.create({ data: { modeName: "UPI", isActive: true, branchId: null } });
      await mongoClient.paymentMode.create({ data: { modeName: "Card", isActive: true, branchId: null } });
      console.log(`✅ Global payment modes created`);
    }

  } catch (error) {
    console.error(`⚠️ Error in ensureBranchDefaults for branch ${branchId}:`, error.message);
  }
};

module.exports = { ensureBranchDefaults };
