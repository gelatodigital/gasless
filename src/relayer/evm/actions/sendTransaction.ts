import type { Address, Hex, SignedAuthorizationList, Transport } from 'viem';
import { hexData32Schema } from '../../../types/index.js';
import {
  formatAuthorization,
  handleRpcError,
  type WithRetriesOptions,
  withRetries
} from '../../../utils/index.js';

export type SendTransactionParameters = {
  authorizationList?: SignedAuthorizationList;
  chainId: number;
  data: Hex;
  to: Address;
};

export type SendTransactionOptions = {
  retries?: WithRetriesOptions;
};

export const sendTransaction = async (
  client: ReturnType<Transport>,
  parameters: SendTransactionParameters,
  options?: SendTransactionOptions
): Promise<Hex> => {
  const { chainId, data, to, authorizationList } = parameters;
  const { retries } = options || {};

  return withRetries(async () => {
    try {
      const result = await client.request({
        method: 'relayer_sendTransaction',
        params: {
          authorizationList: authorizationList
            ? authorizationList.map(formatAuthorization)
            : undefined,
          chainId: chainId.toString(),
          data,
          to
        }
      });

      return hexData32Schema.parse(result);
    } catch (error) {
      handleRpcError(error, { authorizationList, chainId, data, to });
    }
  }, retries);
};
