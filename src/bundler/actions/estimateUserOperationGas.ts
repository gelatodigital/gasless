import type { BaseError, Chain, Client, Transport } from 'viem';
import {
  type EstimateUserOperationGasParameters,
  type EstimateUserOperationGasReturnType,
  formatUserOperationGas,
  formatUserOperationRequest,
  getUserOperationError,
  type PrepareUserOperationParameters,
  type SmartAccount,
  type UserOperation
} from 'viem/account-abstraction';
import { parseAccount } from 'viem/accounts';
import type { CapabilitiesByChain } from '../../relayer/evm/actions/index.js';
import { AccountNotFoundError, type Payment } from '../../types/index.js';
import { serializeStateOverride } from '../../utils/index.js';
import { prepareUserOperation } from './prepareUserOperation.js';

export const estimateUserOperationGas = async <account extends SmartAccount | undefined>(
  client: Client<Transport, Chain | undefined, account>,
  parameters: EstimateUserOperationGasParameters,
  capabilities: CapabilitiesByChain,
  payment?: Payment
): Promise<EstimateUserOperationGasReturnType> => {
  const { account: account_ = client.account, entryPointAddress, stateOverride } = parameters;

  if (!account_ && !parameters.sender) throw new AccountNotFoundError();
  const account = account_ ? parseAccount(account_) : undefined;

  const rpcStateOverride = serializeStateOverride(stateOverride);

  const request = account
    ? await prepareUserOperation(
        client,
        {
          ...parameters,
          parameters: ['authorization', 'factory', 'nonce', 'paymaster', 'signature']
        } as unknown as PrepareUserOperationParameters,
        capabilities,
        payment
      )
    : parameters;

  try {
    const params = [
      formatUserOperationRequest(request as UserOperation),
      // biome-ignore lint/style/noNonNullAssertion: copied from viem
      (entryPointAddress ?? account?.entryPoint?.address)!
    ] as const;

    const result = await client.request({
      method: 'eth_estimateUserOperationGas',
      params: rpcStateOverride ? [...params, rpcStateOverride] : [...params]
    });
    return formatUserOperationGas(result) as EstimateUserOperationGasReturnType<account>;
  } catch (error) {
    // biome-ignore lint/suspicious/noExplicitAny: copied from viem
    const calls = (parameters as any).calls;
    throw getUserOperationError(error as BaseError, {
      ...(request as UserOperation),
      ...(calls ? { calls } : {})
    });
  }
};
