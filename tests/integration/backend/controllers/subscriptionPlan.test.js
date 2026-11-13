import { describe, it, expect } from 'vitest';
import subscriptionPlanService from '../../../../backend/src/services/subscriptionPlan.service';

describe('subscription plan service integration tests', () => {
  it('resolves student limits according to tier', async () => {
    const freeLimit = await subscriptionPlanService.getStudentLimitForTier('FREE');
    expect(freeLimit).toBe(50);

    const basicLimit = await subscriptionPlanService.getStudentLimitForTier('BASIC');
    expect(basicLimit).toBe(200);

    const proLimit = await subscriptionPlanService.getStudentLimitForTier('PRO');
    expect(proLimit).toBe(500);

    const enterpriseLimit = await subscriptionPlanService.getStudentLimitForTier('ENTERPRISE');
    expect(enterpriseLimit).toBe(999999);
  });

  it('resolves staff user limits according to tier', async () => {
    const freeStaff = await subscriptionPlanService.getStaffLimitForTier('FREE');
    expect(freeStaff).toBe(0);

    const basicStaff = await subscriptionPlanService.getStaffLimitForTier('BASIC');
    expect(basicStaff).toBe(2);

    const proStaff = await subscriptionPlanService.getStaffLimitForTier('PRO');
    expect(proStaff).toBe(3);

    const enterpriseStaff = await subscriptionPlanService.getStaffLimitForTier('ENTERPRISE');
    expect(enterpriseStaff).toBe(5);
  });

  it('resolves device login limits according to tier', async () => {
    const freeDevice = await subscriptionPlanService.getDeviceLimitForTier('FREE');
    expect(freeDevice).toBe(1);

    const basicDevice = await subscriptionPlanService.getDeviceLimitForTier('BASIC');
    expect(basicDevice).toBe(2);

    const proDevice = await subscriptionPlanService.getDeviceLimitForTier('PRO');
    expect(proDevice).toBe(3);

    const enterpriseDevice = await subscriptionPlanService.getDeviceLimitForTier('ENTERPRISE');
    expect(enterpriseDevice).toBe(5);
  });

  it('provides dynamic tier pricing for all billing cycles', async () => {
    const pricing = await subscriptionPlanService.getDynamicTierPricing();
    expect(pricing.BASIC.monthly).toBe(150);
    expect(pricing.BASIC.quarterly).toBe(450);
    expect(pricing.BASIC.halfYearly).toBe(900);
    expect(pricing.BASIC.yearly).toBe(1800);

    expect(pricing.PRO.monthly).toBe(250);
    expect(pricing.PRO.quarterly).toBe(750);
    expect(pricing.PRO.halfYearly).toBe(1500);
    expect(pricing.PRO.yearly).toBe(3000);
  });
});
