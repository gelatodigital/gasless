import type { Transport } from 'viem';

import type { GetStatusParameters, TransactionReceipt } from './getStatus.js';
import { handleTerminalStatus } from './handleTerminalStatus.js';
import { waitForStatus } from './waitForStatus.js';

export const waitForInclusion = async (
  client: ReturnType<Transport>,
  parameters: GetStatusParameters
): Promise<TransactionReceipt> => {
  const result = await waitForStatus(client, parameters);

  return handleTerminalStatus(parameters.id, result);
};
