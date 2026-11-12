import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';

if (!process.env.RESEND_API_KEY) process.env.RESEND_API_KEY = 're_test_dummy';

const require = createRequire(import.meta.url);
const dbPath = require.resolve('../../../../backend/src/config/db');
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { connectDB: async () => ({}), getMongoUri: () => 'mongodb://127.0.0.1:27017/test' },
};
const mongoClient = require('../../../../backend/src/config/mongoClient');
const cache = require('../../../../backend/src/utils/cache');
const dashboardController = require('../../../../backend/src/controllers/dashboard.controller');
const { getISTTimeParts, addDaysToYmd } = require('../../../../backend/src/utils/format');
const { createPayment, recordPayment } = require('../../../../backend/src/controllers/payment.controller');
const { autoSuspendExpiredStudents, resetAutoSuspendThrottle } = require('../../../../backend/src/controllers/student.controller');

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe('payment & reactivation regression tests', () => {
  const todayYmd = getISTTimeParts().ymd;
  const futureEndYmd = addDaysToYmd(todayYmd, 15);
  const expiredEndYmd = addDaysToYmd(todayYmd, -12);
  const oldStartYmd = addDaysToYmd(todayYmd, -40);

  let invalidateBranchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    resetAutoSuspendThrottle();
    invalidateBranchSpy = vi.spyOn(cache, 'invalidateBranch').mockImplementation(() => {});
    vi.spyOn(dashboardController, 'clearStatsCache').mockImplementation(() => {});
    vi.spyOn(mongoClient.auditLog, 'create').mockResolvedValue({ id: 999 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reactivates a SUSPENDED student when pending due is cleared on an unexpired plan', async () => {
    const validityDoc = {
      id: 10,
      studentId: 101,
      feePlanId: 5,
      startDate: new Date(`${addDaysToYmd(todayYmd, -14)}T00:00:00+05:30`),
      endDate: new Date(`${futureEndYmd}T00:00:00+05:30`),
      lastRenewedAt: null,
      totalAmount: 1000,
      accessType: 'UNRESERVED',
      student: {
        id: 101,
        branchId: 1,
        accountStatus: 'SUSPENDED',
      },
    };

    vi.spyOn(mongoClient.studentValidity, 'findFirst').mockResolvedValue(validityDoc);
    vi.spyOn(mongoClient.paymentMode, 'findFirst').mockResolvedValue({ id: 1, modeName: 'Cash', isActive: true });

    const studentUpdateSpy = vi.fn().mockResolvedValue({ id: 101, accountStatus: 'ACTIVE' });
    const validityUpdateSpy = vi.fn();

    vi.spyOn(mongoClient, '$transaction').mockImplementation(async (fn) => {
      const tx = {
        payment: {
          create: vi.fn().mockResolvedValue({
            id: 501,
            validityId: 10,
            paymentModeId: 1,
            invoiceNo: 'INV-DUE-1',
            amountReceived: 400,
            paymentDate: new Date(),
            remarks: 'Due cleared',
          }),
          findMany: vi.fn().mockResolvedValue([
            { id: 500, amountReceived: 600 },
            { id: 501, amountReceived: 400 },
          ]),
        },
        feePlan: {
          findFirst: vi.fn().mockResolvedValue({ id: 5, amount: 1000, durationDays: 30, branchId: 1 }),
        },
        studentShiftAssignment: {
          findMany: vi.fn().mockResolvedValue([{ id: 1, shiftId: 1, seatId: null, previousSeatId: null }]),
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn().mockResolvedValue({}),
        },
        seat: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        studentValidity: {
          update: validityUpdateSpy,
        },
        student: {
          update: studentUpdateSpy,
        },
      };
      return fn(tx);
    });

    const req = {
      user: { id: 1, branchId: 1 },
      body: {
        validity_id: 10,
        payment_mode_id: 1,
        invoice_no: 'INV-DUE-1',
        amount_received: 400,
        payment_type: 'fee',
      },
    };
    const res = makeRes();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(validityUpdateSpy).not.toHaveBeenCalled();
    expect(studentUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 101 },
        data: expect.objectContaining({ accountStatus: 'ACTIVE' }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          is_renewal: false,
          reactivated: true,
          plan_expired: false,
          due_remaining: 0,
          account_status: 'ACTIVE',
        }),
      })
    );
    expect(invalidateBranchSpy).toHaveBeenCalledWith(1);
  });

  it('extends expired validity and reactivates INACTIVE student when paying due + renewal together', async () => {
    const validityDoc = {
      id: 11,
      studentId: 102,
      feePlanId: 5,
      startDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
      endDate: new Date(`${expiredEndYmd}T00:00:00+05:30`),
      lastRenewedAt: null,
      totalAmount: 1000,
      accessType: 'RESERVED',
      student: {
        id: 102,
        branchId: 1,
        accountStatus: 'INACTIVE',
      },
    };

    vi.spyOn(mongoClient.studentValidity, 'findFirst').mockResolvedValue(validityDoc);
    vi.spyOn(mongoClient.paymentMode, 'findFirst').mockResolvedValue({ id: 2, modeName: 'UPI', isActive: true });

    const studentUpdateSpy = vi.fn().mockResolvedValue({ id: 102, accountStatus: 'ACTIVE' });
    const validityUpdateSpy = vi.fn().mockResolvedValue({ id: 11 });

    vi.spyOn(mongoClient, '$transaction').mockImplementation(async (fn) => {
      const tx = {
        payment: {
          create: vi.fn().mockResolvedValue({
            id: 502,
            validityId: 11,
            paymentModeId: 2,
            invoiceNo: 'INV-COMB-1',
            amountReceived: 1300,
            paymentDate: new Date(),
            remarks: 'Due + renewal',
          }),
          findMany: vi.fn().mockResolvedValue([
            { id: 500, amountReceived: 700 },
            { id: 502, amountReceived: 1300 },
          ]),
        },
        feePlan: {
          findFirst: vi.fn().mockResolvedValue({ id: 5, amount: 1000, durationDays: 30, branchId: 1 }),
        },
        studentShiftAssignment: {
          findMany: vi.fn().mockResolvedValue([{ id: 1, shiftId: 1, seatId: null, previousSeatId: null }]),
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn().mockResolvedValue({}),
        },
        seat: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        studentValidity: {
          update: validityUpdateSpy,
        },
        student: {
          update: studentUpdateSpy,
        },
      };
      return fn(tx);
    });

    const req = {
      user: { id: 1, branchId: 1 },
      body: {
        validity_id: 11,
        payment_mode_id: 2,
        invoice_no: 'INV-COMB-1',
        amount_received: 1300,
        renew_plan: true,
      },
    };
    const res = makeRes();

    await createPayment(req, res);

    const expectedNewEndYmd = addDaysToYmd(todayYmd, 29);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(validityUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 11 },
        data: expect.objectContaining({
          totalAmount: 2000,
          endDate: new Date(`${expectedNewEndYmd}T23:59:59.999+05:30`),
          lastRenewedAt: new Date(`${todayYmd}T00:00:00+05:30`),
        }),
      })
    );
    expect(studentUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 102 },
        data: expect.objectContaining({ accountStatus: 'ACTIVE' }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          is_renewal: true,
          reactivated: true,
          plan_expired: false,
          due_remaining: 0,
          end_date: expectedNewEndYmd,
          account_status: 'ACTIVE',
        }),
      })
    );
  });

  it('does NOT reactivate when plan is expired and payment only covers old pending due', async () => {
    const validityDoc = {
      id: 12,
      studentId: 103,
      feePlanId: 5,
      startDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
      endDate: new Date(`${expiredEndYmd}T00:00:00+05:30`),
      lastRenewedAt: null,
      totalAmount: 1000,
      accessType: 'UNRESERVED',
      student: {
        id: 103,
        branchId: 1,
        accountStatus: 'SUSPENDED',
      },
    };

    vi.spyOn(mongoClient.studentValidity, 'findFirst').mockResolvedValue(validityDoc);
    vi.spyOn(mongoClient.paymentMode, 'findFirst').mockResolvedValue({ id: 1, modeName: 'Cash', isActive: true });

    const studentUpdateSpy = vi.fn();

    vi.spyOn(mongoClient, '$transaction').mockImplementation(async (fn) => {
      const tx = {
        payment: {
          create: vi.fn().mockResolvedValue({
            id: 503,
            validityId: 12,
            paymentModeId: 1,
            invoiceNo: 'INV-EXP-DUE',
            amountReceived: 300,
            paymentDate: new Date(),
            remarks: 'Due only',
          }),
          findMany: vi.fn().mockResolvedValue([
            { id: 500, amountReceived: 700 },
            { id: 503, amountReceived: 300 },
          ]),
        },
        feePlan: {
          findFirst: vi.fn().mockResolvedValue({ id: 5, amount: 1000, durationDays: 30, branchId: 1 }),
        },
        studentShiftAssignment: {
          findMany: vi.fn().mockResolvedValue([{ id: 1 }]),
        },
        studentValidity: { update: vi.fn() },
        student: { update: studentUpdateSpy },
      };
      return fn(tx);
    });

    const req = {
      user: { id: 1, branchId: 1 },
      body: {
        validity_id: 12,
        payment_mode_id: 1,
        invoice_no: 'INV-EXP-DUE',
        amount_received: 300,
        renew_plan: false,
      },
    };
    const res = makeRes();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(studentUpdateSpy).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          reactivated: false,
          plan_expired: true,
          due_remaining: 0,
          account_status: 'SUSPENDED',
        }),
      })
    );
  });

  it('never auto-reactivates manually DISABLED students upon payment', async () => {
    const validityDoc = {
      id: 13,
      studentId: 104,
      feePlanId: 5,
      startDate: new Date(`${todayYmd}T00:00:00+05:30`),
      endDate: new Date(`${futureEndYmd}T00:00:00+05:30`),
      lastRenewedAt: null,
      totalAmount: 1000,
      accessType: 'RESERVED',
      student: {
        id: 104,
        branchId: 1,
        accountStatus: 'DISABLED',
      },
    };

    vi.spyOn(mongoClient.studentValidity, 'findFirst').mockResolvedValue(validityDoc);
    vi.spyOn(mongoClient.paymentMode, 'findFirst').mockResolvedValue({ id: 1, modeName: 'Cash', isActive: true });

    const studentUpdateSpy = vi.fn();

    vi.spyOn(mongoClient, '$transaction').mockImplementation(async (fn) => {
      const tx = {
        payment: {
          create: vi.fn().mockResolvedValue({
            id: 504,
            validityId: 13,
            paymentModeId: 1,
            invoiceNo: 'INV-DIS-1',
            amountReceived: 1000,
            paymentDate: new Date(),
          }),
          findMany: vi.fn().mockResolvedValue([{ id: 504, amountReceived: 1000 }]),
        },
        feePlan: {
          findFirst: vi.fn().mockResolvedValue({ id: 5, amount: 1000, durationDays: 30, branchId: 1 }),
        },
        studentShiftAssignment: { findMany: vi.fn().mockResolvedValue([{ id: 1 }]) },
        studentValidity: { update: vi.fn() },
        student: { update: studentUpdateSpy },
      };
      return fn(tx);
    });

    const req = {
      user: { id: 1, branchId: 1 },
      body: {
        validity_id: 13,
        payment_mode_id: 1,
        invoice_no: 'INV-DIS-1',
        amount_received: 1000,
      },
    };
    const res = makeRes();

    await createPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(studentUpdateSpy).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reactivated: false,
          account_status: 'DISABLED',
        }),
      })
    );
  });

  it('recordPayment reactivates existingValidity SUSPENDED student and invalidates cache', async () => {
    vi.spyOn(mongoClient.student, 'findFirst').mockResolvedValue({
      id: 105,
      branchId: 2,
      fullName: 'Ravi Kumar',
      studentCode: 'STD00105',
      accountStatus: 'SUSPENDED',
    });
    vi.spyOn(mongoClient.feePlan, 'findFirst').mockResolvedValue({
      id: 5,
      planName: 'Monthly',
      amount: 1000,
      durationDays: 30,
      isActive: true,
    });
    vi.spyOn(mongoClient.paymentMode, 'findFirst').mockResolvedValue({ id: 1, isActive: true });
    vi.spyOn(mongoClient.studentValidity, 'findUnique').mockResolvedValue({
      id: 14,
      studentId: 105,
      feePlanId: 5,
      startDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
      endDate: new Date(`${expiredEndYmd}T00:00:00+05:30`),
      totalAmount: 1000,
      accessType: 'UNRESERVED',
    });

    const studentUpdateSpy = vi.fn().mockResolvedValue({ id: 105, accountStatus: 'ACTIVE' });
    const validityUpdateSpy = vi.fn().mockResolvedValue({ id: 14 });

    vi.spyOn(mongoClient, '$transaction').mockImplementation(async (fn) => {
      const tx = {
        payment: {
          create: vi.fn().mockResolvedValue({
            id: 505,
            validityId: 14,
            paymentModeId: 1,
            invoiceNo: 'INV-REC-1',
            amountReceived: 1000,
            paymentDate: new Date(),
          }),
          findMany: vi.fn().mockResolvedValue([
            { id: 500, amountReceived: 1000 },
            { id: 505, amountReceived: 1000 },
          ]),
        },
        feePlan: {
          findFirst: vi.fn().mockResolvedValue({ id: 5, amount: 1000, durationDays: 30, branchId: 2 }),
        },
        studentShiftAssignment: { findMany: vi.fn().mockResolvedValue([{ id: 1 }]) },
        studentValidity: { update: validityUpdateSpy },
        student: { update: studentUpdateSpy },
      };
      return fn(tx);
    });

    const req = {
      user: { id: 1, branchId: 2 },
      body: {
        student_id: 105,
        fee_plan_id: 5,
        start_date: todayYmd,
        payment_mode_id: 1,
        invoice_no: 'INV-REC-1',
        amount_received: 1000,
      },
    };
    const res = makeRes();

    await recordPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(validityUpdateSpy).toHaveBeenCalled();
    expect(studentUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 105 },
        data: expect.objectContaining({ accountStatus: 'ACTIVE' }),
      })
    );
    expect(invalidateBranchSpy).toHaveBeenCalledWith(2);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reactivated: true,
          is_renewal: true,
          account_status: 'ACTIVE',
        }),
      })
    );
  });

  it('autoSuspendExpiredStudents reactivates cleared students, respects lastRenewedAt grace period, and avoids duplicate suspension logs', async () => {
    const mockStudents = [
      // 1. SUSPENDED student whose due is cleared & plan unexpired -> should AUTO_REACTIVATE
      {
        id: 201,
        branchId: 1,
        accountStatus: 'SUSPENDED',
        admissionDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
        validities: [
          {
            startDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
            endDate: new Date(`${futureEndYmd}T00:00:00+05:30`),
            lastRenewedAt: new Date(`${todayYmd}T00:00:00+05:30`),
            totalAmount: 2000,
            payments: [{ amountReceived: 2000 }],
          },
        ],
      },
      // 2. ACTIVE student recently renewed with partial due (lastRenewedAt = today, startDate = 40d ago) -> stays ACTIVE
      {
        id: 202,
        branchId: 1,
        accountStatus: 'ACTIVE',
        admissionDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
        validities: [
          {
            startDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
            endDate: new Date(`${futureEndYmd}T00:00:00+05:30`),
            lastRenewedAt: new Date(`${todayYmd}T00:00:00+05:30`),
            totalAmount: 2000,
            payments: [{ amountReceived: 1500 }],
          },
        ],
      },
      // 3. Already SUSPENDED student expired 12d ago -> should NOT trigger duplicate update
      {
        id: 203,
        branchId: 1,
        accountStatus: 'SUSPENDED',
        admissionDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
        validities: [
          {
            startDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
            endDate: new Date(`${expiredEndYmd}T00:00:00+05:30`),
            lastRenewedAt: null,
            totalAmount: 1000,
            payments: [{ amountReceived: 1000 }],
          },
        ],
      },
    ];

    vi.spyOn(mongoClient.student, 'findMany').mockImplementation(async ({ where }) => {
      if (where?.accountStatus?.in?.includes('ACTIVE')) return mockStudents;
      return [];
    });
    const updateManySpy = vi.spyOn(mongoClient.student, 'updateMany').mockResolvedValue({ count: 1 });

    await autoSuspendExpiredStudents(1, { force: true });

    expect(updateManySpy).toHaveBeenCalledTimes(1);
    expect(updateManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [201] } },
        data: expect.objectContaining({ accountStatus: 'ACTIVE' }),
      })
    );
  });
});
