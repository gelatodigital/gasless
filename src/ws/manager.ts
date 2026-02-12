import WebSocketImpl from 'isomorphic-ws';
import { statusSchema } from '../types/schema.js';
import { WebSocketConnectionError, WebSocketSubscriptionError } from './errors.js';
import { createSubscription } from './subscription.js';
import type {
  InternalSubscription,
  JsonRpcNotification,
  JsonRpcRequest,
  JsonRpcResponse,
  SubscriptionParams,
  WebSocketConfig,
  WebSocketManager,
  WebSocketMessage
} from './types.js';

/**
 * Creates a generic WebSocket manager for handling real-time updates
 *
 * This factory function returns a manager object that:
 * - Manages a single WebSocket connection with lazy initialization
 * - Multiplexes multiple subscriptions over one connection
 * - Handles automatic reconnection with exponential backoff
 * - Responds to server heartbeat pings
 * - Routes incoming messages to the correct subscription
 *
 * @param config - WebSocket manager configuration
 * @returns WebSocketManager object with connection and subscription methods
 */
export function createWebSocketManager<TReceipt>(
  config: WebSocketConfig
): WebSocketManager<TReceipt> {
  // Private state using closures
  let ws: WebSocketImpl | null = null;
  let isConnecting = false;
  let connectionPromise: Promise<void> | null = null;
  let reconnectAttempts = 0;
  let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  let messageId = 0;

  const subscriptions = new Map<string, InternalSubscription<TReceipt>>();
  const pendingRequests = new Map<
    number | string,
    { resolve: (value: JsonRpcResponse) => void; reject: (error: Error) => void }
  >();

  // Merge config with defaults
  const fullConfig: Required<WebSocketConfig> = {
    disable: false,
    heartbeatTimeout: 60000,
    maxReconnectAttempts: 5,
    reconnect: true,
    reconnectInterval: 1000,
    ...config
  };

  /**
   * Setup heartbeat timeout
   * Triggers reconnection if no ping received within timeout period
   */
  const setupHeartbeat = (): void => {
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
    }

    heartbeatTimer = setTimeout(() => {
      reconnect();
    }, fullConfig.heartbeatTimeout);
  };

  /**
   * Handle incoming WebSocket messages
   * Routes to appropriate handler based on message type
   */
  const handleMessage = (event: { data: unknown }): void => {
    try {
      const message = JSON.parse(event.data as string) as WebSocketMessage;

      // Handle JSON-RPC responses (subscribe/unsubscribe results)
      if ('id' in message && 'jsonrpc' in message) {
        const pending = pendingRequests.get(message.id);
        if (pending) {
          pendingRequests.delete(message.id);
          pending.resolve(message);
        }
        return;
      }

      // Handle subscription notifications (data updates)
      if ('method' in message && message.method === 'subscription') {
        const notification = message as JsonRpcNotification;
        const { subscription: subId, result } = notification.params;
        const subscription = subscriptions.get(subId);

        if (subscription) {
          // Augment the data with the subscription id to create WebSocketStatus
          subscription.handle(statusSchema.parse(result.data));
        }
        return;
      }

      // Handle heartbeat pings
      if ('type' in message && message.type === 'ping') {
        ws?.send(JSON.stringify({ type: 'pong' }));
        setupHeartbeat();
      }
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: ws error
      console.error('[WebSocket] Error handling message:', error);
    }
  };

  /**
   * Handle WebSocket close event
   * Triggers reconnection unless explicitly disabled or auth error
   */
  const handleClose = (event: { code: number; reason: string }): void => {
    // biome-ignore lint/suspicious/noConsole: ws close
    console.warn(`[WebSocket] Closed: ${event.code} - ${event.reason}`);
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
    }

    // Don't reconnect on auth errors (4002) or if reconnect disabled
    if (fullConfig.reconnect && event.code !== 4002) {
      reconnect();
    }
  };

  /**
   * Handle WebSocket error event
   */
  const handleError = (event: { error?: Error; message?: string }): void => {
    // biome-ignore lint/suspicious/noConsole: ws error
    console.error('[WebSocket] Error:', event);
  };

  /**
   * Attempt to reconnect with exponential backoff
   */
  const reconnect = (): void => {
    if (reconnectAttempts >= fullConfig.maxReconnectAttempts) {
      disconnect();
      return;
    }

    reconnectAttempts++;
    const delay = fullConfig.reconnectInterval * 2 ** (reconnectAttempts - 1);

    setTimeout(() => {
      connect().catch((error) => {
        // biome-ignore lint/suspicious/noConsole: ws reconnection failure
        console.error(`[WebSocket] Reconnection attempt ${reconnectAttempts} failed:`, error);
      });
    }, delay);
  };

  /**
   * Send a JSON-RPC request and wait for response
   */
  const sendJsonRpc = (request: JsonRpcRequest): Promise<JsonRpcResponse> => {
    return new Promise((resolve, reject) => {
      if (!ws || ws.readyState !== WebSocketImpl.OPEN) {
        reject(new WebSocketConnectionError('WebSocket not connected'));
        return;
      }

      pendingRequests.set(request.id, { reject, resolve });
      ws.send(JSON.stringify(request));

      // Timeout after 5 seconds
      setTimeout(() => {
        if (pendingRequests.has(request.id)) {
          pendingRequests.delete(request.id);
          reject(new WebSocketConnectionError('Request timeout'));
        }
      }, 5000);
    });
  };

  /**
   * Connect to WebSocket server
   * Lazy initialization - connects on first call
   * Reuses existing connection if already connected
   */
  const connect = async (): Promise<void> => {
    if (fullConfig.disable) {
      throw new Error('WebSocket are disabled!');
    }

    if (ws?.readyState === WebSocketImpl.OPEN) {
      return;
    }

    if (isConnecting && connectionPromise) {
      return connectionPromise;
    }

    isConnecting = true;
    connectionPromise = new Promise((resolve, reject) => {
      const wsUrl = `${fullConfig.baseUrl.replace('https://', 'wss://').replace('http://', 'ws://')}/ws`;

      // Create WebSocket with authorization header
      ws = new WebSocketImpl(wsUrl, {
        headers: {
          Authorization: `Bearer ${fullConfig.apiKey}`
        }
      });

      ws.onopen = () => {
        // biome-ignore lint/suspicious/noConsole: opened connection
        console.log(`[WebSocket] Connection opened`);
        reconnectAttempts = 0;
        isConnecting = false;
        setupHeartbeat();
        resolve();
      };

      ws.onerror = (error: unknown) => {
        isConnecting = false;
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null && 'message' in error
              ? String((error as { message: unknown }).message)
              : 'Unknown error';
        reject(new WebSocketConnectionError(`Failed to connect: ${message}`));
      };

      ws.onmessage = handleMessage as (event: unknown) => void;
      ws.onclose = handleClose as (event: unknown) => void;
      (
        ws as { addEventListener?: (type: string, listener: (event: unknown) => void) => void }
      ).addEventListener?.('error', handleError as (event: unknown) => void);
    });

    return connectionPromise;
  };

  /**
   * Disconnect from WebSocket server
   * Cleans up all state and pending requests
   */
  const disconnect = (): void => {
    if (fullConfig.disable) {
      throw new Error('WebSockets are disabled!');
    }

    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
    }
    if (ws) {
      ws.close(1000, 'Client disconnect');
      ws = null;
    }
    subscriptions.clear();
    pendingRequests.clear();
    isConnecting = false;
    connectionPromise = null;
  };

  /**
   * Subscribe to updates
   * Automatically connects if not already connected
   *
   * @param params - Subscription parameters (id optional - omit to subscribe to all transactions)
   * @returns Subscription object for handling data updates
   */
  const subscribe = async (
    params?: SubscriptionParams
  ): Promise<InternalSubscription<TReceipt>> => {
    if (fullConfig.disable) {
      throw new Error('WebSockets are disabled!');
    }

    await connect();

    const requestId = ++messageId;

    // Build subscription params - only include transactionId if id is provided
    const subscriptionParams: { eventTypes: string[]; transactionId?: string } = {
      eventTypes: ['transaction.*']
    };

    if (params?.id) {
      subscriptionParams.transactionId = params.id;
    }

    const request: JsonRpcRequest = {
      id: requestId,
      jsonrpc: '2.0',
      method: 'subscribe',
      params: [subscriptionParams]
    };

    const response = await sendJsonRpc(request);

    if (response.error) {
      throw new WebSocketSubscriptionError(`Subscription failed: ${response.error.message}`);
    }

    if (!response.result) {
      throw new WebSocketSubscriptionError('Subscription failed: no subscription ID returned');
    }

    const subscriptionId = response.result as string;
    // Use provided id or generate a unique one for local tracking
    const localId = params?.id || `all-${subscriptionId}`;
    const subscription = createSubscription<TReceipt>(localId, subscriptionId);
    subscriptions.set(subscriptionId, subscription);

    return subscription;
  };

  /**
   * Unsubscribe from updates
   *
   * @param subscriptionId - Subscription ID to unsubscribe
   */
  const unsubscribe = async (subscriptionId: string): Promise<void> => {
    if (fullConfig.disable) {
      throw new Error('WebSockets are disabled!');
    }

    const id = ++messageId;
    const request: JsonRpcRequest = {
      id,
      jsonrpc: '2.0',
      method: 'unsubscribe',
      params: [subscriptionId]
    };

    await sendJsonRpc(request);
    subscriptions.delete(subscriptionId);
  };

  return {
    connect,
    disconnect,
    subscribe,
    unsubscribe
  };
}
