import { describe, expect, it, vi } from 'vitest';
import { MOCK_ADDRESS, MOCK_CALL_DATA } from '../../__test__/helpers/fixtures.js';
import { createMockSmartAccount } from '../../__test__/helpers/mockSmartAccount.js';
import { createMockBundlerClient } from '../../__test__/helpers/mockTransport.js';
import { prepareUserOperation } from './prepareUserOperation.js';

// Mock getUserOperationGasPrice
vi.mock('./getUserOperationGasPrice.js', () => ({
  getUserOperationGasPrice: vi.fn().mockResolvedValue({
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 500000000n
  })
}));

// Mock estimateUserOperationGas
vi.mock('./estimateUserOperationGas.js', () => ({
  estimateUserOperationGas: vi.fn().mockResolvedValue({
    callGasLimit: 21000n,
    preVerificationGas: 21000n,
    verificationGasLimit: 100000n
  })
}));

describe('prepareUserOperation', () => {
  it('prepares user operation with all default parameters', async () => {
    const { client } = createMockBundlerClient();
    const account = createMockSmartAccount();

    const result = await prepareUserOperation(
      Object.assign(client, { account }) as never,
      {
        account,
        calls: [{ to: MOCK_ADDRESS, value: 0n }]
      } as never,
      true
    );

    expect(result).toBeDefined();
    expect(account.encodeCalls).toHaveBeenCalled();
    expect(account.getNonce).toHaveBeenCalled();
  });

  it('throws AccountNotFoundError when no account', async () => {
    const { client } = createMockBundlerClient();

    await expect(prepareUserOperation(client as never, {} as never, true)).rejects.toThrow(
      'Account'
    );
  });

  it('uses provided nonce when given', async () => {
    const { client } = createMockBundlerClient();
    const account = createMockSmartAccount();

    const result = await prepareUserOperation(
      Object.assign(client, { account }) as never,
      {
        account,
        calls: [{ to: MOCK_ADDRESS, value: 0n }],
        nonce: 42n
      } as never,
      true
    );

    expect((result as Record<string, unknown>)['nonce']).toBe(42n);
    expect(account.getNonce).not.toHaveBeenCalled();
  });

  it('uses provided callData instead of encoding calls', async () => {
    const { client } = createMockBundlerClient();
    const account = createMockSmartAccount();

    const result = await prepareUserOperation(
      Object.assign(client, { account }) as never,
      {
        account,
        callData: MOCK_CALL_DATA
      } as never,
      true
    );

    expect((result as Record<string, unknown>)['callData']).toBe(MOCK_CALL_DATA);
    expect(account.encodeCalls).not.toHaveBeenCalled();
  });

  it('uses provided fee values without fetching', async () => {
    const { client } = createMockBundlerClient();
    const account = createMockSmartAccount();

    const result = await prepareUserOperation(
      Object.assign(client, { account }) as never,
      {
        account,
        calls: [{ to: MOCK_ADDRESS, value: 0n }],
        maxFeePerGas: 999n,
        maxPriorityFeePerGas: 111n
      } as never,
      true
    );

    expect((result as Record<string, unknown>)['maxFeePerGas']).toBe(999n);
    expect((result as Record<string, unknown>)['maxPriorityFeePerGas']).toBe(111n);
  });

  it('sets initCode to 0x for entryPoint 0.6', async () => {
    const { client } = createMockBundlerClient();
    const account = createMockSmartAccount({
      entryPoint: {
        abi: [],
        address: MOCK_ADDRESS,
        version: '0.6'
      }
    } as never);

    const result = await prepareUserOperation(
      Object.assign(client, { account }) as never,
      {
        account,
        calls: [{ to: MOCK_ADDRESS, value: 0n }]
      } as never,
      true
    );

    expect((result as Record<string, unknown>)['initCode']).toBe('0x');
  });
});
