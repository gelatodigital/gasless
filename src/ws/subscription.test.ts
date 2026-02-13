import { describe, expect, it, vi } from 'vitest';
import { StatusCode } from '../types/schema.js';
import { createSubscription } from './subscription.js';

describe('createSubscription', () => {
  it('sets id and subscriptionId', () => {
    const sub = createSubscription('my-id', 'sub-123');
    expect(sub.id).toBe('my-id');
    expect(sub.subscriptionId).toBe('sub-123');
  });

  describe('on/off', () => {
    it('registers and calls event listeners', () => {
      const sub = createSubscription('id', 'sub');
      const callback = vi.fn();

      sub.on('success', callback);
      sub.handle({
        chainId: 1,
        createdAt: 1700000000,
        id: 'id',
        receipt: {} as never,
        status: StatusCode.Success
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('dispatches to correct event based on status code', () => {
      const sub = createSubscription('id', 'sub');
      const pendingCb = vi.fn();
      const submittedCb = vi.fn();
      const successCb = vi.fn();
      const rejectedCb = vi.fn();
      const revertedCb = vi.fn();

      sub.on('pending', pendingCb);
      sub.on('submitted', submittedCb);
      sub.on('success', successCb);
      sub.on('rejected', rejectedCb);
      sub.on('reverted', revertedCb);

      sub.handle({
        chainId: 1,
        createdAt: 1700000000,
        id: 'id',
        status: StatusCode.Pending
      });
      expect(pendingCb).toHaveBeenCalledTimes(1);
      expect(submittedCb).not.toHaveBeenCalled();

      sub.handle({
        chainId: 1,
        createdAt: 1700000000,
        hash: `0x${'ab'.repeat(32)}`,
        id: 'id',
        status: StatusCode.Submitted
      } as never);
      expect(submittedCb).toHaveBeenCalledTimes(1);
    });

    it('removes listener with off', () => {
      const sub = createSubscription('id', 'sub');
      const callback = vi.fn();

      sub.on('success', callback);
      sub.off('success', callback);

      sub.handle({
        chainId: 1,
        createdAt: 1700000000,
        id: 'id',
        receipt: {} as never,
        status: StatusCode.Success
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('supports multiple listeners for same event', () => {
      const sub = createSubscription('id', 'sub');
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      sub.on('rejected', cb1);
      sub.on('rejected', cb2);

      sub.handle({
        chainId: 1,
        createdAt: 1700000000,
        data: '0x',
        id: 'id',
        message: 'rejected',
        status: StatusCode.Rejected
      });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    it('does not throw when no listeners registered for event', () => {
      const sub = createSubscription('id', 'sub');
      expect(() =>
        sub.handle({
          chainId: 1,
          createdAt: 1700000000,
          id: 'id',
          status: StatusCode.Pending
        })
      ).not.toThrow();
    });
  });
});
