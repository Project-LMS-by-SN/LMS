import { describe, it, expect } from 'vitest';
import subscriptionPlanService from '../../../../backend/src/services/subscriptionPlan.service';

describe('subscription plan service integration tests', () => {
  it('resolves student limits according to tier', async () => {
    const starterLimit = await subscriptionPlanService.getStudentLimitForTier('STARTER');
    expect(typeof starterLimit).toBe('number');
    expect(starterLimit).toBeGreaterThan(0);

    const pro100Limit = await subscriptionPlanService.getStudentLimitForTier('PRO_100');
    expect(typeof pro100Limit).toBe('number');
    expect(pro100Limit).toBeGreaterThan(0);

    const pro200Limit = await subscriptionPlanService.getStudentLimitForTier('PRO_200');
    expect(typeof pro200Limit).toBe('number');
    expect(pro200Limit).toBeGreaterThan(0);
  });

  it('resolves staff user limits according to tier', async () => {
    const starterStaff = await subscriptionPlanService.getStaffLimitForTier('STARTER');
    expect(typeof starterStaff).toBe('number');
    expect(starterStaff).toBeGreaterThanOrEqual(1);

    const pro100Staff = await subscriptionPlanService.getStaffLimitForTier('PRO_100');
    expect(typeof pro100Staff).toBe('number');
    expect(pro100Staff).toBeGreaterThanOrEqual(1);

    const pro200Staff = await subscriptionPlanService.getStaffLimitForTier('PRO_200');
    expect(typeof pro200Staff).toBe('number');
    expect(pro200Staff).toBeGreaterThanOrEqual(1);
  });

  it('resolves device login limits according to tier', async () => {
    const starterDevice = await subscriptionPlanService.getDeviceLimitForTier('STARTER');
    expect(typeof starterDevice).toBe('number');
    expect(starterDevice).toBeGreaterThanOrEqual(1);

    const pro100Device = await subscriptionPlanService.getDeviceLimitForTier('PRO_100');
    expect(typeof pro100Device).toBe('number');
    expect(pro100Device).toBeGreaterThanOrEqual(1);

    const pro200Device = await subscriptionPlanService.getDeviceLimitForTier('PRO_200');
    expect(typeof pro200Device).toBe('number');
    expect(pro200Device).toBeGreaterThanOrEqual(1);
  });
});
