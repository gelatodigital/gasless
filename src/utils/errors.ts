import type { Hex } from 'viem';
import { hexData32Schema } from '../types/schema.js';

/**
 * Extracts the transaction/operation ID from an error
 *
 * Expected error structure:
 * ```json
 * {
 *   "error": {
 *     "code": -X,
 *     "data": "0x... (transaction/operation hash)",
 *     "message": "..."
 *   }
 * }
 * ```
 *
 * @param error - The error to check
 * @returns The ID of the transaction/operation or undefined if not found
 */
export function retrieveIdFromError(error: unknown): Hex | undefined {
  // Type guard: check if error is an object
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const err = error as Record<string, unknown>;

  const data = err['data'] as string;

  // Validate that id/userOperationHash exists and is a string (transaction/operation hash)
  if (typeof data !== 'string' || data.length === 0) {
    return undefined;
  }

  try {
    return hexData32Schema.parse(data);
  } catch {
    return undefined;
  }
}
