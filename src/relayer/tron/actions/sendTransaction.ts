import { z } from 'zod';
import type { RpcClient } from '../types/client.js';
import type { Payment } from '../types/payment.js';

const responseSchema = z.object({
  id: z.string()
});

export type SendTransactionParameters = {
  chainId: number;
  to: string;
  data: string;
  payment: Payment;
  context?: unknown;
};

export const sendTransaction = async (
  client: RpcClient,
  parameters: SendTransactionParameters
): Promise<string> => {
  const { chainId, to, data, payment, context } = parameters;

  const result = await client.request({
    method: 'tron_sendTransaction',
    params: {
      chainId,
      context: context ?? null,
      data,
      payment,
      to
    }
  });

  const parsed = responseSchema.parse(result);
  return parsed.id;
};
