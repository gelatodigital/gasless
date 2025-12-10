import type { Hex } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import {
  createGelatoEvmRelayerClient,
  type FeeQuote,
  type GelatoEvmRelayerClient
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
  'getCapabilities' | 'getStatus' | 'waitForStatus'
> & {
  sendTransaction: (parameters: SendTransactionParameters) => Promise<Hex>;
  getFeeQuote: (parameters: GetFeeQuoteParameters) => Promise<FeeQuote>;
};

export type GelatoSmartAccountClientConfig = {
  apiKey: string;
  account: SmartAccount<GelatoSmartAccountImplementation>;
};

export const createGelatoSmartAccountClient = async (
  parameters: GelatoSmartAccountClientConfig
): Promise<GelatoSmartAccountClient> => {
  const { account, apiKey } = parameters;

  const client = createGelatoEvmRelayerClient({
    apiKey,
    testnet: account.chain.testnet ?? false
  });

  const capabilities = (await client.getCapabilities())[account.chain.id];

  if (!capabilities) {
    throw new Error(`Chain not supported: ${account.chain.id}`);
  }

  return {
    getCapabilities: () => client.getCapabilities(),
    getFeeQuote: (parameters) => getFeeQuote(client, account, capabilities, parameters),
    getStatus: (parameters) => client.getStatus(parameters),
    sendTransaction: (parameters) => sendTransaction(client, account, capabilities, parameters),
    waitForStatus: (parameters) => client.waitForStatus(parameters)
  };
};
