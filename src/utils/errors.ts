import type { Address, Hex, SignedAuthorizationList } from 'viem';
import { BaseError, type TransactionReceipt } from 'viem';
import { hexData32Schema } from '../types/schema.js';
import { version as gaslessVersion } from '../version.js';

class GaslessBaseError extends BaseError {
  constructor(shortMessage: string, args: ConstructorParameters<typeof BaseError>[1] = {}) {
    super(shortMessage, args);
    this.version = gaslessVersion;
    this.docsPath = 'https://docs.gelato.cloud';
  }
}

export type RpcParams = {
  to: Address;
  chainId: number;
  data: Hex;
  authorizationList?: SignedAuthorizationList;
};

function causeDetails(cause: Error) {
  return cause instanceof BaseError ? cause.details : cause.message;
}

function causeMetaMessages(cause: Error) {
  return cause instanceof BaseError ? cause.metaMessages : undefined;
}

// JSON-RPC standard errors

export class ParseRpcError extends GaslessBaseError {
  static code = -32700 as const;
  readonly code = ParseRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Parse error.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'ParseRpcError'
    });
    this.params = params;
  }
}

export class InvalidRequestRpcError extends GaslessBaseError {
  static code = -32600 as const;
  readonly code = InvalidRequestRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Invalid request.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'InvalidRequestRpcError'
    });
    this.params = params;
  }
}

export class MethodNotFoundRpcError extends GaslessBaseError {
  static code = -32601 as const;
  readonly code = MethodNotFoundRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Method not found.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'MethodNotFoundRpcError'
    });
    this.params = params;
  }
}

export class InvalidParamsRpcError extends GaslessBaseError {
  static code = -32602 as const;
  readonly code = InvalidParamsRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Invalid parameters.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'InvalidParamsRpcError'
    });
    this.params = params;
  }
}

export class InternalRpcError extends GaslessBaseError {
  static code = -32603 as const;
  readonly code = InternalRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Internal error.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'InternalRpcError'
    });
    this.params = params;
  }
}

export class TimeoutRpcError extends GaslessBaseError {
  static code = -32070 as const;
  readonly code = TimeoutRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Request timed out.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'TimeoutRpcError'
    });
    this.params = params;
  }
}

// Relayer errors

export class UnauthorizedRpcError extends GaslessBaseError {
  static code = 4100 as const;
  readonly code = UnauthorizedRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Unauthorized.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'UnauthorizedRpcError'
    });
    this.params = params;
  }
}

export class InsufficientPaymentRpcError extends GaslessBaseError {
  static code = 4200 as const;
  readonly code = InsufficientPaymentRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Insufficient payment.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'InsufficientPaymentRpcError'
    });
    this.params = params;
  }
}

export class UnsupportedPaymentTokenRpcError extends GaslessBaseError {
  static code = 4202 as const;
  readonly code = UnsupportedPaymentTokenRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Unsupported payment token.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'UnsupportedPaymentTokenRpcError'
    });
    this.params = params;
  }
}

export class InsufficientBalanceRpcError extends GaslessBaseError {
  static code = 4205 as const;
  readonly code = InsufficientBalanceRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Insufficient balance.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'InsufficientBalanceRpcError'
    });
    this.params = params;
  }
}

export class UnsupportedChainRpcError extends GaslessBaseError {
  static code = 4206 as const;
  readonly code = UnsupportedChainRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Unsupported chain.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'UnsupportedChainRpcError'
    });
    this.params = params;
  }
}

export class UnknownTransactionIdRpcError extends GaslessBaseError {
  static code = 4208 as const;
  readonly code = UnknownTransactionIdRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Unknown transaction ID.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'UnknownTransactionIdRpcError'
    });
    this.params = params;
  }
}

export class InvalidAuthorizationListRpcError extends GaslessBaseError {
  static code = 4210 as const;
  readonly code = InvalidAuthorizationListRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Invalid authorization list.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'InvalidAuthorizationListRpcError'
    });
    this.params = params;
  }
}

export class SimulationFailedRpcError extends GaslessBaseError {
  static code = 4211 as const;
  readonly code = SimulationFailedRpcError.code;
  readonly revertData: string;
  readonly params?: RpcParams;

  constructor(cause: Error & { data: string }, params?: RpcParams) {
    super('Transaction reverted on simulation.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'SimulationFailedRpcError'
    });
    this.revertData = cause.data;
    this.params = params;
  }
}

// Bundler errors

