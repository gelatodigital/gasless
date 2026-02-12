import type { TransactionReceipt, Transport } from 'viem';
import { StatusCode, terminalStatusSchema } from '../../../types/schema.js';
import {
  formatAuthorization,
  retrieveIdFromError,
  TransactionRejectedError,
  TransactionRevertedError
} from '../../../utils/index.js';
import type { WebSocketManager } from '../../../ws/types.js';
import type { SendTransactionParameters } from './sendTransaction.js';
import { waitForReceipt } from './waitForReceipt.js';

export type SendTransactionSyncParameters = SendTransactionParameters & {
  timeout?: number;
  requestTimeout?: number;
  pollingInterval?: number;
  throwOnReverted?: boolean;
  ws?: WebSocketManager<TransactionReceipt>;
};

/**
 * Send transaction and wait for receipt synchronously
 *
 * Uses WebSocket for real-time updates if available, with automatic fallback to HTTP polling.
 * If the RPC call times out but returns a transaction ID, falls back to waiting for receipt.
 *
 * @param client - HTTP transport client for RPC calls
 * @param wsManager - Optional WebSocket manager for real-time updates
 * @param parameters - Transaction parameters and timeout configuration
 * @returns Transaction receipt on success
 * @throws Error if transaction is rejected or reverted
 */
export const sendTransactionSync = async (
  client: ReturnType<Transport>,
  parameters: SendTransactionSyncParameters
): Promise<TransactionReceipt> => {
  const {
    chainId,
    data,
    to,
    context,
    authorizationList,
    timeout,
    requestTimeout,
    ws,
    throwOnReverted = true
  } = parameters;

  try {
    const result = await client.request(
      {
        method: 'relayer_sendTransactionSync',
        params: {
          authorizationList: authorizationList
            ? authorizationList.map(formatAuthorization)
            : undefined,
          chainId: chainId.toString(),
          context,
          data,
          timeout: requestTimeout,
          to
        }
      },
      { retryCount: 0 }
    );

    const output = terminalStatusSchema.parse(result);

    if (output.status === StatusCode.Reverted && throwOnReverted) {
      throw new TransactionRevertedError({
        chainId: output.chainId,
        createdAt: output.createdAt,
        errorData: output.data,
        errorMessage: output.message,
        id: output.id,
        // In relayer context, receipt is always TransactionReceipt
        receipt: output.receipt as TransactionReceipt
      });
    }

    if (output.status === StatusCode.Rejected) {
      throw new TransactionRejectedError({
        chainId: output.chainId,
        createdAt: output.createdAt,
        errorData: output.data,
        errorMessage: output.message,
        id: output.id
      });
    }

    return output.receipt as TransactionReceipt;
  } catch (error) {
    console.log('error', error.message);
    const id = retrieveIdFromError(error);
    if (id) {
      return waitForReceipt(client, {
        id,
        pollingInterval: parameters.pollingInterval,
        timeout,
        ws
      });
    }

    throw error;
  }
};
