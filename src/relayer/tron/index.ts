import { GELATO_PROD_API, GELATO_STAGING_API } from '../../constants/index.js';
import {
  type GetExchangeRateParameters,
  type GetStatusParameters,
  getExchangeRate,
  getStatus,
  type SendTransactionParameters,
  type SendTransactionSyncParameters,
  sendTransaction,
  sendTransactionSync,
  type TronExchangeRate,
  type TronReceipt,
  type TronStatus,
  type TronTerminalStatus,
  waitForInclusion,
  waitForStatus
} from './actions/index.js';
import { createRpcClient } from './types/client.js';

export * from './actions/index.js';
export * from './errors/index.js';
export * from './types/index.js';

export type GelatoTronRelayerClient = {
  sendTransaction: (parameters: SendTransactionParameters) => Promise<string>;
  sendTransactionSync: (parameters: SendTransactionSyncParameters) => Promise<TronReceipt>;
  getStatus: (parameters: GetStatusParameters) => Promise<TronStatus>;
  waitForStatus: (parameters: GetStatusParameters) => Promise<TronTerminalStatus>;
  waitForInclusion: (parameters: GetStatusParameters) => Promise<TronReceipt>;
  getExchangeRate: (parameters: GetExchangeRateParameters) => Promise<TronExchangeRate>;
};

export type GelatoTronRelayerClientConfig = {
  apiKey: string;
  testnet: boolean;
  baseUrl?: string;
};

export const createGelatoTronRelayerClient = (
  config: GelatoTronRelayerClientConfig
): GelatoTronRelayerClient => {
  const { apiKey, testnet, baseUrl } = config;

  const base = baseUrl ?? (testnet ? GELATO_STAGING_API : GELATO_PROD_API);

  const client = createRpcClient({
    apiKey,
    baseUrl: `${base}/rpc`
  });

  return {
    getExchangeRate: (parameters) => getExchangeRate(client, parameters),
    getStatus: (parameters) => getStatus(client, parameters),
    sendTransaction: (parameters) => sendTransaction(client, parameters),
    sendTransactionSync: (parameters) => sendTransactionSync(client, parameters),
    waitForInclusion: (parameters) => waitForInclusion(client, parameters),
    waitForStatus: (parameters) => waitForStatus(client, parameters)
  };
};
