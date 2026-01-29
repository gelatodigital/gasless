import type { Transport } from 'viem';
import { z } from 'zod';
import { evmAddressSchema, hexData32Schema, hexDataSchema } from '../../../types/index.js';

export enum GelatoStatusCode {
  Pending = 100,
  Submitted = 110,
  Success = 200,
  Finalized = 210,
  Rejected = 400,
  Reverted = 500
}

const logSchema = z.object({
  address: evmAddressSchema,
  data: hexDataSchema,
  topics: z.array(hexData32Schema)
});

const receiptSchema = z.object({
  blockHash: hexData32Schema,
  blockNumber: z.coerce.bigint(),
  gasUsed: z.coerce.bigint(),
  logs: z.array(logSchema).optional(),
  transactionHash: hexData32Schema
});

const baseStatusSchema = z.object({
  chainId: z.coerce.number(),
  createdAt: z.number()
});

const pendingStatusSchema = baseStatusSchema.extend({
  status: z.literal(GelatoStatusCode.Pending)
});

const submittedStatusSchema = baseStatusSchema.extend({
  hash: hexData32Schema,
  status: z.literal(GelatoStatusCode.Submitted)
});

const successStatusSchema = baseStatusSchema.extend({
  receipt: receiptSchema,
  status: z.literal(GelatoStatusCode.Success)
});

const finalizedStatusSchema = baseStatusSchema.extend({
  receipt: receiptSchema,
  status: z.literal(GelatoStatusCode.Finalized)
});

const rejectedStatusSchema = baseStatusSchema.extend({
  data: z.unknown().optional(),
  message: z.string(),
  status: z.literal(GelatoStatusCode.Rejected)
});

const revertedStatusSchema = baseStatusSchema.extend({
  data: z.string(),
  message: z.string().optional(),
  receipt: receiptSchema,
  status: z.literal(GelatoStatusCode.Reverted)
});

export const gelatoTerminalStatusSchema = z.discriminatedUnion('status', [
  finalizedStatusSchema,
  rejectedStatusSchema,
  revertedStatusSchema
]);

export const gelatoStatusSchema = z.discriminatedUnion('status', [
  pendingStatusSchema,
  submittedStatusSchema,
  successStatusSchema,
  finalizedStatusSchema,
  rejectedStatusSchema,
  revertedStatusSchema
]);

export type GelatoTerminalStatus = z.infer<typeof gelatoTerminalStatusSchema>;

export type GelatoStatus = z.infer<typeof gelatoStatusSchema>;

export type GetGelatoStatusParameters = {
  id: string;
};

export const getGelatoStatus = async (
  client: ReturnType<Transport>,
  parameters: GetGelatoStatusParameters
): Promise<GelatoStatus> => {
  const { id } = parameters;

  const result = await client.request({
    method: 'gelato_getStatus',
    params: { id }
  });

  return gelatoStatusSchema.parse(result);
};
