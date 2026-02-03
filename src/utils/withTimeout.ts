/**
 * Error thrown when a polling operation times out
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Validation constants for polling parameters
export const MIN_POLLING_INTERVAL = 100; // 100ms minimum
export const MAX_POLLING_INTERVAL = 300000; // 5 minutes maximum
export const MAX_TIMEOUT = 600000; // 10 minutes maximum

/**
 * Options for configuring the withTimeout polling behavior
 */
export interface WithTimeoutOptions<T> {
  /**
   * Function to check if polling should continue
   * Return true to continue polling, false to return the result
   *
   * @example
   * // Continue polling while status is pending
   * shouldContinue: (status) => status.status === StatusCode.Pending
   *
   * @example
   * // Continue polling while result is null
   * shouldContinue: (result) => result === null
   */
  shouldContinue: (result: T) => boolean;

  /**
   * Polling interval in milliseconds
   * Must be between 100ms and 300000ms (5 minutes)
   */
  pollingInterval: number;

  /**
   * Maximum time to wait before timing out in milliseconds
   * Must not exceed 600000ms (10 minutes)
   */
  timeout: number;

  /**
   * Error message for timeout
   * @default "Timeout waiting for result"
   */
  timeoutErrorMessage?: string;
}

/**
 * Wraps a polling operation with configurable timeout logic
 *
 * This utility provides a consistent pattern for polling operations across the codebase.
 * It repeatedly calls the provided function until either:
 * - The shouldContinue callback returns false (success)
 * - The timeout is exceeded (throws TimeoutError)
 *
 * If the poll function throws an error, it will propagate immediately and stop polling.
 * This means the poll function should handle "not ready yet" cases by returning a value
 * that shouldContinue can check, rather than throwing an error.
 *
 * @template T - The type of result returned by the polling function
 * @param pollFn - Async function to call repeatedly
 * @param options - Configuration options for polling behavior
 * @returns The result from pollFn when shouldContinue returns false
 * @throws {TimeoutError} When timeout is exceeded
 * @throws Any error thrown by pollFn is propagated immediately
 *
 * @example
 * // Poll for a status to complete
 * const status = await withTimeout(
 *   () => getStatus(client, params),
 *   {
 *     shouldContinue: (s) => s.status === StatusCode.Pending,
 *     pollingInterval: 100,
 *     timeout: 10000,
 *     timeoutErrorMessage: 'Timeout waiting for status'
 *   }
 * );
 */
export async function withTimeout<T>(
  pollFn: () => Promise<T>,
  options: WithTimeoutOptions<T>
): Promise<T> {
  const {
    shouldContinue,
    pollingInterval,
    timeout,
    timeoutErrorMessage = 'Timeout waiting for result'
  } = options;

  // Input validation to prevent DoS attacks
  if (pollingInterval < MIN_POLLING_INTERVAL) {
    throw new Error(`pollingInterval must be at least ${MIN_POLLING_INTERVAL}ms`);
  }
  if (pollingInterval > MAX_POLLING_INTERVAL) {
    throw new Error(`pollingInterval cannot exceed ${MAX_POLLING_INTERVAL}ms`);
  }
  if (timeout > MAX_TIMEOUT) {
    throw new Error(`timeout cannot exceed ${MAX_TIMEOUT}ms`);
  }
  if (timeout < 0) {
    throw new Error('timeout must be non-negative');
  }

  const startTime = Date.now();

  while (true) {
    // Poll first to ensure at least one attempt
    const result = await pollFn();

    // Check if we should continue polling or return
    if (!shouldContinue(result)) {
      return result;
    }

    // Check timeout AFTER getting result (more accurate)
    const elapsed = Date.now() - startTime;
    if (elapsed > timeout) {
      throw new TimeoutError(`${timeoutErrorMessage} (exceeded timeout of ${timeout}ms)`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollingInterval));
  }
}
