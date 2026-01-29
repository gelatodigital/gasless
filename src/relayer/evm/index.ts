import { type Hex, type HttpTransportConfig, http } from 'viem';
import { GELATO_PROD_API, GELATO_STAGING_API } from '../../constants/index.js';
import {
  type Capabilities,
  type FeeData,
  type FeeQuote,
  type GelatoStatus,
  type GelatoTerminalStatus,
  type GetFeeDataParameters,
  type GetFeeQuoteParameters,
  type GetGelatoStatusParameters,
  type GetStatusParameters,
  getCapabilities,
  getFeeData,
  getFeeQuote,
  getGelatoStatus,
  getStatus,
  type SendTransactionParameters,
  type SendTransactionSyncParameters,
  type Status,
  sendTransaction,
  sendTransactionSync,
  type TerminalStatus,
  type TransactionReceipt,
  waitForGelatoStatus,
  waitForReceipt,
  waitForStatus
} from './actions/index.js';

export * from './actions/index.js';

export type GelatoEvmRelayerClient = {
  getCapabilities: () => Promise<Capabilities>;
  getFeeData: (parameters: GetFeeDataParameters) => Promise<FeeData>;
  getFeeQuote: (parameters: GetFeeQuoteParameters) => Promise<FeeQuote>;
  getGelatoStatus: (parameters: GetGelatoStatusParameters) => Promise<GelatoStatus>;
  getStatus: (parameters: GetStatusParameters) => Promise<Status>;
  waitForGelatoStatus: (parameters: GetGelatoStatusParameters) => Promise<GelatoTerminalStatus>;
  waitForReceipt: (parameters: GetStatusParameters) => Promise<TransactionReceipt>;
  waitForStatus: (parameters: GetStatusParameters) => Promise<TerminalStatus>;
  sendTransaction: (parameters: SendTransactionParameters) => Promise<Hex>;
  sendTransactionSync: (parameters: SendTransactionSyncParameters) => Promise<TransactionReceipt>;
};

export type GelatoEvmRelayerClientConfig = {
  apiKey: string;
  testnet?: boolean;
  baseUrl?: string;
};

// TODO: the testnet/mainnet separation won't be necessary in the future
export const createGelatoEvmRelayerClient = (
  parameters: GelatoEvmRelayerClientConfig
): GelatoEvmRelayerClient => {
  const { apiKey, testnet, baseUrl } = parameters;

  const config: HttpTransportConfig = {
    fetchOptions: {
      headers: {
        'X-API-Key': apiKey
      }
    }
  };

  // TODO: can just use prod endpoint in the future
  const base = baseUrl || (testnet ? GELATO_STAGING_API : GELATO_PROD_API);

  const client = http(`${base}/rpc`, config)({});

  return {
    getCapabilities: () => getCapabilities(client),
    getFeeData: (parameters) => getFeeData(client, parameters),
    getFeeQuote: (parameters) => getFeeQuote(client, parameters),
    getGelatoStatus: (parameters) => getGelatoStatus(client, parameters),
    getStatus: (parameters) => getStatus(client, parameters),
    sendTransaction: (parameters) => sendTransaction(client, parameters),
    sendTransactionSync: (parameters) => sendTransactionSync(client, parameters),
    waitForGelatoStatus: (parameters) => waitForGelatoStatus(client, parameters),
    waitForReceipt: (parameters) => waitForReceipt(client, parameters),
    waitForStatus: (parameters) => waitForStatus(client, parameters)
  };
};
