import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';
import {
  DERIVED_STATUS,
  canManuallyActivateMember,
  getMemberActionButtonMode,
  getStudentStatus,
  getDerivedStatus,
  getStatusCounts,
  filterStudentsList,
  getGraceExpiredInfo,
} from '../../../../frontend/src/utils/studentStatus.js';

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
const { getISTTimeParts, addDaysToYmd } = require('../../../../backend/src/utils/format');
const { evaluateStudentLifecycle } = require('../../../../backend/src/utils/studentStatus');
const {
  autoSuspendExpiredStudents,
  resetAutoSuspendThrottle,
  updateStudent,
} = require('../../../../backend/src/controllers/student.controller');
const dashboardController = require('../../../../backend/src/controllers/dashboard.controller');
const { createPayment } = require('../../../../backend/src/controllers/payment.controller');
const { checkIn, publicCheckInOrOut } = require('../../../../backend/src/controllers/attendance.controller');

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe('Two-Layer Status, Attendance Block & Seat Lifecycle workflow', () => {
  const todayYmd = getISTTimeParts().ymd;
  const futureEndYmd = addDaysToYmd(todayYmd, 15);
  const grace5Ymd = addDaysToYmd(todayYmd, -5);
  const grace10Ymd = addDaysToYmd(todayYmd, -10);
  const overdue11Ymd = addDaysToYmd(todayYmd, -11);
  const overdue21Ymd = addDaysToYmd(todayYmd, -21);
  const oldStartYmd = addDaysToYmd(todayYmd, -40);

  beforeEach(() => {
    vi.restoreAllMocks();
    resetAutoSuspendThrottle();
    dashboardController.clearStatsCache();
    vi.spyOn(cache, 'invalidateBranch').mockImplementation(() => {});
    vi.spyOn(mongoClient.auditLog, 'create').mockResolvedValue({ id: 999 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Fix #5: evaluates Day 0 until 23:59:59.999 IST as EXPIRING_SOON and next day 00:00:00 IST as EXPIRED_GRACE', () => {
    const endYmd = '2026-06-15';
    const nextYmd = '2026-06-16';
    const student = {
      id: 500,
      accountStatus: 'ACTIVE',
      validities: [
        {
          startDate: new Date('2026-05-17T00:00:00+05:30'),
          endDate: new Date(`${endYmd}T23:59:59.999+05:30`),
          totalAmount: 1000,
          payments: [{ amountReceived: 1000 }],
        },
      ],
    };

    const day0BeforeMidnight = evaluateStudentLifecycle(student, new Date(`${endYmd}T23:59:58+05:30`));
    expect(day0BeforeMidnight.isExpired).toBe(false);
    expect(day0BeforeMidnight.daysRemaining).toBe(0);
    expect(day0BeforeMidnight.derivedStatus).toBe('EXPIRING_SOON');
    expect(day0BeforeMidnight.targetAccountStatus).toBe('ACTIVE');

    const day1AfterMidnight = evaluateStudentLifecycle(student, new Date(`${nextYmd}T00:00:01+05:30`));
    expect(day1AfterMidnight.isExpired).toBe(true);
    expect(day1AfterMidnight.daysOverdue).toBe(1);
    expect(day1AfterMidnight.derivedStatus).toBe('EXPIRED_GRACE');
    expect(day1AfterMidnight.targetAccountStatus).toBe('ACTIVE');
  });

  it('Fix #1 & #3: keeps 1-10d expired students ACTIVE, suspends on day 11+, inactivates on day 21+ with explicit seatId=null release', async () => {
    const updateManySpy = vi.spyOn(mongoClient.student, 'updateMany').mockResolvedValue({ count: 1 });
    const shiftUpdateSpy = vi.spyOn(mongoClient.studentShiftAssignment, 'update').mockResolvedValue({});
    vi.spyOn(mongoClient.studentValidity, 'findMany').mockResolvedValue([{ id: 703, studentId: 103 }]);
    vi.spyOn(mongoClient.studentShiftAssignment, 'findMany').mockResolvedValue([
      { id: 803, validityId: 703, shiftId: 1, seatId: 12, assignmentStatus: 'ACTIVE' },
    ]);
    vi.spyOn(mongoClient.student, 'findMany').mockImplementation(async ({ where }) => {
      if (where?.accountStatus?.in?.includes('ACTIVE')) {
        return [
          {
            id: 101,
            branchId: 1,
            accountStatus: 'ACTIVE',
            admissionDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
            validities: [{ startDate: new Date(`${oldStartYmd}T00:00:00+05:30`), endDate: new Date(`${grace10Ymd}T23:59:59.999+05:30`), totalAmount: 1000, payments: [{ amountReceived: 1000 }] }],
          },
          {
            id: 102,
            branchId: 1,
            accountStatus: 'ACTIVE',
            admissionDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
            validities: [{ startDate: new Date(`${oldStartYmd}T00:00:00+05:30`), endDate: new Date(`${overdue11Ymd}T23:59:59.999+05:30`), totalAmount: 1000, payments: [{ amountReceived: 1000 }] }],
          },
          {
            id: 103,
            branchId: 1,
            accountStatus: 'SUSPENDED',
            admissionDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
            validities: [{ startDate: new Date(`${oldStartYmd}T00:00:00+05:30`), endDate: new Date(`${overdue21Ymd}T23:59:59.999+05:30`), totalAmount: 1000, payments: [{ amountReceived: 1000 }] }],
          },
        ];
      }
      return [];
    });

    await autoSuspendExpiredStudents(1, { force: true });

    expect(updateManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [102] } },
        data: expect.objectContaining({ accountStatus: 'SUSPENDED' }),
      })
    );
    expect(shiftUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 803 },
        data: expect.objectContaining({
          seatId: null,
          previousSeatId: 12,
          seatReleasedAt: expect.any(Date),
        }),
      })
    );
    expect(updateManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [103] } },
        data: expect.objectContaining({ accountStatus: 'INACTIVE' }),
      })
    );
  });

  it('releases seatId=null explicitly when admin manually disables a student via updateStudent', async () => {
    vi.spyOn(mongoClient.student, 'findFirst').mockImplementation(async ({ where }) => {
      if (where?.id === 210) {
        return {
          id: 210,
          branchId: 1,
          studentCode: 'STD210',
          fullName: 'Disabled Member',
          email: 'd@example.com',
          mobile: '9999999999',
          gender: 'MALE',
          accountStatus: 'ACTIVE',
        };
      }
      return null;
    });
    vi.spyOn(mongoClient.student, 'findMany').mockResolvedValue([]);
    vi.spyOn(mongoClient.studentValidity, 'findMany').mockResolvedValue([{ id: 910, studentId: 210 }]);
    vi.spyOn(mongoClient.studentShiftAssignment, 'findMany').mockResolvedValue([
      { id: 920, validityId: 910, shiftId: 1, seatId: 25, assignmentStatus: 'ACTIVE' },
    ]);
    const shiftUpdateSpy = vi.spyOn(mongoClient.studentShiftAssignment, 'update').mockResolvedValue({});
    vi.spyOn(mongoClient.student, 'update').mockResolvedValue({
      id: 210,
      branchId: 1,
      studentCode: 'STD210',
      fullName: 'Disabled Member',
      email: 'd@example.com',
      mobile: '9999999999',
      gender: 'MALE',
      accountStatus: 'DISABLED',
    });

    const res = makeRes();
    await updateStudent(
      { user: { id: 1, branchId: 1, role: 'OWNER' }, params: { id: '210' }, body: { account_status: 'DISABLED' } },
      res
    );

    expect(shiftUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 920 },
        data: expect.objectContaining({
          seatId: null,
          previousSeatId: 25,
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ account_status: 'DISABLED' }),
      })
    );
  });

  it('includes 1-10d Grace Period students in Total, Active, and Expired metrics in Overview', async () => {
    const activeRows = [
      {
        id: 1,
        studentCode: 'STD1',
        fullName: 'Active Member',
        mobile: '900001',
        admissionDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
        accountStatus: 'ACTIVE',
        validities: [{ accessType: 'RESERVED', endDate: new Date(`${futureEndYmd}T23:59:59.999+05:30`), totalAmount: 1000, feePlan: { planName: 'Monthly' }, payments: [{ amountReceived: 1000 }] }],
      },
      {
        id: 2,
        studentCode: 'STD2',
        fullName: 'Expired Grace Member',
        mobile: '900002',
        admissionDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
        accountStatus: 'ACTIVE',
        validities: [{ accessType: 'UNRESERVED', endDate: new Date(`${grace5Ymd}T23:59:59.999+05:30`), totalAmount: 1000, feePlan: { planName: 'Monthly' }, payments: [{ amountReceived: 800 }] }],
      },
    ];

    vi.spyOn(mongoClient.student, 'updateMany').mockResolvedValue({ count: 0 });
    vi.spyOn(mongoClient.student, 'count').mockImplementation(async ({ where }) => {
      if (!where.accountStatus) return 3;
      if (where.accountStatus === 'ACTIVE') return 2;
      if (where.accountStatus === 'SUSPENDED') return 1;
      return 0;
    });
    vi.spyOn(mongoClient.payment, 'count').mockResolvedValue(2);
    vi.spyOn(mongoClient.payment, 'aggregate').mockResolvedValue({ _sum: { amountReceived: 1800 } });
    vi.spyOn(mongoClient.attendance, 'findMany').mockResolvedValue([]);
    vi.spyOn(mongoClient.shift, 'count').mockResolvedValue(1);
    vi.spyOn(mongoClient.seat, 'count').mockResolvedValue(10);
    vi.spyOn(mongoClient.studentShiftAssignment, 'count').mockResolvedValue(1);
    vi.spyOn(mongoClient.expense, 'aggregate').mockResolvedValue({ _sum: { amount: 0 } });
    vi.spyOn(mongoClient.student, 'findMany').mockImplementation(async ({ where }) => {
      if (where?.accountStatus?.in?.includes('INACTIVE') && !where?.accountStatus?.in?.includes('ACTIVE')) {
        return [];
      }
      return activeRows;
    });

    const res = makeRes();
    await dashboardController.getDashboardStats({ user: { id: 1, branchId: 1 } }, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          total_students: 3,
          active_students: 2,
          active_validities: 1,
          expired_students: 1,
          expired_students_list: [
            expect.objectContaining({
              id: 2,
              days_overdue: 5,
              due_amount: 200,
              derived_status: 'EXPIRED_GRACE',
            }),
          ],
        }),
      })
    );
  });

  it('Fix #2: allows attendance for Grace Period (ACTIVE) and strictly blocks (403) SUSPENDED, INACTIVE, and DISABLED on checkIn & QR kiosk', async () => {
    vi.spyOn(mongoClient.attendance, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(mongoClient.branch, 'findFirst').mockResolvedValue({ id: 1, isActive: true });

    // 1. Grace period student (10d overdue, DB status ACTIVE) -> ALLOWED
    const graceStudent = {
      id: 77,
      branchId: 1,
      studentCode: 'STD77',
      fullName: 'Grace Student',
      accountStatus: 'ACTIVE',
    };
    const shiftDoc = { id: 1, shiftName: 'All Day', startTime: '00:30:00', endTime: '23:59:00' };
    const graceAssignment = {
      id: 301,
      validityId: 770,
      shiftId: 1,
      assignmentStatus: 'ACTIVE',
      shift: shiftDoc,
      validity: { id: 770, studentId: 77, endDate: new Date(`${grace10Ymd}T23:59:59.999+05:30`), totalAmount: 1000, payments: [], student: graceStudent },
    };

    vi.spyOn(mongoClient.studentShiftAssignment, 'findMany').mockResolvedValue([graceAssignment]);
    vi.spyOn(mongoClient.attendance, 'findMany').mockResolvedValue([]);
    vi.spyOn(mongoClient.attendance, 'findFirst').mockResolvedValue(null);
    vi.spyOn(mongoClient.attendance, 'create').mockImplementation(async ({ data }) => ({ id: 901, ...data }));
    vi.spyOn(mongoClient.student, 'findFirst').mockResolvedValue({
      ...graceStudent,
      validities: [{ id: 770, endDate: new Date(`${grace10Ymd}T23:59:59.999+05:30`), totalAmount: 1000, payments: [], assignments: [graceAssignment] }],
    });

    const staffRes = makeRes();
    await checkIn({ user: { id: 1, branchId: 1 }, body: { student_id: 77, shift_id: 1 } }, staffRes);
    expect(staffRes.status).toHaveBeenCalledWith(201);

    const pubRes = makeRes();
    await publicCheckInOrOut({ body: { studentCodeOrMobile: 'STD77', branchId: 1 } }, pubRes);
    expect(pubRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, action: 'CHECK_IN' }));

    // 2. SUSPENDED, INACTIVE, DISABLED -> ALL BLOCKED with 403
    for (const [idx, blockedStatus] of ['SUSPENDED', 'INACTIVE', 'DISABLED'].entries()) {
      const blockedStudent = {
        id: 80 + idx,
        branchId: 1,
        studentCode: `STD8${idx}`,
        fullName: `${blockedStatus} Student`,
        accountStatus: blockedStatus,
      };
      const endDateRef = blockedStatus === 'INACTIVE' ? overdue21Ymd : overdue11Ymd;
      const blockedAssignment = {
        id: 400 + idx,
        validityId: 800 + idx,
        shiftId: 1,
        assignmentStatus: 'ACTIVE',
        shift: shiftDoc,
        validity: {
          id: 800 + idx,
          studentId: blockedStudent.id,
          endDate: new Date(`${endDateRef}T23:59:59.999+05:30`),
          totalAmount: 1000,
          payments: [],
          student: blockedStudent,
        },
      };

      vi.spyOn(mongoClient.studentShiftAssignment, 'findMany').mockResolvedValue([blockedAssignment]);
      vi.spyOn(mongoClient.student, 'findFirst').mockResolvedValue({
        ...blockedStudent,
        validities: [
          {
            id: 800 + idx,
            endDate: new Date(`${endDateRef}T23:59:59.999+05:30`),
            totalAmount: 1000,
            payments: [],
            assignments: [blockedAssignment],
          },
        ],
      });

      const blockedStaffRes = makeRes();
      await checkIn({ user: { id: 1, branchId: 1 }, body: { student_id: blockedStudent.id, shift_id: 1 } }, blockedStaffRes);
      expect(blockedStaffRes.status).toHaveBeenCalledWith(403);
      expect(blockedStaffRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, code: 'ACCOUNT_BLOCKED', account_status: blockedStatus })
      );

      const blockedPubRes = makeRes();
      await publicCheckInOrOut({ body: { studentCodeOrMobile: blockedStudent.studentCode, branchId: 1 } }, blockedPubRes);
      expect(blockedPubRes.status).toHaveBeenCalledWith(403);
      expect(blockedPubRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, code: 'ACCOUNT_BLOCKED', account_status: blockedStatus })
      );
    }
  });

  it('Fix #4 (Case A - Free Seat): restores previousSeatId when INACTIVE student reactivates and old seat is still free', async () => {
    const validityDoc = {
      id: 91,
      studentId: 910,
      feePlanId: 5,
      startDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
      endDate: new Date(`${overdue21Ymd}T23:59:59.999+05:30`),
      lastRenewedAt: null,
      totalAmount: 1000,
      accessType: 'RESERVED',
      student: { id: 910, branchId: 1, accountStatus: 'INACTIVE' },
    };

    vi.spyOn(mongoClient.studentValidity, 'findFirst').mockResolvedValue(validityDoc);
    vi.spyOn(mongoClient.paymentMode, 'findFirst').mockResolvedValue({ id: 1, isActive: true });

    const assignUpdateSpy = vi.fn().mockResolvedValue({});
    vi.spyOn(mongoClient, '$transaction').mockImplementation(async (fn) => {
      const tx = {
        payment: {
          create: vi.fn().mockResolvedValue({ id: 9, validityId: 91, paymentModeId: 1, invoiceNo: 'INV-FREE', amountReceived: 1000, paymentDate: new Date() }),
          findMany: vi.fn().mockResolvedValue([{ id: 1, amountReceived: 1000 }, { id: 9, amountReceived: 1000 }]),
        },
        feePlan: { findFirst: vi.fn().mockResolvedValue({ id: 5, amount: 1000, durationDays: 30, branchId: 1 }) },
        studentShiftAssignment: {
          findMany: vi.fn().mockResolvedValue([{ id: 55, validityId: 91, shiftId: 1, seatId: null, previousSeatId: 14, assignmentStatus: 'ACTIVE' }]),
          findFirst: vi.fn().mockResolvedValue(null),
          update: assignUpdateSpy,
        },
        seat: {
          findFirst: vi.fn().mockResolvedValue({ id: 14, seatNumber: 'B4', isActive: true }),
        },
        studentValidity: { update: vi.fn().mockResolvedValue({ id: 91 }) },
        student: { update: vi.fn().mockResolvedValue({ id: 910, accountStatus: 'ACTIVE' }) },
      };
      return fn(tx);
    });

    const payRes = makeRes();
    await createPayment(
      { user: { id: 1, branchId: 1 }, body: { validity_id: 91, payment_mode_id: 1, invoice_no: 'INV-FREE', amount_received: 1000, renew_plan: true } },
      payRes
    );

    expect(payRes.status).toHaveBeenCalledWith(201);
    expect(assignUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 55 },
        data: expect.objectContaining({ seatId: 14, previousSeatId: null, seatReleasedAt: null }),
      })
    );
    expect(payRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reactivated: true,
          account_status: 'ACTIVE',
          seat_status: 'REASSIGNED',
          seat_reassignment_required: false,
          restored_seat_number: 'B4',
        }),
      })
    );
  });

  it('Fix #4 (Case B - Occupied Seat): keeps seatId=null (Floating) and returns seat reassignment prompt when old seat was taken', async () => {
    const validityDoc = {
      id: 92,
      studentId: 920,
      feePlanId: 5,
      startDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
      endDate: new Date(`${overdue21Ymd}T23:59:59.999+05:30`),
      lastRenewedAt: null,
      totalAmount: 1000,
      accessType: 'RESERVED',
      student: { id: 920, branchId: 1, accountStatus: 'INACTIVE' },
    };

    vi.spyOn(mongoClient.studentValidity, 'findFirst').mockResolvedValue(validityDoc);
    vi.spyOn(mongoClient.paymentMode, 'findFirst').mockResolvedValue({ id: 1, isActive: true });

    const assignUpdateSpy = vi.fn().mockResolvedValue({});
    vi.spyOn(mongoClient, '$transaction').mockImplementation(async (fn) => {
      const tx = {
        payment: {
          create: vi.fn().mockResolvedValue({ id: 10, validityId: 92, paymentModeId: 1, invoiceNo: 'INV-TAKEN', amountReceived: 1000, paymentDate: new Date() }),
          findMany: vi.fn().mockResolvedValue([{ id: 1, amountReceived: 1000 }, { id: 10, amountReceived: 1000 }]),
        },
        feePlan: { findFirst: vi.fn().mockResolvedValue({ id: 5, amount: 1000, durationDays: 30, branchId: 1 }) },
        studentShiftAssignment: {
          findMany: vi.fn().mockResolvedValue([{ id: 56, validityId: 92, shiftId: 1, seatId: null, previousSeatId: 14, assignmentStatus: 'ACTIVE' }]),
          findFirst: vi.fn().mockResolvedValue({ id: 999, seatId: 14, shiftId: 1 }),
          update: assignUpdateSpy,
        },
        seat: {
          findFirst: vi.fn().mockResolvedValue({ id: 14, seatNumber: 'B4', isActive: true }),
        },
        studentValidity: { update: vi.fn().mockResolvedValue({ id: 92 }) },
        student: { update: vi.fn().mockResolvedValue({ id: 920, accountStatus: 'ACTIVE' }) },
      };
      return fn(tx);
    });

    const payRes = makeRes();
    await createPayment(
      { user: { id: 1, branchId: 1 }, body: { validity_id: 92, payment_mode_id: 1, invoice_no: 'INV-TAKEN', amount_received: 1000, renew_plan: true } },
      payRes
    );

    expect(payRes.status).toHaveBeenCalledWith(201);
    expect(assignUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 56 },
        data: expect.objectContaining({ seatId: null, previousSeatId: null }),
      })
    );
    expect(payRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reactivated: true,
          account_status: 'ACTIVE',
          seat_status: 'OCCUPIED_FLOATING',
          seat_reassignment_required: true,
          restored_seat_number: null,
          previous_seat_number: 'B4',
          seat_prompt: 'Seat was reassigned. Please allocate a new seat.',
        }),
      })
    );
  });

  it('normalizes Grace Period student on fee clearance & cleanly separates Disabled vs Inactive in frontend filters', async () => {
    const validityDoc = {
      id: 88,
      studentId: 880,
      feePlanId: 5,
      startDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
      endDate: new Date(`${grace5Ymd}T23:59:59.999+05:30`),
      lastRenewedAt: null,
      totalAmount: 1000,
      accessType: 'RESERVED',
      student: { id: 880, branchId: 1, accountStatus: 'ACTIVE' },
    };
    vi.spyOn(mongoClient.studentValidity, 'findFirst').mockResolvedValue(validityDoc);
    vi.spyOn(mongoClient.paymentMode, 'findFirst').mockResolvedValue({ id: 1, isActive: true });
    vi.spyOn(mongoClient, '$transaction').mockImplementation(async (fn) => {
      const tx = {
        payment: {
          create: vi.fn().mockResolvedValue({ id: 2, validityId: 88, paymentModeId: 1, invoiceNo: 'INV-CLR', amountReceived: 1000, paymentDate: new Date() }),
          findMany: vi.fn().mockResolvedValue([{ id: 1, amountReceived: 1000 }, { id: 2, amountReceived: 1000 }]),
        },
        feePlan: { findFirst: vi.fn().mockResolvedValue({ id: 5, amount: 1000, durationDays: 30, branchId: 1 }) },
        studentShiftAssignment: { findMany: vi.fn().mockResolvedValue([{ id: 1 }]) },
        studentValidity: { update: vi.fn().mockResolvedValue({ id: 88 }) },
        student: { update: vi.fn() },
      };
      return fn(tx);
    });

    const payRes = makeRes();
    await createPayment(
      { user: { id: 1, branchId: 1 }, body: { validity_id: 88, payment_mode_id: 1, invoice_no: 'INV-CLR', amount_received: 1000, renew_plan: true } },
      payRes
    );
    expect(payRes.status).toHaveBeenCalledWith(201);
    expect(payRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          is_renewal: true,
          plan_expired: false,
          due_remaining: 0,
          account_status: 'ACTIVE',
        }),
      })
    );

    const studentsSample = [
      { id: 1, full_name: 'Normal', student_code: 'S1', mobile: '1', account_status: 'ACTIVE', end_date: futureEndYmd },
      { id: 2, full_name: 'Expiring Day0', student_code: 'S2', mobile: '2', account_status: 'ACTIVE', end_date: todayYmd },
      { id: 3, full_name: 'Grace 5d', student_code: 'S3', mobile: '3', account_status: 'ACTIVE', end_date: grace5Ymd },
      { id: 4, full_name: 'Grace 10d', student_code: 'S4', mobile: '4', account_status: 'ACTIVE', end_date: grace10Ymd },
      { id: 5, full_name: 'Suspended', student_code: 'S5', mobile: '5', account_status: 'SUSPENDED', end_date: overdue11Ymd },
      { id: 6, full_name: 'Inactive', student_code: 'S6', mobile: '6', account_status: 'INACTIVE', end_date: overdue21Ymd },
      { id: 7, full_name: 'Disabled', student_code: 'S7', mobile: '7', account_status: 'DISABLED', end_date: futureEndYmd },
    ];
    expect(getGraceExpiredInfo(studentsSample[3], todayYmd).daysOverdue).toBe(10);
    expect(getDerivedStatus(studentsSample[1], todayYmd)).toBe(DERIVED_STATUS.EXPIRING_SOON);
    expect(getDerivedStatus(studentsSample[2], todayYmd)).toBe(DERIVED_STATUS.EXPIRED_GRACE);
    expect(getDerivedStatus(studentsSample[6], todayYmd)).toBe(DERIVED_STATUS.DISABLED);

    expect(getStatusCounts(studentsSample, 'all', todayYmd)).toEqual({
      all: 7,
      active: 4,
      expiring_soon: 1,
      expired: 2,
      suspended: 1,
      inactive: 1,
      disabled: 1,
    });
    expect(filterStudentsList(studentsSample, { statusFilter: 'active', todayYmd }).map((s) => s.id)).toEqual([1, 2, 3, 4]);
    expect(filterStudentsList(studentsSample, { statusFilter: 'expiring_soon', todayYmd }).map((s) => s.id)).toEqual([2]);
    expect(filterStudentsList(studentsSample, { statusFilter: 'expired', todayYmd }).map((s) => s.id)).toEqual([3, 4]);
    expect(filterStudentsList(studentsSample, { statusFilter: 'inactive', todayYmd }).map((s) => s.id)).toEqual([6]);
    expect(filterStudentsList(studentsSample, { statusFilter: 'disabled', todayYmd }).map((s) => s.id)).toEqual([7]);

    const normalized = studentsSample.map((s) => (s.id === 3 ? { ...s, end_date: futureEndYmd } : s));
    expect(getStudentStatus(normalized[2], todayYmd)).toBe('active');
    expect(getStatusCounts(normalized, 'all', todayYmd).expired).toBe(1);
  });

  it('allows QR & staff check-in for paid active student (11-20d after startDate), requests payments:true, and self-heals false SUSPENDED status', async () => {
    vi.spyOn(mongoClient.attendance, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(mongoClient.branch, 'findFirst').mockResolvedValue({ id: 1, isActive: true });

    const start14dAgoYmd = addDaysToYmd(todayYmd, -14);
    const shiftDoc = { id: 1, shiftName: 'All Day', startTime: '00:30:00', endTime: '23:59:00' };

    // 1. Paid student started 14 days ago, plan valid until futureEndYmd -> ALLOWED & includes payments:true
    const paidStudent = {
      id: 601,
      branchId: 1,
      studentCode: 'STD00601',
      fullName: 'Afroz',
      accountStatus: 'ACTIVE',
    };
    const paidValidity = {
      id: 6101,
      studentId: 601,
      startDate: new Date(`${start14dAgoYmd}T00:00:00+05:30`),
      endDate: new Date(`${futureEndYmd}T23:59:59.999+05:30`),
      totalAmount: 1000,
      payments: [{ id: 1, amountReceived: 1000 }],
    };
    const paidAssignment = {
      id: 7101,
      validityId: 6101,
      shiftId: 1,
      assignmentStatus: 'ACTIVE',
      shift: shiftDoc,
      validity: { ...paidValidity, student: { ...paidStudent } },
    };

    const assignFindSpy = vi.spyOn(mongoClient.studentShiftAssignment, 'findMany').mockResolvedValue([paidAssignment]);
    vi.spyOn(mongoClient.attendance, 'findMany').mockResolvedValue([]);
    vi.spyOn(mongoClient.attendance, 'findFirst').mockResolvedValue(null);
    vi.spyOn(mongoClient.attendance, 'create').mockImplementation(async ({ data }) => ({ id: 9901, ...data }));
    const studentFindSpy = vi.spyOn(mongoClient.student, 'findFirst').mockResolvedValue({
      ...paidStudent,
      validities: [{ ...paidValidity, assignments: [paidAssignment] }],
    });
    const studentUpdateSpy = vi.spyOn(mongoClient.student, 'update').mockResolvedValue({ ...paidStudent });

    const staffRes = makeRes();
    await checkIn({ user: { id: 1, branchId: 1 }, body: { student_id: 601, shift_id: 1 } }, staffRes);
    expect(staffRes.status).toHaveBeenCalledWith(201);
    expect(assignFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          validity: expect.objectContaining({
            include: expect.objectContaining({ student: true, payments: true }),
          }),
        }),
      })
    );

    const pubRes = makeRes();
    await publicCheckInOrOut({ body: { studentCodeOrMobile: 'STD00601', branchId: 1 } }, pubRes);
    expect(pubRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, action: 'CHECK_IN' }));
    expect(studentFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          validities: expect.objectContaining({
            include: expect.objectContaining({ payments: true }),
          }),
        }),
      })
    );
    expect(studentUpdateSpy).not.toHaveBeenCalled();

    // 2. Previously falsely SUSPENDED paid student (from prior missing-payments bug) -> auto-heals back to ACTIVE and checks in
    const falselySuspendedStudent = {
      id: 602,
      branchId: 1,
      studentCode: 'STD00602',
      fullName: 'Afroz',
      accountStatus: 'SUSPENDED',
    };
    const healedValidity = {
      id: 6102,
      studentId: 602,
      startDate: new Date(`${start14dAgoYmd}T00:00:00+05:30`),
      endDate: new Date(`${futureEndYmd}T23:59:59.999+05:30`),
      totalAmount: 1000,
      payments: [{ id: 2, amountReceived: 1000 }],
    };
    const healedAssignment = {
      id: 7102,
      validityId: 6102,
      shiftId: 1,
      assignmentStatus: 'ACTIVE',
      shift: shiftDoc,
      validity: { ...healedValidity, student: { ...falselySuspendedStudent } },
    };

    vi.spyOn(mongoClient.studentShiftAssignment, 'findMany').mockResolvedValue([healedAssignment]);
    vi.spyOn(mongoClient.student, 'findFirst').mockResolvedValue({
      ...falselySuspendedStudent,
      validities: [{ ...healedValidity, assignments: [healedAssignment] }],
    });
    studentUpdateSpy.mockClear();

    const healedPubRes = makeRes();
    await publicCheckInOrOut({ body: { studentCodeOrMobile: 'Afroz', branchId: 1 } }, healedPubRes);
    expect(studentUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 602 },
        data: expect.objectContaining({ accountStatus: 'ACTIVE' }),
      })
    );
    expect(healedPubRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, action: 'CHECK_IN' }));

    // Also verify staff checkIn heals a falsely SUSPENDED paid student
    falselySuspendedStudent.accountStatus = 'SUSPENDED';
    healedAssignment.validity.student = { ...falselySuspendedStudent };
    studentUpdateSpy.mockClear();
    const healedStaffRes = makeRes();
    await checkIn({ user: { id: 1, branchId: 1 }, body: { student_id: 602, shift_id: 1 } }, healedStaffRes);
    expect(studentUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 602 },
        data: expect.objectContaining({ accountStatus: 'ACTIVE' }),
      })
    );
    expect(healedStaffRes.status).toHaveBeenCalledWith(201);

    // 3. Re-fetches payments via studentValidity.findMany when embedded validity omits payments, and never falsely suspends if payments are omitted
    const partialStudent = {
      id: 603,
      branchId: 1,
      studentCode: 'STD00603',
      fullName: 'Partial Mock Student',
      accountStatus: 'ACTIVE',
    };
    const validityWithoutPayments = {
      id: 6103,
      studentId: 603,
      startDate: new Date(`${start14dAgoYmd}T00:00:00+05:30`),
      endDate: new Date(`${futureEndYmd}T23:59:59.999+05:30`),
      totalAmount: 1000,
    };
    const partialAssignment = {
      id: 7103,
      validityId: 6103,
      shiftId: 1,
      assignmentStatus: 'ACTIVE',
      shift: shiftDoc,
      validity: { ...validityWithoutPayments, student: { ...partialStudent } },
    };
    vi.spyOn(mongoClient.studentShiftAssignment, 'findMany').mockResolvedValue([partialAssignment]);
    vi.spyOn(mongoClient.student, 'findFirst').mockResolvedValue({
      ...partialStudent,
      validities: [{ ...validityWithoutPayments, assignments: [partialAssignment] }],
    });
    const valFindSpy = vi.spyOn(mongoClient.studentValidity, 'findMany').mockResolvedValue([
      { ...validityWithoutPayments, payments: [{ amountReceived: 1000 }] },
    ]);
    studentUpdateSpy.mockClear();

    const fetchedPubRes = makeRes();
    await publicCheckInOrOut({ body: { studentCodeOrMobile: 'STD00603', branchId: 1 } }, fetchedPubRes);
    expect(valFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 603 }, include: { payments: true } })
    );
    expect(fetchedPubRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, action: 'CHECK_IN' }));
    expect(studentUpdateSpy).not.toHaveBeenCalled();

    // Direct evaluateStudentLifecycle safeguard: omitted payments array never assumes totalPaid=0
    const noPaymentsEval = evaluateStudentLifecycle({
      id: 604,
      accountStatus: 'ACTIVE',
      validities: [validityWithoutPayments],
    });
    expect(noPaymentsEval.dueAmount).toBe(0);
    expect(noPaymentsEval.targetAccountStatus).toBe('ACTIVE');
  });

  it('prevents manual activation of SUSPENDED/INACTIVE members, shows Disable button until DISABLED, and allows SUSPENDED -> DISABLED', async () => {
    // 1. UI helper checks: only DISABLED shows Activate; ACTIVE, SUSPENDED, INACTIVE all show Disable
    expect(canManuallyActivateMember({ account_status: 'ACTIVE' })).toBe(false);
    expect(canManuallyActivateMember({ account_status: 'SUSPENDED' })).toBe(false);
    expect(canManuallyActivateMember({ account_status: 'INACTIVE' })).toBe(false);
    expect(canManuallyActivateMember({ account_status: 'DISABLED' })).toBe(true);

    expect(getMemberActionButtonMode('ACTIVE')).toBe('disable');
    expect(getMemberActionButtonMode('SUSPENDED')).toBe('disable');
    expect(getMemberActionButtonMode('INACTIVE')).toBe('disable');
    expect(getMemberActionButtonMode('DISABLED')).toBe('activate');

    // 2. Backend updateStudent blocks manual SUSPENDED -> ACTIVE and INACTIVE -> ACTIVE
    vi.spyOn(mongoClient.student, 'findMany').mockResolvedValue([]);
    const updateSpy = vi.spyOn(mongoClient.student, 'update');

    for (const blockedFrom of ['SUSPENDED', 'INACTIVE']) {
      vi.spyOn(mongoClient.student, 'findFirst').mockImplementation(async ({ where }) =>
        where?.id === 710
          ? {
              id: 710,
              branchId: 1,
              studentCode: 'STD710',
              fullName: 'Suspended Student',
              email: 's710@example.com',
              mobile: '9876543210',
              gender: 'MALE',
              accountStatus: blockedFrom,
            }
          : null
      );

      const res = makeRes();
      await updateStudent(
        { user: { id: 1, branchId: 1, role: 'OWNER' }, params: { id: '710' }, body: { account_status: 'ACTIVE' } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Collect Fee/i),
        })
      );
      expect(updateSpy).not.toHaveBeenCalled();
    }

    // 3. Backend updateStudent allows SUSPENDED -> DISABLED and releases seat
    vi.spyOn(mongoClient.student, 'findFirst').mockImplementation(async ({ where }) =>
      where?.id === 711
        ? {
            id: 711,
            branchId: 1,
            studentCode: 'STD711',
            fullName: 'Afroz',
            email: 'afroz@example.com',
            mobile: '9876543211',
            gender: 'MALE',
            accountStatus: 'SUSPENDED',
          }
        : null
    );
    vi.spyOn(mongoClient.studentValidity, 'findMany').mockResolvedValueOnce([{ id: 911, studentId: 711 }]);
    vi.spyOn(mongoClient.studentShiftAssignment, 'findMany').mockResolvedValueOnce([
      { id: 921, validityId: 911, shiftId: 1, seatId: 33, assignmentStatus: 'ACTIVE' },
    ]);
    const shiftUpdateSpy = vi.spyOn(mongoClient.studentShiftAssignment, 'update').mockResolvedValue({});
    updateSpy.mockResolvedValueOnce({
      id: 711,
      branchId: 1,
      studentCode: 'STD711',
      fullName: 'Afroz',
      email: 'afroz@example.com',
      mobile: '9876543211',
      gender: 'MALE',
      accountStatus: 'DISABLED',
    });

    const disableRes = makeRes();
    await updateStudent(
      { user: { id: 1, branchId: 1, role: 'OWNER' }, params: { id: '711' }, body: { account_status: 'DISABLED' } },
      disableRes
    );
    expect(shiftUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 921 },
        data: expect.objectContaining({ seatId: null, previousSeatId: 33 }),
      })
    );
    expect(disableRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ account_status: 'DISABLED' }),
      })
    );

    // 4. Re-activating a DISABLED student whose dues are still 11-20d overdue transitions to SUSPENDED instead of bypassing fee clearance
    vi.spyOn(mongoClient.student, 'findFirst').mockImplementation(async ({ where }) =>
      where?.id === 712
        ? {
            id: 712,
            branchId: 1,
            studentCode: 'STD712',
            fullName: 'Overdue Disabled',
            email: 'o712@example.com',
            mobile: '9876543212',
            gender: 'MALE',
            accountStatus: 'DISABLED',
          }
        : null
    );
    vi.spyOn(mongoClient.studentValidity, 'findMany').mockResolvedValueOnce([
      {
        id: 912,
        studentId: 712,
        startDate: new Date(`${oldStartYmd}T00:00:00+05:30`),
        endDate: new Date(`${overdue11Ymd}T23:59:59.999+05:30`),
        totalAmount: 1000,
        payments: [{ id: 1, amountReceived: 1000 }],
      },
    ]);
    updateSpy.mockResolvedValueOnce({
      id: 712,
      branchId: 1,
      studentCode: 'STD712',
      fullName: 'Overdue Disabled',
      email: 'o712@example.com',
      mobile: '9876543212',
      gender: 'MALE',
      accountStatus: 'SUSPENDED',
    });

    const reactivateOverdueRes = makeRes();
    await updateStudent(
      { user: { id: 1, branchId: 1, role: 'OWNER' }, params: { id: '712' }, body: { account_status: 'ACTIVE' } },
      reactivateOverdueRes
    );
    expect(updateSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 712 },
        data: expect.objectContaining({ accountStatus: 'SUSPENDED' }),
      })
    );
    expect(reactivateOverdueRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ account_status: 'SUSPENDED' }),
      })
    );

    // 5. Re-activating a DISABLED student with cleared & unexpired fees succeeds to ACTIVE
    vi.spyOn(mongoClient.student, 'findFirst').mockImplementation(async ({ where }) =>
      where?.id === 713
        ? {
            id: 713,
            branchId: 1,
            studentCode: 'STD713',
            fullName: 'Paid Disabled',
            email: 'p713@example.com',
            mobile: '9876543213',
            gender: 'MALE',
            accountStatus: 'DISABLED',
          }
        : null
    );
    vi.spyOn(mongoClient.studentValidity, 'findMany').mockResolvedValueOnce([
      {
        id: 913,
        studentId: 713,
        startDate: new Date(`${todayYmd}T00:00:00+05:30`),
        endDate: new Date(`${futureEndYmd}T23:59:59.999+05:30`),
        totalAmount: 1000,
        payments: [{ id: 2, amountReceived: 1000 }],
      },
    ]);
    vi.spyOn(mongoClient.studentValidity, 'findFirst').mockResolvedValueOnce(null);
    updateSpy.mockResolvedValueOnce({
      id: 713,
      branchId: 1,
      studentCode: 'STD713',
      fullName: 'Paid Disabled',
      email: 'p713@example.com',
      mobile: '9876543213',
      gender: 'MALE',
      accountStatus: 'ACTIVE',
    });

    const reactivatePaidRes = makeRes();
    await updateStudent(
      { user: { id: 1, branchId: 1, role: 'OWNER' }, params: { id: '713' }, body: { account_status: 'ACTIVE' } },
      reactivatePaidRes
    );
    expect(updateSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 713 },
        data: expect.objectContaining({ accountStatus: 'ACTIVE' }),
      })
    );
    expect(reactivatePaidRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ account_status: 'ACTIVE' }),
      })
    );
  });
});
