import type { RpcClient } from '../types/client.js';
import type { GetStatusParameters, TronReceipt } from './getStatus.js';
import { handleTerminalStatus } from './handleTerminalStatus.js';
import { waitForStatus } from './waitForStatus.js';

/** Waits for a transaction to be included, throws on failure */
export const waitForInclusion = async (
  client: RpcClient,
  parameters: GetStatusParameters
): Promise<TronReceipt> => {
  const status = await waitForStatus(client, parameters);
  return handleTerminalStatus(parameters.id, status);
};
