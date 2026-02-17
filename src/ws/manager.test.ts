import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketConnectionError, WebSocketSubscriptionError } from './errors.js';
import { createWebSocketManager } from './manager.js';

// Mock state
const mockSend = vi.fn();
const mockClose = vi.fn();
const mockConstructorArgs: unknown[][] = [];
let mockOnOpen: (() => void) | undefined;
let mockOnMessage: ((event: { data: string }) => void) | undefined;

vi.mock('isomorphic-ws', () => {
  class MockWebSocket {
    static OPEN = 1;
    readyState = 1;
    send = mockSend;
    close = mockClose;

    constructor(...args: unknown[]) {
      mockConstructorArgs.push(args);
      setTimeout(() => mockOnOpen?.(), 0);
    }

    set onopen(fn: () => void) {
      mockOnOpen = fn;
    }

    set onmessage(fn: (event: { data: string }) => void) {
      mockOnMessage = fn;
    }

    set onerror(_fn: (event: unknown) => void) {}

    set onclose(_fn: (event: { code: number; reason: string }) => void) {}

    addEventListener() {}
  }

  return { default: MockWebSocket };
});

vi.mock('./env.js', () => ({
  isBrowser: false
}));

/** Helper to connect a manager and advance timers */
async function connectManager(manager: ReturnType<typeof createWebSocketManager>) {
  const p = manager.connect();
  await vi.advanceTimersByTimeAsync(1);
  await p;
}

/** Yield to microtask queue so async continuations can run */
async function flushMicrotasks() {
  await vi.advanceTimersByTimeAsync(0);
}

