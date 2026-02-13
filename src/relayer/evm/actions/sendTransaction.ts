import type { Address, Hex, SignedAuthorizationList, Transport } from 'viem';
import { hexData32Schema } from '../../../types/index.js';
import { formatAuthorization, handleRpcError } from '../../../utils/index.js';

export type SendTransactionParameters = {
  authorizationList?: SignedAuthorizationList;
  chainId: number;
  context?: unknown;
  data: Hex;
  to: Address;
};

export const sendTransaction = async (
  client: ReturnType<Transport>,
  parameters: SendTransactionParameters
): Promise<Hex> => {
  const { chainId, data, to, context, authorizationList } = parameters;

  try {
    const result = await client.request({
      method: 'relayer_sendTransaction',
      params: {
        authorizationList: authorizationList
          ? authorizationList.map(formatAuthorization)
          : undefined,
        chainId: chainId.toString(),
        context,
        data,
        to
      }
    });

    return hexData32Schema.parse(result);
  } catch (error) {
    handleRpcError(error, { authorizationList, chainId, data, to });
  }
};
