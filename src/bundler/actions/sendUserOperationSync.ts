import type { BaseError, Chain, Client, Hex, Transport } from 'viem';
import {
  formatUserOperationReceipt,
  formatUserOperationRequest,
  getUserOperationError,
  getUserOperationReceipt,
  type PrepareUserOperationParameters,
  type SendUserOperationParameters,
  type SmartAccount,
  type UserOperation,
  type UserOperationReceipt,
  UserOperationReceiptNotFoundError
} from 'viem/account-abstraction';
import { parseAccount } from 'viem/accounts';
import { AccountNotFoundError } from '../../types/index.js';
import { StatusCode } from '../../types/schema.js';
import { TransactionRejectedError } from '../../utils/errors.js';
import { retrieveIdFromSyncTimeoutError } from '../../utils/index.js';
import { withTimeout } from '../../utils/withTimeout.js';
import type { WebSocketManager } from '../../ws/types.js';
import { waitForTerminalStatus } from '../../ws/waitForTerminalStatus.js';
import { prepareUserOperation } from './prepareUserOperation.js';

export type SendUserOperationSyncParameters = SendUserOperationParameters & {
  timeout?: number;
  requestTimeout?: number;
  pollingInterval?: number;
  usePolling?: boolean;
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
 * Wait for user operation receipt using HTTP polling
 * @internal
 */
const waitForReceiptPolling = async <account extends SmartAccount | undefined>(
  client: Client<Transport, Chain | undefined, account>,
  hash: Hex,
  timeout: number,
  pollingInterval: number
): Promise<UserOperationReceipt> => {
  const receipt = await withTimeout(
    async () => {
      try {
        return await getUserOperationReceipt(client, { hash });
      } catch (error) {
        // If receipt not found, return null to continue polling
        if (error instanceof UserOperationReceiptNotFoundError) {
          return null;
        }
        // Other errors propagate immediately
        throw error;
      }
    },
    {
      pollingInterval,
      shouldContinue: (receipt) => receipt === null,
      timeout,
      timeoutErrorMessage: `Timeout waiting for user operation receipt: ${hash}`
    }
  );

  // Type guard: receipt should never be null after withTimeout completes
  if (!receipt) {
    throw new Error('Unexpected null receipt after withTimeout completed');
  }

  return receipt;
};

export const sendUserOperationSync = async <account extends SmartAccount | undefined>(
  client: Client<Transport, Chain | undefined, account>,
  parameters: SendUserOperationSyncParameters,
  sponsored: boolean
): Promise<UserOperationReceipt> => {
  const {
    account: account_ = client.account,
    entryPointAddress,
    timeout = 120000,
    requestTimeout = 10000,
    pollingInterval = client.pollingInterval,
    usePolling,
    ws
  } = parameters;

  if (!account_ && !parameters.sender) throw new AccountNotFoundError();
  const account = account_ ? parseAccount(account_) : undefined;

  const request = account
    ? await prepareUserOperation(
        client,
        parameters as unknown as PrepareUserOperationParameters,
        sponsored
      )
    : parameters;

  // biome-ignore lint/style/noNonNullAssertion: copied from viem
  const signature = (parameters.signature ||
    (await account?.signUserOperation?.(request as UserOperation)))!;

  const rpcParameters = formatUserOperationRequest({
    ...request,
    signature
  } as UserOperation);

  try {
    const receipt = await client.request(
      {
        method: 'eth_sendUserOperationSync',
        params: [
          rpcParameters,
          // biome-ignore lint/style/noNonNullAssertion: copied from viem
          (entryPointAddress ?? account?.entryPoint?.address)!,
          // Always select the minimum timeout, either the http client timeout or the request timeout
          // The request timeout must always be greater so we can then parse the transaction id from the error
          // Otherwise the the http client will timeout locally
          { timeout: Math.min(requestTimeout, (client.transport.timeout ?? 10000) - 1000) }
        ]
      } as never,
      { retryCount: 0 }
    );

    return formatUserOperationReceipt(receipt);
  } catch (error) {
    const id = retrieveIdFromSyncTimeoutError(error);
    if (id) {
      // Cast to Hex since retrieveIdFromSyncTimeoutError returns string but it's always a hash
      const hash = id as Hex;

      // Use WebSocket if available and not explicitly disabled
      const shouldUseWebSocket = ws && !usePolling;

      if (!shouldUseWebSocket) {
        return await waitForReceiptPolling(client, hash, timeout, pollingInterval);
      }

      // Race WebSocket vs HTTP polling
      // Both start simultaneously, fastest wins
      return Promise.race([
        waitForReceiptWebSocket(ws, hash, timeout),
        waitForReceiptPolling(client, hash, timeout, Math.max(2_000, pollingInterval))
      ]);
    }

    // biome-ignore lint/suspicious/noExplicitAny: copied from viem
    const calls = (parameters as any).calls;
    throw getUserOperationError(error as BaseError, {
      ...(request as UserOperation),
      ...(calls ? { calls } : {}),
      signature
    });
  }
};
