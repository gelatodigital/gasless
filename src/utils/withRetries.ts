import { SimulationFailedRpcError } from './errors.js';

export const MAX_RETRIES = 10;

export interface WithRetriesOptions {
  /** Error codes that trigger a retry. Default: [4211] (SimulationFailedRpcError) */
  errorCodes?: number[];
  /** Maximum number of retries (0-10). Default: 0 (no retries) */
  max?: number;
  /** Delay in ms before each retry. Default: 200 */
  delay?: number;
}

export async function withRetries<T>(
  fn: () => Promise<T>,
  options?: WithRetriesOptions
): Promise<T> {
  const max = Math.min(options?.max ?? 0, MAX_RETRIES);
  const errorCodes = options?.errorCodes ?? [SimulationFailedRpcError.code];
  const delay = options?.delay ?? 200;

  for (let attempt = 0; attempt <= max; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (attempt < max && code !== undefined && errorCodes.includes(code)) {
        if (delay > 0) await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('withRetries: unreachable');
}
