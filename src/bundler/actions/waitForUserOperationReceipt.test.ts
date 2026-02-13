import { describe, expect, it, vi } from 'vitest';
import { MOCK_ADDRESS, MOCK_TX_HASH } from '../../__test__/helpers/fixtures.js';
import { createMockBundlerClient } from '../../__test__/helpers/mockTransport.js';
import { createMockWebSocketManager } from '../../__test__/helpers/mockWebSocket.js';
import { StatusCode } from '../../types/schema.js';
import { TransactionRejectedError } from '../../utils/errors.js';
import { waitForUserOperationReceipt } from './waitForUserOperationReceipt.js';

// Hoisted mock so we can change behavior per-test
const { mockViemWait } = vi.hoisted(() => ({
  mockViemWait: vi.fn()
}));

const mockReceipt = {
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
};

// Provide explicit mock exports to avoid circular vi.importActual issue
// (types/schema.ts also imports from viem/account-abstraction, causing init cycle)
vi.mock('viem/account-abstraction', () => ({
  // Required by types/schema.ts (transitive dependency)
  formatUserOperationReceipt: (receipt: unknown) => receipt,
  waitForUserOperationReceipt: mockViemWait
}));

describe('waitForUserOperationReceipt', () => {
  it('uses polling when no WebSocket provided', async () => {
    mockViemWait.mockResolvedValue(mockReceipt);
    const { client } = createMockBundlerClient();

    const result = await waitForUserOperationReceipt(client as never, {
      hash: MOCK_TX_HASH,
      timeout: 5000
    });

    expect(result).toBeDefined();
    expect(result.userOpHash).toBe(mockReceipt.userOpHash);
  });

  it('uses polling when usePolling is true', async () => {
    mockViemWait.mockResolvedValue(mockReceipt);
    const { client } = createMockBundlerClient();
    const ws = createMockWebSocketManager();

    const result = await waitForUserOperationReceipt(client as never, {
      hash: MOCK_TX_HASH,
      timeout: 5000,
      usePolling: true,
      ws
    });

    expect(result).toBeDefined();
    // WS should not be used
    expect(ws.subscribe).not.toHaveBeenCalled();
  });

  it('races WebSocket vs polling when ws is provided', async () => {
    // Polling never resolves so WS wins
    mockViemWait.mockReturnValue(new Promise(() => {}));
    const { client } = createMockBundlerClient();
    const ws = createMockWebSocketManager();

    const promise = waitForUserOperationReceipt(client as never, {
      hash: MOCK_TX_HASH,
      timeout: 10000,
      ws
    });

    // Let the async race start
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Emit success via WebSocket
    ws.mockSubscription.emit('success', {
      chainId: 1,
      createdAt: 1700000000,
      id: MOCK_TX_HASH,
      receipt: {
        actualGasCost: 21000n,
        actualGasUsed: 21000n,
        entryPoint: MOCK_ADDRESS,
        logs: [],
        nonce: 0n,
        receipt: {},
        sender: MOCK_ADDRESS,
        success: true,
        userOpHash: MOCK_TX_HASH
      } as never,
      status: StatusCode.Success
    });

    const result = await promise;
    expect(result).toBeDefined();
  });

  it('throws TransactionRejectedError on rejected WebSocket event', async () => {
    // Polling never resolves so WS wins
    mockViemWait.mockReturnValue(new Promise(() => {}));
    const { client } = createMockBundlerClient();
    const ws = createMockWebSocketManager();

    const promise = waitForUserOperationReceipt(client as never, {
      hash: MOCK_TX_HASH,
      timeout: 10000,
      ws
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    ws.mockSubscription.emit('rejected', {
      chainId: 1,
      createdAt: 1700000000,
      data: '0x',
      id: MOCK_TX_HASH,
      message: 'Rejected',
      status: StatusCode.Rejected
    });

    await expect(promise).rejects.toThrow(TransactionRejectedError);
  });
});
