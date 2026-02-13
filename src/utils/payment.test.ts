import { zeroAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { MOCK_ADDRESS, MOCK_FEE_COLLECTOR } from '../__test__/helpers/fixtures.js';
import { appendPayment } from './payment.js';

describe('appendPayment', () => {
  it('appends native ETH transfer for zeroAddress token', () => {
    const calls = [{ to: MOCK_ADDRESS, value: 0n }];
    const result = appendPayment(calls, zeroAddress, MOCK_FEE_COLLECTOR, 1000n);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(calls[0]);
    expect(result[1]).toEqual({
      to: MOCK_FEE_COLLECTOR,
      value: 1000n
    });
  });

  it('appends ERC20 transfer for non-zero token', () => {
    const calls = [{ to: MOCK_ADDRESS, value: 0n }];
    const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const;
    const result = appendPayment(calls, tokenAddress, MOCK_FEE_COLLECTOR, 1000n);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(calls[0]);
    // ERC20 transfer call
    expect(result[1]?.to).toBe(tokenAddress);
    expect(result[1]?.data).toBeDefined();
    // No value for ERC20 transfer
    expect(result[1]?.value).toBeUndefined();
  });

  it('preserves existing calls', () => {
    const calls = [
      { to: MOCK_ADDRESS, value: 100n },
      { data: '0xabcdef' as const, to: MOCK_ADDRESS }
    ];
    const result = appendPayment(calls, zeroAddress, MOCK_FEE_COLLECTOR, 500n);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(calls[0]);
    expect(result[1]).toEqual(calls[1]);
  });

  it('works with empty calls array', () => {
    const result = appendPayment([], zeroAddress, MOCK_FEE_COLLECTOR, 1000n);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      to: MOCK_FEE_COLLECTOR,
      value: 1000n
    });
  });
});
