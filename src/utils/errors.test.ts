import { BaseError } from 'viem';
import { describe, expect, it } from 'vitest';
import { MOCK_ID, MOCK_TX_HASH, mockTransactionReceipt } from '../__test__/helpers/fixtures.js';
import {
  ExecutionFailedRpcError,
  handleRpcError,
  InsufficientBalanceRpcError,
  InsufficientPaymentRpcError,
  InternalRpcError,
  InvalidAuthorizationListRpcError,
  InvalidParamsRpcError,
  InvalidRequestRpcError,
  InvalidSignatureRpcError,
  MethodNotFoundRpcError,
  ParseRpcError,
  PaymasterValidationFailedRpcError,
  retrieveIdFromSyncTimeoutError,
  SimulationFailedRpcError,
  TimeoutRpcError,
  TransactionRejectedError,
  TransactionRevertedError,
  UnauthorizedRpcError,
  UnknownTransactionIdRpcError,
  UnsupportedChainRpcError,
  UnsupportedPaymentTokenRpcError,
  ValidationFailedRpcError
} from './errors.js';

describe('handleRpcError', () => {
  const errorClasses = [
    { Class: ParseRpcError, code: -32700 },
    { Class: InvalidRequestRpcError, code: -32600 },
    { Class: MethodNotFoundRpcError, code: -32601 },
    { Class: InvalidParamsRpcError, code: -32602 },
    { Class: InternalRpcError, code: -32603 },
    { Class: TimeoutRpcError, code: -32070 },
    { Class: UnauthorizedRpcError, code: 4100 },
    { Class: InsufficientPaymentRpcError, code: 4200 },
    { Class: UnsupportedPaymentTokenRpcError, code: 4202 },
    { Class: InsufficientBalanceRpcError, code: 4205 },
    { Class: UnsupportedChainRpcError, code: 4206 },
    { Class: UnknownTransactionIdRpcError, code: 4208 },
    { Class: InvalidAuthorizationListRpcError, code: 4210 },
    { Class: ValidationFailedRpcError, code: -32500 },
    { Class: PaymasterValidationFailedRpcError, code: -32501 },
    { Class: InvalidSignatureRpcError, code: -32507 },
    { Class: ExecutionFailedRpcError, code: -32521 }
  ];

  for (const { Class, code } of errorClasses) {
    it(`maps code ${code} to ${Class.name}`, () => {
      const error = { code, message: 'test error' };
      expect(() => handleRpcError(error)).toThrow(Class);
    });
  }

  it('maps SimulationFailedRpcError (4211) with data', () => {
    const error = { code: 4211, data: '0xdeadbeef', message: 'sim failed' };
    expect(() => handleRpcError(error)).toThrow(SimulationFailedRpcError);
    try {
      handleRpcError(error);
    } catch (e) {
      expect((e as SimulationFailedRpcError).revertData).toBe('0xdeadbeef');
    }
  });

  it('re-throws unknown error codes', () => {
    const error = { code: 9999, message: 'unknown' };
    expect(() => handleRpcError(error)).toThrow();
  });

  it('re-throws BaseError instances directly for unknown codes', () => {
    const error = new BaseError('base error');
    Object.assign(error, { code: 9999 });
    expect(() => handleRpcError(error)).toThrow(BaseError);
  });

  it('passes params to error class', () => {
    const error = { code: -32700, message: 'parse error' };
    const params = {
      chainId: 1,
      data: '0x' as const,
      to: '0x1234567890abcdef1234567890abcdef12345678' as const
    };
    try {
      handleRpcError(error, params);
    } catch (e) {
      expect((e as ParseRpcError).params).toEqual(params);
    }
  });
});

describe('retrieveIdFromSyncTimeoutError', () => {
  it('extracts hex from timeout error with data field', () => {
    const error = { code: -32070, data: MOCK_ID, message: 'timeout' };
    expect(retrieveIdFromSyncTimeoutError(error)).toBe(MOCK_ID);
  });

  it('returns undefined for non-object errors', () => {
    expect(retrieveIdFromSyncTimeoutError('string error')).toBeUndefined();
    expect(retrieveIdFromSyncTimeoutError(null)).toBeUndefined();
    expect(retrieveIdFromSyncTimeoutError(undefined)).toBeUndefined();
    expect(retrieveIdFromSyncTimeoutError(42)).toBeUndefined();
  });

  it('returns undefined when data is missing', () => {
    expect(retrieveIdFromSyncTimeoutError({ code: -32070, message: 'timeout' })).toBeUndefined();
  });

  it('returns undefined when data is not a valid 32-byte hex', () => {
    expect(retrieveIdFromSyncTimeoutError({ data: '0x1234' })).toBeUndefined();
    expect(retrieveIdFromSyncTimeoutError({ data: 'not-hex' })).toBeUndefined();
    expect(retrieveIdFromSyncTimeoutError({ data: '' })).toBeUndefined();
  });

  it('returns undefined when data is not a string', () => {
    expect(retrieveIdFromSyncTimeoutError({ data: 123 })).toBeUndefined();
  });
});

describe('TransactionRejectedError', () => {
  it('sets all properties', () => {
    const error = new TransactionRejectedError({
      chainId: 1,
      createdAt: 1700000000,
      errorData: '0xdata',
      errorMessage: 'rejected reason',
      id: MOCK_ID
    });

    expect(error.id).toBe(MOCK_ID);
    expect(error.chainId).toBe(1);
    expect(error.createdAt).toBe(1700000000);
    expect(error.errorData).toBe('0xdata');
    expect(error.errorMessage).toBe('rejected reason');
    expect(error.name).toBe('TransactionRejectedError');
    expect(error.message).toContain(MOCK_ID);
  });
});

describe('TransactionRevertedError', () => {
  it('sets all properties including receipt', () => {
    const receipt = mockTransactionReceipt();
    const error = new TransactionRevertedError({
      chainId: 1,
      createdAt: 1700000000,
      errorData: '0xrevert',
      errorMessage: 'reverted',
      id: MOCK_ID,
      receipt
    });

    expect(error.id).toBe(MOCK_ID);
    expect(error.chainId).toBe(1);
    expect(error.createdAt).toBe(1700000000);
    expect(error.receipt).toBe(receipt);
    expect(error.errorData).toBe('0xrevert');
    expect(error.errorMessage).toBe('reverted');
    expect(error.name).toBe('TransactionRevertedError');
    expect(error.message).toContain(MOCK_TX_HASH);
  });
});
