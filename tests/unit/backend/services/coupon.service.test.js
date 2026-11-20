import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dbPath = require.resolve('../../../../backend/src/config/db');
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { connectDB: async () => ({}), getMongoUri: () => 'mongodb://127.0.0.1:27017/test' },
};

const models = require('../../../../backend/src/models');
const couponService = require('../../../../backend/src/services/coupon.service');

describe('Admin & Staff Cross-Coupon Validity Unit Tests', () => {
  const mockAdminUser = {
    id: 1,
    name: 'Admin Library Owner',
    email: 'admin@library.com',
    role: 'OWNER',
    branchId: 1,
    isActive: true,
    deletedAt: null,
  };

  const mockStaffUser = {
    id: 5,
    name: 'Staff Member 1',
    email: 'staff1@library.com',
    role: 'STAFF',
    branchId: 1,
    isActive: true,
    deletedAt: null,
  };

  const mockOtherBranchOwner = {
    id: 99,
    name: 'Other Branch Owner',
    email: 'other@library.com',
    role: 'OWNER',
    branchId: 2,
    isActive: true,
    deletedAt: null,
  };

  let couponUsageStore = [];

  beforeEach(() => {
    vi.restoreAllMocks();
    couponUsageStore = [];

    // Mock User queries
    vi.spyOn(models.User, 'findOne').mockImplementation((query) => {
      return {
        lean: () => {
          if (query.id === 1) return mockAdminUser;
          if (query.id === 5) return mockStaffUser;
          if (query.id === 99) return mockOtherBranchOwner;
          if (query.role === 'OWNER' && query.branchId === 1) return mockAdminUser;
          if (query.role === 'OWNER' && query.branchId === 2) return mockOtherBranchOwner;
          return null;
        },
        select: () => ({
          lean: () => {
            if (query.id === 1) return { branchId: 1 };
            if (query.id === 5) return { branchId: 1 };
            if (query.id === 99) return { branchId: 2 };
            return null;
          }
        }),
      };
    });

    vi.spyOn(models.User, 'find').mockImplementation((query) => {
      return {
        select: () => ({
          lean: () => {
            if (query.branchId === 1) return [{ id: 1 }, { id: 5 }];
            if (query.branchId === 2) return [{ id: 99 }];
            return [];
          },
        }),
      };
    });

    // Mock CouponUsage queries
    vi.spyOn(models.CouponUsage, 'countDocuments').mockImplementation(async (query) => {
      const targetCodes = ['PRO1', 'PRO', 'SPECIAL1'];
      const matches = couponUsageStore.filter((record) => {
        const codeMatches = targetCodes.includes(record.couponCode);
        if (!codeMatches) return false;

        if (query.$or) {
          const userMatch = query.$or.some((c) => {
            if (c.userId && c.userId.$in) return c.userId.$in.includes(record.userId);
            if (c.branchId) return c.branchId === record.branchId;
            return false;
          });
          return userMatch;
        }

        if (query.userId) return record.userId === query.userId;
        if (query.branchId) return record.branchId === query.branchId;
        return false;
      });

      return matches.length;
    });

    vi.spyOn(models.CouponUsage, 'create').mockImplementation(async (data) => {
      const record = { id: couponUsageStore.length + 1, ...data };
      couponUsageStore.push(record);
      return record;
    });
  });

  it('allows coupon validation when neither Admin nor Staff has used the coupon', async () => {
    const adminCheck = await couponService.validateCoupon(1, 'PRO1', 'PRO');
    expect(adminCheck.valid).toBe(true);
    expect(adminCheck.couponCode).toBe('PRO1');

    const staffCheck = await couponService.validateCoupon(5, 'PRO1', 'PRO');
    expect(staffCheck.valid).toBe(true);
    expect(staffCheck.couponCode).toBe('PRO1');
  });

  it('prevents Staff from using a coupon if Admin has already redeemed it', async () => {
    // Admin redeems PRO1 coupon
    await couponService.recordCouponUsage(1, 'PRO1', 'PRO', 1, 1);

    // Verify Admin has used it
    const adminStatus = await couponService.hasUserUsedCoupon(1, 'PRO1');
    expect(adminStatus).toBe(true);

    // Now Staff tries to validate or use the same coupon
    const staffStatus = await couponService.hasUserUsedCoupon(5, 'PRO1');
    expect(staffStatus).toBe(true);

    const staffValidation = await couponService.validateCoupon(5, 'PRO1', 'PRO');
    expect(staffValidation.valid).toBe(false);
    expect(staffValidation.alreadyUsed).toBe(true);
    expect(staffValidation.message).toContain('already been redeemed by your library account');
  });

  it('prevents Admin from using a coupon if Staff has already redeemed it (vice versa)', async () => {
    // Staff redeems PRO1 coupon
    await couponService.recordCouponUsage(5, 'PRO1', 'PRO', 1, 1);

    // Verify Staff has used it
    const staffStatus = await couponService.hasUserUsedCoupon(5, 'PRO1');
    expect(staffStatus).toBe(true);

    // Now Admin tries to validate or use the same coupon
    const adminStatus = await couponService.hasUserUsedCoupon(1, 'PRO1');
    expect(adminStatus).toBe(true);

    const adminValidation = await couponService.validateCoupon(1, 'PRO1', 'PRO');
    expect(adminValidation.valid).toBe(false);
    expect(adminValidation.alreadyUsed).toBe(true);
    expect(adminValidation.message).toContain('already been redeemed by your library account');
  });

  it('does NOT block another independent library branch from using the coupon', async () => {
    // Library branch 1 uses the coupon
    await couponService.recordCouponUsage(1, 'PRO1', 'PRO', 1, 1);

    // Library branch 2 owner checks coupon
    const otherOwnerStatus = await couponService.hasUserUsedCoupon(99, 'PRO1');
    expect(otherOwnerStatus).toBe(false);

    const otherOwnerValidation = await couponService.validateCoupon(99, 'PRO1', 'PRO');
    expect(otherOwnerValidation.valid).toBe(true);
  });

  it('validateCouponEndpoint correctly reports alreadyUsed: true when cross-redeemed', async () => {
    const razorpayController = require('../../../../backend/src/controllers/razorpay.controller');

    // Admin redeems coupon
    await couponService.recordCouponUsage(1, 'PRO1', 'PRO', 1, 1);

    // Staff calls endpoint
    const req = {
      user: { id: 5, role: 'STAFF', branchId: 1 },
      body: { couponCode: 'PRO1', tier: 'PRO', billing: 'quarterly' },
    };
    let resData = null;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: (data) => {
        resData = data;
        return res;
      },
    };

    await razorpayController.validateCouponEndpoint(req, res);

    expect(resData.success).toBe(false);
    expect(resData.alreadyUsed).toBe(true);
    expect(resData.message).toContain('already been redeemed by your library account');
  });
});
