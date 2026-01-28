import {
  type Account,
  type Chain,
  type Client,
  encodeFunctionData,
  encodePacked,
  type JsonRpcAccount,
  type LocalAccount,
  type PrivateKeyAccount,
  type StateOverride,
  type Transport,
  type TypedDataDefinition
} from 'viem';
import {
  entryPoint08Abi,
  entryPoint08Address,
  getUserOperationTypedData,
  type SmartAccount
} from 'viem/account-abstraction';
import {
  estimateGas,
  getCode,
  readContract,
  signMessage,
  signTypedData,
  signAuthorization as viem_signAuthorization
} from 'viem/actions';
import { encodeCalls } from 'viem/experimental/erc7821';
import { delegationCode, delegationGas, estimateL1Fee } from '../../utils/index.js';
import type { GelatoSmartAccountImplementation } from '../types/index.js';
import { delegationAbi, simulationAbi, simulationBytecode } from './abi.js';
import {
  EXECUTION_MODE_OP_DATA,
  GELATO_DELEGATION_ADDRESS,
  GELATO_DELEGATION_NAME,
  GELATO_DELEGATION_VERSION,
  STUB_SIGNATURE
} from './constants.js';

export type GelatoSmartAccountParameters = {
  client: Client<Transport, Chain, JsonRpcAccount | LocalAccount | undefined>;
  owner: Account;
};

export type GelatoSmartAccountReturnType = SmartAccount<
  GelatoSmartAccountImplementation<typeof entryPoint08Abi, '0.8'>
>;

export const toGelatoSmartAccount = (
  parameters: GelatoSmartAccountParameters
): GelatoSmartAccountReturnType => {
  const { client, owner } = parameters;

  let deployed = false;
  const isDeployed = async () => {
    if (deployed) {
      return true;
    }

    const code = await getCode(client, { address: owner.address });

    deployed =
      code !== undefined &&
      code.toLowerCase() === delegationCode(GELATO_DELEGATION_ADDRESS).toLowerCase();

    return deployed;
  };

  const getNonce = async (parameters?: { key?: bigint }) =>
    readContract(client, {
      abi: delegationAbi,
      address: owner.address,
      args: [parameters?.key ?? 0n],
      functionName: 'getNonce',
      stateOverride: (await isDeployed())
        ? undefined
        : [
            {
              address: owner.address,
              code: delegationCode(GELATO_DELEGATION_ADDRESS)
            }
          ]
    });

  return {
    address: owner.address,
    authorization: {
      account: owner as PrivateKeyAccount,
      address: GELATO_DELEGATION_ADDRESS
    },
    chain: client.chain,
    client,
    encodeCallData: async (parameters) => {
      const { calls, nonce } = parameters;

      const signature = await signTypedData(client, {
        account: owner,
        domain: {
          chainId: client.chain.id,
          name: GELATO_DELEGATION_NAME,
          verifyingContract: owner.address,
          version: GELATO_DELEGATION_VERSION
        },
        message: {
          calls: calls.map((call) => ({
            data: call.data ?? '0x',
            to: call.to,
            value: call.value ?? 0n
          })),
          mode: EXECUTION_MODE_OP_DATA,
          nonce
        },
        primaryType: 'Execute',
        types: {
          Call: [
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' }
          ],
          Execute: [
            { name: 'mode', type: 'bytes32' },
            { name: 'calls', type: 'Call[]' },
            { name: 'nonce', type: 'uint256' }
          ]
        }
      });

      const nonceKey = nonce >> 64n;

      const opData = encodePacked(['uint192', 'bytes'], [nonceKey, signature]);

      return encodeFunctionData({
        abi: delegationAbi,
        args: [EXECUTION_MODE_OP_DATA, encodeCalls(calls, opData)],
        functionName: 'execute'
      });
    },
    encodeCalls: async (calls) => encodeCalls(calls),
    entryPoint: {
      abi: entryPoint08Abi,
      address: entryPoint08Address,
      version: '0.8'
    },
    estimate: async (parameters) => {
      const opData = encodePacked(['uint192', 'bytes'], [0n, STUB_SIGNATURE]);

      const data = encodeFunctionData({
        abi: simulationAbi,
        args: [EXECUTION_MODE_OP_DATA, encodeCalls(parameters.calls, opData)],
        functionName: 'simulateExecute'
      });

      const stateOverride: StateOverride = [
        {
          address: owner.address,
          code: simulationBytecode
        }
      ];

      const [estimatedGas, estimatedL1Fee, deployed] = await Promise.all([
        estimateGas(client, {
          blockTag: 'pending',
          data,
          stateOverride,
          to: owner.address
        }),
        estimateL1Fee(client, owner.address, data),
        isDeployed()
      ]);

      return {
        estimatedGas: estimatedGas + delegationGas(deployed ? 0 : 1),
        estimatedL1Fee
      };
    },
    getAddress: async () => owner.address,
    getFactoryArgs: async () => ({
      factory: '0x7702',
      factoryData: '0x'
    }),
    getNonce,
    getStubSignature: async () => STUB_SIGNATURE,
    isDeployed,
    signAuthorization: () =>
      viem_signAuthorization(client, {
        account: owner,
        address: GELATO_DELEGATION_ADDRESS,
        chainId: client.chain.id
      }),
    signMessage: (parameters) =>
      signMessage(client, {
        account: owner,
        message: parameters.message
      }),
    signTypedData: (parameters) =>
      signTypedData(client, {
        ...(parameters as TypedDataDefinition),
        account: owner
      }),
    signUserOperation: async (parameters) => {
      const typedData = getUserOperationTypedData({
        chainId: client.chain.id,
        entryPointAddress: entryPoint08Address,
        userOperation: {
          ...parameters,
          sender: parameters.sender ?? owner.address
        }
      });

      return signTypedData(client, {
        ...typedData,
        account: owner
      });
    },
    type: 'smart'
  };
};
