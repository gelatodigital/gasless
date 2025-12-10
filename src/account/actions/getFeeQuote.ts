import { type Call, zeroAddress } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import type { CapabilitiesByChain, FeeQuote, GelatoEvmRelayerClient } from '../../relayer/index.js';
import { type Payment, PaymentType } from '../../types/index.js';
import { appendPayment } from '../../utils/payment.js';
import type { GelatoSmartAccountImplementation } from '../adapters/types/index.js';

export type GetFeeQuoteParameters = {
  payment: Payment;
  calls: Call[];
};

export const getFeeQuote = async (
  client: GelatoEvmRelayerClient,
  account: SmartAccount<GelatoSmartAccountImplementation>,
  capabilities: CapabilitiesByChain,
  parameters: GetFeeQuoteParameters
): Promise<FeeQuote> => {
  const { payment } = parameters;

  const calls =
    payment.type === PaymentType.Token
      ? appendPayment(parameters.calls, payment.address, capabilities.feeCollector, 1n)
      : parameters.calls;

  const { estimatedGas, estimatedL1Fee } = await account.estimate({ calls });

  return await client.getFeeQuote({
    chainId: account.chain.id,
    gas: estimatedGas,
    l1Fee: estimatedL1Fee,
    token: payment.type === PaymentType.Token ? payment.address : zeroAddress
  });
};
