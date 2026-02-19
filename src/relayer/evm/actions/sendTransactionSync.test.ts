import { describe, expect, it, vi } from 'vitest';
import {
  MOCK_ADDRESS,
  MOCK_CALL_DATA,
  MOCK_ID,
  mockRpcTransactionReceipt,
  rejectedStatusResponse
} from '../../../__test__/helpers/fixtures.js';
import { createMockTransportClient } from '../../../__test__/helpers/mockTransport.js';
import { StatusCode } from '../../../types/schema.js';
import { TransactionRejectedError, TransactionRevertedError } from '../../../utils/errors.js';
import { sendTransactionSync } from './sendTransactionSync.js';

// Mock waitForReceipt
vi.mock('./waitForReceipt.js', () => ({
  waitForReceipt: vi.fn().mockResolvedValue({
    blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    blockNumber: 1n,
    status: 'success',
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  })
}));

describe('sendTransactionSync', () => {
  const baseParams = {
    chainId: 1,
    data: MOCK_CALL_DATA,
    to: MOCK_ADDRESS
  };

  it('returns receipt on success terminal status', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue({
      chainId: 1,
      createdAt: 1700000000,
      id: MOCK_ID,
      receipt: mockRpcTransactionReceipt(),
      status: StatusCode.Success
    });

    const result = await sendTransactionSync(client, baseParams);
    expect(result).toBeDefined();
    expect(result.transactionHash).toBeDefined();
  });

  it('throws TransactionRejectedError on rejected status', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(rejectedStatusResponse);

    await expect(sendTransactionSync(client, baseParams)).rejects.toThrow(TransactionRejectedError);
  });

  it('throws TransactionRevertedError when throwOnReverted and status is reverted', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue({
      chainId: 1,
      createdAt: 1700000000,
      data: '0x08c379a0',
      id: MOCK_ID,
      message: 'reverted',
      receipt: mockRpcTransactionReceipt(),
      status: StatusCode.Reverted
    });

    await expect(
      sendTransactionSync(client, baseParams, { throwOnReverted: true })
    ).rejects.toThrow(TransactionRevertedError);
  });

  it('falls back to waitForReceipt on timeout with id', async () => {
    const { client, request } = createMockTransportClient();
    request.mockRejectedValue({
      code: -32070,
      data: MOCK_ID,
      message: 'timeout'
    });

    const result = await sendTransactionSync(client, baseParams, { timeout: 5000 });
    expect(result).toBeDefined();
  });

  it('throws via handleRpcError on timeout without id', async () => {
    const { client, request } = createMockTransportClient();
    request.mockRejectedValue({
      code: -32070,
      message: 'timeout'
    });

    await expect(sendTransactionSync(client, baseParams)).rejects.toThrow();
  });

  it('throws via handleRpcError on non-timeout errors', async () => {
    const { client, request } = createMockTransportClient();
    request.mockRejectedValue({
      code: 4100,
      message: 'Unauthorized'
    });

    await expect(sendTransactionSync(client, baseParams)).rejects.toThrow();
  });

  it('includes gas and skipSimulation in RPC params when provided', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue({
      chainId: 1,
      createdAt: 1700000000,
      id: MOCK_ID,
      receipt: mockRpcTransactionReceipt(),
      status: StatusCode.Success
    });

    await sendTransactionSync(client, {
      ...baseParams,
      gas: 100000n,
      skipSimulation: true
    });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          gas: '100000',
          skipSimulation: true
        })
      }),
      expect.anything()
    );
  });

  it('retries on matching error code and succeeds on retry', async () => {
    const { client, request } = createMockTransportClient();
    request
      .mockRejectedValueOnce({ code: 4211, data: '0xdeadbeef', message: 'sim failed' })
      .mockResolvedValue({
        chainId: 1,
        createdAt: 1700000000,
        id: MOCK_ID,
        receipt: mockRpcTransactionReceipt(),
        status: StatusCode.Success
      });

    const result = await sendTransactionSync(client, baseParams, {
      retries: { max: 1 }
    });

    expect(result).toBeDefined();
    expect(result.transactionHash).toBeDefined();
    expect(request).toHaveBeenCalledTimes(2);
  });
});
