import { describe, expect, it } from 'vitest';
import { mockCapabilitiesResponse } from '../../../__test__/helpers/fixtures.js';
import { createMockTransportClient } from '../../../__test__/helpers/mockTransport.js';
import { getCapabilities } from './getCapabilities.js';

describe('getCapabilities', () => {
  it('calls relayer_getCapabilities and returns parsed result', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(mockCapabilitiesResponse);

    const result = await getCapabilities(client);

    expect(request).toHaveBeenCalledWith({
      method: 'relayer_getCapabilities',
      params: []
    });
    expect(result[1]).toBeDefined();
    expect(result[1]?.feeCollector).toBeDefined();
    expect(result[1]?.tokens).toHaveLength(1);
  });

  it('throws on RPC error', async () => {
    const { client, request } = createMockTransportClient();
    request.mockRejectedValue({ code: -32600, message: 'Invalid request' });

    await expect(getCapabilities(client)).rejects.toThrow();
  });
});
