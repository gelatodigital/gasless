import type { BaseError, Chain, Client, Transport } from 'viem';
import {
  formatUserOperationRequest,
  getUserOperationError,
  type PrepareUserOperationParameters,
  type SendUserOperationParameters,
  type SendUserOperationReturnType,
  type SmartAccount,
  type UserOperation
} from 'viem/account-abstraction';
import { parseAccount } from 'viem/accounts';
import { AccountNotFoundError } from '../../types/index.js';
import { prepareUserOperation } from './prepareUserOperation.js';

export const sendUserOperation = async <account extends SmartAccount | undefined>(
  client: Client<Transport, Chain | undefined, account>,
  parameters: SendUserOperationParameters,
  sponsored: boolean
): Promise<SendUserOperationReturnType> => {
  const { account: account_ = client.account, entryPointAddress } = parameters;

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
    return await client.request(
      {
        method: 'eth_sendUserOperation',
        // biome-ignore lint/style/noNonNullAssertion: copied from viem
        params: [rpcParameters, (entryPointAddress ?? account?.entryPoint?.address)!]
      },
      { retryCount: 0 }
    );
  } catch (error) {
    // biome-ignore lint/suspicious/noExplicitAny: copied from viem
    const calls = (parameters as any).calls;
    throw getUserOperationError(error as BaseError, {
      ...(request as UserOperation),
      ...(calls ? { calls } : {}),
      signature
    });
  }
};
