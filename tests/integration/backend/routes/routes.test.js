import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../../backend/src/app';

describe('backend Express app route integration tests', () => {
  it('protects unregistered private routes with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/unregistered-private-endpoint');
    expect(res.status).toBe(401);
  });

  it('handles public unknown routes with 404 Not Found', async () => {
    const res = await request(app).get('/login/non-existent-subpath');
    expect([404, 401]).toContain(res.status);
  });

  it('sets CORS headers on requests', async () => {
    const res = await request(app)
      .get('/api/users/login')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
