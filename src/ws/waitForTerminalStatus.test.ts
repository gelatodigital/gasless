import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockWebSocketManager } from '../__test__/helpers/mockWebSocket.js';
import { StatusCode } from '../types/schema.js';
import { WebSocketTimeoutError } from './errors.js';
import { waitForTerminalStatus } from './waitForTerminalStatus.js';

describe('waitForTerminalStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves on success event', async () => {
    const ws = createMockWebSocketManager();
    const promise = waitForTerminalStatus(ws, 'test-id', 10000);

    // Need to yield to let the async function register .on() handlers
    await vi.advanceTimersByTimeAsync(0);

    ws.mockSubscription.emit('success', {
      chainId: 1,
      createdAt: 1700000000,
      id: 'test-id',
      receipt: { mock: true } as never,
      status: StatusCode.Success
    });

    const result = await promise;
    expect(result.status).toBe(StatusCode.Success);
  });

  it('resolves on rejected event', async () => {
    const ws = createMockWebSocketManager();
    const promise = waitForTerminalStatus(ws, 'test-id', 10000);

    await vi.advanceTimersByTimeAsync(0);

    ws.mockSubscription.emit('rejected', {
      chainId: 1,
      createdAt: 1700000000,
      data: '0x',
      id: 'test-id',
      message: 'rejected',
      status: StatusCode.Rejected
    });

    const result = await promise;
    expect(result.status).toBe(StatusCode.Rejected);
  });

  it('resolves on reverted event', async () => {
    const ws = createMockWebSocketManager();
    const promise = waitForTerminalStatus(ws, 'test-id', 10000);

    await vi.advanceTimersByTimeAsync(0);

    ws.mockSubscription.emit('reverted', {
      chainId: 1,
      createdAt: 1700000000,
      data: '0x08c379a0',
      id: 'test-id',
      receipt: { mock: true } as never,
      status: StatusCode.Reverted
    });

    const result = await promise;
    expect(result.status).toBe(StatusCode.Reverted);
  });

  it('calls unsubscribe in finally block', async () => {
    const ws = createMockWebSocketManager();
    const promise = waitForTerminalStatus(ws, 'test-id', 10000);

    await vi.advanceTimersByTimeAsync(0);

    ws.mockSubscription.emit('success', {
      chainId: 1,
      createdAt: 1700000000,
      id: 'test-id',
      receipt: {} as never,
      status: StatusCode.Success
    });

    await promise;
    expect(ws.unsubscribe).toHaveBeenCalledWith('mock-sub-id');
  });

  it('throws WebSocketTimeoutError on timeout', async () => {
    const ws = createMockWebSocketManager();
    const promise = waitForTerminalStatus(ws, 'test-id', 5000);
    const caught = promise.catch((e) => e);

    await vi.advanceTimersByTimeAsync(6000);

    const error = await caught;
    expect(error).toBeInstanceOf(WebSocketTimeoutError);
    expect(error.message).toContain('test-id');

    // Ensure unsubscribe is still called on timeout
    expect(ws.unsubscribe).toHaveBeenCalledWith('mock-sub-id');
  });

  it('subscribes with the provided id', async () => {
    const ws = createMockWebSocketManager();
    const promise = waitForTerminalStatus(ws, 'my-tx-id', 10000);

    await vi.advanceTimersByTimeAsync(0);

    ws.mockSubscription.emit('success', {
      chainId: 1,
      createdAt: 1700000000,
      id: 'my-tx-id',
      receipt: {} as never,
      status: StatusCode.Success
    });

    await promise;
    expect(ws.subscribe).toHaveBeenCalledWith({ id: 'my-tx-id' });
  });
});