export class ValidationFailedRpcError extends GaslessBaseError {
  static code = -32500 as const;
  readonly code = ValidationFailedRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Validation failed.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'ValidationFailedRpcError'
    });
    this.params = params;
  }
}

export class PaymasterValidationFailedRpcError extends GaslessBaseError {
  static code = -32501 as const;
  readonly code = PaymasterValidationFailedRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Paymaster validation failed.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'PaymasterValidationFailedRpcError'
    });
    this.params = params;
  }
}

export class InvalidSignatureRpcError extends GaslessBaseError {
  static code = -32507 as const;
  readonly code = InvalidSignatureRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Invalid signature.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'InvalidSignatureRpcError'
    });
    this.params = params;
  }
}

export class ExecutionFailedRpcError extends GaslessBaseError {
  static code = -32521 as const;
  readonly code = ExecutionFailedRpcError.code;
  readonly params?: RpcParams;
  constructor(cause: Error, params?: RpcParams) {
    super('Execution failed.', {
      details: causeDetails(cause),
      metaMessages: causeMetaMessages(cause),
      name: 'ExecutionFailedRpcError'
    });
    this.params = params;
  }
}

/**
 * Maps an RPC error to its typed error class based on the error code.
 * If the error code doesn't match any known code, re-throws the original error.
 */
export function handleRpcError(error: unknown, params?: RpcParams): never {
  const err = error as { code?: number; message?: string; data?: unknown };
  switch (err.code) {
    case ParseRpcError.code:
      throw new ParseRpcError(err as Error, params);
    case InvalidRequestRpcError.code:
      throw new InvalidRequestRpcError(err as Error, params);
    case MethodNotFoundRpcError.code:
      throw new MethodNotFoundRpcError(err as Error, params);
    case InvalidParamsRpcError.code:
      throw new InvalidParamsRpcError(err as Error, params);
    case InternalRpcError.code:
      throw new InternalRpcError(err as Error, params);
    case TimeoutRpcError.code:
      throw new TimeoutRpcError(err as Error, params);
    case UnauthorizedRpcError.code:
      throw new UnauthorizedRpcError(err as Error, params);
    case InsufficientPaymentRpcError.code:
      throw new InsufficientPaymentRpcError(err as Error, params);
    case UnsupportedPaymentTokenRpcError.code:
      throw new UnsupportedPaymentTokenRpcError(err as Error, params);
    case InsufficientBalanceRpcError.code:
      throw new InsufficientBalanceRpcError(err as Error, params);
    case UnsupportedChainRpcError.code:
      throw new UnsupportedChainRpcError(err as Error, params);
    case UnknownTransactionIdRpcError.code:
      throw new UnknownTransactionIdRpcError(err as Error, params);
    case InvalidAuthorizationListRpcError.code:
      throw new InvalidAuthorizationListRpcError(err as Error, params);
    case SimulationFailedRpcError.code:
      throw new SimulationFailedRpcError(err as Error & { data: string; message: string }, params);
    case ValidationFailedRpcError.code:
      throw new ValidationFailedRpcError(err as Error, params);
    case PaymasterValidationFailedRpcError.code:
      throw new PaymasterValidationFailedRpcError(err as Error, params);
    case InvalidSignatureRpcError.code:
      throw new InvalidSignatureRpcError(err as Error, params);
    case ExecutionFailedRpcError.code:
      throw new ExecutionFailedRpcError(err as Error, params);
    default:
      if (error instanceof BaseError) throw error;
      throw error;
  }
}

export class TransactionRejectedError extends GaslessBaseError {
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
export class TransactionRevertedError extends GaslessBaseError {
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

/**
 * Extracts the transaction/operation ID from an error
 *
 * Expected error structure:
 * ```json
 * {
 *   "error": {
 *     "code": -X,
 *     "data": "0x... (transaction/operation hash)",
 *     "message": "..."
 *   }
 * }
 * ```
 *
 * @param error - The error to check
 * @returns The ID of the transaction/operation or undefined if not found
 */
export function retrieveIdFromError(error: unknown): Hex | undefined {
  // Type guard: check if error is an object
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const err = error as Record<string, unknown>;

  const data = err['data'] as string;

  // Validate that id/userOperationHash exists and is a hex string (transaction/operation hash)
  if (typeof data !== 'string' || data.length === 0 || !/^0x([0-9a-fA-F]{2})*$/.test(data)) {
    return undefined;
  }

  try {
    return hexData32Schema.parse(data);
  } catch {
    return undefined;
  }
}
