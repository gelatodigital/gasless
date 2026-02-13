import { describe, expect, it, vi } from 'vitest';
import { MOCK_ADDRESS, MOCK_ID, MOCK_TX_HASH } from '../../__test__/helpers/fixtures.js';
import { createMockSmartAccount } from '../../__test__/helpers/mockSmartAccount.js';
import { createMockBundlerClient } from '../../__test__/helpers/mockTransport.js';
import { sendUserOperationSync } from './sendUserOperationSync.js';

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

// Provide explicit mock exports to avoid circular vi.importActual issue
// (types/schema.ts also imports from viem/account-abstraction, causing init cycle)
vi.mock('viem/account-abstraction', () => ({
  formatUserOperationReceipt: (receipt: unknown) => receipt,
  formatUserOperationRequest: (request: unknown) => request,
  getUserOperationError: (error: unknown) => error,
  getUserOperationReceipt: vi.fn().mockResolvedValue({
    actualGasCost: 21000n,
    actualGasUsed: 21000n,
    entryPoint: '0x1234567890abcdef1234567890abcdef12345678',
    logs: [],
    nonce: 0n,
    receipt: {
      blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      blockNumber: 1n,
      from: '0x1234567890abcdef1234567890abcdef12345678',
      gasUsed: 21000n,
      logs: [],
      status: 'success',
      to: '0x1234567890abcdef1234567890abcdef12345678',
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    },
    sender: '0x1234567890abcdef1234567890abcdef12345678',
    success: true,
    userOpHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  }),
  UserOperationReceiptNotFoundError: class extends Error {
    constructor() {
      super('User Operation Receipt Not Found');
      this.name = 'UserOperationReceiptNotFoundError';
    }
  }
}));

describe('sendUserOperationSync', () => {
  it('returns formatted receipt on direct success', async () => {
    const { client, request } = createMockBundlerClient();
    const account = createMockSmartAccount();

    // Return a receipt-like object directly
    request.mockResolvedValue({
      actualGasCost: '0x5208',
      actualGasUsed: '0x5208',
      entryPoint: MOCK_ADDRESS,
      logs: [],
      nonce: '0x0',
      receipt: {
        blockHash: MOCK_TX_HASH,
        blockNumber: '0x1',
        contractAddress: null,
        cumulativeGasUsed: '0x5208',
        effectiveGasPrice: '0x3b9aca00',
        from: MOCK_ADDRESS,
        gasUsed: '0x5208',
        logs: [],
        logsBloom: `0x${'0'.repeat(512)}`,
        status: '0x1',
        to: MOCK_ADDRESS,
        transactionHash: MOCK_TX_HASH,
        transactionIndex: '0x0',
        type: '0x2'
      },
      sender: MOCK_ADDRESS,
      success: true,
      userOpHash: MOCK_TX_HASH
    });

    const result = await sendUserOperationSync(
      Object.assign(client, { account }) as never,
      {
        account,
        calls: [{ to: MOCK_ADDRESS, value: 0n }]
      } as never,
      true
    );

    expect(result).toBeDefined();
  });

  it('falls back to polling on timeout with id', async () => {
    const { client, request } = createMockBundlerClient();
    const account = createMockSmartAccount();

    // First call: timeout with id
    request.mockRejectedValue({
      code: -32070,
      data: MOCK_ID,
      message: 'timeout'
    });

    const result = await sendUserOperationSync(
      Object.assign(client, { account }) as never,
      {
        account,
        calls: [{ to: MOCK_ADDRESS, value: 0n }],
        pollingInterval: 100,
        timeout: 5000
      } as never,
      true
    );

    expect(result).toBeDefined();
  });

  it('throws AccountNotFoundError when no account', async () => {
    const { client } = createMockBundlerClient();

    await expect(sendUserOperationSync(client as never, {} as never, true)).rejects.toThrow(
      'Account'
    );
  });
});
