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

const mongoClient = require('../../../../backend/src/config/mongoClient');
const userController = require('../../../../backend/src/controllers/user.controller');

describe('Subscription Queued Plan Switch & Auto-Activation Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully activates pendingTier manually via activatePendingPlan', async () => {
    const mockUser = {
      id: 99,
      email: 'owner@test.com',
      role: 'OWNER',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: new Date(Date.now() + 10 * 86400000), // 10 days left
      pendingTier: 'PRO',
      pendingExpiryDays: 30,
    };

    let updatedData = null;
    vi.spyOn(mongoClient.user, 'findUnique').mockResolvedValue(mockUser);
    vi.spyOn(mongoClient.user, 'update').mockImplementation(async ({ data }) => {
      updatedData = data;
      return { ...mockUser, ...data };
    });
    vi.spyOn(mongoClient.securityEvent, 'create').mockResolvedValue({ id: 1 });

    const req = {
      user: { id: 99, role: 'OWNER' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Vitest' },
    };

    let resData = null;
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        resData = data;
        return res;
      },
    };

    await userController.activatePendingPlan(req, res);

    expect(statusCode).toBe(200);
    expect(resData.success).toBe(true);
    expect(resData.subscriptionTier).toBe('PRO');
    expect(resData.pendingTier).toBeNull();
    expect(resData.pendingExpiryDays).toBeNull();

    // Verify DB update
    expect(updatedData.subscriptionTier).toBe('PRO');
    expect(updatedData.pendingTier).toBeNull();
    expect(updatedData.pendingExpiryDays).toBeNull();
    // Expiry should be around 30 days from now
    const diffDays = Math.round((new Date(updatedData.subscriptionExpiry) - new Date()) / 86400000);
    expect(diffDays).toBe(30);
  });

  it('rejects activation when no pending plan is queued', async () => {
    const mockUser = {
      id: 99,
      email: 'owner@test.com',
      role: 'OWNER',
      subscriptionTier: 'PRO',
      subscriptionExpiry: new Date(Date.now() + 10 * 86400000),
      pendingTier: null,
      pendingExpiryDays: null,
    };

    vi.spyOn(mongoClient.user, 'findUnique').mockResolvedValue(mockUser);

    const req = { user: { id: 99, role: 'OWNER' } };
    let resData = null;
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        resData = data;
        return res;
      },
    };

    await userController.activatePendingPlan(req, res);

    expect(statusCode).toBe(400);
    expect(resData.success).toBe(false);
    expect(resData.message).toContain('No pending plan found');
  });

  it('rejects activation when user role is not OWNER', async () => {
    const req = { user: { id: 5, role: 'STAFF' } };
    let resData = null;
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        resData = data;
        return res;
      },
    };

    await userController.activatePendingPlan(req, res);

    expect(statusCode).toBe(403);
    expect(resData.success).toBe(false);
  });

  it('auto-activates pendingTier when existing plan has expired on getProfile', async () => {
    const expiredDate = new Date(Date.now() - 2 * 86400000); // expired 2 days ago
    const mockExpiredUser = {
      id: 101,
      name: 'Owner Expiry Test',
      email: 'expired_owner@test.com',
      role: 'OWNER',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: expiredDate,
      pendingTier: 'PRO',
      pendingExpiryDays: 30,
      isActive: true,
      branchId: 1,
      branch: { id: 1, name: 'Main Branch', code: 'LB100001', admissionToken: 'adm_123', attendanceToken: 'att_123' },
    };

    let activatedData = null;
    vi.spyOn(mongoClient.user, 'findFirst').mockResolvedValue(mockExpiredUser);
    vi.spyOn(mongoClient.user, 'updateMany').mockImplementation(async ({ data }) => {
      activatedData = data;
      return { count: 1 };
    });

    const req = { user: { id: 101, email: 'expired_owner@test.com', role: 'OWNER' } };
    let resData = null;
    const res = {
      status: () => res,
      json: (data) => {
        resData = data;
        return res;
      },
    };

    await userController.getProfile(req, res);

    expect(resData.success).toBe(true);
    expect(resData.data.subscriptionTier).toBe('PRO');
    expect(resData.data.pendingTier).toBeNull();
    expect(activatedData).not.toBeNull();
    expect(activatedData.subscriptionTier).toBe('PRO');
    expect(activatedData.pendingTier).toBeNull();
  });

  it('staff getProfile auto-activates owner pending plan if owner plan has expired', async () => {
    const expiredDate = new Date(Date.now() - 2 * 86400000);
    const mockStaffUser = {
      id: 202,
      name: 'Staff Test',
      email: 'staff@test.com',
      role: 'STAFF',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: null,
      pendingTier: null,
      pendingExpiryDays: null,
      isActive: true,
      branchId: 1,
      branch: { id: 1, name: 'Main Branch', code: 'LB100001', admissionToken: 'adm_123', attendanceToken: 'att_123' },
    };

    const mockOwnerUser = {
      id: 101,
      name: 'Owner Test',
      email: 'owner@test.com',
      role: 'OWNER',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: expiredDate,
      pendingTier: 'PRO',
      pendingExpiryDays: 30,
      isActive: true,
      branchId: 1,
    };

    let activatedData = null;
    vi.spyOn(mongoClient.user, 'findFirst').mockImplementation(async ({ where }) => {
      if (where.role === 'OWNER') return mockOwnerUser;
      return mockStaffUser;
    });
    vi.spyOn(mongoClient.user, 'updateMany').mockImplementation(async ({ data }) => {
      activatedData = data;
      return { count: 1 };
    });

    const req = { user: { id: 202, email: 'staff@test.com', role: 'STAFF' } };
    let resData = null;
    const res = {
      status: () => res,
      json: (data) => {
        resData = data;
        return res;
      },
    };

    await userController.getProfile(req, res);

    expect(resData.success).toBe(true);
    expect(resData.data.subscriptionTier).toBe('PRO');
    expect(resData.data.pendingTier).toBeNull();
    expect(activatedData).not.toBeNull();
    expect(activatedData.subscriptionTier).toBe('PRO');
  });

  it('auth middleware blocks staff when owner subscription is expired and has no pending plan', async () => {
    const expiredDate = new Date(Date.now() - 2 * 86400000);
    const mockStaffUser = {
      id: 202,
      name: 'Staff Test',
      email: 'staff@test.com',
      role: 'STAFF',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: null,
      pendingTier: null,
      pendingExpiryDays: null,
      isActive: true,
      branchId: 1,
    };

    const mockOwnerUser = {
      id: 101,
      name: 'Owner Test',
      email: 'owner@test.com',
      role: 'OWNER',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: expiredDate,
      pendingTier: null,
      pendingExpiryDays: null,
      isActive: true,
      branchId: 1,
    };

    const authMiddleware = require('../../../../backend/src/middleware/auth');
    const authUtil = require('../../../../backend/src/utils/auth');

    vi.spyOn(authUtil, 'verifyToken').mockReturnValue({ id: 202, email: 'staff@test.com', role: 'STAFF', deviceId: 'dev_123' });
    vi.spyOn(mongoClient.user, 'findFirst').mockImplementation(async ({ where }) => {
      if (where.role === 'OWNER') return mockOwnerUser;
      return mockStaffUser;
    });
    vi.spyOn(mongoClient.userSession, 'findFirst').mockResolvedValue({ id: 1, isActive: true });
    vi.spyOn(mongoClient.userSession, 'findUnique').mockResolvedValue({ id: 1, isActive: true });

    const req = {
      method: 'GET',
      path: '/students',
      originalUrl: '/api/students',
      headers: { authorization: 'Bearer dummy_token' },
    };
    let statusCode = null;
    let resData = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        resData = data;
        return res;
      },
    };
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(403);
    expect(resData.code).toBe('SUBSCRIPTION_EXPIRED');
    expect(resData.message).toContain('Please contact the library owner to renew');
  });
});
