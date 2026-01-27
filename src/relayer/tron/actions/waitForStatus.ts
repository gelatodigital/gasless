import type { RpcClient } from '../types/client.js';
import {
  type GetStatusParameters,
  getStatus,
  StatusCode,
  type TronTerminalStatus
} from './getStatus.js';

/** Poll interval in milliseconds */
const POLL_INTERVAL_MS = 100;

/** Polls for status until a terminal state is reached */
export const waitForStatus = async (
  client: RpcClient,
  parameters: GetStatusParameters
): Promise<TronTerminalStatus> => {
  while (true) {
    const status = await getStatus(client, parameters);

    if (status.status !== StatusCode.Pending && status.status !== StatusCode.Submitted) {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
};
