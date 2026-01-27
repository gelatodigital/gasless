import { z } from 'zod';
import type { RpcClient } from '../types/client.js';
import { tronTokenSchema } from '../types/schema.js';

const exchangeRateSchema = z.object({
  chainId: z.string(),
  context: z.unknown().optional(),
  energyPriceSun: z.string(),
  expiry: z.number(),
  rate: z.number(),
  token: tronTokenSchema
});

export type TronExchangeRate = z.infer<typeof exchangeRateSchema>;

export type GetExchangeRateParameters = {
  chainId: number;
  token: string;
};

export const getExchangeRate = async (
  client: RpcClient,
  parameters: GetExchangeRateParameters
): Promise<TronExchangeRate> => {
  const { chainId, token } = parameters;

  const result = await client.request({
    method: 'tron_getExchangeRate',
    params: {
      chainId,
      token
    }
  });

  return exchangeRateSchema.parse(result);
};
