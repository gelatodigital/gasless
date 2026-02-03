import { getAddress, type Hex } from 'viem';
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

// Type exports
export type BaseStatus = z.infer<typeof baseStatusSchema>;
