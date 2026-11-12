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
  getFeePlans,
  deleteFeePlan,
} = require('../../../../backend/src/controllers/feePlan.controller');

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe('feePlan controller unit tests', () => {
  let invalidateBranchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    cache.flushAll?.();
    vi.spyOn(cache, 'get').mockReturnValue(null);
    vi.spyOn(cache, 'set').mockImplementation(() => {});
    invalidateBranchSpy = vi.spyOn(cache, 'invalidateBranch').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getFeePlans marks plans allocated to non-deleted students with is_allocated and allocated_count', async () => {
    vi.spyOn(mongoClient.feePlan, 'findFirst').mockResolvedValue({
      id: 1,
      planName: 'Registration Fee',
      planType: 'REGISTRATION',
    });
    vi.spyOn(mongoClient.feePlan, 'findMany').mockResolvedValue([
      { id: 1, planName: 'Registration Fee', durationDays: 36500, amount: 100, isActive: true, planType: 'REGISTRATION' },
      { id: 2, planName: 'Unreserved Monthly', durationDays: 30, amount: 800, isActive: true, planType: 'UNRESERVED' },
      { id: 3, planName: 'Unused Plan', durationDays: 30, amount: 1000, isActive: true, planType: 'RESERVED' },
    ]);
    vi.spyOn(mongoClient.studentValidity, 'findMany').mockResolvedValue([
      { id: 11, feePlanId: 2 },
      { id: 12, feePlanId: 2 },
    ]);

    const req = { user: { id: 1, branchId: 1, role: 'OWNER' } };
    const res = makeRes();

    await getFeePlans(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        expect.objectContaining({ id: 1, allocated_count: 0, is_allocated: false }),
        expect.objectContaining({ id: 2, allocated_count: 2, is_allocated: true }),
        expect.objectContaining({ id: 3, allocated_count: 0, is_allocated: false }),
      ],
    });
  });

  it('deleteFeePlan rejects deletion when the fee plan is allocated to active/existing students', async () => {
    vi.spyOn(mongoClient.feePlan, 'findFirst').mockResolvedValue({
      id: 2,
      planName: 'Unreserved Monthly',
      planType: 'UNRESERVED',
      branchId: 1,
    });
    vi.spyOn(mongoClient.studentValidity, 'findMany').mockResolvedValue([
      { id: 21, feePlanId: 2, student: { fullName: 'Afroz', studentCode: 'STD00011' } },
    ]);
    const deleteSpy = vi.spyOn(mongoClient.feePlan, 'delete');

    const req = { user: { id: 1, branchId: 1, role: 'OWNER' }, params: { id: '2' } };
    const res = makeRes();

    await deleteFeePlan(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Afroz (STD00011)'),
      })
    );
  });

  it('deleteFeePlan allows deleting an unallocated fee plan and invalidates branch cache', async () => {
    vi.spyOn(mongoClient.feePlan, 'findFirst').mockResolvedValue({
      id: 3,
      planName: 'Unused Plan',
      planType: 'RESERVED',
      branchId: 4,
    });
    vi.spyOn(mongoClient.studentValidity, 'findMany').mockResolvedValue([]);
    const deleteSpy = vi.spyOn(mongoClient.feePlan, 'delete').mockResolvedValue({
      id: 3,
      planName: 'Unused Plan',
    });

    const req = { user: { id: 1, branchId: 4, role: 'OWNER' }, params: { id: '3' } };
    const res = makeRes();

    await deleteFeePlan(req, res);

    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 3 } });
    expect(invalidateBranchSpy).toHaveBeenCalledWith(4);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Fee plan deleted permanently',
      })
    );
  });

  it('deleteFeePlan refuses to delete REGISTRATION fee plans', async () => {
    vi.spyOn(mongoClient.feePlan, 'findFirst').mockResolvedValue({
      id: 1,
      planName: 'Registration Fee',
      planType: 'REGISTRATION',
      branchId: 1,
    });
    const deleteSpy = vi.spyOn(mongoClient.feePlan, 'delete');

    const req = { user: { id: 1, branchId: 1, role: 'OWNER' }, params: { id: '1' } };
    const res = makeRes();

    await deleteFeePlan(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});

