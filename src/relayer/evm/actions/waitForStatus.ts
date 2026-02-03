import type { Transport } from 'viem';
import { withTimeout } from '../../../utils/withTimeout.js';
import {
  type GetStatusParameters,
  getStatus,
  StatusCode,
  type TerminalStatus
} from './getStatus.js';

export type WaitForStatusParameters = GetStatusParameters & {
  timeout?: number;
  pollingInterval?: number;
};

export const waitForStatus = async (
  client: ReturnType<Transport>,
  parameters: WaitForStatusParameters
): Promise<TerminalStatus> => {
  const { timeout = 10000, pollingInterval = 100 } = parameters;

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

  // TypeScript now understands the discriminated union narrowing
  return result;
};
