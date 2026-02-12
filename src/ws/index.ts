/**
 * Shared WebSocket infrastructure for real-time updates
 *
 * @module ws
 */

// Re-export errors
export {
  isWebSocketError,
  WebSocketConnectionError,
  WebSocketSubscriptionError,
  WebSocketTimeoutError
} from './errors.js';
// Re-export manager
export { createWebSocketManager } from './manager.js';

// Re-export types
export type {
  HeartbeatMessage,
  InternalSubscription,
  JsonRpcNotification,
  JsonRpcRequest,
  JsonRpcResponse,
  StatusEvent,
  StatusEventMap,
  StatusEventName,
  Subscription,
  SubscriptionParams,
  WebSocketConfig,
  WebSocketManager,
  WebSocketMessage
} from './types.js';
