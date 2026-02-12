import type { Status, StatusCode } from '../types/schema.js';

/**
 * WebSocket configuration options
 */
export type WebSocketConfig = {
  /** Base URL for the API (will be converted to ws:// or wss://) */
  baseUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Disable websockets */
  disable?: boolean;
  /** Whether to automatically reconnect on disconnection */
  reconnect?: boolean;
  /** Initial reconnection interval in milliseconds */
  reconnectInterval?: number;
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
  /** Timeout for heartbeat in milliseconds */
  heartbeatTimeout?: number;
};

/**
 * Status event types (shared by bundler and relayer)
 */
export type StatusEvent =
  | 'transaction.pending'
  | 'transaction.submitted'
  | 'transaction.success'
  | 'transaction.rejected'
  | 'transaction.reverted';

/**
 * Status event names that can be subscribed to
 */
export type StatusEventName = 'pending' | 'submitted' | 'success' | 'rejected' | 'reverted';

/**
 * JSON-RPC 2.0 request message
 */
export type JsonRpcRequest<TParams = unknown> = {
  jsonrpc: '2.0';
  id: number | string;
  method: 'subscribe' | 'unsubscribe';
  params: TParams;
};

/**
 * JSON-RPC 2.0 response message
 */
export type JsonRpcResponse<TResult = unknown> = {
  jsonrpc: '2.0';
  id: number | string;
  result?: TResult;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

/**
 * JSON-RPC 2.0 notification message for subscriptions
 */
export type JsonRpcNotification = {
  jsonrpc: '2.0';
  method: 'subscription';
  params: {
    subscription: string;
    result: {
      event: StatusEvent;
      data: Status;
    };
  };
};

/**
 * Heartbeat message types
 */
export type HeartbeatMessage = {
  type: 'ping' | 'pong';
};

/**
 * Union of all WebSocket message types
 */
export type WebSocketMessage<TResult = unknown> =
  | JsonRpcResponse<TResult>
  | JsonRpcNotification
  | HeartbeatMessage;

/**
 * Maps each status event name to its narrowed WebSocketStatus type.
 * For success/reverted events, the receipt field is overridden with TReceipt.
 */
export type StatusEventMap<TReceipt> = {
  pending: Extract<Status, { status: StatusCode.Pending }>;
  submitted: Extract<Status, { status: StatusCode.Submitted }>;
  success: Omit<Extract<Status, { status: StatusCode.Success }>, 'receipt'> & {
    receipt: TReceipt;
  };
  rejected: Extract<Status, { status: StatusCode.Rejected }>;
  reverted: Omit<Extract<Status, { status: StatusCode.Reverted }>, 'receipt'> & {
    receipt: TReceipt;
  };
};

/**
 * Generic subscription interface (public API)
 * Simple event-based API with on/off handlers
 */
export type Subscription<TReceipt> = {
  /** Unique identifier for this subscription */
  id: string;
  /** Subscription ID from the server */
  subscriptionId: string;
  /** Subscribe to specific status events */
  on: <E extends StatusEventName>(
    event: E,
    callback: (data: StatusEventMap<TReceipt>[E]) => void
  ) => void;
  /** Unsubscribe from specific status events */
  off: <E extends StatusEventName>(
    event: E,
    callback: (data: StatusEventMap<TReceipt>[E]) => void
  ) => void;
};

/**
 * Internal subscription interface with additional methods
 * Used internally by manager and actions
 */
export type InternalSubscription<TReceipt> = Subscription<TReceipt> & {
  /** Internal method used by manager to emit events */
  handle: (data: Status) => void;
};
/**
 * Subscription parameters for transaction status updates
 */
export type SubscriptionParams = {
  id: string;
};

/**
 * WebSocket manager interface
 * Note: subscribe returns InternalSubscription for internal use of waitForReceipt/waitForTerminal
 * Public API consumers should only use the on/off methods
 */
export type WebSocketManager<TReceipt> = {
  /** Connect to the WebSocket server */
  connect: () => Promise<void>;
  /** Disconnect from the WebSocket server */
  disconnect: () => void;
  /** Subscribe to updates - returns internal subscription with all methods */
  subscribe: (params?: SubscriptionParams) => Promise<InternalSubscription<TReceipt>>;
  /** Unsubscribe from updates */
  unsubscribe: (subscriptionId: string) => Promise<void>;
};
