import { type Chain, type Client, http, type Transport } from 'viem';
import {
  type BundlerActions,
  type BundlerClient,
  type BundlerClientConfig,
  createBundlerClient
} from 'viem/account-abstraction';
import { type Payment, PaymentType } from '../types/index.js';
import {
  estimateUserOperationGas,
  type GetUserOperationGasPriceReturnType,
  type GetUserOperationQuoteParameters,
  type GetUserOperationQuoteReturnType,
  getCapabilities,
  getUserOperationGasPrice,
  getUserOperationQuote,
  prepareUserOperation,
  sendUserOperation
} from './actions/index.js';

export type GelatoBundlerActions = Partial<BundlerActions> & {
  getUserOperationGasPrice: () => Promise<GetUserOperationGasPriceReturnType>;
  getUserOperationQuote: (
    parameters: GetUserOperationQuoteParameters
  ) => Promise<GetUserOperationQuoteReturnType>;
};

export type GelatoBundlerClient = BundlerClient & GelatoBundlerActions;

export type GelatoBundlerClientConfig = Omit<BundlerClientConfig, 'transport' | 'userOperation'> & {
  client: Client<Transport, Chain>;
  payment?: Payment;
  apiKey: string;
};

export const createGelatoBundlerClient = async (
  parameters: GelatoBundlerClientConfig
): Promise<GelatoBundlerClient> => {
  const { client: client_, payment, apiKey } = parameters;

  const base = client_.chain.testnet ? 'https://api.t.gelato.cloud' : 'https://api.gelato.cloud';
  let endpoint = `${base}/rpc/${client_.chain.id}`;

  if (payment) {
    endpoint += `?payment=${payment.type}`;

    if (payment.type === PaymentType.Token) {
      endpoint += `&token=${payment.address}`; // TODO: rename token to address
    }
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

  const capabilities = await getCapabilities(client);

  return client.extend(
    (client) =>
      ({
        estimateUserOperationGas: (parameters) =>
          estimateUserOperationGas(client, parameters, capabilities, payment),
        getUserOperationGasPrice: () => getUserOperationGasPrice(client, payment),
        getUserOperationQuote: (parameters) =>
          getUserOperationQuote(client, parameters, capabilities, payment),
        prepareUserOperation: (parameters) =>
          prepareUserOperation(client, parameters, capabilities, payment),
        sendUserOperation: (parameters) =>
          sendUserOperation(client, parameters, capabilities, payment)
      }) as GelatoBundlerActions
  ) as unknown as GelatoBundlerClient;
};
