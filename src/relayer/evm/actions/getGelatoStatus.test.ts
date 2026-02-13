import { describe, expect, it } from 'vitest';
import {
  MOCK_ID,
  MOCK_TX_HASH,
  mockRpcTransactionReceipt,
  pendingStatusResponse,
  rejectedStatusResponse
} from '../../../__test__/helpers/fixtures.js';
import { createMockTransportClient } from '../../../__test__/helpers/mockTransport.js';
import { GelatoStatusCode, getGelatoStatus } from './getGelatoStatus.js';

describe('getGelatoStatus', () => {
  it('returns pending status', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(pendingStatusResponse);

    const result = await getGelatoStatus(client, { id: MOCK_ID });

    expect(request).toHaveBeenCalledWith({
      method: 'gelato_getStatus',
      params: { id: MOCK_ID }
    });
    expect(result.status).toBe(GelatoStatusCode.Pending);
  });

  it('returns submitted status', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue({
      chainId: 1,
      createdAt: 1700000000,
      hash: MOCK_TX_HASH,
      id: MOCK_ID,
      status: GelatoStatusCode.Submitted
    });

    const result = await getGelatoStatus(client, { id: MOCK_ID });
    expect(result.status).toBe(GelatoStatusCode.Submitted);
  });

  it('returns success status with receipt', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue({
      chainId: 1,
      createdAt: 1700000000,
      id: MOCK_ID,
      receipt: mockRpcTransactionReceipt(),
      status: GelatoStatusCode.Success
    });

    const result = await getGelatoStatus(client, { id: MOCK_ID });
    expect(result.status).toBe(GelatoStatusCode.Success);
  });

  it('returns finalized status (210)', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue({
      chainId: 1,
      createdAt: 1700000000,
      id: MOCK_ID,
      receipt: mockRpcTransactionReceipt(),
      status: GelatoStatusCode.Finalized
    });

    const result = await getGelatoStatus(client, { id: MOCK_ID });
    expect(result.status).toBe(GelatoStatusCode.Finalized);
  });

  it('returns rejected status', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(rejectedStatusResponse);

    const result = await getGelatoStatus(client, { id: MOCK_ID });
    expect(result.status).toBe(GelatoStatusCode.Rejected);
  });

  it('returns reverted status', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue({
      chainId: 1,
      createdAt: 1700000000,
      data: '0x08c379a0',
      id: MOCK_ID,
      message: 'Execution reverted',
      receipt: mockRpcTransactionReceipt(),
      status: GelatoStatusCode.Reverted
    });

    const result = await getGelatoStatus(client, { id: MOCK_ID });
    expect(result.status).toBe(GelatoStatusCode.Reverted);
  });

  it('throws on RPC error', async () => {
    const { client, request } = createMockTransportClient();
    request.mockRejectedValue({ code: 4208, message: 'Unknown transaction ID' });

    await expect(getGelatoStatus(client, { id: MOCK_ID })).rejects.toThrow();
  });
});
