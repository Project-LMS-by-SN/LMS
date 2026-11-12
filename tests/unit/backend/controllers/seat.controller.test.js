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
  createSeat,
  createBulkSeats,
  renumberAllSeats,
} = require('../../../../backend/src/controllers/seat.controller');

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe('seat.controller — multi-prefix & continuation seats', () => {
  let invalidateBranchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    invalidateBranchSpy = vi.spyOn(cache, 'invalidateBranch').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows creating A6..A8 when A1..A5 already exist and invalidates branch cache', async () => {
    const existing = [1, 2, 3, 4, 5].map((n) => ({
      id: n,
      seatNumber: `A${n}`,
      floor: '1',
      room: 'A1',
      branchId: 1,
      isActive: true,
    }));

    const createdDocs = [6, 7, 8].map((n) => ({
      id: n,
      seatNumber: `A${n}`,
      floor: '1',
      room: 'A1',
      section: null,
      branchId: 1,
      isActive: true,
    }));

    vi.spyOn(mongoClient.seat, 'findMany')
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(createdDocs);

    const createSpy = vi.spyOn(mongoClient.seat, 'create').mockImplementation(async ({ data }) => ({
      id: 100,
      ...data,
      isActive: true,
    }));

    const req = {
      user: { branchId: 1 },
      body: { seats: ['A6', 'A7', 'A8'], floor: '1', room: 'A1' },
    };
    const res = makeRes();

    await createBulkSeats(req, res);

    expect(createSpy).toHaveBeenCalledTimes(3);
    expect(createSpy.mock.calls.map((c) => c[0].data.seatNumber)).toEqual(['A6', 'A7', 'A8']);
    expect(invalidateBranchSpy).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: '3 seats created successfully.',
      })
    );
  });

  it('allows creating A1..A3 when AL1..AL5 exist (no false prefix collision)', async () => {
    const existing = [1, 2, 3, 4, 5].map((n) => ({
      id: n,
      seatNumber: `AL${n}`,
      floor: '1',
      room: 'A1',
      branchId: 1,
      isActive: true,
    }));

    const createdDocs = [1, 2, 3].map((n) => ({
      id: 10 + n,
      seatNumber: `A${n}`,
      floor: '1',
      room: 'A1',
      section: null,
      branchId: 1,
      isActive: true,
    }));

    vi.spyOn(mongoClient.seat, 'findMany')
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(createdDocs);

    const createSpy = vi.spyOn(mongoClient.seat, 'create').mockImplementation(async ({ data }) => ({
      id: 200,
      ...data,
      isActive: true,
    }));

    const req = {
      user: { branchId: 1 },
      body: { seats: ['A1', 'A2', 'A3'], floor: '1', room: 'A1' },
    };
    const res = makeRes();

    await createBulkSeats(req, res);

    expect(createSpy).toHaveBeenCalledTimes(3);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('skips duplicate seat numbers and returns 409 with next-start hint when all seats exist', async () => {
    const existing = [1, 2, 3, 4, 5].map((n) => ({
      id: n,
      seatNumber: `A${n}`,
      floor: '1',
      room: 'A1',
      branchId: 1,
      isActive: true,
    }));

    vi.spyOn(mongoClient.seat, 'findMany').mockResolvedValueOnce(existing);
    const createSpy = vi.spyOn(mongoClient.seat, 'create');

    const req = {
      user: { branchId: 1 },
      body: { seats: ['A1', 'A2', 'A3', 'A4', 'A5'], floor: '1', room: 'A1' },
    };
    const res = makeRes();

    await createBulkSeats(req, res);

    expect(createSpy).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('A6'),
      })
    );
  });

  it('createSeat allows A6 when A1..A5 exist and rejects exact duplicate A5 with 409', async () => {
    const findFirstSpy = vi.spyOn(mongoClient.seat, 'findFirst');
    findFirstSpy.mockResolvedValueOnce(null);
    vi.spyOn(mongoClient.seat, 'create').mockResolvedValueOnce({
      id: 6,
      seatNumber: 'A6',
      floor: '1',
      room: 'A1',
      section: null,
      isActive: true,
    });

    const resOk = makeRes();
    await createSeat(
      { user: { branchId: 1 }, body: { seat_number: 'A6', floor: '1', room: 'A1' } },
      resOk
    );
    expect(resOk.status).toHaveBeenCalledWith(201);

    findFirstSpy.mockResolvedValueOnce({ id: 5, seatNumber: 'A5', branchId: 1 });
    const resDup = makeRes();
    await createSeat(
      { user: { branchId: 1 }, body: { seat_number: 'A5', floor: '1', room: 'A1' } },
      resDup
    );
    expect(resDup.status).toHaveBeenCalledWith(409);
  });

  it('renumberAllSeats keeps A and AL prefixes in separate numbered groups', async () => {
    vi.spyOn(mongoClient.seat, 'findMany').mockResolvedValueOnce([
      { id: 1, seatNumber: 'A1', branchId: 1 },
      { id: 2, seatNumber: 'A4', branchId: 1 },
      { id: 3, seatNumber: 'AL1', branchId: 1 },
      { id: 4, seatNumber: 'AL3', branchId: 1 },
    ]);

    const txSpy = vi.spyOn(mongoClient, '$transaction').mockResolvedValueOnce([]);
    const updateSpy = vi.spyOn(mongoClient.seat, 'update').mockImplementation((args) => args);

    const renamed = await renumberAllSeats(1);

    expect(renamed).toBe(2);
    expect(updateSpy).toHaveBeenCalledWith({ where: { id: 2 }, data: { seatNumber: 'A2' } });
    expect(updateSpy).toHaveBeenCalledWith({ where: { id: 4 }, data: { seatNumber: 'AL2' } });
    expect(txSpy).toHaveBeenCalledTimes(1);
    expect(invalidateBranchSpy).toHaveBeenCalledWith(1);
  });
});

