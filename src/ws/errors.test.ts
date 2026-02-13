import { describe, expect, it } from 'vitest';
import {
  isWebSocketError,
  WebSocketConnectionError,
  WebSocketSubscriptionError,
  WebSocketTimeoutError
} from './errors.js';

describe('WebSocket error classes', () => {
  it('WebSocketConnectionError has correct name', () => {
    const error = new WebSocketConnectionError('connection failed');
    expect(error.name).toBe('WebSocketConnectionError');
    expect(error.message).toContain('connection failed');
  });

  it('WebSocketSubscriptionError has correct name', () => {
    const error = new WebSocketSubscriptionError('sub failed');
    expect(error.name).toBe('WebSocketSubscriptionError');
    expect(error.message).toContain('sub failed');
  });

  it('WebSocketTimeoutError has correct name', () => {
    const error = new WebSocketTimeoutError('timed out');
    expect(error.name).toBe('WebSocketTimeoutError');
    expect(error.message).toContain('timed out');
  });
});

describe('isWebSocketError', () => {
  it('returns true for WebSocketConnectionError', () => {
    expect(isWebSocketError(new WebSocketConnectionError('test'))).toBe(true);
  });

  it('returns true for WebSocketSubscriptionError', () => {
    expect(isWebSocketError(new WebSocketSubscriptionError('test'))).toBe(true);
  });

  it('returns true for WebSocketTimeoutError', () => {
    expect(isWebSocketError(new WebSocketTimeoutError('test'))).toBe(true);
  });

  it('returns false for regular Error', () => {
    expect(isWebSocketError(new Error('test'))).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isWebSocketError('string')).toBe(false);
    expect(isWebSocketError(null)).toBe(false);
    expect(isWebSocketError(undefined)).toBe(false);
  });
});
