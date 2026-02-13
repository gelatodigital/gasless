import type { Chain, Client, Transport } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import { vi } from 'vitest';

/**
 * Creates a mock transport client (used by relayer actions).
 * Relayer actions take `ReturnType<Transport>` which has a `.request()` method.
 */
export function createMockTransportClient() {
  const request = vi.fn();
  const client = {
    config: { timeout: 15000 },
    request
  } as unknown as ReturnType<Transport>;

  return { client, request };
}

/**
 * Creates a mock viem Client (used by bundler actions).
 * Bundler actions take `Client<Transport, Chain, Account>`.
 */
export function createMockBundlerClient(overrides?: Partial<Client>) {
  const request = vi.fn();
  const client = {
    account: undefined,
    chain: { id: 1 } as Chain,
    pollingInterval: 4000,
    request,
    transport: { timeout: 15000 },
    ...overrides
  } as unknown as Client<Transport, Chain | undefined, SmartAccount | undefined>;

  return { client, request };
}
