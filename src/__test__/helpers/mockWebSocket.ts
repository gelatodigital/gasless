import { vi } from 'vitest';
import type { Status } from '../../types/schema.js';
import type { InternalSubscription, StatusEventName, WebSocketManager } from '../../ws/types.js';

/**
 * Creates a mock InternalSubscription with an `.emit()` helper
 * to simulate server events in tests.
 */
export function createMockSubscription<TReceipt>(
  id = 'mock-id',
  subscriptionId = 'mock-sub-id'
): InternalSubscription<TReceipt> & { emit: (event: StatusEventName, data: Status) => void } {
  // biome-ignore lint/suspicious/noExplicitAny: test helper
  const listeners = new Map<StatusEventName, Set<(data: any) => void>>();

  const subscription: InternalSubscription<TReceipt> & {
    emit: (event: StatusEventName, data: Status) => void;
  } = {
    emit(event: StatusEventName, data: Status) {
      const callbacks = listeners.get(event);
      if (callbacks) {
        for (const cb of callbacks) {
          cb(data);
        }
      }
    },
    handle: vi.fn((_data: Status) => {
      // Route to listeners by status code — not used in most tests
      // Tests should use .emit() directly
    }),
    id,
    off(event, callback) {
      listeners.get(event)?.delete(callback);
    },
    on(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)?.add(callback);
    },
    subscriptionId
  };

  return subscription;
}

/**
 * Creates a mock WebSocketManager with all methods stubbed.
 */
export function createMockWebSocketManager<TReceipt>(): WebSocketManager<TReceipt> & {
  mockSubscription: InternalSubscription<TReceipt> & {
    emit: (event: StatusEventName, data: Status) => void;
  };
} {
  const mockSub = createMockSubscription<TReceipt>();

  return {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    mockSubscription: mockSub,
    subscribe: vi.fn().mockResolvedValue(mockSub),
    unsubscribe: vi.fn().mockResolvedValue(undefined)
  };
}
