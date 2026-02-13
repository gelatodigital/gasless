import { WebSocketTimeoutError } from './errors.js';
import type { TerminalStatusResult, WebSocketManager } from './types.js';

export const waitForTerminalStatus = async <TReceipt>(
  wsManager: WebSocketManager<TReceipt>,
  id: string,
  timeout: number
): Promise<TerminalStatusResult<TReceipt>> => {
  const subscription = await wsManager.subscribe({ id });

  try {
    return await new Promise<TerminalStatusResult<TReceipt>>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new WebSocketTimeoutError(`Timeout waiting for terminal status for ${id}`));
      }, timeout);

      subscription.on('success', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
      subscription.on('reverted', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
      subscription.on('rejected', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  } finally {
    await wsManager.unsubscribe(subscription.subscriptionId);
  }
};
