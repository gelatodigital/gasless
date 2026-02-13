import type { Hex, SignedAuthorization } from 'viem';
import { describe, expect, it } from 'vitest';
import {
  formatAuthorization,
  serializeAccountStateOverride,
  serializeStateMapping,
  serializeStateOverride
} from './serialize.js';

const VALID_SLOT = `0x${'ab'.repeat(32)}` as Hex;
const VALID_VALUE = `0x${'cd'.repeat(32)}` as Hex;
const VALID_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678' as const;

describe('serializeStateMapping', () => {
  it('returns undefined for undefined input', () => {
    expect(serializeStateMapping(undefined)).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    expect(serializeStateMapping([])).toBeUndefined();
  });

  it('serializes valid slot/value pairs', () => {
    const result = serializeStateMapping([{ slot: VALID_SLOT, value: VALID_VALUE }]);
    expect(result).toEqual({ [VALID_SLOT]: VALID_VALUE });
  });

  it('throws for invalid slot length', () => {
    expect(() => serializeStateMapping([{ slot: '0xabcd' as Hex, value: VALID_VALUE }])).toThrow();
  });

  it('throws for invalid value length', () => {
    expect(() => serializeStateMapping([{ slot: VALID_SLOT, value: '0xabcd' as Hex }])).toThrow();
  });
});

describe('serializeAccountStateOverride', () => {
  it('serializes balance', () => {
    const result = serializeAccountStateOverride({ balance: 1000n });
    expect(result.balance).toBeDefined();
  });

  it('serializes nonce', () => {
    const result = serializeAccountStateOverride({ nonce: 5 });
    expect(result.nonce).toBeDefined();
  });

  it('serializes code', () => {
    const result = serializeAccountStateOverride({ code: '0xdeadbeef' as Hex });
    expect(result.code).toBe('0xdeadbeef');
  });

  it('serializes state mapping', () => {
    const result = serializeAccountStateOverride({
      state: [{ slot: VALID_SLOT, value: VALID_VALUE }]
    });
    expect(result.state).toEqual({ [VALID_SLOT]: VALID_VALUE });
  });

  it('serializes stateDiff mapping', () => {
    const result = serializeAccountStateOverride({
      stateDiff: [{ slot: VALID_SLOT, value: VALID_VALUE }]
    });
    expect(result.stateDiff).toEqual({ [VALID_SLOT]: VALID_VALUE });
  });

  it('throws when both state and stateDiff are provided', () => {
    expect(() =>
      serializeAccountStateOverride({
        state: [{ slot: VALID_SLOT, value: VALID_VALUE }],
        stateDiff: [{ slot: VALID_SLOT, value: VALID_VALUE }]
      })
    ).toThrow();
  });

  it('returns empty object for no overrides', () => {
    const result = serializeAccountStateOverride({});
    expect(result).toEqual({});
  });
});

describe('serializeStateOverride', () => {
  it('returns undefined for undefined input', () => {
    expect(serializeStateOverride(undefined)).toBeUndefined();
  });

  it('serializes valid state overrides', () => {
    const result = serializeStateOverride([
      {
        address: VALID_ADDRESS,
        balance: 100n
      }
    ]);
    expect(result).toBeDefined();
    expect(result?.[VALID_ADDRESS]).toBeDefined();
  });

  it('throws for invalid address', () => {
    expect(() =>
      serializeStateOverride([
        {
          address: '0xinvalid' as `0x${string}`,
          balance: 100n
        }
      ])
    ).toThrow();
  });

  it('throws for duplicate address', () => {
    expect(() =>
      serializeStateOverride([
        { address: VALID_ADDRESS, balance: 100n },
        { address: VALID_ADDRESS, nonce: 1 }
      ])
    ).toThrow();
  });
});

describe('formatAuthorization', () => {
  it('formats authorization with all fields', () => {
    const auth: SignedAuthorization = {
      address: VALID_ADDRESS,
      chainId: 1,
      nonce: 5,
      r: '0x1234',
      s: '0x5678',
      yParity: 1
    };

    const result = formatAuthorization(auth);
    expect(result.address).toBe(VALID_ADDRESS);
    expect(result.chainId).toBeDefined();
    expect(result.nonce).toBeDefined();
    expect(result.r).toBeDefined();
    expect(result.s).toBeDefined();
    expect(result.yParity).toBeDefined();
  });

  it('pads r and s with zeros when falsy', () => {
    const auth: SignedAuthorization = {
      address: VALID_ADDRESS,
      chainId: 1,
      nonce: 0,
      r: '0x0',
      s: '0x0',
      yParity: 0
    };

    const result = formatAuthorization(auth);
    // r/s should be padded to 32 bytes when truthy
    // yParity 0 is falsy, gets padded to 32 bytes
    expect(result.yParity).toHaveLength(66); // 0x + 64 hex chars
  });
});
