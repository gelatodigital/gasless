import { BaseError, type TransactionReceipt } from 'viem';

export class TransactionRejectedError extends BaseError {
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
    super(`Transaction with id "${id}" rejected with message: ${errorMessage}.`, {
      metaMessages: [
        'The transaction was rejected by the relayer. This could mean that the transaction was invalid, simulation failed, payment was insufficient or that the relayer did not approve it for some other reason.',
        ' ',
        'You can attempt to retry or get the status of the transaction by:',
        '- calling the `sendTransaction` or `sendTransactionSync` Action with the same parameters',
        '- calling the `getStatus` Action with the `id`',
        '- checking the `errorData` and `errorMessage` properties of the error object'
      ],
      name: 'TransactionRejectedError'
    });
    this.id = id;
    this.chainId = chainId;
    this.createdAt = createdAt;
    this.errorData = errorData;
    this.errorMessage = errorMessage;
  }
}

/**
 * Thrown when a transaction receipt is reverted.
 */
export class TransactionRevertedError extends BaseError {
  readonly receipt: TransactionReceipt;
  readonly id: string;
  readonly chainId: number;
  readonly createdAt: number;
  readonly errorData?: unknown;
  readonly errorMessage?: string;

  constructor({
    id,
    chainId,
    createdAt,
    errorData,
    errorMessage,
    receipt
  }: {
    id: string;
    chainId: number;
    createdAt: number;
    errorData?: unknown;
    receipt: TransactionReceipt;
    errorMessage?: string;
  }) {
    super(`Transaction with hash "${receipt.transactionHash}" reverted.`, {
      metaMessages: [
        'The receipt marked the transaction as "reverted". This could mean that the function on the contract you are trying to call threw an error.',
        ' ',
        'You can attempt to extract the revert reason by:',
        '- calling the `simulateContract` or `simulateCalls` Action with the `abi` and `functionName` of the contract',
        '- using the `call` Action with raw `data`',
        '- checking the `errorData` and `errorMessage` properties of the error object'
      ],
      name: 'TransactionRevertedError'
    });

    this.receipt = receipt;
    this.id = id;
    this.chainId = chainId;
    this.createdAt = createdAt;
    this.errorData = errorData;
    this.errorMessage = errorMessage;
  }
}
