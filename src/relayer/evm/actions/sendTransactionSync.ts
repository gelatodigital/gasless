import type { TransactionReceipt, Transport } from 'viem';
import { StatusCode, terminalStatusSchema } from '../../../types/schema.js';
import {
  formatAuthorization,
  handleRpcError,
  retrieveIdFromSyncTimeoutError,
  TransactionRejectedError,
  TransactionRevertedError,
  type WithRetriesOptions,
  withRetries
} from '../../../utils/index.js';
import type { WebSocketManager } from '../../../ws/types.js';
import type { SendTransactionParameters } from './sendTransaction.js';
import { waitForReceipt } from './waitForReceipt.js';

export type SendTransactionSyncOptions = {
  retries?: WithRetriesOptions;
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
  parameters: SendTransactionParameters,
  options?: SendTransactionSyncOptions
): Promise<TransactionReceipt> => {
  const { chainId, data, to, authorizationList, gas, skipSimulation } = parameters;

  const {
    timeout = 120000,
    requestTimeout = 10000,
    ws,
    throwOnReverted = false,
    pollingInterval = 2000,
    retries
  } = options || {};

  return withRetries(async () => {
    try {
      const result = await client.request(
        {
          method: 'relayer_sendTransactionSync',
          params: {
            authorizationList: authorizationList
              ? authorizationList.map(formatAuthorization)
              : undefined,
            chainId: chainId.toString(),
            data,
            gas: gas?.toString(),
            skipSimulation,
            // Always select the minimum timeout, either the http client timeout or the request timeout
            // The request timeout must always be greater so we can then parse the transaction id from the error
            // Otherwise the the http client will timeout locally
            timeout: Math.min(requestTimeout, (client.config.timeout ?? 10000) - 1000),
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
      const id = retrieveIdFromSyncTimeoutError(error);
      if (id) {
        return waitForReceipt(
          client,
          { id },
          {
            pollingInterval,
            timeout,
            ws
          }
        );
      }

      handleRpcError(error, { authorizationList, chainId, data, to });
    }
  }, retries);
};
