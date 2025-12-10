import type { BaseError, Chain, Client, Transport } from 'viem';
import {
  formatUserOperationReceipt,
  formatUserOperationRequest,
  getUserOperationError,
  type PrepareUserOperationParameters,
  type SendUserOperationParameters,
  type SmartAccount,
  type UserOperation,
  type UserOperationReceipt
} from 'viem/account-abstraction';
import { parseAccount } from 'viem/accounts';
import type { CapabilitiesByChain } from '../../relayer/evm/actions/index.js';
import { AccountNotFoundError, type Payment } from '../../types/index.js';
import { prepareUserOperation } from './prepareUserOperation.js';

export type SendUserOperationSyncParameters = SendUserOperationParameters & {
  timeout: number;
};

export const sendUserOperationSync = async <account extends SmartAccount | undefined>(
  client: Client<Transport, Chain | undefined, account>,
  parameters: SendUserOperationSyncParameters,
  capabilities: CapabilitiesByChain,
  payment?: Payment
): Promise<UserOperationReceipt> => {
  const { account: account_ = client.account, entryPointAddress, timeout } = parameters;

  if (!account_ && !parameters.sender) throw new AccountNotFoundError();
  const account = account_ ? parseAccount(account_) : undefined;

  const request = account
    ? await prepareUserOperation(
        client,
        parameters as unknown as PrepareUserOperationParameters,
        capabilities,
        payment,
        true
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
        // biome-ignore lint/style/noNonNullAssertion: copied from viem
        params: [rpcParameters, (entryPointAddress ?? account?.entryPoint?.address)!, { timeout }]
      } as never,
      { retryCount: 0 }
    );

    return formatUserOperationReceipt(receipt);
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
