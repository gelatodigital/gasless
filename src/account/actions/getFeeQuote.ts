import { type Address, type Call, zeroAddress } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import type { FeeQuote, GelatoEvmRelayerClient } from '../../relayer/index.js';
import type { GelatoSmartAccountImplementation } from '../adapters/types/index.js';

export type GetFeeQuoteParameters = {
  token?: Address;
  calls: Call[];
};

export const getFeeQuote = async (
  client: GelatoEvmRelayerClient,
  account: SmartAccount<GelatoSmartAccountImplementation>,
  parameters: GetFeeQuoteParameters
): Promise<FeeQuote> => {
  const { token } = parameters;

  const { estimatedGas, estimatedL1Fee } = await account.estimate({ calls: parameters.calls });

  return await client.getFeeQuote({
    chainId: account.chain.id,
    gas: estimatedGas,
    l1Fee: estimatedL1Fee,
    token: token ?? zeroAddress
  });
};
