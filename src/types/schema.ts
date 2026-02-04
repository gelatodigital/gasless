import { formatTransactionReceipt, getAddress, type Hex, type RpcTransactionReceipt } from 'viem';
import { z } from 'zod';

const hexData32Pattern = /^0x([0-9a-fA-F][0-9a-fA-F]){32}$/;
const hexDataPattern = /^0x([0-9a-fA-F][0-9a-fA-F])*$/;
const evmAddressPattern = /^0x([0-9a-fA-F][0-9a-fA-F]){20}$/;

export const hexDataSchema = z
  .string()
  .regex(hexDataPattern, { message: 'not valid hex data' })
  .transform((val) => val as Hex);

export const hexData32Schema = z
  .string()
  .regex(hexData32Pattern, { message: 'not valid 32-byte hex data' })
  .transform((val) => val as Hex);

export const evmAddressSchema = z
  .string()
  .regex(evmAddressPattern, { message: 'not a valid EVM address' })
  .transform((val) => getAddress(val));

export const evmTokenSchema = z.object({
  address: evmAddressSchema,
  decimals: z.number()
});

export type EvmToken = z.infer<typeof evmTokenSchema>;

/**
 * Base schema for all status responses
 */
export const baseStatusSchema = z.object({
  chainId: z.coerce.number(),
  createdAt: z.number()
});

export const transactionReceiptSchema = z
  .custom<RpcTransactionReceipt>()
  .transform((receipt) => formatTransactionReceipt(receipt));

export enum StatusCode {
  Pending = 100,
  Submitted = 110,
  Success = 200,
  Rejected = 400,
  Reverted = 500
}

export const pendingStatusSchema = baseStatusSchema.extend({
  status: z.literal(StatusCode.Pending)
});

export const submittedStatusSchema = baseStatusSchema.extend({
  hash: hexData32Schema,
  status: z.literal(StatusCode.Submitted)
});

export const successStatusSchema = baseStatusSchema.extend({
  receipt: transactionReceiptSchema,
  status: z.literal(StatusCode.Success)
});

export const rejectedStatusSchema = baseStatusSchema.extend({
  data: z.unknown().optional(),
  message: z.string(),
  status: z.literal(StatusCode.Rejected)
});

export const revertedStatusSchema = baseStatusSchema.extend({
  data: z.string(),
  message: z.string().optional(),
  receipt: transactionReceiptSchema,
  status: z.literal(StatusCode.Reverted)
});

export const statusSchema = z.discriminatedUnion('status', [
  pendingStatusSchema,
  submittedStatusSchema,
  successStatusSchema,
  rejectedStatusSchema,
  revertedStatusSchema
]);

export const terminalStatusSchema = z.discriminatedUnion('status', [
  successStatusSchema,
  rejectedStatusSchema,
  revertedStatusSchema
]);

export type TerminalStatus = z.infer<typeof terminalStatusSchema>;

export type Status = z.infer<typeof statusSchema>;
