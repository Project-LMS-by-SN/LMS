import { describe, it, expect } from 'vitest';
import models from '../../../../backend/src/models';

describe('backend model sequence integration tests', () => {
  it('exposes getNextSequence and ensureCounterAtLeast helpers', () => {
    expect(typeof models.getNextSequence).toBe('function');
    expect(typeof models.ensureCounterAtLeast).toBe('function');
  });

  it('ensures Counter model is registered', () => {
    expect(models.Counter || models.counterSchema).toBeDefined();
  });
});
