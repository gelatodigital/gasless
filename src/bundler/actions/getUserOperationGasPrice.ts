import type { Client, EstimateFeesPerGasReturnType } from 'viem';
import type { Payment } from '../../types/index.js';

export type GetUserOperationGasPriceReturnType = EstimateFeesPerGasReturnType<'eip1559'>;

export const getUserOperationGasPrice = async (
  client: Client,
  payment?: Payment
): Promise<GetUserOperationGasPriceReturnType> => {
  if (payment) {
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
