import type { Chain, Client, Hex, Transport } from 'viem';
import {
  type SmartAccount,
  type UserOperationReceipt,
  waitForUserOperationReceipt as viemWaitForUserOperationReceipt,
  type WaitForUserOperationReceiptReturnType
} from 'viem/account-abstraction';
import { StatusCode } from '../../types/schema.js';
import { TransactionRejectedError } from '../../utils/errors.js';
import type { WebSocketManager } from '../../ws/types.js';
import { waitForTerminalStatus } from '../../ws/waitForTerminalStatus.js';

export type { WaitForUserOperationReceiptReturnType };

export type WaitForUserOperationReceiptParameters = {
  /** The hash of the User Operation. */
  hash: Hex;
  /** Polling frequency (in ms). Defaults to the client's pollingInterval config. */
  pollingInterval?: number;
  /** Optional timeout (in ms) to wait before stopping polling. */
  timeout?: number;
  /** Force HTTP polling instead of WebSocket */
  usePolling?: boolean;
  /** WebSocket manager for real-time updates */
  ws?: WebSocketManager<UserOperationReceipt>;
};

/**
 * Wait for user operation receipt using WebSocket
 * @internal
 */
const waitForReceiptWebSocket = async (
  wsManager: WebSocketManager<UserOperationReceipt>,
  hash: Hex,
  timeout: number
): Promise<UserOperationReceipt> => {
  const result = await waitForTerminalStatus(wsManager, hash, timeout);

  if (result.status === StatusCode.Rejected) {
    throw new TransactionRejectedError({
      chainId: result.chainId,
      createdAt: result.createdAt,
      errorData: result.data,
      errorMessage: result.message,
      id: hash
    });
  }

  return result.receipt;
};

/**
 * Wait for user operation receipt with WebSocket acceleration.
 *
 * Uses WebSocket for real-time updates if available, with automatic fallback to HTTP polling.
 * When WebSocket is available, races WS vs polling so the fastest source wins.
 */
export const waitForUserOperationReceipt = async <account extends SmartAccount | undefined>(
  client: Client<Transport, Chain | undefined, account>,
  parameters: WaitForUserOperationReceiptParameters
): Promise<WaitForUserOperationReceiptReturnType> => {
  const {
    hash,
    timeout = 120000,
    pollingInterval = client.pollingInterval,
    usePolling,
    ws
  } = parameters;

  const shouldUseWebSocket = ws && !usePolling;

  if (!shouldUseWebSocket) {
    return viemWaitForUserOperationReceipt(client, { hash, pollingInterval, timeout });
  }

  return Promise.race([
    waitForReceiptWebSocket(ws, hash, timeout),
    viemWaitForUserOperationReceipt(client, {
      hash,
      pollingInterval: Math.max(2_000, client.pollingInterval),
      timeout
    })
  ]);
};
