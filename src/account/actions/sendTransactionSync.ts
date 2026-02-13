import type { TransactionReceipt } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import type { GelatoEvmRelayerClient } from '../../relayer/index.js';
import type { GelatoSmartAccountImplementation } from '../adapters/types/index.js';
import type { SendTransactionParameters } from './sendTransaction.js';

export type SendTransactionSyncParameters = SendTransactionParameters & {
  timeout?: number;
  requestTimeout?: number;
  pollingInterval?: number;
  usePolling?: boolean;
};

export const sendTransactionSync = async (
  client: GelatoEvmRelayerClient,
  account: SmartAccount<GelatoSmartAccountImplementation>,
  parameters: SendTransactionSyncParameters
): Promise<TransactionReceipt> => {
  const { timeout, calls } = parameters;

  const [nonce, deployed] = await Promise.all([
    parameters.nonce ?? account.getNonce({ key: parameters.nonceKey }),
    account.isDeployed()
  ]);

  const [data, authorizationList] = await Promise.all([
    account.encodeCallData({ calls, nonce }),
    deployed ? undefined : account.signAuthorization().then((x) => [x])
  ]);

  return await client.sendTransactionSync({
    ...parameters,
    authorizationList,
    chainId: account.chain.id,
    data,
    timeout,
    to: account.address
  });
};
