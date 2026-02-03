import { type Chain, type Client, http, type Transport } from 'viem';
import {
  type BundlerActions,
  type BundlerClient,
  type BundlerClientConfig,
  createBundlerClient,
  type UserOperationReceipt
} from 'viem/account-abstraction';
import { GELATO_PROD_API, GELATO_STAGING_API } from '../constants/index.js';
import { getCapabilities } from '../relayer/evm/actions/index.js';
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
  sendUserOperationSync
} from './actions/index.js';

export * from './actions/index.js';

export type GelatoBundlerActions = Partial<BundlerActions> & {
  sendUserOperationSync: (
    parameters: SendUserOperationSyncParameters
  ) => Promise<UserOperationReceipt>;
  getUserOperationGasPrice: () => Promise<GetUserOperationGasPriceReturnType>;
  getUserOperationQuote: (
    parameters: GetUserOperationQuoteParameters
  ) => Promise<GetUserOperationQuoteReturnType>;
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
};

export const createGelatoBundlerClient = async (
  parameters: GelatoBundlerClientConfig
): Promise<GelatoBundlerClient> => {
  const { client: client_, sponsored, apiKey, baseUrl } = parameters;

  const base = baseUrl || (client_.chain.testnet ? GELATO_STAGING_API : GELATO_PROD_API);

  let endpoint = `${base}/rpc/${client_.chain.id}`;

  if (sponsored && !endpoint.includes('payment=sponsored')) {
    endpoint += `?payment=sponsored`;
  }

  const transport = http(endpoint, {
    fetchOptions: {
      headers: {
        'X-API-Key': apiKey
      }
    }
  });

  const client = createBundlerClient({
    ...parameters,
    transport
  });

  const capabilities = (await getCapabilities(transport({})))[client_.chain.id];

  if (!capabilities) {
    throw new Error(`Chain not supported: ${client_.chain.id}`);
  }

  return client.extend(
    (client) =>
      ({
        estimateUserOperationGas: (parameters) =>
          estimateUserOperationGas(client, parameters, sponsored),
        getUserOperationGasPrice: () => getUserOperationGasPrice(client, sponsored),
        getUserOperationQuote: (parameters) => getUserOperationQuote(client, parameters, sponsored),
        prepareUserOperation: (parameters) => prepareUserOperation(client, parameters, sponsored),
        sendUserOperation: (parameters) => sendUserOperation(client, parameters, sponsored),
        sendUserOperationSync: (parameters) => sendUserOperationSync(client, parameters, sponsored)
      }) as GelatoBundlerActions
  ) as unknown as GelatoBundlerClient;
};
