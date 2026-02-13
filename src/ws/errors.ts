import { BaseError } from 'viem';

/**
 * Error thrown when WebSocket connection fails
 */
export class WebSocketConnectionError extends BaseError {
  constructor(message: string) {
    super(message, { name: 'WebSocketConnectionError' });
  }
}

/**
 * Error thrown when WebSocket subscription fails
 */
export class WebSocketSubscriptionError extends BaseError {
  constructor(message: string) {
    super(message, { name: 'WebSocketSubscriptionError' });
  }
}

/**
 * Error thrown when waiting for data times out
 */
export class WebSocketTimeoutError extends BaseError {
  constructor(message: string) {
    super(message, { name: 'WebSocketTimeoutError' });
  }
}

/**
 * Helper function to detect WebSocket-specific errors
 * Used to determine whether to fall back to HTTP polling
 */
export function isWebSocketError(error: unknown): boolean {
  return (
    error instanceof WebSocketConnectionError ||
    error instanceof WebSocketSubscriptionError ||
    error instanceof WebSocketTimeoutError
  );
}
