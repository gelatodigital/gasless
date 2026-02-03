import type { Call, Chain, Client, SignedAuthorization, Transport } from 'viem';
import {
  type EstimateUserOperationGasParameters,
  getPaymasterData as getPaymasterData_,
  getPaymasterStubData as getPaymasterStubData_,
  type PrepareUserOperationParameters,
  type PrepareUserOperationRequest,
  type PrepareUserOperationReturnType,
  type SmartAccount,
  type UserOperation
} from 'viem/account-abstraction';
import { parseAccount } from 'viem/accounts';
import { getChainId as getChainId_, prepareAuthorization } from 'viem/actions';
import { concat, encodeFunctionData, getAction } from 'viem/utils';
import { AccountNotFoundError } from '../../types/index.js';
import type { GelatoBundlerClient } from '..';
import { estimateUserOperationGas } from './estimateUserOperationGas.js';
import { getUserOperationGasPrice } from './getUserOperationGasPrice.js';

const defaultParameters = [
  'factory',
  'fees',
  'gas',
  'paymaster',
  'nonce',
  'signature',
  'authorization'
] as const;

export const prepareUserOperation = async <
  account extends SmartAccount | undefined,
  const calls extends readonly unknown[],
  const request extends PrepareUserOperationRequest<account, accountOverride, calls>,
  accountOverride extends SmartAccount | undefined = undefined
