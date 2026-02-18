import { type Chain, type Client, type HttpTransportConfig, http, type Transport } from 'viem';
import {
  type BundlerActions,
  type BundlerClient,
  type BundlerClientConfig,
  createBundlerClient,
  type UserOperationReceipt
} from 'viem/account-abstraction';
import { GELATO_PROD_API, GELATO_STAGING_API } from '../constants/index.js';
import { type Balance, getBalance, getCapabilities } from '../relayer/evm/actions/index.js';
import {
  createWebSocketManager,
  type WebSocketConfig,
  type WebSocketManager
} from '../ws/index.js';
import {
  estimateUserOperationGas,
  type GetUserOperationGasPriceReturnType,
  type GetUserOperationQuoteParameters,
  type GetUserOperationQuoteReturnType,
  getUserOperationGasPrice,
  getUserOperationQuote,
  prepareUserOperation,
  type SendUserOperationSyncParameters,
  sendUserOperation,
  sendUserOperationSync,
  type WaitForUserOperationReceiptParameters,
  type WaitForUserOperationReceiptReturnType,
  waitForUserOperationReceipt
} from './actions/index.js';

export * from './actions/index.js';

export type GelatoBundlerActions = Partial<BundlerActions> & {
  getBalance: () => Promise<Balance>;
  sendUserOperationSync: (
    parameters: SendUserOperationSyncParameters
  ) => Promise<UserOperationReceipt>;
  waitForUserOperationReceipt: (
    parameters: WaitForUserOperationReceiptParameters
  ) => Promise<WaitForUserOperationReceiptReturnType>;
  getUserOperationGasPrice: () => Promise<GetUserOperationGasPriceReturnType>;
  getUserOperationQuote: (
    parameters: GetUserOperationQuoteParameters
  ) => Promise<GetUserOperationQuoteReturnType>;
  ws: WebSocketManager<UserOperationReceipt>;
};

export type GelatoBundlerClient = BundlerClient & GelatoBundlerActions;

export type GelatoBundlerClientConfig = Omit<BundlerClientConfig, 'transport' | 'userOperation'> & {
  client: Client<Transport, Chain>;
  /**
   * Whether to use sponsored payment via Gas Tank
   */
  sponsored: boolean;
  apiKey: string;
  baseUrl?: string;
  /** WebSocket configuration options */
  ws?: Omit<WebSocketConfig, 'apiKey' | 'baseUrl'>;
  httpTransportConfig?: HttpTransportConfig;
};

export const createGelatoBundlerClient = async (
  parameters: GelatoBundlerClientConfig
): Promise<GelatoBundlerClient> => {
  const { client: client_, sponsored, apiKey, baseUrl, ws: wsConfig } = parameters;

  const base = baseUrl || (client_.chain.testnet ? GELATO_STAGING_API : GELATO_PROD_API);

  let endpoint = `${base}/rpc/${client_.chain.id}`;

  if (sponsored && !endpoint.includes('payment=sponsored')) {
    endpoint += `?payment=sponsored`;
  }

  const transport = http(endpoint, {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...parameters.httpTransportConfig?.fetchOptions?.headers
      },
      ...parameters.httpTransportConfig?.fetchOptions
    },
    // Unless overriden, increase http timeout to 15s due to sync methods
    // We want the sync methods to timeout on the server not on the client
    // Default for sync methods is 10s
    timeout: 15_000,
    ...parameters.httpTransportConfig
  });

  const client = createBundlerClient({
    ...parameters,
    transport
  });

  const capabilities = (await getCapabilities(transport({})))[client_.chain.id];

  if (!capabilities) {
    throw new Error(`Chain not supported: ${client_.chain.id}`);
  }

  // Create WebSocket manager (lazy connect on first use)
  const ws = createWebSocketManager<UserOperationReceipt>({
    apiKey,
    baseUrl: base,
    heartbeatTimeout: 60000,
    maxReconnectAttempts: 5,
    reconnect: true,
    reconnectInterval: 1000,
    ...wsConfig
  });

  return client.extend(
    (client) =>
      ({
        estimateUserOperationGas: (parameters) =>
          estimateUserOperationGas(client, parameters, sponsored),
        getBalance: () => getBalance(transport({})),
        getUserOperationGasPrice: () => getUserOperationGasPrice(client, sponsored),
        getUserOperationQuote: (parameters) => getUserOperationQuote(client, parameters, sponsored),
        prepareUserOperation: (parameters) => prepareUserOperation(client, parameters, sponsored),
        sendUserOperation: (parameters) => sendUserOperation(client, parameters, sponsored),
        sendUserOperationSync: (parameters) =>
          sendUserOperationSync(client, { ...parameters, ws }, sponsored),
        waitForUserOperationReceipt: (parameters) =>
          waitForUserOperationReceipt(client, { ...parameters, ws }),
        ws
      }) as GelatoBundlerActions
  ) as unknown as GelatoBundlerClient;
};
