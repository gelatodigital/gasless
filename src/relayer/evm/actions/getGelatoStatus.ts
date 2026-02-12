import type { Transport } from 'viem';
import { z } from 'zod';
import {
  baseStatusSchema,
  pendingStatusSchema,
  rejectedStatusSchema,
  revertedStatusSchema,
  submittedStatusSchema,
  successStatusSchema,
  transactionReceiptSchema
} from '../../../types/schema.js';

export enum GelatoStatusCode {
  Pending = 100,
  Submitted = 110,
  Success = 200,
  Finalized = 210,
  Rejected = 400,
  Reverted = 500
}
const finalizedStatusSchema = baseStatusSchema.extend({
  receipt: transactionReceiptSchema,
  status: z.literal(GelatoStatusCode.Finalized)
});

export const relayerSuccessStatusSchema = successStatusSchema.extend({
  receipt: transactionReceiptSchema
});

export const relayerRevertedStatusSchema = revertedStatusSchema.extend({
  receipt: transactionReceiptSchema
});

export const gelatoTerminalStatusSchema = z.discriminatedUnion('status', [
  finalizedStatusSchema,
  rejectedStatusSchema,
  relayerRevertedStatusSchema
]);

export const gelatoStatusSchema = z.discriminatedUnion('status', [
  pendingStatusSchema,
  submittedStatusSchema,
  relayerSuccessStatusSchema,
  finalizedStatusSchema,
  rejectedStatusSchema,
  relayerRevertedStatusSchema
]);

export type GelatoTerminalStatus =
  | z.infer<typeof finalizedStatusSchema>
  | z.infer<typeof rejectedStatusSchema>
  | z.infer<typeof relayerRevertedStatusSchema>;

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
