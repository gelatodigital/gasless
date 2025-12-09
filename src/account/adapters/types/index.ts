import type { Abi, Call, Hex, SignedAuthorization } from 'viem';
import type { EntryPointVersion, SmartAccountImplementation } from 'viem/account-abstraction';

export type EstimateParameters = {
  calls: Call[];
};

export type EstimateReturnType = {
  estimatedGas: bigint;
  estimatedL1Fee?: bigint;
};

export type EncodeCallDataParameters = EstimateParameters & {
  nonce?: bigint;
};

export type GelatoSmartAccountActions = {
  estimate: (parameters: EstimateParameters) => Promise<EstimateReturnType>;
  encodeCallData: (parameters: EncodeCallDataParameters) => Promise<Hex>;
  signAuthorization: () => Promise<SignedAuthorization>;
};

export type GelatoSmartAccountImplementation<
  entryPointAbi extends Abi | readonly unknown[] = Abi,
  entryPointVersion extends EntryPointVersion = EntryPointVersion
> = SmartAccountImplementation<entryPointAbi, entryPointVersion, object, true> &
  GelatoSmartAccountActions;
