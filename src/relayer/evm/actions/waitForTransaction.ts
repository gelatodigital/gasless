import type { Transport } from 'viem';
import { type GetStatusParameters, getStatus, type Status, StatusCode } from './getStatus.js';

// TODO: use websockets
// TODO: make polling interval configurable
export const waitForTransaction = async (
  client: ReturnType<Transport>,
  parameters: GetStatusParameters
): Promise<Status> => {
  while (true) {
    const status = await getStatus(client, parameters);

    if (status.status !== StatusCode.Pending && status.status !== StatusCode.Submitted) {
      return status;
    }

    await new Promise((r) => setTimeout(r, 100));
  }
};
