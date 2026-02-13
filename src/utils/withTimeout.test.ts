import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_POLLING_INTERVAL,
  MAX_TIMEOUT,
  MIN_POLLING_INTERVAL,
  MIN_TIMEOUT,
  TimeoutError,
  withTimeout
} from './withTimeout.js';

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns immediately when shouldContinue is false on first poll', async () => {
    const pollFn = vi.fn().mockResolvedValue('done');
    const promise = withTimeout(pollFn, {
      pollingInterval: 1000,
      shouldContinue: () => false,
      timeout: 5000
    });

    const result = await promise;
    expect(result).toBe('done');
    expect(pollFn).toHaveBeenCalledTimes(1);
  });

  it('polls repeatedly until shouldContinue returns false', async () => {
    let callCount = 0;
    const pollFn = vi.fn().mockImplementation(async () => {
      callCount++;
      return callCount;
    });

    const promise = withTimeout(pollFn, {
      pollingInterval: 1000,
      shouldContinue: (result: number) => result < 3,
      timeout: 10000
    });

    // First poll: returns 1, shouldContinue(1) = true → wait
    await vi.advanceTimersByTimeAsync(0);
    // After first poll, wait 1000ms for next poll
    await vi.advanceTimersByTimeAsync(1000);
    // Second poll: returns 2, shouldContinue(2) = true → wait
    await vi.advanceTimersByTimeAsync(1000);
    // Third poll: returns 3, shouldContinue(3) = false → return

    const result = await promise;
    expect(result).toBe(3);
    expect(pollFn).toHaveBeenCalledTimes(3);
  });

  it('throws TimeoutError when timeout exceeded', async () => {
    const pollFn = vi.fn().mockResolvedValue('pending');

    const promise = withTimeout(pollFn, {
      pollingInterval: 500,
      shouldContinue: () => true,
      timeout: 1000,
      timeoutErrorMessage: 'custom timeout'
    });

    // Catch the rejection early to avoid unhandled rejection warning
    const caught = promise.catch((e) => e);

    // Advance past the timeout
    await vi.advanceTimersByTimeAsync(2000);

    const error = (await caught) as TimeoutError;
    expect(error).toBeInstanceOf(TimeoutError);
    expect(error.message).toContain('custom timeout');
  });

  it('propagates pollFn errors immediately', async () => {
    const pollFn = vi.fn().mockRejectedValue(new Error('poll error'));

    const promise = withTimeout(pollFn, {
      pollingInterval: 1000,
      shouldContinue: () => true,
      timeout: 5000
    });

    await expect(promise).rejects.toThrow('poll error');
  });

  it('uses default timeout error message', async () => {
    const pollFn = vi.fn().mockResolvedValue('pending');

    const promise = withTimeout(pollFn, {
      pollingInterval: 500,
      shouldContinue: () => true,
      timeout: 1000
    });

    const caught = promise.catch((e) => e);
    await vi.advanceTimersByTimeAsync(2000);

    const error = (await caught) as TimeoutError;
    expect(error).toBeInstanceOf(TimeoutError);
    expect(error.message).toContain('Timeout waiting for result');
  });

  describe('input validation', () => {
    const validOptions = {
      pollingInterval: 1000,
      shouldContinue: () => false,
      timeout: 5000
    };
    const pollFn = vi.fn().mockResolvedValue('ok');

    it('rejects pollingInterval below minimum', async () => {
      await expect(
        withTimeout(pollFn, { ...validOptions, pollingInterval: MIN_POLLING_INTERVAL - 1 })
      ).rejects.toThrow(`pollingInterval must be at least ${MIN_POLLING_INTERVAL}ms`);
    });

    it('rejects pollingInterval above maximum', async () => {
      await expect(
        withTimeout(pollFn, { ...validOptions, pollingInterval: MAX_POLLING_INTERVAL + 1 })
      ).rejects.toThrow(`pollingInterval cannot exceed ${MAX_POLLING_INTERVAL}ms`);
    });

    it('rejects timeout below minimum', async () => {
      await expect(
        withTimeout(pollFn, { ...validOptions, timeout: MIN_TIMEOUT - 1 })
      ).rejects.toThrow(`timeout must be at least ${MIN_TIMEOUT}ms`);
    });

    it('rejects timeout above maximum', async () => {
      await expect(
        withTimeout(pollFn, { ...validOptions, timeout: MAX_TIMEOUT + 1 })
      ).rejects.toThrow(`timeout cannot exceed ${MAX_TIMEOUT}ms`);
    });

    it('rejects NaN pollingInterval', async () => {
      await expect(
        withTimeout(pollFn, { ...validOptions, pollingInterval: Number.NaN })
      ).rejects.toThrow('pollingInterval must be a finite integer');
    });

    it('rejects Infinity pollingInterval', async () => {
      await expect(
        withTimeout(pollFn, { ...validOptions, pollingInterval: Number.POSITIVE_INFINITY })
      ).rejects.toThrow('pollingInterval must be a finite integer');
    });

    it('rejects non-integer pollingInterval', async () => {
      await expect(
        withTimeout(pollFn, { ...validOptions, pollingInterval: 1000.5 })
      ).rejects.toThrow('pollingInterval must be a finite integer');
    });

    it('rejects NaN timeout', async () => {
      await expect(withTimeout(pollFn, { ...validOptions, timeout: Number.NaN })).rejects.toThrow(
        'timeout must be a finite integer'
      );
    });

    it('rejects Infinity timeout', async () => {
      await expect(
        withTimeout(pollFn, { ...validOptions, timeout: Number.POSITIVE_INFINITY })
      ).rejects.toThrow('timeout must be a finite integer');
    });

    it('rejects non-integer timeout', async () => {
      await expect(withTimeout(pollFn, { ...validOptions, timeout: 5000.5 })).rejects.toThrow(
        'timeout must be a finite integer'
      );
    });
  });
});
