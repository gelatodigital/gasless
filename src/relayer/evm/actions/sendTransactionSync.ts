import type { Transport } from 'viem';
import { formatAuthorization } from '../../../utils/index.js';
import { type TerminalStatus, terminalStatusSchema } from './getStatus.js';
import type { SendTransactionParameters } from './sendTransaction.js';

export type SendTransactionSyncParameters = SendTransactionParameters & {
  timeout: number;
};

export const sendTransactionSync = async (
  client: ReturnType<Transport>,
  parameters: SendTransactionSyncParameters
): Promise<TerminalStatus> => {
  const { chainId, data, to, payment, context, authorizationList, timeout } = parameters;

  const result = await client.request({
    method: 'relayer_sendTransactionSync',
    params: {
      authorizationList: authorizationList ? authorizationList.map(formatAuthorization) : undefined,
      chainId: chainId.toString(),
      context,
      data,
      payment,
      timeout,
      to
    }
  });

  return terminalStatusSchema.parse(result);
};
