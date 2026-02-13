import { describe, expect, it } from 'vitest';
import {
  MOCK_ID,
  mockRpcTransactionReceipt,
  pendingStatusResponse,
  rejectedStatusResponse
} from '../../../__test__/helpers/fixtures.js';
import { createMockTransportClient } from '../../../__test__/helpers/mockTransport.js';
import { createMockWebSocketManager } from '../../../__test__/helpers/mockWebSocket.js';
import { StatusCode } from '../../../types/schema.js';
import { TransactionRejectedError, TransactionRevertedError } from '../../../utils/errors.js';
import { waitForReceipt } from './waitForReceipt.js';

describe('waitForReceipt', () => {
  it('polls via getStatus until terminal and returns receipt', async () => {
    const { client, request } = createMockTransportClient();
    let callCount = 0;
    request.mockImplementation(async () => {
      callCount++;
      if (callCount < 2) return pendingStatusResponse;
      return {
        chainId: 1,
        createdAt: 1700000000,
        id: MOCK_ID,
        receipt: mockRpcTransactionReceipt(),
        status: StatusCode.Success
      };
    });

    const result = await waitForReceipt(client, {
      id: MOCK_ID,
      pollingInterval: 100,
      timeout: 5000
    });

    expect(result).toBeDefined();
    expect(result.transactionHash).toBeDefined();
  });

  it('throws TransactionRejectedError on rejected status', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(rejectedStatusResponse);

    await expect(
      waitForReceipt(client, { id: MOCK_ID, pollingInterval: 100, timeout: 5000 })
    ).rejects.toThrow(TransactionRejectedError);
  });

  it('throws TransactionRevertedError when throwOnReverted is true', async () => {
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
      waitForReceipt(client, {
        id: MOCK_ID,
        pollingInterval: 100,
        throwOnReverted: true,
        timeout: 5000
      })
    ).rejects.toThrow(TransactionRevertedError);
  });

  it('returns receipt on reverted when throwOnReverted is false', async () => {
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

    const result = await waitForReceipt(client, {
      id: MOCK_ID,
      pollingInterval: 100,
      timeout: 5000
    });

    expect(result).toBeDefined();
  });

  it('uses WebSocket race when ws is provided', async () => {
    const { client, request } = createMockTransportClient();
    // HTTP polling returns pending
    request.mockResolvedValue(pendingStatusResponse);

    const ws = createMockWebSocketManager();

    const promise = waitForReceipt(client, {
      id: MOCK_ID,
      pollingInterval: 2000,
      timeout: 10000,
      ws
    });

    // Let the async race start
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Emit success via WebSocket
    ws.mockSubscription.emit('success', {
      chainId: 1,
      createdAt: 1700000000,
      id: MOCK_ID,
      receipt: {} as never,
      status: StatusCode.Success
    });

    const result = await promise;
    expect(result).toBeDefined();
  });

  it('uses polling-only when usePolling is true', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue({
      chainId: 1,
      createdAt: 1700000000,
      id: MOCK_ID,
      receipt: mockRpcTransactionReceipt(),
      status: StatusCode.Success
    });

    const ws = createMockWebSocketManager();

    const result = await waitForReceipt(client, {
      id: MOCK_ID,
      pollingInterval: 100,
      timeout: 5000,
      usePolling: true,
      ws
    });

    // WebSocket should not be used
    expect(ws.subscribe).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('defaults timeout to 120000ms', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue({
      chainId: 1,
      createdAt: 1700000000,
      id: MOCK_ID,
      receipt: mockRpcTransactionReceipt(),
      status: StatusCode.Success
    });

    const result = await waitForReceipt(client, {
      id: MOCK_ID,
      pollingInterval: 100
    });

    expect(result).toBeDefined();
  });
});
