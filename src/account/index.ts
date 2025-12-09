import type { Hex } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import {
  createGelatoEvmRelayerClient,
  type FeeQuote,
  type GelatoEvmRelayerClient,
  type GelatoEvmRelayerClientConfig
} from '../relayer/index.js';
import {
  type GetFeeQuoteParameters,
  getFeeQuote,
  type SendTransactionParameters,
  sendTransaction
} from './actions/index.js';
import type { GelatoSmartAccountImplementation } from './adapters/types/index.js';

export * from './adapters/index.js';

export type GelatoSmartAccountClient = Pick<
  GelatoEvmRelayerClient,
  'getCapabilities' | 'getStatus' | 'waitForTransaction'
> & {
  sendTransaction: (parameters: SendTransactionParameters) => Promise<Hex>;
  getFeeQuote: (parameters: GetFeeQuoteParameters) => Promise<FeeQuote>;
};

export type GelatoSmartAccountClientConfig = GelatoEvmRelayerClientConfig & {
  account: SmartAccount<GelatoSmartAccountImplementation>;
};

export const createGelatoSmartAccountClient = async (
  parameters: GelatoSmartAccountClientConfig
): Promise<GelatoSmartAccountClient> => {
  const { account } = parameters;

  const client = createGelatoEvmRelayerClient(parameters);

  const capabilities = await client.getCapabilities();

  return {
    getCapabilities: () => client.getCapabilities(),
    getFeeQuote: (parameters) => getFeeQuote(client, account, capabilities, parameters),
    getStatus: (parameters) => client.getStatus(parameters),
    sendTransaction: (parameters) => sendTransaction(client, account, capabilities, parameters),
    waitForTransaction: (parameters) => client.waitForTransaction(parameters)
  };
};
