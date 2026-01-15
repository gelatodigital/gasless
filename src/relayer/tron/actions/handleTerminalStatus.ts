import { TronTransactionRejectedError, TronTransactionRevertedError } from '../errors/index.js';
import { StatusCode, type TronReceipt, type TronTerminalStatus } from './getStatus.js';

export const handleTerminalStatus = (id: string, status: TronTerminalStatus): TronReceipt => {
  if (status.status === StatusCode.Included) {
    return status.receipt;
  }

  if (status.status === StatusCode.Reverted) {
    throw new TronTransactionRevertedError({
      chainId: Number(status.chainId),
      createdAt: status.createdAt,
      errorData: status.data,
      errorMessage: status.message,
      id,
      receipt: status.receipt
    });
  }

  throw new TronTransactionRejectedError({
    chainId: Number(status.chainId),
    createdAt: status.createdAt,
    errorData: status.data,
    errorMessage: status.message,
    id
  });
};
