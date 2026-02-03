import type { Transport } from 'viem';

import type { TransactionReceipt } from './getStatus.js';
import { handleTerminalStatus } from './handleTerminalStatus.js';
import { type WaitForStatusParameters, waitForStatus } from './waitForStatus.js';

export const waitForReceipt = async (
  client: ReturnType<Transport>,
  parameters: WaitForStatusParameters
): Promise<TransactionReceipt> => {
  const result = await waitForStatus(client, parameters);

  return handleTerminalStatus(parameters.id, result);
};
