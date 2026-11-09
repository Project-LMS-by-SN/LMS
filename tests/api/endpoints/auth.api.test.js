import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../backend/src/app';

describe('API: Authentication Endpoints (Supertest)', () => {
  it('POST /api/users/login rejects empty payload with 400', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toMatch(/required/i);
  });

  it('POST /api/users/login rejects missing password with 400', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@admin.com' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('POST /api/users/forgot-password validates empty email', async () => {
    const res = await request(app)
      .post('/api/users/forgot-password')
      .send({ email: '' });

    expect([400, 404]).toContain(res.status);
    expect(res.body).toHaveProperty('success', false);
  });
});
