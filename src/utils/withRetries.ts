import { SimulationFailedRpcError } from './errors.js';

export const MAX_RETRIES = 5;

export interface WithRetriesOptions {
  /** Error codes that trigger a retry. Default: [4211] (SimulationFailedRpcError) */
  errorCodes?: number[];
  /** Maximum number of retries (0-10). Default: 0 (no retries) */
  max?: number;
  /** Delay in ms before each retry. Default: 200 */
  delay?: number;
  /** Backoff strategy. 'fixed' keeps constant delay, 'exponential' doubles each retry. Default: 'exponential' */
  backoff?: 'fixed' | 'exponential';
  /** Maximum delay in ms. Caps exponential backoff so it never exceeds this value. Default: 10000 */
  maxDelay?: number;
}

export async function withRetries<T>(
  fn: () => Promise<T>,
  options?: WithRetriesOptions
): Promise<T> {
  const max = Math.min(options?.max ?? 0, MAX_RETRIES);
  const errorCodes = options?.errorCodes ?? [SimulationFailedRpcError.code];
  const delay = options?.delay ?? 200;
  const backoff = options?.backoff ?? 'exponential';
  const maxDelay = options?.maxDelay ?? 12_000;

  for (let attempt = 0; attempt <= max; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (attempt < max && code !== undefined && errorCodes.includes(code)) {
        const wait = backoff === 'exponential' ? Math.min(delay * 2 ** attempt, maxDelay) : delay;
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw error;
    }
  }
  throw new Error('withRetries: unreachable');
}
