import type { TransactionReceipt } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import type { GelatoEvmRelayerClient, SendTransactionSyncOptions } from '../../relayer/index.js';
import type { GelatoSmartAccountImplementation } from '../adapters/types/index.js';
import type { SendTransactionParameters } from './sendTransaction.js';

export type SendTransactionSyncParameters = SendTransactionParameters;

export const sendTransactionSync = async (
  client: GelatoEvmRelayerClient,
  account: SmartAccount<GelatoSmartAccountImplementation>,
  parameters: SendTransactionSyncParameters,
  options?: SendTransactionSyncOptions
): Promise<TransactionReceipt> => {
  const { calls } = parameters;

  const [nonce, deployed] = await Promise.all([
    parameters.nonce ?? account.getNonce({ key: parameters.nonceKey }),
    account.isDeployed()
  ]);

  const [data, authorizationList] = await Promise.all([
    account.encodeCallData({ calls, nonce }),
    deployed ? undefined : account.signAuthorization().then((x) => [x])
  ]);

  return await client.sendTransactionSync(
    {
      authorizationList,
      chainId: account.chain.id,
      data,
      to: account.address
    },
    options
  );
};
