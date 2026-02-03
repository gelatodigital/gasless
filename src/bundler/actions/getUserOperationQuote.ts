import type { BaseError, Client, Transport } from 'viem';
import {
  type EstimateUserOperationGasParameters,
  type EstimateUserOperationGasReturnType,
  formatUserOperationRequest,
  getUserOperationError,
  type PrepareUserOperationParameters,
  type SmartAccount,
  type UserOperation
} from 'viem/account-abstraction';
import { parseAccount } from 'viem/accounts';
import type { Chain } from 'viem/chains';
import { AccountNotFoundError } from '../../types/index.js';
import { serializeStateOverride } from '../../utils/index.js';
import { prepareUserOperation } from './prepareUserOperation.js';

export type GetUserOperationQuoteParameters = Omit<
  EstimateUserOperationGasParameters,
  'paymaster' | 'paymasterContext'
>;

export type GetUserOperationQuoteReturnType = EstimateUserOperationGasReturnType & {
  fee: bigint;
  gas: bigint;
  l1Fee?: bigint;
};

export const getUserOperationQuote = async <account extends SmartAccount | undefined>(
  client: Client<Transport, Chain | undefined, account>,
  parameters: GetUserOperationQuoteParameters,
  sponsored: boolean
): Promise<GetUserOperationQuoteReturnType> => {
  const { account: account_ = client.account, entryPointAddress, stateOverride } = parameters;

  if (!account_ && !parameters.sender) throw new AccountNotFoundError();
  const account = account_ ? parseAccount(account_) : undefined;

  const rpcStateOverride = serializeStateOverride(stateOverride);

  const request = account
    ? await prepareUserOperation(
        client,
        {
          ...parameters,
          parameters: ['authorization', 'factory', 'nonce', 'signature']
        } as unknown as PrepareUserOperationParameters,
        sponsored
      )
    : parameters;

  try {
    const params = [
      formatUserOperationRequest(request as UserOperation),
      // biome-ignore lint/style/noNonNullAssertion: copied from viem
      (entryPointAddress ?? account?.entryPoint?.address)!
    ] as const;

    const { fee, gas, l1Fee, preVerificationGas, verificationGasLimit, callGasLimit } =
      await client.request({
        method: 'gelato_getUserOperationQuote',
        params: rpcStateOverride ? [...params, rpcStateOverride] : [...params]
      } as never);

    return {
      callGasLimit: BigInt(callGasLimit),
      fee: BigInt(fee),
      gas: BigInt(gas),
      l1Fee: l1Fee ? BigInt(l1Fee) : undefined,
      preVerificationGas: BigInt(preVerificationGas),
      verificationGasLimit: BigInt(verificationGasLimit)
    };
  } catch (error) {
    // biome-ignore lint/suspicious/noExplicitAny: copied from viem
    const calls = (parameters as any).calls;
    throw getUserOperationError(error as BaseError, {
      ...(request as UserOperation),
      ...(calls ? { calls } : {})
    });
  }
};
