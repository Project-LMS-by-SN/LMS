import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../backend/src/app';

describe('API: Subscription & Plans Endpoints (Supertest)', () => {
  it('GET /api/payments/razorpay/plans returns 200 with dynamic plans', async () => {
    const res = await request(app).get('/api/payments/razorpay/plans');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.plans)).toBe(true);
    expect(res.body.plans.length).toBeGreaterThan(0);

    const firstPlan = res.body.plans[0];
    expect(firstPlan).toHaveProperty('tierKey');
    expect(firstPlan).toHaveProperty('monthlyPrice');
  });

  it('GET /api/students returns 401 without auth token', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });
});
