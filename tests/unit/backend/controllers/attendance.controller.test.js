import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
const {
  groupAttendanceRecords: groupAttendanceController,
  publicCheckInOrOut,
} = require('../../../../backend/src/controllers/attendance.controller');
const {
  groupAttendanceRecords: groupReportController,
} = require('../../../../backend/src/controllers/report.controller');

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe('attendance grouping & non-consecutive multi-shift check-in/out', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps one row when Evening Shift timing was edited after a single 3-shift check-in/out session', () => {
    const attendanceDate = new Date('2026-11-12T00:00:00+05:30');
    const student = { id: 27, studentCode: 'STD00011', fullName: 'Afroz', regNo: 'REG001' };

    const records = [
      {
        id: 123,
        shiftAssignmentId: 48,
        attendanceDate,
        status: 'PRESENT',
        checkInTime: '15:18',
        checkOutTime: '15:32:10',
        shiftStartTime: '08:00:00',
        shiftEndTime: '14:00:00',
        shiftAssignment: {
          id: 48,
          seat: { seatNumber: 'B3' },
          shift: { id: 1, shiftName: 'Morning Shift', startTime: '08:00:00', endTime: '14:00:00' },
          validity: { studentId: 27, student },
        },
      },
      {
        id: 124,
        shiftAssignmentId: 49,
        attendanceDate,
        status: 'PRESENT',
        checkInTime: '15:18',
        checkOutTime: '15:32:10',
        shiftStartTime: '14:00:00',
        shiftEndTime: '20:00:00',
        shiftAssignment: {
          id: 49,
          seat: { seatNumber: 'B3' },
          // Owner edited Evening Shift from 14:00 -> 17:00 after attendance was recorded
          shift: { id: 2, shiftName: 'Evening Shift', startTime: '17:00', endTime: '20:00' },
          validity: { studentId: 27, student },
        },
      },
      {
        id: 125,
        shiftAssignmentId: 50,
        attendanceDate,
        status: 'PRESENT',
        checkInTime: '15:18',
        checkOutTime: '15:32:10',
        shiftStartTime: '20:00',
        shiftEndTime: '23:00',
        shiftAssignment: {
          id: 50,
          seat: { seatNumber: 'B3' },
          shift: { id: 3, shiftName: 'Night Shift', startTime: '20:00', endTime: '23:00' },
          validity: { studentId: 27, student },
        },
      },
    ];

    const groupedAtt = groupAttendanceController(records);
    expect(groupedAtt).toHaveLength(1);
    expect(groupedAtt[0].shift_name).toBe('3 Shifts (Morning Shift, Evening Shift, Night Shift)');
    expect(groupedAtt[0].check_in_time).toBe('15:18');
    expect(groupedAtt[0].check_out_time).toBe('15:32');

    const groupedRep = groupReportController(records);
    expect(groupedRep).toHaveLength(1);
    expect(groupedRep[0].shift_name).toBe('3 Shifts (Morning Shift, Evening Shift, Night Shift)');
  });

  it('merges same-session records even without shiftStartTime snapshot, while preserving truly separate visits', () => {
    const attendanceDate = new Date('2026-11-12T00:00:00+05:30');
    const student = { id: 27, studentCode: 'STD00011', fullName: 'Afroz', regNo: 'REG001' };

    const separateVisits = [
      {
        id: 201,
        shiftAssignmentId: 48,
        attendanceDate,
        status: 'PRESENT',
        checkInTime: '08:05',
        checkOutTime: '13:55',
        shiftStartTime: '08:00',
        shiftEndTime: '14:00',
        shiftAssignment: {
          id: 48,
          seat: { seatNumber: 'B3' },
          shift: { id: 1, shiftName: 'Morning Shift', startTime: '08:00', endTime: '14:00' },
          validity: { studentId: 27, student },
        },
      },
      {
        id: 202,
        shiftAssignmentId: 49,
        attendanceDate,
        status: 'PRESENT',
        checkInTime: '17:05',
        checkOutTime: '19:55',
        shiftStartTime: '17:00',
        shiftEndTime: '20:00',
        shiftAssignment: {
          id: 49,
          seat: { seatNumber: 'B3' },
          shift: { id: 2, shiftName: 'Evening Shift', startTime: '17:00', endTime: '20:00' },
          validity: { studentId: 27, student },
        },
      },
    ];

    expect(groupAttendanceController(separateVisits)).toHaveLength(2);
    expect(groupReportController(separateVisits)).toHaveLength(2);

    const sameSessionNoSnapshot = separateVisits.map((r) => ({
      ...r,
      checkInTime: '15:18',
      checkOutTime: '15:32',
      shiftStartTime: null,
      shiftEndTime: null,
    }));

    expect(groupAttendanceController(sameSessionNoSnapshot)).toHaveLength(1);
    expect(groupReportController(sameSessionNoSnapshot)).toHaveLength(1);
  });

  it('checks out active Morning Shift on QR scan during Morning hours instead of prematurely checking into Evening Shift', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-12T11:00:00+05:30'));

    const morningShift = { id: 1, shiftName: 'Morning Shift', startTime: '08:00', endTime: '14:00' };
    const eveningShift = { id: 2, shiftName: 'Evening Shift', startTime: '17:00', endTime: '20:00' };
    const nightShift = { id: 3, shiftName: 'Night Shift', startTime: '20:00', endTime: '23:00' };

    const assignments = [
      { id: 48, assignmentStatus: 'ACTIVE', shiftId: 1, shift: morningShift, seat: { seatNumber: 'B3' } },
      { id: 49, assignmentStatus: 'ACTIVE', shiftId: 2, shift: eveningShift, seat: { seatNumber: 'B3' } },
      { id: 50, assignmentStatus: 'ACTIVE', shiftId: 3, shift: nightShift, seat: { seatNumber: 'B3' } },
    ];

    vi.spyOn(mongoClient.branch, 'findFirst').mockResolvedValue({ id: 1, isActive: true, attendanceToken: 'att_1' });
    vi.spyOn(mongoClient.student, 'findFirst').mockResolvedValue({
      id: 27,
      studentCode: 'STD00011',
      fullName: 'Afroz',
      accountStatus: 'ACTIVE',
      branchId: 1,
      validities: [
        {
          id: 35,
          startDate: new Date('2026-10-01T00:00:00+05:30'),
          endDate: new Date('2026-12-01T00:00:00+05:30'),
          totalAmount: 1000,
          payments: [{ amountReceived: 1000 }],
          assignments,
        },
      ],
    });

    vi.spyOn(mongoClient.attendance, 'findMany').mockResolvedValue([
      {
        id: 301,
        shiftAssignmentId: 48,
        checkInTime: '08:05',
        checkOutTime: null,
        shiftAssignment: assignments[0],
      },
    ]);

    const updateSpy = vi.spyOn(mongoClient.attendance, 'update').mockResolvedValue({});
    const createSpy = vi.spyOn(mongoClient.attendance, 'create').mockResolvedValue({});

    const req = { body: { studentCodeOrMobile: 'STD00011', branchId: 1 } };
    const res = makeRes();

    await publicCheckInOrOut(req, res);

    expect(createSpy).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 301 },
        data: expect.objectContaining({ checkOutTime: '11:00' }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        action: 'CHECK_OUT',
      })
    );
  });
});

