import { type Address, type Call, encodeFunctionData, erc20Abi, zeroAddress } from 'viem';

export const appendPayment = (
  calls: Call[],
  token: Address,
  feeCollector: Address,
  amount: bigint
): Call[] => {
  if (token === zeroAddress) {
    return [...calls, { to: feeCollector, value: amount }];
  }

  const data = encodeFunctionData({
    abi: erc20Abi,
    args: [feeCollector, amount],
    functionName: 'transfer'
  });

  return [...calls, { data, to: token }];
};
