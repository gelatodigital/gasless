import type { Transport } from 'viem';
import { withTimeout } from '../../../utils/index.js';
import {
  GelatoStatusCode,
  type GelatoTerminalStatus,
  type GetGelatoStatusParameters,
  getGelatoStatus
} from './getGelatoStatus.js';

export type WaitForGelatoStatusParameters = GetGelatoStatusParameters & {
  timeout?: number;
  pollingInterval?: number;
};

export const waitForGelatoStatus = async (
  client: ReturnType<Transport>,
  parameters: WaitForGelatoStatusParameters
): Promise<GelatoTerminalStatus> => {
  const { timeout = 120000, pollingInterval = 10000 } = parameters;

  const result = await withTimeout(() => getGelatoStatus(client, parameters), {
    pollingInterval,
    shouldContinue: (status) =>
      status.status === GelatoStatusCode.Pending ||
      status.status === GelatoStatusCode.Submitted ||
      status.status === GelatoStatusCode.Success, // Success is intermediate, wait for Finalized
    timeout,
    timeoutErrorMessage: `Timeout waiting for gelato status for transaction ${parameters.id} after ${timeout}ms`
  });

  // Runtime validation instead of unsafe type assertion
  if (
    result.status === GelatoStatusCode.Pending ||
    result.status === GelatoStatusCode.Submitted ||
    result.status === GelatoStatusCode.Success
  ) {
    throw new Error(
      `Internal error: withTimeout returned non-terminal status ${result.status} for transaction ${parameters.id}`
    );
  }

  return result;
};
