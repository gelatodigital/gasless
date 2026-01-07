import type { Transport } from 'viem';
import { formatAuthorization } from '../../../utils/index.js';
import { type TransactionReceipt, terminalStatusSchemaWithId } from './getStatus.js';
import { handleTerminalStatus } from './handleTerminalStatus.js';
import type { SendTransactionParameters } from './sendTransaction.js';

export type SendTransactionSyncParameters = SendTransactionParameters & {
  timeout?: number;
};

export const sendTransactionSync = async (
  client: ReturnType<Transport>,
  parameters: SendTransactionSyncParameters
): Promise<TransactionReceipt> => {
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

  const output = terminalStatusSchemaWithId.parse(result);

  return handleTerminalStatus(output.id, output);
};
