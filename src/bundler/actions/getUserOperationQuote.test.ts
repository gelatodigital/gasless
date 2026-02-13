import { describe, expect, it, vi } from 'vitest';
import { MOCK_ENTRY_POINT } from '../../__test__/helpers/fixtures.js';
import { createMockSmartAccount } from '../../__test__/helpers/mockSmartAccount.js';
import { createMockBundlerClient } from '../../__test__/helpers/mockTransport.js';
import { getUserOperationQuote } from './getUserOperationQuote.js';

// Mock prepareUserOperation
vi.mock('./prepareUserOperation.js', () => ({
  prepareUserOperation: vi.fn().mockResolvedValue({
    callData: '0x',
    callGasLimit: 0n,
    maxFeePerGas: 0n,
    maxPriorityFeePerGas: 0n,
    nonce: 0n,
    preVerificationGas: 0n,
    sender: '0x1234567890abcdef1234567890abcdef12345678',
    signature: '0x',
    verificationGasLimit: 0n
  })
}));

describe('getUserOperationQuote', () => {
  it('calls gelato_getUserOperationQuote and returns bigint values', async () => {
    const { client, request } = createMockBundlerClient();
    const account = createMockSmartAccount();

    request.mockResolvedValue({
      callGasLimit: '0x5208',
      fee: '0x2386f26fc10000',
      gas: '0x30d40',
      preVerificationGas: '0x5208',
      verificationGasLimit: '0x5208'
    });

    const result = await getUserOperationQuote(
      Object.assign(client, { account }) as never,
      { account, entryPointAddress: MOCK_ENTRY_POINT } as never,
      true
    );

    expect(result.fee).toBe(BigInt('0x2386f26fc10000'));
    expect(result.gas).toBe(BigInt('0x30d40'));
    expect(result.callGasLimit).toBe(BigInt('0x5208'));
    expect(result.l1Fee).toBeUndefined();
  });

  it('includes l1Fee when present', async () => {
    const { client, request } = createMockBundlerClient();
    const account = createMockSmartAccount();

    request.mockResolvedValue({
      callGasLimit: '0x5208',
      fee: '0x100',
      gas: '0x100',
      l1Fee: '0x200',
      preVerificationGas: '0x5208',
      verificationGasLimit: '0x5208'
    });

    const result = await getUserOperationQuote(
      Object.assign(client, { account }) as never,
      { account, entryPointAddress: MOCK_ENTRY_POINT } as never,
      true
    );

    expect(result.l1Fee).toBe(BigInt('0x200'));
  });

  it('throws AccountNotFoundError when no account', async () => {
    const { client } = createMockBundlerClient();

    await expect(getUserOperationQuote(client as never, {} as never, true)).rejects.toThrow(
      'Account'
    );
  });
});
