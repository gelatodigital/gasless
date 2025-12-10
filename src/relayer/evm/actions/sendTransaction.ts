import type { Address, Hex, SignedAuthorizationList, Transport } from 'viem';
import { hexData32Schema, type Payment } from '../../../types/index.js';
import { formatAuthorization } from '../../../utils/index.js';

export type SendTransactionParameters = {
  authorizationList?: SignedAuthorizationList;
  chainId: number;
  context?: unknown;
  data: Hex;
  payment: Payment;
  to: Address;
};

export const sendTransaction = async (
  client: ReturnType<Transport>,
  parameters: SendTransactionParameters
): Promise<Hex> => {
  const { chainId, data, to, payment, context, authorizationList } = parameters;

  const result = await client.request({
    method: 'relayer_sendTransaction',
    params: {
      authorizationList: authorizationList ? authorizationList.map(formatAuthorization) : undefined,
      chainId: chainId.toString(),
      context,
      data,
      payment,
      to
    }
  });

  return hexData32Schema.parse(result);
};
