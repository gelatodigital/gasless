import type { Address, Chain, Hex } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import { vi } from 'vitest';
import { MOCK_ADDRESS, MOCK_CALL_DATA, MOCK_CHAIN_ID, MOCK_ENTRY_POINT } from './fixtures.js';

/**
 * Creates a mock SmartAccount with all methods stubbed.
 */
export function createMockSmartAccount(overrides?: Partial<SmartAccount>): SmartAccount & {
  estimate: ReturnType<typeof vi.fn>;
  signAuthorization: ReturnType<typeof vi.fn>;
  encodeCallData: ReturnType<typeof vi.fn>;
} {
  return {
    address: MOCK_ADDRESS as Address,
    chain: { id: MOCK_CHAIN_ID } as Chain,
    client: {} as SmartAccount['client'],
    encodeCallData: vi.fn().mockResolvedValue(MOCK_CALL_DATA),
    encodeCalls: vi.fn().mockResolvedValue(MOCK_CALL_DATA),
    entryPoint: {
      abi: [],
      address: MOCK_ENTRY_POINT,
      version: '0.7'
    },
    estimate: vi.fn().mockResolvedValue({ estimatedGas: 100000n, estimatedL1Fee: 0n }),
    getFactoryArgs: vi.fn().mockResolvedValue({ factory: undefined, factoryData: undefined }),
    getNonce: vi.fn().mockResolvedValue(0n),
    getStubSignature: vi.fn().mockResolvedValue('0x' as Hex),
    isDeployed: vi.fn().mockResolvedValue(true),
    signAuthorization: vi.fn().mockResolvedValue({
      address: MOCK_ADDRESS,
      chainId: MOCK_CHAIN_ID,
      nonce: 0,
      r: '0x1',
      s: '0x2',
      yParity: 0
    }),
    signMessage: vi.fn(),
    signTypedData: vi.fn(),
    signUserOperation: vi.fn().mockResolvedValue('0xsignature' as Hex),
    type: 'smart',
    ...overrides
  } as unknown as SmartAccount & {
    estimate: ReturnType<typeof vi.fn>;
    signAuthorization: ReturnType<typeof vi.fn>;
    encodeCallData: ReturnType<typeof vi.fn>;
  };
}
