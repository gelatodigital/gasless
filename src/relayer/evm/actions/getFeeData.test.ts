import { describe, expect, it } from 'vitest';
import { MOCK_TOKEN_ADDRESS, mockFeeDataResponse } from '../../../__test__/helpers/fixtures.js';
import { createMockTransportClient } from '../../../__test__/helpers/mockTransport.js';
import { getFeeData } from './getFeeData.js';

describe('getFeeData', () => {
  it('calls relayer_getFeeData and coerces gasPrice to bigint', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(mockFeeDataResponse);

    const result = await getFeeData(client, { chainId: 1, token: MOCK_TOKEN_ADDRESS });

    expect(request).toHaveBeenCalledWith({
      method: 'relayer_getFeeData',
      params: { chainId: '1', token: MOCK_TOKEN_ADDRESS }
    });
    expect(result.gasPrice).toBe(1000000000n);
    expect(result.chainId).toBe(1);
    expect(result.rate).toBe(1.0);
  });

  it('throws on RPC error', async () => {
    const { client, request } = createMockTransportClient();
    request.mockRejectedValue({ code: 4206, message: 'Unsupported chain' });

    await expect(getFeeData(client, { chainId: 999, token: MOCK_TOKEN_ADDRESS })).rejects.toThrow();
  });
});
