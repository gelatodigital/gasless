import type { Transport } from 'viem';
import { z } from 'zod';
import { evmAddressSchema, hexData32Schema, hexDataSchema } from '../../../types/index.js';

export enum StatusCode {
  Pending = 100,
  Submitted = 110,
  Success = 200,
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
  status: z.literal(StatusCode.Pending)
});

const submittedStatusSchema = baseStatusSchema.extend({
  hash: hexData32Schema,
  status: z.literal(StatusCode.Submitted)
});

const successStatusSchema = baseStatusSchema.extend({
  receipt: receiptSchema,
  status: z.literal(StatusCode.Success)
});

const rejectedStatusSchema = baseStatusSchema.extend({
  data: z.unknown().optional(),
  message: z.string(),
  status: z.literal(StatusCode.Rejected)
});

const revertedStatusSchema = baseStatusSchema.extend({
  data: z.string(),
  message: z.string().optional(),
  receipt: receiptSchema,
  status: z.literal(StatusCode.Reverted)
});

export const terminalStatusSchema = z.discriminatedUnion('status', [
  successStatusSchema,
  rejectedStatusSchema,
  revertedStatusSchema
]);

export const terminalStatusSchemaWithId = z.discriminatedUnion('status', [
  successStatusSchema.extend({ id: z.string() }),
  rejectedStatusSchema.extend({ id: z.string() }),
  revertedStatusSchema.extend({ id: z.string() })
]);

export const statusSchema = z.discriminatedUnion('status', [
  pendingStatusSchema,
  submittedStatusSchema,
  successStatusSchema,
  rejectedStatusSchema,
  revertedStatusSchema
]);

export type TerminalStatus = z.infer<typeof terminalStatusSchema>;

export type Status = z.infer<typeof statusSchema>;

export type TransactionReceipt = z.infer<typeof receiptSchema>;

export type GetStatusParameters = {
  id: string;
};

export const getStatus = async (
  client: ReturnType<Transport>,
  parameters: GetStatusParameters
): Promise<Status> => {
  const { id } = parameters;

  const result = await client.request({
    method: 'relayer_getStatus',
    params: { id }
  });

  return statusSchema.parse(result);
};
