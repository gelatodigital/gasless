import type { Hex, TransactionReceipt } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import {
  createGelatoEvmRelayerClient,
  type FeeQuote,
  type GelatoEvmRelayerClient,
  type GelatoEvmRelayerClientConfig,
  type SendTransactionOptions,
  type SendTransactionSyncOptions
} from '../relayer/index.js';
import {
  type GetFeeQuoteParameters,
  getFeeQuote,
  type SendTransactionParameters,
  type SendTransactionSyncParameters,
  sendTransaction,
  sendTransactionSync
} from './actions/index.js';
import type { GelatoSmartAccountImplementation } from './adapters/types/index.js';

export * from './adapters/index.js';

export type GelatoSmartAccountClient = Pick<
  GelatoEvmRelayerClient,
  'getBalance' | 'getCapabilities' | 'getStatus' | 'waitForReceipt' | 'ws'
> & {
  sendTransaction: (
    parameters: SendTransactionParameters,
    options?: SendTransactionOptions
  ) => Promise<Hex>;
  sendTransactionSync: (
    parameters: SendTransactionSyncParameters,
    options?: SendTransactionSyncOptions
  ) => Promise<TransactionReceipt>;
  getFeeQuote: (parameters: GetFeeQuoteParameters) => Promise<FeeQuote>;
};

export type GelatoSmartAccountClientConfig = GelatoEvmRelayerClientConfig & {
  account: SmartAccount<GelatoSmartAccountImplementation>;
};

export const createGelatoSmartAccountClient = async (
  parameters: GelatoSmartAccountClientConfig
): Promise<GelatoSmartAccountClient> => {
  const { account } = parameters;

  const client = createGelatoEvmRelayerClient({
    testnet: parameters.testnet ?? account.chain.testnet ?? false,
    ...parameters
  });

  const capabilities = (await client.getCapabilities())[account.chain.id];

  if (!capabilities) {
    throw new Error(`Chain not supported: ${account.chain.id}`);
  }

  return {
    getBalance: () => client.getBalance(),
    getCapabilities: () => client.getCapabilities(),
    getFeeQuote: (parameters) => getFeeQuote(client, account, parameters),
    getStatus: (parameters) => client.getStatus(parameters),
    sendTransaction: (parameters, options) => sendTransaction(client, account, parameters, options),
    sendTransactionSync: (parameters, options) =>
      sendTransactionSync(client, account, parameters, options),
    waitForReceipt: (parameters) => client.waitForReceipt(parameters),
    ws: client.ws
  };
};
