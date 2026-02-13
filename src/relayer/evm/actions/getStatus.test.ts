import { describe, expect, it } from 'vitest';
import {
  MOCK_ID,
  mockRpcTransactionReceipt,
  pendingStatusResponse,
  rejectedStatusResponse,
  submittedStatusResponse
} from '../../../__test__/helpers/fixtures.js';
import { createMockTransportClient } from '../../../__test__/helpers/mockTransport.js';
import { StatusCode } from '../../../types/schema.js';
import { getStatus } from './getStatus.js';

describe('getStatus', () => {
  it('calls relayer_getStatus with id', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(pendingStatusResponse);

    const result = await getStatus(client, { id: MOCK_ID });

    expect(request).toHaveBeenCalledWith({
      method: 'relayer_getStatus',
      params: { id: MOCK_ID }
    });
    expect(result.status).toBe(StatusCode.Pending);
  });

  it('returns submitted status', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(submittedStatusResponse);

    const result = await getStatus(client, { id: MOCK_ID });
    expect(result.status).toBe(StatusCode.Submitted);
  });

  it('returns success status', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue({
      chainId: 1,
      createdAt: 1700000000,
      id: MOCK_ID,
      receipt: mockRpcTransactionReceipt(),
      status: StatusCode.Success
    });

    const result = await getStatus(client, { id: MOCK_ID });
    expect(result.status).toBe(StatusCode.Success);
  });

  it('returns rejected status', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(rejectedStatusResponse);

    const result = await getStatus(client, { id: MOCK_ID });
    expect(result.status).toBe(StatusCode.Rejected);
  });

  it('returns reverted status', async () => {
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

    const result = await getStatus(client, { id: MOCK_ID });
    expect(result.status).toBe(StatusCode.Reverted);
  });

  it('throws on RPC error', async () => {
    const { client, request } = createMockTransportClient();
    request.mockRejectedValue({ code: 4208, message: 'Unknown' });

    await expect(getStatus(client, { id: MOCK_ID })).rejects.toThrow();
  });
});
