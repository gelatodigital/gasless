import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SimulationFailedRpcError } from './errors.js';
import { MAX_RETRIES, withRetries } from './withRetries.js';

describe('withRetries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('succeeds on first attempt (no retry needed)', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    const result = await withRetries(fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on matching error code and succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: SimulationFailedRpcError.code })
      .mockResolvedValue('ok');

    const result = await withRetries(fn, { delay: 0, max: 1 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry when max is 0', async () => {
    const fn = vi.fn().mockRejectedValue({ code: SimulationFailedRpcError.code });

    await expect(withRetries(fn, { max: 0 })).rejects.toEqual({
      code: SimulationFailedRpcError.code
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on non-matching error code', async () => {
    const fn = vi.fn().mockRejectedValue({ code: 9999 });

    await expect(withRetries(fn, { max: 3 })).rejects.toEqual({ code: 9999 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries then throws the last error', async () => {
    const fn = vi.fn().mockRejectedValue({ code: SimulationFailedRpcError.code });

    await expect(withRetries(fn, { delay: 0, max: 2 })).rejects.toEqual({
      code: SimulationFailedRpcError.code
    });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('respects delay between retries', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: SimulationFailedRpcError.code })
      .mockResolvedValue('ok');

    const promise = withRetries(fn, { backoff: 'fixed', delay: 500, max: 1 });

    // First call happens immediately and fails
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    // Advance past delay
    await vi.advanceTimersByTimeAsync(500);

    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('uses default errorCodes [4211] when not specified', async () => {
    const fn = vi.fn().mockRejectedValueOnce({ code: 4211 }).mockResolvedValue('ok');

    const result = await withRetries(fn, { delay: 0, max: 1 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('supports custom error codes', async () => {
    const fn = vi.fn().mockRejectedValueOnce({ code: 1234 }).mockResolvedValue('ok');

    const result = await withRetries(fn, { delay: 0, errorCodes: [1234], max: 1 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry errors without a code property', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('no code'));

    await expect(withRetries(fn, { max: 3 })).rejects.toThrow('no code');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses exponential backoff when configured', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: SimulationFailedRpcError.code })
      .mockRejectedValueOnce({ code: SimulationFailedRpcError.code })
      .mockRejectedValueOnce({ code: SimulationFailedRpcError.code })
      .mockResolvedValue('ok');

    const promise = withRetries(fn, { backoff: 'exponential', delay: 100, max: 3 });

    // First call fails immediately
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    // Retry 0: delay = 100 * 2^0 = 100ms
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);

    // Retry 1: delay = 100 * 2^1 = 200ms
    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(3);

    // Retry 2: delay = 100 * 2^2 = 400ms
    await vi.advanceTimersByTimeAsync(400);
    expect(fn).toHaveBeenCalledTimes(4);

    const result = await promise;
    expect(result).toBe('ok');
  });

  it('clamps max retries to MAX_RETRIES', async () => {
    const fn = vi.fn().mockRejectedValue({ code: SimulationFailedRpcError.code });

    await expect(withRetries(fn, { delay: 0, max: 100 })).rejects.toEqual({
      code: SimulationFailedRpcError.code
    });
    // Should be clamped to MAX_RETRIES (10) + 1 initial attempt = 11
    expect(fn).toHaveBeenCalledTimes(MAX_RETRIES + 1);
  });
});
