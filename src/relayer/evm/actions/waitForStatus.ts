import type { Transport } from 'viem';
import { StatusCode, type TerminalStatus, terminalStatusSchema } from '../../../types/schema.js';
import { withTimeout } from '../../../utils/withTimeout.js';
import { type GetStatusParameters, getStatus } from './getStatus.js';

export type WaitForStatusParameters = GetStatusParameters & {
  timeout?: number;
  pollingInterval?: number;
};

export const waitForStatus = async (
  client: ReturnType<Transport>,
  parameters: WaitForStatusParameters
): Promise<TerminalStatus> => {
  const { timeout = 120000, pollingInterval = 1000 } = parameters;

  const result = await withTimeout(() => getStatus(client, parameters), {
    pollingInterval,
    shouldContinue: (status) =>
      status.status === StatusCode.Pending || status.status === StatusCode.Submitted,
    timeout,
    timeoutErrorMessage: `Timeout waiting for status for transaction ${parameters.id}`
  });

  // Runtime validation instead of unsafe type assertion
  if (result.status === StatusCode.Pending || result.status === StatusCode.Submitted) {
    throw new Error(
      `Internal error: withTimeout returned non-terminal status ${result.status} for transaction ${parameters.id}`
    );
  }

  return terminalStatusSchema.parse(result);
};
