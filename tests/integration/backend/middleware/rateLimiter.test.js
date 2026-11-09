import { describe, it, expect, vi } from 'vitest';
import rateLimiter from '../../../../backend/src/middleware/rateLimiter';

describe('rateLimiter middleware integration tests', () => {
  it('allows requests within the configured threshold', () => {
    const limiter = rateLimiter.createRateLimiter({ max: 3, windowMs: 10000 });
    const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } };
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('blocks requests exceeding the threshold with 429 status', () => {
    const limiter = rateLimiter.createRateLimiter({ max: 2, windowMs: 10000 });
    const req = { headers: {}, socket: { remoteAddress: '10.0.0.99' } };
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    limiter(req, res, next); // 1
    limiter(req, res, next); // 2
    expect(next).toHaveBeenCalledTimes(2);

    limiter(req, res, next); // 3 (exceeded)
    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });
});