describe('createWebSocketManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockConstructorArgs.length = 0;
    mockOnOpen = undefined;
    mockOnMessage = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const config = {
    apiKey: 'test-key',
    baseUrl: 'https://api.gelato.cloud'
  };

  describe('connect', () => {
    it('connects to WebSocket server', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);
    });

    it('reuses existing connection', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);
      await manager.connect();
    });

    it('throws when disabled', async () => {
      const manager = createWebSocketManager({ ...config, disable: true });
      await expect(manager.connect()).rejects.toThrow('WebSocket are disabled!');
    });
  });

  describe('connect authentication', () => {
    it('passes Authorization header in Node.js', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);

      const [url, opts] = mockConstructorArgs[0] as [
        string,
        { headers: { Authorization: string } }
      ];
      expect(url).toBe('wss://api.gelato.cloud/ws');
      expect(opts).toEqual({ headers: { Authorization: 'Bearer test-key' } });
    });

    it('does not include apiKey in URL in Node.js', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);

      const [url] = mockConstructorArgs[0] as [string];
      expect(url).not.toContain('apiKey');
    });

    it('passes apiKey as query parameter in browser', async () => {
      const env = await import('./env.js');
      vi.mocked(env).isBrowser = true;

      const manager = createWebSocketManager(config);
      await connectManager(manager);

      const [url] = mockConstructorArgs[0] as [string];
      const parsed = new URL(url);
      expect(parsed.searchParams.get('apiKey')).toBe('test-key');
      expect(mockConstructorArgs[0]).toHaveLength(1);

      vi.mocked(env).isBrowser = false;
    });

    it('URL-encodes special characters in apiKey for browser', async () => {
      const env = await import('./env.js');
      vi.mocked(env).isBrowser = true;

      const specialKey = 'key+with/special=chars&more';
      const manager = createWebSocketManager({ ...config, apiKey: specialKey });
      await connectManager(manager);

      const [url] = mockConstructorArgs[0] as [string];
      const parsed = new URL(url);
      expect(parsed.searchParams.get('apiKey')).toBe(specialKey);
      expect(url).not.toContain('+with/');

      vi.mocked(env).isBrowser = false;
    });

    it('converts https to wss in browser', async () => {
      const env = await import('./env.js');
      vi.mocked(env).isBrowser = true;

      const manager = createWebSocketManager(config);
      await connectManager(manager);

      const [url] = mockConstructorArgs[0] as [string];
      expect(url).toMatch(/^wss:\/\//);

      vi.mocked(env).isBrowser = false;
    });

    it('converts http to ws in browser', async () => {
      const env = await import('./env.js');
      vi.mocked(env).isBrowser = true;

      const manager = createWebSocketManager({ ...config, baseUrl: 'http://localhost:3000' });
      await connectManager(manager);

      const [url] = mockConstructorArgs[0] as [string];
      expect(url).toMatch(/^ws:\/\/localhost:3000\/ws/);

      vi.mocked(env).isBrowser = false;
    });

    it('does not pass Authorization header in browser', async () => {
      const env = await import('./env.js');
      vi.mocked(env).isBrowser = true;

      const manager = createWebSocketManager(config);
      await connectManager(manager);

      expect(mockConstructorArgs[0]).toHaveLength(1);

      vi.mocked(env).isBrowser = false;
    });

    it('preserves base URL path in browser', async () => {
      const env = await import('./env.js');
      vi.mocked(env).isBrowser = true;

      const manager = createWebSocketManager({ ...config, baseUrl: 'https://api.gelato.cloud' });
      await connectManager(manager);

      const [url] = mockConstructorArgs[0] as [string];
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/ws');
      expect(parsed.hostname).toBe('api.gelato.cloud');

      vi.mocked(env).isBrowser = false;
    });

    it('converts https to wss', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);

      const [url] = mockConstructorArgs[0] as [string];
      expect(url).toMatch(/^wss:\/\//);
    });

    it('converts http to ws', async () => {
      const manager = createWebSocketManager({ ...config, baseUrl: 'http://localhost:3000' });
      await connectManager(manager);

      const [url] = mockConstructorArgs[0] as [string];
      expect(url).toMatch(/^ws:\/\/localhost:3000\/ws/);
    });
  });

  describe('disconnect', () => {
    it('closes connection and clears state', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);

      manager.disconnect();
      expect(mockClose).toHaveBeenCalledWith(1000, 'Client disconnect');
    });

    it('throws when disabled', () => {
      const manager = createWebSocketManager({ ...config, disable: true });
      expect(() => manager.disconnect()).toThrow('WebSockets are disabled!');
    });
  });

  describe('subscribe', () => {
    it('sends subscribe JSON-RPC request', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);

      const subscribePromise = manager.subscribe({ id: 'tx-123' });
      // Yield so the async subscribe can continue past `await connect()`
      await flushMicrotasks();

      const sentMessage = JSON.parse(mockSend.mock.calls[0]?.[0] as string);
      expect(sentMessage.method).toBe('subscribe');

      mockOnMessage?.({
        data: JSON.stringify({
          id: sentMessage.id,
          jsonrpc: '2.0',
          result: 'sub-abc'
        })
      });

      const sub = await subscribePromise;
      expect(sub.subscriptionId).toBe('sub-abc');
      expect(sub.id).toBe('tx-123');
    });

    it('throws on subscription error response', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);

      const subscribePromise = manager.subscribe({ id: 'tx-123' });
      await flushMicrotasks();

      const sentMessage = JSON.parse(mockSend.mock.calls[0]?.[0] as string);
      mockOnMessage?.({
        data: JSON.stringify({
          error: { code: -1, message: 'sub failed' },
          id: sentMessage.id,
          jsonrpc: '2.0'
        })
      });

      await expect(subscribePromise).rejects.toThrow(WebSocketSubscriptionError);
    });

    it('throws when no subscription ID returned', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);

      const subscribePromise = manager.subscribe({ id: 'tx-123' });
      await flushMicrotasks();

      const sentMessage = JSON.parse(mockSend.mock.calls[0]?.[0] as string);
      mockOnMessage?.({
        data: JSON.stringify({
          id: sentMessage.id,
          jsonrpc: '2.0'
        })
      });

      await expect(subscribePromise).rejects.toThrow(WebSocketSubscriptionError);
    });

    it('throws when disabled', async () => {
      const manager = createWebSocketManager({ ...config, disable: true });
      await expect(manager.subscribe({ id: 'test' })).rejects.toThrow('WebSockets are disabled!');
    });
  });

  describe('unsubscribe', () => {
    it('sends unsubscribe JSON-RPC request', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);

      const unsubPromise = manager.unsubscribe('sub-123');
      await flushMicrotasks();

      const sentMessage = JSON.parse(mockSend.mock.calls[0]?.[0] as string);
      mockOnMessage?.({
        data: JSON.stringify({
          id: sentMessage.id,
          jsonrpc: '2.0',
          result: true
        })
      });

      await unsubPromise;
      expect(sentMessage.method).toBe('unsubscribe');
      expect(sentMessage.params).toEqual(['sub-123']);
    });

    it('throws when disabled', async () => {
      const manager = createWebSocketManager({ ...config, disable: true });
      await expect(manager.unsubscribe('sub-123')).rejects.toThrow('WebSockets are disabled!');
    });
  });

  describe('message routing', () => {
    it('routes subscription notifications to correct handler', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);

      const subscribePromise = manager.subscribe({ id: 'tx-1' });
      await flushMicrotasks();

      const sentMessage = JSON.parse(mockSend.mock.calls[0]?.[0] as string);
      mockOnMessage?.({
        data: JSON.stringify({
          id: sentMessage.id,
          jsonrpc: '2.0',
          result: 'sub-1'
        })
      });
      const sub = await subscribePromise;

      const listener = vi.fn();
      sub.on('pending', listener);

      mockOnMessage?.({
        data: JSON.stringify({
          jsonrpc: '2.0',
          method: 'subscription',
          params: {
            result: {
              data: {
                chainId: 1,
                createdAt: 1700000000,
                id: 'tx-1',
                status: 100
              },
              event: 'transaction.pending'
            },
            subscription: 'sub-1'
          }
        })
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('handles heartbeat ping with pong', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);

      mockOnMessage?.({
        data: JSON.stringify({ type: 'ping' })
      });

      expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ type: 'pong' }));
    });
  });

  describe('sendJsonRpc timeout', () => {
    it('rejects pending request after 5 second timeout', async () => {
      const manager = createWebSocketManager(config);
      await connectManager(manager);

      const subscribePromise = manager.subscribe({ id: 'tx-123' });
      const caught = subscribePromise.catch((e) => e);

      await vi.advanceTimersByTimeAsync(6000);

      const error = await caught;
      expect(error).toBeInstanceOf(WebSocketConnectionError);
      expect(error.message).toContain('Request timeout');
    });
  });
});
