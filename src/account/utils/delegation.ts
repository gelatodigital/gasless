import { type Address, concatHex, type Hex } from 'viem';

const DELEGATION_GAS = 25_000n;

export const delegationGas = (authorizationCount: number): bigint => {
  return DELEGATION_GAS * BigInt(authorizationCount);
};

export const delegationCode = (address: Address): Hex => concatHex(['0xef0100', address]);
