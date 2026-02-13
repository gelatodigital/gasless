import type { Address, Transport } from 'viem';
import { z } from 'zod';
import { evmTokenSchema } from '../../../types/index.js';
import { handleRpcError } from '../../../utils/index.js';

const feeQuote = z.object({
  chainId: z.coerce.number(),
  context: z.unknown().optional(),
  expiry: z.number(),
  fee: z.coerce.bigint(),
  token: evmTokenSchema
});

export type FeeQuote = z.infer<typeof feeQuote>;

export type GetFeeQuoteParameters = {
  chainId: number;
  gas: bigint;
  l1Fee?: bigint;
  token: Address;
};

export const getFeeQuote = async (
  client: ReturnType<Transport>,
  parameters: GetFeeQuoteParameters
): Promise<FeeQuote> => {
  const { chainId, gas, l1Fee, token } = parameters;
  try {
    const result = await client.request({
      method: 'relayer_getFeeQuote',
      params: {
        chainId: chainId.toString(),
        gas: gas.toString(),
        l1Fee: l1Fee ? l1Fee.toString() : undefined,
        token
      }
    });

    return feeQuote.parse(result);
  } catch (error) {
    handleRpcError(error);
  }
};
