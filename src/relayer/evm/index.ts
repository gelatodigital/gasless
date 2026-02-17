import { type Hex, type HttpTransportConfig, http, type TransactionReceipt } from 'viem';
import { GELATO_PROD_API, GELATO_STAGING_API } from '../../constants/index.js';
import type { Status } from '../../types/index.js';
import {
  createWebSocketManager,
  type WebSocketConfig,
  type WebSocketManager
} from '../../ws/index.js';
import {
  type Balance,
  type Capabilities,
  type FeeData,
  type FeeQuote,
  type GelatoStatus,
  type GetFeeDataParameters,
  type GetFeeQuoteParameters,
  type GetGelatoStatusParameters,
  type GetStatusParameters,
  getBalance,
  getCapabilities,
  getFeeData,
  getFeeQuote,
  getGelatoStatus,
  getStatus,
  type SendTransactionOptions,
  type SendTransactionParameters,
  type SendTransactionSyncOptions,
  sendTransaction,
  sendTransactionSync,
  type WaitForReceiptOptions,
  waitForReceipt
} from './actions/index.js';

export * from './actions/index.js';

export type GelatoEvmRelayerClient = {
  getBalance: () => Promise<Balance>;
  getCapabilities: () => Promise<Capabilities>;
  getFeeData: (parameters: GetFeeDataParameters) => Promise<FeeData>;
  getFeeQuote: (parameters: GetFeeQuoteParameters) => Promise<FeeQuote>;
  getGelatoStatus: (parameters: GetGelatoStatusParameters) => Promise<GelatoStatus>;
  getStatus: (parameters: GetStatusParameters) => Promise<Status>;
  waitForReceipt: (
    parameters: GetStatusParameters,
    options?: WaitForReceiptOptions
  ) => Promise<TransactionReceipt>;
  sendTransaction: (
    parameters: SendTransactionParameters,
    options?: SendTransactionOptions
  ) => Promise<Hex>;
  sendTransactionSync: (
    parameters: SendTransactionParameters,
    options?: SendTransactionSyncOptions
  ) => Promise<TransactionReceipt>;
  ws: WebSocketManager<TransactionReceipt>;
};

export type GelatoEvmRelayerClientConfig = {
  apiKey: string;
  pollingInterval?: number;
  timeout?: number;
  testnet?: boolean;
  baseUrl?: string;
  httpTransportConfig?: HttpTransportConfig;
  ws?: Omit<WebSocketConfig, 'apiKey' | 'baseUrl'>;
};

export const createGelatoEvmRelayerClient = (
  parameters: GelatoEvmRelayerClientConfig
): GelatoEvmRelayerClient => {
  const { apiKey, testnet, baseUrl, timeout, pollingInterval, ws: wsConfig } = parameters;

  const config: HttpTransportConfig = {
    // Unless overriden, increase http timeout to 15s due to sync methods
    // We want the sync methods to timeout on the server not on the client
    // Default for sync methods is 10s
    timeout: timeout ?? 15_000,
    ...parameters.httpTransportConfig,
    fetchOptions: {
      headers: {
        'X-API-Key': apiKey,
        ...parameters.httpTransportConfig?.fetchOptions?.headers
      },
      ...parameters.httpTransportConfig?.fetchOptions
    }
  };

  const base = baseUrl || (testnet ? GELATO_STAGING_API : GELATO_PROD_API);

  const client = http(`${base}/rpc`, config)({});

  // Create WebSocket manager (lazy connect on first use)
  const ws = createWebSocketManager<TransactionReceipt>({
    apiKey,
    baseUrl: base,
    heartbeatTimeout: 60000,
    maxReconnectAttempts: 5,
    reconnect: true,
    reconnectInterval: 1000,
    ...wsConfig
  });

  return {
    getBalance: () => getBalance(client),
    getCapabilities: () => getCapabilities(client),
    getFeeData: (parameters) => getFeeData(client, parameters),
    getFeeQuote: (parameters) => getFeeQuote(client, parameters),
    getGelatoStatus: (parameters) => getGelatoStatus(client, parameters),
    getStatus: (parameters) => getStatus(client, parameters),
    sendTransaction: (parameters, options) => sendTransaction(client, parameters, options),
    sendTransactionSync: (parameters, options) =>
      sendTransactionSync(client, parameters, {
        pollingInterval: pollingInterval ?? 2000,
        timeout: timeout ?? 120000,
        ws,
        ...options
      }),
    waitForReceipt: (parameters, options) =>
      waitForReceipt(client, parameters, {
        pollingInterval: pollingInterval ?? 2000,
        timeout: timeout ?? 120000,
        ws,
        ...options
      }),
    ws
  };
};
