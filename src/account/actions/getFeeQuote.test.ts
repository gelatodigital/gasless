import { zeroAddress } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { MOCK_ADDRESS, MOCK_TOKEN_ADDRESS } from '../../__test__/helpers/fixtures.js';
import { createMockSmartAccount } from '../../__test__/helpers/mockSmartAccount.js';
import { getFeeQuote } from './getFeeQuote.js';

describe('getFeeQuote', () => {
  const mockClient = {
    getFeeQuote: vi.fn().mockResolvedValue({
      chainId: 1,
      expiry: 1700001000,
      fee: 100000000000000n,
      token: { address: MOCK_TOKEN_ADDRESS, decimals: 18 }
    })
  };

  it('calls account.estimate and client.getFeeQuote', async () => {
    const account = createMockSmartAccount();

    const result = await getFeeQuote(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }]
    });

    expect(account.estimate).toHaveBeenCalledWith({
      calls: [{ to: MOCK_ADDRESS, value: 0n }]
    });
    expect(mockClient.getFeeQuote).toHaveBeenCalledWith({
      chainId: 1,
      gas: 100000n,
      l1Fee: 0n,
      token: zeroAddress
    });
    expect(result.fee).toBe(100000000000000n);
  });

  it('uses provided token address', async () => {
    const account = createMockSmartAccount();

    await getFeeQuote(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }],
      token: MOCK_TOKEN_ADDRESS
    });

    expect(mockClient.getFeeQuote).toHaveBeenCalledWith(
      expect.objectContaining({ token: MOCK_TOKEN_ADDRESS })
    );
  });

  it('defaults token to zeroAddress', async () => {
    const account = createMockSmartAccount();

    await getFeeQuote(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }]
    });

    expect(mockClient.getFeeQuote).toHaveBeenCalledWith(
      expect.objectContaining({ token: zeroAddress })
    );
  });
});
