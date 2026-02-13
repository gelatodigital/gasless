import type { Transport } from 'viem';
import { type Status, statusSchema } from '../../../types/schema.js';
import { handleRpcError } from '../../../utils/index.js';

export type GetStatusParameters = {
  id: string;
};

export const getStatus = async (
  client: ReturnType<Transport>,
  parameters: GetStatusParameters
): Promise<Status> => {
  const { id } = parameters;

  try {
    const result = await client.request({
      method: 'relayer_getStatus',
      params: { id }
    });

    return statusSchema.parse(result);
  } catch (error) {
    handleRpcError(error);
  }
};
