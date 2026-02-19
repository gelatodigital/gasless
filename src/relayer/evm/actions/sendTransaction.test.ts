import type { SignedAuthorizationList } from 'viem';
import { describe, expect, it } from 'vitest';
import { MOCK_ADDRESS, MOCK_CALL_DATA, MOCK_TX_HASH } from '../../../__test__/helpers/fixtures.js';
import { createMockTransportClient } from '../../../__test__/helpers/mockTransport.js';
import { sendTransaction } from './sendTransaction.js';

describe('sendTransaction', () => {
  it('calls relayer_sendTransaction and returns 32-byte hex hash', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(MOCK_TX_HASH);

    const result = await sendTransaction(client, {
      chainId: 1,
      data: MOCK_CALL_DATA,
      to: MOCK_ADDRESS
    });

    expect(request).toHaveBeenCalledWith({
      method: 'relayer_sendTransaction',
      params: {
        authorizationList: undefined,
        chainId: '1',
        data: MOCK_CALL_DATA,
        to: MOCK_ADDRESS
      }
    });
    expect(result).toBe(MOCK_TX_HASH);
  });

  it('formats authorizationList when provided', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(MOCK_TX_HASH);

    const authList: SignedAuthorizationList = [
      {
        address: MOCK_ADDRESS,
        chainId: 1,
        nonce: 0,
        r: '0x1',
        s: '0x2',
        yParity: 0
      }
    ];

    await sendTransaction(client, {
      authorizationList: authList,
      chainId: 1,
      data: MOCK_CALL_DATA,
      to: MOCK_ADDRESS
    });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          authorizationList: expect.arrayContaining([
            expect.objectContaining({ address: MOCK_ADDRESS })
          ])
        })
      })
    );
  });

  it('throws on RPC error with params', async () => {
    const { client, request } = createMockTransportClient();
    request.mockRejectedValue({ code: 4211, data: '0xdeadbeef', message: 'sim failed' });

    await expect(
      sendTransaction(client, { chainId: 1, data: MOCK_CALL_DATA, to: MOCK_ADDRESS })
    ).rejects.toThrow();
  });

  it('includes gas and skipSimulation in RPC params when provided', async () => {
    const { client, request } = createMockTransportClient();
    request.mockResolvedValue(MOCK_TX_HASH);

    await sendTransaction(client, {
      chainId: 1,
      data: MOCK_CALL_DATA,
      gas: 100000n,
      skipSimulation: true,
      to: MOCK_ADDRESS
    });

    expect(request).toHaveBeenCalledWith({
      method: 'relayer_sendTransaction',
      params: {
        authorizationList: undefined,
        chainId: '1',
        data: MOCK_CALL_DATA,
        gas: '100000',
        skipSimulation: true,
        to: MOCK_ADDRESS
      }
    });
  });

  it('retries on matching error code and succeeds on retry', async () => {
    const { client, request } = createMockTransportClient();
    request
      .mockRejectedValueOnce({ code: 4211, data: '0xdeadbeef', message: 'sim failed' })
      .mockResolvedValue(MOCK_TX_HASH);

    const result = await sendTransaction(
      client,
      {
        chainId: 1,
        data: MOCK_CALL_DATA,
        to: MOCK_ADDRESS
      },
      { retries: { max: 1 } }
    );

    expect(result).toBe(MOCK_TX_HASH);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
