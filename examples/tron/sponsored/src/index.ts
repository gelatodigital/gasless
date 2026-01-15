import { config } from 'dotenv';
import { resolve } from 'path';

// Load root .env first (defaults)
config({ path: resolve(__dirname, '../../../../.env') });

// Load local .env to override (optional)
config({ override: true });

import {
  createGelatoTronRelayerClient,
  StatusCode,
  sponsored,
  token
} from '@gelatocloud/gasless/tron.js';
import { TronWeb } from 'tronweb';

const GELATO_API_KEY = process.env['GELATO_API_KEY'];

if (!GELATO_API_KEY) {
  throw new Error('GELATO_API_KEY is not set');
}

// Tron Nile testnet chain ID
const TRON_NILE_CHAIN_ID = 3448148188;

// Initialize TronWeb for encoding
const tronWeb = new TronWeb({ fullHost: 'https://nile.trongrid.io' });

// Example counter contract on Nile testnet
const COUNTER_CONTRACT = 'TYouBMJLPJwqcgKCZgqHxYqQg7RgGooooB';

/**
 * Encodes a function call using TronWeb
 */
const encodeFunctionCall = (functionSignature: string, args: string[] = []): string => {
  // Extract function name and parameter types
  const nameMatch = functionSignature.match(/^([^(]+)/);
  const functionName = nameMatch?.[1]?.trim() || '';
  const paramsMatch = functionSignature.match(/\((.*?)\)/);
  const paramTypesStr = paramsMatch?.[1] || '';
  const paramTypes = paramTypesStr
    ? paramTypesStr
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t)
    : [];

  // Encode function selector (first 4 bytes of keccak256 hash)
  const hashHex = tronWeb.sha3(functionSignature, false);
  const functionSelector = '0x' + hashHex.slice(0, 8);

  // Encode parameters if any
  if (paramTypes.length > 0 && args.length > 0) {
    const functionABI = {
      inputs: paramTypes.map((type, index) => ({
        name: `param${index}`,
        type: type
      })),
      name: functionName,
      outputs: [],
      type: 'function'
    };

    const encodedParameters = tronWeb.utils.abi.encodeParamsV2ByABI(functionABI, args);
    return functionSelector + encodedParameters.slice(2);
  }

  return functionSelector;
};

const main = async () => {
  // Create the Tron relayer client
  const client = createGelatoTronRelayerClient({
    apiKey: GELATO_API_KEY,
    testnet: true
  });

  console.log('Tron Relayer Client created');

  // Example 1: Sponsored transaction (gasless)
  console.log('\n--- Sponsored Transaction Example ---');

  try {
    // Encode a simple increment function call
    const data = encodeFunctionCall('increase(uint256)', ['1']);
    console.log(`Encoded data: ${data}`);

    const receipt = await client.sendTransactionSync({
      chainId: TRON_NILE_CHAIN_ID,
      data,
      payment: sponsored(),
      to: COUNTER_CONTRACT
    });

    console.log(`Transaction hash: ${receipt.transactionHash}`);
    console.log(`Energy used: ${receipt.energyUsed ?? 'N/A'}`);
    console.log(`Bandwidth used: ${receipt.bandwidthUsed ?? 'N/A'}`);
  } catch (error) {
    console.error('Sponsored transaction failed:', error);
  }

  // Example 2: Pay with TRX (native token)
  console.log('\n--- TRX Payment Example ---');

  try {
    // First, get the exchange rate to understand the cost
    const exchangeRate = await client.getExchangeRate({
      chainId: TRON_NILE_CHAIN_ID,
      token: 'TRX'
    });

    console.log(`Current energy price: ${exchangeRate.energyPriceSun} SUN`);
    console.log(`TRX rate: ${exchangeRate.rate}`);

    // Encode the function call
    const data = encodeFunctionCall('increase(uint256)', ['1']);

    // Send transaction with TRX payment
    const taskId = await client.sendTransaction({
      chainId: TRON_NILE_CHAIN_ID,
      data,
      payment: token('TRX'),
      to: COUNTER_CONTRACT
    });

    console.log(`Task ID: ${taskId}`);

    // Wait for the transaction to be included
    const status = await client.waitForStatus({ id: taskId });

    if (status.status === StatusCode.Included) {
      console.log(`Transaction included: ${status.receipt.transactionHash}`);
    } else if (status.status === StatusCode.Rejected) {
      console.log(`Transaction rejected: ${status.message}`);
    } else if (status.status === StatusCode.Reverted) {
      console.log(`Transaction reverted: ${status.message ?? 'Unknown reason'}`);
    }
  } catch (error) {
    console.error('TRX payment transaction failed:', error);
  }

  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
