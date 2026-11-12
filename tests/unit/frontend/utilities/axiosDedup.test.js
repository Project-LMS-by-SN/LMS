/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from '../../../../frontend/src/api/axios';

describe('axios global in-flight mutation deduplication', () => {
  let originalAdapter;

  beforeEach(() => {
    originalAdapter = api.defaults.adapter;
    localStorage.clear();
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  it('sends only one network request when identical POST mutations are triggered concurrently', async () => {
    let resolveNetwork;
    const adapterSpy = vi.fn(
      (config) =>
        new Promise((resolve) => {
          resolveNetwork = () =>
            resolve({
              data: { success: true, id: 101 },
              status: 201,
              statusText: 'Created',
              headers: {},
              config,
            });
        })
    );
    api.defaults.adapter = adapterSpy;

    const payload = { shift_name: 'Morning', start_time: '06:00', end_time: '12:00' };
    const req1 = api.post('/shifts', payload);
    const req2 = api.post('/shifts', payload);

    try {
      await vi.waitFor(() => {
        expect(adapterSpy).toHaveBeenCalledTimes(1);
      });
    } finally {
      resolveNetwork?.();
    }

    const [res1, res2] = await Promise.all([req1, req2]);
    expect(res1.data).toEqual({ success: true, id: 101 });
    expect(res2.data).toEqual({ success: true, id: 101 });

    // Subsequent sequential call after completion fires normally
    const req3 = api.post('/shifts', payload);
    try {
      await vi.waitFor(() => {
        expect(adapterSpy).toHaveBeenCalledTimes(2);
      });
    } finally {
      resolveNetwork?.();
    }
    await req3;
  });

  it('does not deduplicate mutations with different payloads', async () => {
    const adapterSpy = vi.fn(async (config) => ({
      data: { success: true },
      status: 201,
      statusText: 'Created',
      headers: {},
      config,
    }));
    api.defaults.adapter = adapterSpy;

    await Promise.all([
      api.post('/shifts', { shift_name: 'Shift A', start_time: '06:00', end_time: '12:00' }),
      api.post('/shifts', { shift_name: 'Shift B', start_time: '12:00', end_time: '18:00' }),
    ]);

    expect(adapterSpy).toHaveBeenCalledTimes(2);
  });
});
