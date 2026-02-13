import { describe, expect, it } from 'vitest';
import { MOCK_TOKEN_ADDRESS, mockFeeQuoteResponse } from '../../../__test__/helpers/fixtures.js';
import { createMockTransportClient } from '../../../__test__/helpers/mockTransport.js';
import { getFeeQuote } from './getFeeQuote.js';

describe('getFeeQuote', () => {
  it('calls relayer_getFeeQuote and coerces fee to bigint', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(mockFeeQuoteResponse);

    const result = await getFeeQuote(client, {
      chainId: 1,
      gas: 100000n,
      token: MOCK_TOKEN_ADDRESS
    });

    expect(request).toHaveBeenCalledWith({
      method: 'relayer_getFeeQuote',
      params: {
        chainId: '1',
        gas: '100000',
        l1Fee: undefined,
        token: MOCK_TOKEN_ADDRESS
      }
    });
    expect(result.fee).toBe(100000000000000n);
    expect(result.chainId).toBe(1);
  });

  it('passes optional l1Fee as string', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(mockFeeQuoteResponse);

    await getFeeQuote(client, {
      chainId: 1,
      gas: 100000n,
      l1Fee: 5000n,
      token: MOCK_TOKEN_ADDRESS
    });

    expect(request).toHaveBeenCalledWith({
      method: 'relayer_getFeeQuote',
      params: expect.objectContaining({ l1Fee: '5000' })
    });
  });

  it('throws on RPC error', async () => {
    const { client, request } = createMockTransportClient();
    request.mockRejectedValue({ code: -32602, message: 'Invalid params' });

    await expect(
      getFeeQuote(client, { chainId: 1, gas: 0n, token: MOCK_TOKEN_ADDRESS })
    ).rejects.toThrow();
  });
});
