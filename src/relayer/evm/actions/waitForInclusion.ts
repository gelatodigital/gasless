import type { Transport } from 'viem';

import { TransactionRejectedError, TransactionRevertedError } from '../errors/index.js';
import { type GetStatusParameters, StatusCode, type TransactionReceipt } from './getStatus.js';
import { waitForStatus } from './waitForStatus.js';

export const waitForInclusion = async (
  client: ReturnType<Transport>,
  parameters: GetStatusParameters
): Promise<TransactionReceipt> => {
  const result = await waitForStatus(client, parameters);

  if (result.status === StatusCode.Included) {
    return result.receipt;
  }

  if (result.status === StatusCode.Reverted) {
    throw new TransactionRevertedError({
      chainId: result.chainId,
      createdAt: result.createdAt,
      errorData: result.data,
      errorMessage: result.message,
      id: parameters.id,
      receipt: result.receipt
    });
  }

  throw new TransactionRejectedError({
    chainId: result.chainId,
    createdAt: result.createdAt,
    errorData: result.data,
    errorMessage: result.message,
    id: parameters.id
  });
};
