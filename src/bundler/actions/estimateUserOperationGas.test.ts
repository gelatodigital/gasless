import { describe, expect, it, vi } from 'vitest';
import { MOCK_ENTRY_POINT } from '../../__test__/helpers/fixtures.js';
import { createMockSmartAccount } from '../../__test__/helpers/mockSmartAccount.js';
import { createMockBundlerClient } from '../../__test__/helpers/mockTransport.js';
import { estimateUserOperationGas } from './estimateUserOperationGas.js';

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

describe('estimateUserOperationGas', () => {
  it('calls eth_estimateUserOperationGas and returns formatted gas', async () => {
    const { client, request } = createMockBundlerClient();
    const account = createMockSmartAccount();

    request.mockResolvedValue({
      callGasLimit: '0x5208',
      preVerificationGas: '0x5208',
      verificationGasLimit: '0x5208'
    });

    const result = await estimateUserOperationGas(
      Object.assign(client, { account }) as never,
      { account, entryPointAddress: MOCK_ENTRY_POINT } as never,
      true
    );

    expect(result).toBeDefined();
    expect(request).toHaveBeenCalled();
  });

  it('throws AccountNotFoundError when no account', async () => {
    const { client } = createMockBundlerClient();

    await expect(estimateUserOperationGas(client as never, {} as never, true)).rejects.toThrow(
      'Account'
    );
  });
});
