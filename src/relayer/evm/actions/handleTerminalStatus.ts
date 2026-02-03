import type { TransactionReceipt } from 'viem';
import { TransactionRejectedError, TransactionRevertedError } from '../errors/index.js';
import { StatusCode, type TerminalStatus } from './getStatus.js';

export const handleTerminalStatus = (id: string, status: TerminalStatus): TransactionReceipt => {
  if (status.status === StatusCode.Success) {
    return status.receipt;
  }

  if (status.status === StatusCode.Reverted) {
    throw new TransactionRevertedError({
      chainId: status.chainId,
      createdAt: status.createdAt,
      errorData: status.data,
      errorMessage: status.message,
      id,
      receipt: status.receipt
    });
  }

  throw new TransactionRejectedError({
    chainId: status.chainId,
    createdAt: status.createdAt,
    errorData: status.data,
    errorMessage: status.message,
    id
  });
};
