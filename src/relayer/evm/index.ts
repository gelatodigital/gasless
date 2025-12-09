import { type Hex, type HttpTransportConfig, http } from 'viem';
import {
  type Capabilities,
  type FeeData,
  type FeeQuote,
  type GetFeeDataParameters,
  type GetFeeQuoteParameters,
  type GetStatusParameters,
  getCapabilities,
  getFeeData,
  getFeeQuote,
  getStatus,
  type SendTransactionParameters,
  type Status,
  sendTransaction,
  type TerminalStatus,
  waitForStatus
} from './actions/index.js';

export * from './actions/index.js';

export type GelatoEvmRelayerClient = {
  getCapabilities: () => Promise<Capabilities>;
  getFeeData: (parameters: GetFeeDataParameters) => Promise<FeeData>;
  getFeeQuote: (parameters: GetFeeQuoteParameters) => Promise<FeeQuote>;
  getStatus: (parameters: GetStatusParameters) => Promise<Status>;
  waitForStatus: (parameters: GetStatusParameters) => Promise<TerminalStatus>;
  sendTransaction: (parameters: SendTransactionParameters) => Promise<Hex>;
};

export type GelatoEvmRelayerClientConfig = {
  apiKey: string;
  testnet: boolean;
};

// TODO: the testnet/mainnet separation won't be necessary in the future
export const createGelatoEvmRelayerClient = (
  parameters: GelatoEvmRelayerClientConfig
): GelatoEvmRelayerClient => {
  const { apiKey, testnet } = parameters;

  const config: HttpTransportConfig = {
    fetchOptions: {
      headers: {
        'X-API-Key': apiKey
      }
    }
  };

  const client = http(
    testnet ? 'https://api.t.gelato.cloud/rpc' : 'https://api.gelato.cloud/rpc',
    config
  )({});

  return {
    getCapabilities: () => getCapabilities(client),
    getFeeData: (parameters) => getFeeData(client, parameters),
    getFeeQuote: (parameters) => getFeeQuote(client, parameters),
    getStatus: (parameters) => getStatus(client, parameters),
    sendTransaction: (parameters) => sendTransaction(client, parameters),
    waitForStatus: (parameters) => waitForStatus(client, parameters)
  };
};
