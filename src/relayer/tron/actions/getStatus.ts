import { z } from 'zod';
import type { RpcClient } from '../types/client.js';

export enum StatusCode {
  Pending = 100,
  Submitted = 110,
  Included = 200,
  Rejected = 400,
  Reverted = 500
}

const tronReceiptSchema = z.object({
  bandwidthUsed: z.string().optional(),
  blockHash: z.string().optional(),
  blockNumber: z.string().optional(),
  callValue: z.string().optional(),
  energyUsed: z.string().optional(),
  feeLimit: z.string().optional(),
  includedAt: z.number().optional(),
  transactionHash: z.string()
});

const baseStatusSchema = z.object({
  chainId: z.string(),
  createdAt: z.number()
});

const pendingStatusSchema = baseStatusSchema.extend({
  status: z.literal(StatusCode.Pending)
});

const submittedStatusSchema = baseStatusSchema.extend({
  hash: z.string(),
  status: z.literal(StatusCode.Submitted)
});

const includedStatusSchema = baseStatusSchema.extend({
  receipt: tronReceiptSchema,
  status: z.literal(StatusCode.Included)
});

const rejectedStatusSchema = baseStatusSchema.extend({
  data: z.unknown().optional(),
  message: z.string(),
  status: z.literal(StatusCode.Rejected)
});

const revertedStatusSchema = baseStatusSchema.extend({
  data: z.string(),
  message: z.string().optional(),
  receipt: tronReceiptSchema,
  status: z.literal(StatusCode.Reverted)
});

export const terminalStatusSchema = z.discriminatedUnion('status', [
  includedStatusSchema,
  rejectedStatusSchema,
  revertedStatusSchema
]);

export const statusSchema = z.discriminatedUnion('status', [
  pendingStatusSchema,
  submittedStatusSchema,
  includedStatusSchema,
  rejectedStatusSchema,
  revertedStatusSchema
]);

export type TronTerminalStatus = z.infer<typeof terminalStatusSchema>;
export type TronStatus = z.infer<typeof statusSchema>;
export type TronReceipt = z.infer<typeof tronReceiptSchema>;

export type GetStatusParameters = {
  id: string;
};

export const getStatus = async (
  client: RpcClient,
  parameters: GetStatusParameters
): Promise<TronStatus> => {
  const { id } = parameters;

  const result = await client.request({
    method: 'tron_getStatus',
    params: { id }
  });

  return statusSchema.parse(result);
};
