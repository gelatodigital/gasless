import { type Call, zeroAddress } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import type { Capabilities, FeeQuote, GelatoEvmRelayerClient } from '../../relayer/index.js';
import { type Payment, PaymentType } from '../../types/index.js';
import { appendPayment } from '../../utils/payment.js';
import type { GelatoSmartAccountImplementation } from '../adapters/types/index.js';

export type GetFeeQuoteParameters = {
  chainId: number;
  payment: Payment;
  calls: Call[];
};

export const getFeeQuote = async (
  client: GelatoEvmRelayerClient,
  account: SmartAccount<GelatoSmartAccountImplementation>,
  capabilities: Capabilities,
  parameters: GetFeeQuoteParameters
): Promise<FeeQuote> => {
  const { chainId, payment } = parameters;

  const feeCollector = capabilities[chainId]?.feeCollector;

  if (!feeCollector) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const calls =
    payment.type === PaymentType.Token
      ? appendPayment(parameters.calls, payment.address, feeCollector, 1n)
      : parameters.calls;

  const { estimatedGas, estimatedL1Fee } = await account.estimate({ calls });

  return await client.getFeeQuote({
    chainId,
    gas: estimatedGas,
    l1Fee: estimatedL1Fee,
    token: payment.type === PaymentType.Token ? payment.address : zeroAddress
  });
};
