import { type Status, StatusCode } from '../types/schema.js';
import type { InternalSubscription, StatusEventName } from './types.js';

/**
 * Maps StatusCode to event name
 */
const getEventName = (status: StatusCode): StatusEventName => {
  switch (status) {
    case StatusCode.Pending:
      return 'pending';
    case StatusCode.Submitted:
      return 'submitted';
    case StatusCode.Success:
      return 'success';
    case StatusCode.Rejected:
      return 'rejected';
    case StatusCode.Reverted:
      return 'reverted';
  }
};

/**
 * Creates a generic subscription object for managing data updates
 *
 * This factory function returns a subscription object that:
 * - Allows subscribing to specific status events via on/off handlers
 * - Resolves a promise when status with receipt is received
 * - Times out if no receipt received within timeout period
 *
 * @param id - Unique identifier for this subscription
 * @param subscriptionId - The subscription ID from the WebSocket server
 * @returns Subscription object with methods for managing data updates
 */
export function createSubscription<TReceipt>(
  id: string,
  subscriptionId: string
): InternalSubscription<TReceipt> {
  // Event-based listeners map
  // biome-ignore lint/suspicious/noExplicitAny: event listener
  const eventListeners = new Map<StatusEventName, Set<(data: any) => void>>();

  /**
   * Handle incoming data update (internal method)
   * - Notifies event-specific listeners
   * - Resolves terminal/receipt promises if applicable
   */
  const handle = (data: Status): void => {
    // Notify event-specific listeners
    const eventName = getEventName(data.status);
    const eventCallbacks = eventListeners.get(eventName);
    if (eventCallbacks) {
      for (const callback of eventCallbacks) {
        callback(data);
      }
    }
  };

  /**
   * Subscribe to a specific status event
   */
  const on: InternalSubscription<TReceipt>['on'] = (event, callback): void => {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)?.add(callback);
  };

  /**
   * Unsubscribe from a specific status event
   */
  const off: InternalSubscription<TReceipt>['off'] = (event, callback): void => {
    const callbacks = eventListeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  };

  return {
    handle,
    id,
    off,
    on,
    subscriptionId
  };
}
