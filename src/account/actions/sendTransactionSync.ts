import type { SmartAccount } from 'viem/account-abstraction';
import type {
  CapabilitiesByChain,
  GelatoEvmRelayerClient,
  TerminalStatus
} from '../../relayer/index.js';
import { PaymentType } from '../../types/index.js';
import { appendPayment } from '../../utils/index.js';
import type { GelatoSmartAccountImplementation } from '../adapters/types/index.js';
import { getFeeQuote } from './getFeeQuote.js';
import type { SendTransactionParameters } from './sendTransaction.js';

export type SendTransactionSyncParameters = SendTransactionParameters & {
  timeout: number;
};

export const sendTransactionSync = async (
  client: GelatoEvmRelayerClient,
  account: SmartAccount<GelatoSmartAccountImplementation>,
  capabilities: CapabilitiesByChain,
  parameters: SendTransactionSyncParameters
): Promise<TerminalStatus> => {
  const { payment, timeout } = parameters;

  const [quote, nonce, deployed] = await Promise.all([
    payment.type === PaymentType.Token
      ? (parameters.quote ?? (await getFeeQuote(client, account, capabilities, parameters)))
      : undefined,
    parameters.nonce ?? account.getNonce({ key: parameters.nonceKey }),
    account.isDeployed()
  ]);

  const calls = quote
    ? appendPayment(parameters.calls, quote.token.address, capabilities.feeCollector, quote.fee)
    : parameters.calls;

  const [data, authorizationList] = await Promise.all([
    account.encodeCallData({ calls, nonce }),
    deployed ? undefined : account.signAuthorization().then((x) => [x])
  ]);

  return await client.sendTransactionSync({
    authorizationList,
    chainId: account.chain.id,
    context: quote?.context,
    data,
    payment,
    timeout,
    to: account.address
  });
};
