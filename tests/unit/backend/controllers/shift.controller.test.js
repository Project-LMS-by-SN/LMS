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
const cache = require('../../../../backend/src/utils/cache');
const {
  createShift,
  updateShift,
  checkTimeOverlap,
} = require('../../../../backend/src/controllers/shift.controller');
const studentController = require('../../../../backend/src/controllers/student.controller');

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe('shift overlap & full-day shift rules', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(cache, 'get').mockReturnValue(null);
    vi.spyOn(cache, 'set').mockImplementation(() => {});
    vi.spyOn(cache, 'invalidateBranch').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkTimeOverlap (circular 24h shift windows)', () => {
    it('detects standard daytime overlaps and allows back-to-back touching shifts', () => {
      expect(checkTimeOverlap('08:00', '14:00', '13:00', '18:00')).toBe(true);
      expect(checkTimeOverlap('08:00', '14:00', '14:00', '20:00')).toBe(false);
    });

    it('detects overnight shift overlap with early morning and other overnight shifts', () => {
      // Overnight 20:00 - 02:00 overlaps 01:00 - 06:00 and 22:00 - 04:00
      expect(checkTimeOverlap('20:00', '02:00', '01:00', '06:00')).toBe(true);
      expect(checkTimeOverlap('20:00', '02:00', '22:00', '04:00')).toBe(true);
      // Overnight 20:00 - 09:00 overlaps daytime 08:00 - 10:00
      expect(checkTimeOverlap('20:00', '09:00', '08:00', '10:00')).toBe(true);
      // Clean 4-shift 24h partition: 06-12, 12-18, 18-00, 00-06
      expect(checkTimeOverlap('18:00', '00:00', '00:00', '06:00')).toBe(false);
      expect(checkTimeOverlap('20:00', '02:00', '02:00', '08:00')).toBe(false);
    });
  });

  describe('createShift & updateShift validation', () => {
    it('rejects identical start_time and end_time', async () => {
      const createSpy = vi.spyOn(mongoClient.shift, 'create');
      const req = {
        user: { id: 1, branchId: 1, role: 'OWNER' },
        body: { shift_name: 'Bad Shift', start_time: '08:00', end_time: '08:00' },
      };
      const res = makeRes();

      await createShift(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(createSpy).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Start time and end time cannot be the same',
        })
      );
    });

    it('rejects overnight overlap when creating a new shift', async () => {
      vi.spyOn(mongoClient.shift, 'findMany').mockResolvedValue([
        { id: 3, shiftName: 'Night Shift', startTime: '20:00:00', endTime: '02:00:00', isActive: true },
      ]);
      const createSpy = vi.spyOn(mongoClient.shift, 'create');

      const req = {
        user: { id: 1, branchId: 1, role: 'OWNER' },
        body: { shift_name: 'Early Dawn', start_time: '01:00', end_time: '06:00' },
      };
      const res = makeRes();

      await createShift(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(createSpy).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Night Shift.*08:00 PM - 02:00 AM/),
        })
      );
    });

    it('rejects updateShift when updated timing overlaps another active shift', async () => {
      vi.spyOn(mongoClient.shift, 'findFirst').mockResolvedValue({
        id: 2,
        shiftName: 'Afternoon',
        startTime: '14:00',
        endTime: '20:00',
        isActive: true,
        branchId: 1,
      });
      vi.spyOn(mongoClient.shift, 'findMany').mockResolvedValue([
        { id: 1, shiftName: 'Morning', startTime: '08:00', endTime: '14:00', isActive: true },
      ]);
      const updateSpy = vi.spyOn(mongoClient.shift, 'update');

      const req = {
        user: { id: 1, branchId: 1, role: 'OWNER' },
        params: { id: '2' },
        body: { shift_name: 'Afternoon', start_time: '13:30', end_time: '19:30' },
      };
      const res = makeRes();

      await updateShift(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('serializes concurrent createShift calls per branch so double-submit creates only one shift', async () => {
      const store = [];
      vi.spyOn(mongoClient.shift, 'findMany').mockImplementation(async () => [...store]);
      const createSpy = vi.spyOn(mongoClient.shift, 'create').mockImplementation(async ({ data }) => {
        await new Promise((r) => setTimeout(r, 15));
        const created = { id: store.length + 1, isActive: true, ...data };
        store.push(created);
        return created;
      });

      const req1 = {
        user: { id: 1, branchId: 77, role: 'OWNER' },
        body: { shift_name: 'Morning', start_time: '06:00', end_time: '12:00' },
      };
      const req2 = {
        user: { id: 1, branchId: 77, role: 'OWNER' },
        body: { shift_name: 'Morning', start_time: '06:00', end_time: '12:00' },
      };
      const res1 = makeRes();
      const res2 = makeRes();

      await Promise.all([createShift(req1, res1), createShift(req2, res2)]);

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(res1.status).toHaveBeenCalledWith(201);
      expect(res2.status).toHaveBeenCalledWith(409);
    });
  });

  describe('getStudents Full Day label for 3-shift vs 4-shift branches', () => {
    const buildStudentRow = (id, name, shiftIds) => ({
      id,
      studentCode: `STD0000${id}`,
      regNo: `REG0000${id}`,
      fullName: name,
      email: `s${id}@test.com`,
      mobile: `987654321${id}`,
      gender: 'MALE',
      dob: null,
      address: null,
      aadharNumber: null,
      admissionDate: new Date('2026-10-01T00:00:00Z'),
      profilePhotoUrl: null,
      accountStatus: 'ACTIVE',
      validities: [
        {
          id: id * 10,
          accessType: 'RESERVED',
          startDate: new Date('2026-10-01T00:00:00Z'),
          endDate: new Date('2099-12-31T23:59:59Z'),
          totalAmount: 1000,
          feePlan: { planName: 'Monthly' },
          payments: [{ amountReceived: 1000 }],
          assignments: shiftIds.map((sid) => ({
            shiftId: sid,
            seatId: 1,
            seat: { seatNumber: 'A1' },
            shift: { id: sid, shiftName: `Shift ${sid}` },
          })),
        },
      ],
    });

    it('labels 3-of-4 shifts as "3 Shift" and only 4-of-4 shifts as "Full Day" when branch has 4 active shifts', async () => {
      studentController.resetAutoSuspendThrottle();
      vi.spyOn(mongoClient.studentValidity, 'findMany').mockResolvedValue([]);
      vi.spyOn(mongoClient.shift, 'findMany').mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
      ]);
      vi.spyOn(mongoClient.student, 'findMany').mockResolvedValue([
        buildStudentRow(1, 'One Shift User', [1]),
        buildStudentRow(2, 'Two Shift User', [1, 2]),
        buildStudentRow(3, 'Three Shift User', [1, 2, 3]),
        buildStudentRow(4, 'Four Shift User', [1, 2, 3, 4]),
      ]);

      const req = { user: { id: 1, branchId: 1, role: 'OWNER' } };
      const res = makeRes();

      await studentController.getStudents(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      const byName = Object.fromEntries(payload.data.map((s) => [s.full_name, s.shift_name]));
      expect(byName['One Shift User']).toBe('Shift 1');
      expect(byName['Two Shift User']).toBe('2 Shift');
      expect(byName['Three Shift User']).toBe('3 Shift');
      expect(byName['Four Shift User']).toBe('Full Day');
    });

    it('labels 3-of-3 shifts as "Full Day" when branch has 3 active shifts', async () => {
      studentController.resetAutoSuspendThrottle();
      vi.spyOn(mongoClient.studentValidity, 'findMany').mockResolvedValue([]);
      vi.spyOn(mongoClient.shift, 'findMany').mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
      vi.spyOn(mongoClient.student, 'findMany').mockResolvedValue([
        buildStudentRow(1, 'Two Shift User', [1, 2]),
        buildStudentRow(2, 'Three Shift User', [1, 2, 3]),
      ]);

      const req = { user: { id: 1, branchId: 1, role: 'OWNER' } };
      const res = makeRes();

      await studentController.getStudents(req, res);

      const payload = res.json.mock.calls[0][0];
      const byName = Object.fromEntries(payload.data.map((s) => [s.full_name, s.shift_name]));
      expect(byName['Two Shift User']).toBe('2 Shift');
      expect(byName['Three Shift User']).toBe('Full Day');
    });
  });
});