>(
  client: Client<Transport, Chain | undefined, account>,
  parameters_: PrepareUserOperationParameters<account, accountOverride, calls, request>,
  sponsored: boolean
): Promise<PrepareUserOperationReturnType<account, accountOverride, calls, request>> => {
  const parameters = parameters_ as PrepareUserOperationParameters;
  const {
    account: account_ = client.account,
    parameters: properties = defaultParameters,
    stateOverride
  } = parameters;

  ////////////////////////////////////////////////////////////////////////////////
  // Assert that an Account is defined.
  ////////////////////////////////////////////////////////////////////////////////

  if (!account_) throw new AccountNotFoundError();
  const account = parseAccount(account_);

  ////////////////////////////////////////////////////////////////////////////////
  // Declare typed Bundler Client.
  ////////////////////////////////////////////////////////////////////////////////

  const bundlerClient = client as unknown as GelatoBundlerClient;

  ////////////////////////////////////////////////////////////////////////////////
  // Declare Paymaster properties.
  ////////////////////////////////////////////////////////////////////////////////

  const paymaster = parameters.paymaster ?? bundlerClient?.paymaster;
  const paymasterAddress = typeof paymaster === 'string' ? paymaster : undefined;
  const { getPaymasterStubData, getPaymasterData } = (() => {
    // If `paymaster: true`, we will assume the Bundler Client supports Paymaster Actions.
    if (paymaster === true)
      return {
        // biome-ignore lint/suspicious/noExplicitAny: copied from viem
        getPaymasterData: (parameters: any) =>
          getAction(bundlerClient, getPaymasterData_, 'getPaymasterData')(parameters),
        // biome-ignore lint/suspicious/noExplicitAny: copied from viem
        getPaymasterStubData: (parameters: any) =>
          getAction(bundlerClient, getPaymasterStubData_, 'getPaymasterStubData')(parameters)
      };

    // If Actions are passed to `paymaster` (via Paymaster Client or directly), we will use them.
    if (typeof paymaster === 'object') {
      const { getPaymasterStubData, getPaymasterData } = paymaster;
      return {
        getPaymasterData: getPaymasterData && getPaymasterStubData ? getPaymasterData : undefined,
        getPaymasterStubData: (getPaymasterData && getPaymasterStubData
          ? getPaymasterStubData
          : getPaymasterData) as typeof getPaymasterStubData
      };
    }

    // No Paymaster functions.
    return {
      getPaymasterData: undefined,
      getPaymasterStubData: undefined
    };
  })();
  const paymasterContext = parameters.paymasterContext
    ? parameters.paymasterContext
    : bundlerClient?.paymasterContext;

  ////////////////////////////////////////////////////////////////////////////////
  // Set up the User Operation request.
  ////////////////////////////////////////////////////////////////////////////////

  let request = {
    ...parameters,
    paymaster: paymasterAddress,
    sender: account.address
  } as PrepareUserOperationRequest;

  ////////////////////////////////////////////////////////////////////////////////
  // Concurrently prepare properties required to fill the User Operation.
  ////////////////////////////////////////////////////////////////////////////////

  const [callData, factory, fees, nonce, authorization] = await Promise.all([
    (async () => {
      if (parameters.calls) {
        const calls = parameters.calls.map((call_) => {
          const call = call_ as Call;
          if (call.abi)
            return {
              data: encodeFunctionData(call),
              to: call.to,
              value: call.value
            } as Call;
          return call as Call;
        });

        const callData = await account.encodeCalls(calls);

        return callData;
      }

      return parameters.callData;
    })(),
    (async () => {
      if (!properties.includes('factory')) return undefined;
      if (parameters.initCode) return { initCode: parameters.initCode };
      if (parameters.factory && parameters.factoryData) {
        return {
          factory: parameters.factory,
          factoryData: parameters.factoryData
        };
      }

      const { factory, factoryData } = await account.getFactoryArgs();

      if (account.entryPoint.version === '0.6')
        return {
          initCode: factory && factoryData ? concat([factory, factoryData]) : undefined
        };
      return {
        factory,
        factoryData
      };
    })(),
    (async () => {
      if (!properties.includes('fees')) return undefined;

      // If we have sufficient properties for fees, return them.
      if (
        typeof parameters.maxFeePerGas === 'bigint' &&
        typeof parameters.maxPriorityFeePerGas === 'bigint'
      )
        return request;

      const fees = await getUserOperationGasPrice(bundlerClient, sponsored);

      return {
        ...request,
        ...fees
      };
    })(),
    (async () => {
      if (!properties.includes('nonce')) return undefined;
      if (typeof parameters.nonce === 'bigint') return parameters.nonce;
      return account.getNonce();
    })(),
    (async () => {
      if (!properties.includes('authorization')) return undefined;
      if (typeof parameters.authorization === 'object') return parameters.authorization;
      if (account.authorization && !(await account.isDeployed())) {
        const authorization = await prepareAuthorization(account.client, account.authorization);
        return {
          ...authorization,
          r: '0xfffffffffffffffffffffffffffffff000000000000000000000000000000000',
          s: '0x7aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          yParity: 1
        } satisfies SignedAuthorization;
      }
      return undefined;
    })()
  ]);

  ////////////////////////////////////////////////////////////////////////////////
  // Fill User Operation with the prepared properties from above.
  ////////////////////////////////////////////////////////////////////////////////

  if (typeof callData !== 'undefined') request.callData = callData;
  // biome-ignore lint/suspicious/noExplicitAny: copied from viem
  if (typeof factory !== 'undefined') request = { ...request, ...(factory as any) };
  // biome-ignore lint/suspicious/noExplicitAny: copied from viem
  if (typeof fees !== 'undefined') request = { ...request, ...(fees as any) };
  if (typeof nonce !== 'undefined') request.nonce = nonce;
  if (typeof authorization !== 'undefined') request.authorization = authorization;

  ////////////////////////////////////////////////////////////////////////////////
  // Fill User Operation with the `signature` property.
  ////////////////////////////////////////////////////////////////////////////////

  if (properties.includes('signature')) {
    if (typeof parameters.signature !== 'undefined') request.signature = parameters.signature;
    else request.signature = await account.getStubSignature(request as UserOperation);
  }

  ////////////////////////////////////////////////////////////////////////////////
  // `initCode` is required to be filled with EntryPoint 0.6.
  ////////////////////////////////////////////////////////////////////////////////

  // If no `initCode` is provided, we use an empty bytes string.
  if (account.entryPoint.version === '0.6' && !request.initCode) request.initCode = '0x';

  ////////////////////////////////////////////////////////////////////////////////
  // Fill User Operation with paymaster-related properties for **gas estimation**.
  ////////////////////////////////////////////////////////////////////////////////

  let chainId: number | undefined;
  async function getChainId(): Promise<number> {
    if (chainId) return chainId;
    if (client.chain) return client.chain.id;
    const chainId_ = await getAction(client, getChainId_, 'getChainId')({});
    chainId = chainId_;
    return chainId;
  }

  // If the User Operation is intended to be sponsored, we will need to fill the paymaster-related
  // User Operation properties required to estimate the User Operation gas.
  let isPaymasterPopulated = false;
  if (
    properties.includes('paymaster') &&
    getPaymasterStubData &&
    !paymasterAddress &&
    !parameters.paymasterAndData
  ) {
    const {
      isFinal = false,
      sponsor: _,
      ...paymasterArgs
    } = await getPaymasterStubData({
      chainId: await getChainId(),
      context: paymasterContext,
      entryPointAddress: account.entryPoint.address,
      ...(request as UserOperation)
    });
    isPaymasterPopulated = isFinal;
    request = {
      ...request,
      ...paymasterArgs
    } as PrepareUserOperationRequest;
  }

  ////////////////////////////////////////////////////////////////////////////////
  // `paymasterAndData` is required to be filled with EntryPoint 0.6.
  ////////////////////////////////////////////////////////////////////////////////

  // If no `paymasterAndData` is provided, we use an empty bytes string.
  if (account.entryPoint.version === '0.6' && !request.paymasterAndData)
    request.paymasterAndData = '0x';

  ////////////////////////////////////////////////////////////////////////////////
  // Fill User Operation with gas-related properties.
  ////////////////////////////////////////////////////////////////////////////////

  if (properties.includes('gas')) {
    // If the Account has opinionated gas estimation logic, run the `estimateGas` hook and
    // fill the request with the prepared gas properties.
    if (account.userOperation?.estimateGas) {
      const gas = await account.userOperation.estimateGas(request as UserOperation);
      request = {
        ...request,
        ...gas
      } as PrepareUserOperationRequest;
    }

    // If not all the gas properties are already populated, we will need to estimate the gas
    // to fill the gas properties.
    if (
      typeof request.callGasLimit === 'undefined' ||
      typeof request.preVerificationGas === 'undefined' ||
      typeof request.verificationGasLimit === 'undefined' ||
      (request.paymaster && typeof request.paymasterPostOpGasLimit === 'undefined') ||
      (request.paymaster && typeof request.paymasterVerificationGasLimit === 'undefined')
    ) {
      const gas = await estimateUserOperationGas(
        bundlerClient,
        {
          account,
          // Some Bundlers fail if nullish gas values are provided for gas estimation :') –
          // so we will need to set a default zeroish value.
          callGasLimit: 0n,
          preVerificationGas: 0n,
          stateOverride,
          verificationGasLimit: 0n,
          ...(request.paymaster
            ? {
                paymasterPostOpGasLimit: 0n,
                paymasterVerificationGasLimit: 0n
              }
            : {}),
          ...request
        } as EstimateUserOperationGasParameters,
        sponsored
      );
      request = {
        ...request,
        callGasLimit: request.callGasLimit ?? gas.callGasLimit,
        paymasterPostOpGasLimit: request.paymasterPostOpGasLimit ?? gas.paymasterPostOpGasLimit,
        paymasterVerificationGasLimit:
          request.paymasterVerificationGasLimit ?? gas.paymasterVerificationGasLimit,
        preVerificationGas: request.preVerificationGas ?? gas.preVerificationGas,
        verificationGasLimit: request.verificationGasLimit ?? gas.verificationGasLimit
      } as PrepareUserOperationRequest;
    }
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Fill User Operation with paymaster-related properties for **sending** the User Operation.
  ////////////////////////////////////////////////////////////////////////////////

  // If the User Operation is intended to be sponsored, we will need to fill the paymaster-related
  // User Operation properties required to send the User Operation.
  if (
    properties.includes('paymaster') &&
    getPaymasterData &&
    !paymasterAddress &&
    !parameters.paymasterAndData &&
    !isPaymasterPopulated
  ) {
    // Retrieve paymaster-related User Operation properties to be used for **sending** the User Operation.
    const paymaster = await getPaymasterData({
      chainId: await getChainId(),
      context: paymasterContext,
      entryPointAddress: account.entryPoint.address,
      ...(request as UserOperation)
    });
    request = {
      ...request,
      ...paymaster
    } as PrepareUserOperationRequest;
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Remove redundant properties that do not conform to the User Operation schema.
  ////////////////////////////////////////////////////////////////////////////////

  delete request.calls;
  delete request.parameters;
  delete request.paymasterContext;
  if (typeof request.paymaster !== 'string') delete request.paymaster;

  ////////////////////////////////////////////////////////////////////////////////

  return request as unknown as PrepareUserOperationReturnType<
    account,
    accountOverride,
    calls,
    request
  >;
};
