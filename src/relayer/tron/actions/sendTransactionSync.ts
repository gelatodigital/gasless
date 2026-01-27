import type { RpcClient } from '../types/client.js';
import type { Payment } from '../types/payment.js';
import type { TronReceipt } from './getStatus.js';
import { sendTransaction } from './sendTransaction.js';
import { waitForInclusion } from './waitForInclusion.js';

export type SendTransactionSyncParameters = {
  chainId: number;
  to: string;
  data: string;
  payment: Payment;
  context?: unknown;
};

/** Sends a transaction and waits for it to be included */
export const sendTransactionSync = async (
  client: RpcClient,
  parameters: SendTransactionSyncParameters
): Promise<TronReceipt> => {
  const id = await sendTransaction(client, parameters);
  return waitForInclusion(client, { id });
};
