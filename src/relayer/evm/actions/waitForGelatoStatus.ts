import type { Transport } from 'viem';
import {
  GelatoStatusCode,
  type GelatoTerminalStatus,
  type GetGelatoStatusParameters,
  getGelatoStatus
} from './getGelatoStatus.js';

// TODO: use websockets
// TODO: make polling interval configurable
export const waitForGelatoStatus = async (
  client: ReturnType<Transport>,
  parameters: GetGelatoStatusParameters
): Promise<GelatoTerminalStatus> => {
  while (true) {
    const status = await getGelatoStatus(client, parameters);

    if (
      status.status !== GelatoStatusCode.Pending &&
      status.status !== GelatoStatusCode.Submitted &&
      status.status !== GelatoStatusCode.Success
    ) {
      return status;
    }

    await new Promise((r) => setTimeout(r, 100));
  }
};
