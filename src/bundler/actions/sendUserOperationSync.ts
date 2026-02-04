import type { BaseError, Chain, Client, Transport } from 'viem';
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
import { retrieveIdFromError } from '../../utils/index.js';
import { withTimeout } from '../../utils/withTimeout.js';
import { prepareUserOperation } from './prepareUserOperation.js';

export type SendUserOperationSyncParameters = SendUserOperationParameters & {
  timeout?: number;
  requestTimeout?: number;
  pollingInterval?: number;
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
    requestTimeout,
    pollingInterval = client.pollingInterval
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
          { timeout: requestTimeout }
        ]
      } as never,
      { retryCount: 0 }
    );

    return formatUserOperationReceipt(receipt);
  } catch (error) {
    const id = retrieveIdFromError(error);
    if (id) {
      // Wrap getUserOperationReceipt with withTimeout for proper timeout handling
      const receipt = await withTimeout(
        async () => {
          try {
            return await getUserOperationReceipt(client, { hash: id });
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
          timeoutErrorMessage: `Timeout waiting for user operation receipt: ${id}`
        }
      );

      // Type guard: receipt should never be null after withTimeout completes
      if (!receipt) {
        throw new Error('Unexpected null receipt after withTimeout completed');
      }

      return receipt;
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
