import type { Hex } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import type { CapabilitiesByChain, FeeQuote, GelatoEvmRelayerClient } from '../../relayer/index.js';
import { PaymentType } from '../../types/index.js';
import { appendPayment } from '../../utils/index.js';
import type { GelatoSmartAccountImplementation } from '../adapters/types/index.js';
import { type GetFeeQuoteParameters, getFeeQuote } from './getFeeQuote.js';

export type SendTransactionParameters = GetFeeQuoteParameters & {
  quote?: FeeQuote;
};

export const sendTransaction = async (
  client: GelatoEvmRelayerClient,
  account: SmartAccount<GelatoSmartAccountImplementation>,
  capabilities: CapabilitiesByChain,
  parameters: SendTransactionParameters
): Promise<Hex> => {
  const { payment } = parameters;

  const [quote, nonce, deployed] = await Promise.all([
    payment.type === PaymentType.Token
      ? (parameters.quote ?? (await getFeeQuote(client, account, capabilities, parameters)))
      : undefined,
    account.getNonce(),
    account.isDeployed()
  ]);

  const calls = quote
    ? appendPayment(parameters.calls, quote.token.address, capabilities.feeCollector, quote.fee)
    : parameters.calls;

  const [data, authorizationList] = await Promise.all([
    account.encodeCallData({ calls, nonce }),
    deployed ? undefined : account.signAuthorization().then((x) => [x])
  ]);

  return await client.sendTransaction({
    authorizationList,
    chainId: account.chain.id,
    context: quote?.context,
    data,
    payment,
    to: account.address
  });
};
