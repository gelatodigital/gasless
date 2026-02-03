import type { Client, EstimateFeesPerGasReturnType } from 'viem';

export type GetUserOperationGasPriceReturnType = EstimateFeesPerGasReturnType<'eip1559'>;

export const getUserOperationGasPrice = async (
  client: Client,
  sponsored: boolean
): Promise<GetUserOperationGasPriceReturnType> => {
  if (sponsored) {
    return {
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n
    };
  }

  const { maxFeePerGas, maxPriorityFeePerGas } = await client.request({
    method: 'gelato_getUserOperationGasPrice'
  } as never);

  return {
    maxFeePerGas: BigInt(maxFeePerGas),
    maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas)
  };
};
