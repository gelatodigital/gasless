import type { TransactionReceipt, Transport } from 'viem';
import { StatusCode, type TerminalStatus } from '../../../types/schema.js';
import { TransactionRejectedError, TransactionRevertedError } from '../../../utils/errors.js';
import { withTimeout } from '../../../utils/withTimeout.js';
import type { WebSocketManager } from '../../../ws/types.js';
import { waitForTerminalStatus } from '../../../ws/waitForTerminalStatus.js';
import { type GetStatusParameters, getStatus } from './getStatus.js';

export type WaitForReceiptOptions = {
  timeout?: number;
  pollingInterval?: number;
  usePolling?: boolean;
  ws?: WebSocketManager<TransactionReceipt>;
  throwOnReverted?: boolean;
};

/**
 * Wait for terminal status using HTTP polling
 * @internal
 */
const waitForReceiptPolling = async (
  client: ReturnType<Transport>,
  parameters: GetStatusParameters,
  options?: WaitForReceiptOptions
): Promise<TerminalStatus> => {
  const { timeout = 120000, pollingInterval = 2000 } = options || {};

  const result = await withTimeout(() => getStatus(client, parameters), {
    pollingInterval,
    shouldContinue: (status) =>
      status.status === StatusCode.Pending || status.status === StatusCode.Submitted,
    timeout,
    timeoutErrorMessage: `Timeout waiting for status for transaction ${parameters.id}`
  });

  // Runtime validation instead of unsafe type assertion
  if (result.status === StatusCode.Pending || result.status === StatusCode.Submitted) {
    throw new Error(
      `Internal error: withTimeout returned non-terminal status ${result.status} for transaction ${parameters.id}`
    );
  }

  return result;
};

/**
 * Wait for transaction receipt (terminal status with Success only)
 *
 * Uses WebSocket for real-time updates if available, with automatic fallback to HTTP polling.
 *
 * @param client - HTTP transport client for RPC calls
 * @param wsManager - Optional WebSocket manager for real-time updates
 * @param parameters - Transaction ID and timeout/polling configuration
 * @returns Transaction receipt on success
 * @throws Error if transaction is rejected or reverted
 */
export const waitForReceipt = async (
  client: ReturnType<Transport>,
  parameters: GetStatusParameters,
  options?: WaitForReceiptOptions
): Promise<TransactionReceipt> => {
  const {
    usePolling,
    throwOnReverted = false,
    timeout = 120000,
    pollingInterval = 2000,
    ws
  } = options || {};

  const { id } = parameters;

  // Use WebSocket if available and not explicitly disabled
  const shouldUseWebSocket = ws && !usePolling;

  // Race WebSocket vs HTTP polling
  // Both start simultaneously, fastest wins
  const result = shouldUseWebSocket
    ? await Promise.race([
        // biome-ignore lint/style/noNonNullAssertion: asserted above
        waitForTerminalStatus(ws!, id, timeout) as Promise<TerminalStatus>,
        waitForReceiptPolling(client, parameters, {
          ...options,
          pollingInterval: pollingInterval ? Math.max(2_000, pollingInterval) : 2_000
        })
      ])
    : await waitForReceiptPolling(client, parameters);

  if (result.status === StatusCode.Reverted && throwOnReverted) {
    throw new TransactionRevertedError({
      chainId: result.chainId,
      createdAt: result.createdAt,
      errorData: result.data,
      errorMessage: result.message,
      id: parameters.id,
      receipt: result.receipt as TransactionReceipt
    });
  }

  if (result.status === StatusCode.Rejected) {
    throw new TransactionRejectedError({
      chainId: result.chainId,
      createdAt: result.createdAt,
      errorData: result.data,
      errorMessage: result.message,
      id: parameters.id
    });
  }

  return result.receipt as TransactionReceipt;
};
