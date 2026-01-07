import type { Transport } from 'viem';
import { formatAuthorization } from '../../../utils/index.js';
import { TransactionRejectedError, TransactionRevertedError } from '../errors/index.js';
import { StatusCode, type TransactionReceipt, terminalStatusSchemaWithId } from './getStatus.js';
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

  if (output.status === StatusCode.Included) {
    return output.receipt;
  }

  if (output.status === StatusCode.Reverted) {
    throw new TransactionRevertedError({
      chainId: output.chainId,
      createdAt: output.createdAt,
      errorData: output.data,
      errorMessage: output.message,
      id: output.id,
      receipt: output.receipt
    });
  }

  throw new TransactionRejectedError({
    chainId: output.chainId,
    createdAt: output.createdAt,
    errorData: output.data,
    errorMessage: output.message,
    id: output.id
  });
};
