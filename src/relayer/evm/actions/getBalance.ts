import type { Transport } from 'viem';
import { z } from 'zod';
import { handleRpcError } from '../../../utils/index.js';

const balanceSchema = z.object({
  balance: z.coerce.bigint(),
  decimals: z.number(),
  unit: z.string()
});

export type Balance = z.infer<typeof balanceSchema>;

export const getBalance = async (client: ReturnType<Transport>): Promise<Balance> => {
  try {
    const result = await client.request({
      method: 'gelato_getBalance',
      params: []
    });

    return balanceSchema.parse(result);
  } catch (error) {
    handleRpcError(error);
  }
};
