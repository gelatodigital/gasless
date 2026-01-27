import { z } from 'zod';

/** Tron address: base58 (T...) or hex (41...) format */
const tronAddressPattern = /^(T[1-9A-HJ-NP-Za-km-z]{33}|41[a-fA-F0-9]{40})$/;
export const tronAddressSchema = z
  .string()
  .regex(tronAddressPattern, { message: 'not a valid Tron address' });

/** Tron transaction hash: 64 hex characters (no 0x prefix) */
export const tronTxHashSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{64}$/, { message: 'not a valid Tron transaction hash' });

/** Hex data with 0x prefix */
const hexDataPattern = /^0x([0-9a-fA-F]{2})*$/;
export const hexDataSchema = z.string().regex(hexDataPattern, { message: 'not valid hex data' });

/** Tron token schema */
export const tronTokenSchema = z.object({
  address: z.string(),
  decimals: z.number()
});

export type TronToken = z.infer<typeof tronTokenSchema>;
