import type { TransactionReceipt, Transport } from 'viem';
import { z } from 'zod';
import {
  rejectedStatusSchema,
  revertedStatusSchema,
  successStatusSchema
} from '../../../types/schema.js';
import { formatAuthorization, retrieveIdFromError } from '../../../utils/index.js';
import { handleTerminalStatus } from './handleTerminalStatus.js';
import type { SendTransactionParameters } from './sendTransaction.js';
import { waitForReceipt } from './waitForReceipt.js';

export const terminalStatusSchemaWithId = z.discriminatedUnion('status', [
  successStatusSchema.extend({ id: z.string() }),
  rejectedStatusSchema.extend({ id: z.string() }),
  revertedStatusSchema.extend({ id: z.string() })
]);

export type SendTransactionSyncParameters = SendTransactionParameters & {
  timeout?: number;
  requestTimeout?: number;
  pollingInterval?: number;
};

export const sendTransactionSync = async (
  client: ReturnType<Transport>,
  parameters: SendTransactionSyncParameters
): Promise<TransactionReceipt> => {
  const { chainId, data, to, context, authorizationList, timeout, requestTimeout } = parameters;

  try {
    const result = await client.request(
      {
        method: 'relayer_sendTransactionSync',
        params: {
          authorizationList: authorizationList
            ? authorizationList.map(formatAuthorization)
            : undefined,
          chainId: chainId.toString(),
          context,
          data,
          timeout: requestTimeout,
          to
        }
      },
      { retryCount: 0 }
    );

    const output = terminalStatusSchemaWithId.parse(result);

    return handleTerminalStatus(output.id, output);
  } catch (error) {
    const id = retrieveIdFromError(error);
    if (id) {
      return waitForReceipt(client, { id, pollingInterval: parameters.pollingInterval, timeout });
    }

    throw error;
  }
};
