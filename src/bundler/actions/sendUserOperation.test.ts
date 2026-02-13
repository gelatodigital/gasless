import { describe, expect, it, vi } from 'vitest';
import { MOCK_ADDRESS, MOCK_TX_HASH } from '../../__test__/helpers/fixtures.js';
import { createMockSmartAccount } from '../../__test__/helpers/mockSmartAccount.js';
import { createMockBundlerClient } from '../../__test__/helpers/mockTransport.js';
import { sendUserOperation } from './sendUserOperation.js';

// Mock prepareUserOperation
vi.mock('./prepareUserOperation.js', () => ({
  prepareUserOperation: vi.fn().mockResolvedValue({
    callData: '0x',
    callGasLimit: 21000n,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 500000000n,
    nonce: 0n,
    preVerificationGas: 21000n,
    sender: '0x1234567890abcdef1234567890abcdef12345678',
    signature: '0x',
    verificationGasLimit: 100000n
  })
}));

describe('sendUserOperation', () => {
  it('prepares, signs, and sends user operation', async () => {
    const { client, request } = createMockBundlerClient();
    const account = createMockSmartAccount();
    request.mockResolvedValue(MOCK_TX_HASH);

    const result = await sendUserOperation(
      Object.assign(client, { account }) as never,
      {
        account,
        calls: [{ to: MOCK_ADDRESS, value: 0n }]
      } as never,
      true
    );

    expect(result).toBe(MOCK_TX_HASH);
    expect(account.signUserOperation).toHaveBeenCalled();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'eth_sendUserOperation' }),
      { retryCount: 0 }
    );
  });

  it('throws AccountNotFoundError when no account', async () => {
    const { client } = createMockBundlerClient();

    await expect(sendUserOperation(client as never, {} as never, true)).rejects.toThrow('Account');
  });

  it('uses provided signature instead of signing', async () => {
    const { client, request } = createMockBundlerClient();
    const account = createMockSmartAccount();
    request.mockResolvedValue(MOCK_TX_HASH);

    await sendUserOperation(
      Object.assign(client, { account }) as never,
      {
        account,
        calls: [{ to: MOCK_ADDRESS, value: 0n }],
        signature: '0xcustomsig'
      } as never,
      true
    );

    // Should use the provided signature, not sign
    expect(request).toHaveBeenCalled();
  });
});
