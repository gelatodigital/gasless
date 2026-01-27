import type { TronReceipt } from '../actions/getStatus.js';

/** Error thrown when a Tron transaction is rejected by the relayer */
export class TronTransactionRejectedError extends Error {
  readonly id: string;
  readonly chainId: number;
  readonly createdAt: number;
  readonly errorData?: unknown;
  readonly errorMessage?: string;

  constructor({
    id,
    chainId,
    createdAt,
    errorMessage,
    errorData
  }: {
    id: string;
    chainId: number;
    createdAt: number;
    errorMessage?: string;
    errorData?: unknown;
  }) {
    super(`Tron transaction with id "${id}" rejected: ${errorMessage ?? 'Unknown reason'}`);
    this.name = 'TronTransactionRejectedError';
    this.id = id;
    this.chainId = chainId;
    this.createdAt = createdAt;
    this.errorData = errorData;
    this.errorMessage = errorMessage;
  }
}

/** Error thrown when a Tron transaction reverts on-chain */
export class TronTransactionRevertedError extends Error {
  readonly receipt: TronReceipt;
  readonly id: string;
  readonly chainId: number;
  readonly createdAt: number;
  readonly errorData?: string;
  readonly errorMessage?: string;

  constructor({
    id,
    chainId,
    createdAt,
    errorData,
    receipt,
    errorMessage
  }: {
    id: string;
    chainId: number;
    createdAt: number;
    errorData?: string;
    receipt: TronReceipt;
    errorMessage?: string;
  }) {
    super(`Tron transaction with hash "${receipt.transactionHash}" reverted.`);
    this.name = 'TronTransactionRevertedError';
    this.receipt = receipt;
    this.id = id;
    this.chainId = chainId;
    this.createdAt = createdAt;
    this.errorData = errorData;
    this.errorMessage = errorMessage;
  }
}
