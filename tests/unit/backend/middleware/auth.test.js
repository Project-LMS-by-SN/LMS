import { describe, it, expect, vi } from 'vitest';
import authMiddleware from '../../../../backend/src/middleware/auth';

describe('auth middleware unit tests', () => {
  it('allows OPTIONS preflight requests', async () => {
    const req = { method: 'OPTIONS' };
    const res = {};
    const next = vi.fn();

    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows public routes without authentication', async () => {
    const publicPaths = [
      '/login',
      '/users/login',
      '/users/forgot-password',
      '/users/verify-reset-otp',
      '/users/reset-password',
    ];

    for (const path of publicPaths) {
      const req = { method: 'GET', path, originalUrl: path };
      const res = {};
      const next = vi.fn();

      await authMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  it('returns 401 if authorization header is missing on protected route', async () => {
    const req = {
      method: 'GET',
      path: '/students',
      originalUrl: '/api/students',
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Authentication required',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if token does not start with Bearer', async () => {
    const req = {
      method: 'GET',
      path: '/students',
      originalUrl: '/api/students',
      headers: { authorization: 'Basic 123456' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
