import { describe, expect, it } from 'vitest';
import { mockBalanceResponse } from '../../../__test__/helpers/fixtures.js';
import { createMockTransportClient } from '../../../__test__/helpers/mockTransport.js';
import { getBalance } from './getBalance.js';

describe('getBalance', () => {
  it('calls gelato_getBalance and returns parsed result', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(mockBalanceResponse);

    const result = await getBalance(client);

    expect(request).toHaveBeenCalledWith({
      method: 'gelato_getBalance',
      params: []
    });
    expect(result.balance).toBe(BigInt(1000000000));
    expect(result.decimals).toBe(6);
    expect(result.unit).toBe('usd');
  });

  it('throws on RPC error', async () => {
    const { client, request } = createMockTransportClient();
    request.mockRejectedValue({ code: -32600, message: 'Invalid request' });

    await expect(getBalance(client)).rejects.toThrow();
  });
});
