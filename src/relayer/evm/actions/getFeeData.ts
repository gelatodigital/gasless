import type { Address, Transport } from 'viem';
import { z } from 'zod';
import { evmTokenSchema } from '../../../types/index.js';
import { handleRpcError } from '../../../utils/index.js';

const feeDataSchema = z.object({
  chainId: z.coerce.number(),
  context: z.unknown().optional(),
  expiry: z.number(),
  gasPrice: z.coerce.bigint(),
  rate: z.number(),
  token: evmTokenSchema
});

export type FeeData = z.infer<typeof feeDataSchema>;

export type GetFeeDataParameters = {
  chainId: number;
  token: Address;
};

export const getFeeData = async (
  client: ReturnType<Transport>,
  parameters: GetFeeDataParameters
): Promise<FeeData> => {
  const { chainId, token } = parameters;
  try {
    const result = await client.request({
      method: 'relayer_getFeeData',
      params: {
        chainId: chainId.toString(),
        token
      }
    });

    return feeDataSchema.parse(result);
  } catch (error) {
    handleRpcError(error);
  }
};
