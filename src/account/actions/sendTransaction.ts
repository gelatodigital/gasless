import type { Call, Hex } from 'viem';
import type { SmartAccount } from 'viem/account-abstraction';
import type { GelatoEvmRelayerClient, SendTransactionOptions } from '../../relayer/index.js';
import type { GelatoSmartAccountImplementation } from '../adapters/types/index.js';

export type NonceOrKey =
  | {
      nonce?: never;
      nonceKey?: never;
    }
  | {
      nonce: bigint;
      nonceKey?: never;
    }
  | {
      nonce?: never;
      nonceKey: bigint;
    };

export type SendTransactionParameters = NonceOrKey & {
  calls: Call[];
  gas?: bigint;
  skipSimulation?: boolean;
};

export const sendTransaction = async (
  client: GelatoEvmRelayerClient,
  account: SmartAccount<GelatoSmartAccountImplementation>,
  parameters: SendTransactionParameters,
  options?: SendTransactionOptions
): Promise<Hex> => {
  const { calls, gas, skipSimulation } = parameters;

  const [nonce, deployed] = await Promise.all([
    parameters.nonce ?? account.getNonce({ key: parameters.nonceKey }),
    account.isDeployed()
  ]);

  const [data, authorizationList] = await Promise.all([
    account.encodeCallData({ calls, nonce }),
    deployed ? undefined : account.signAuthorization().then((x) => [x])
  ]);

  return await client.sendTransaction(
    {
      authorizationList,
      chainId: account.chain.id,
      data,
      gas,
      skipSimulation,
      to: account.address
    },
    options
  );
};
