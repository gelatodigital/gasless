import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load root .env first (defaults)
config({ path: resolve(__dirname, '../../../../.env'), quiet: true });

// Load local .env to override (optional)
config({ override: true, quiet: true });

import { createGelatoSmartAccountClient, toGelatoSmartAccount } from '@gelatocloud/gasless';
import { createPublicClient, type Hex, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const GELATO_API_KEY = process.env['GELATO_API_KEY'];
const PRIVATE_KEY = process.env['PRIVATE_KEY'];

if (!GELATO_API_KEY) {
  throw new Error('GELATO_API_KEY is not set');
}

const chain = baseSepolia;

function encodeNonce(key: bigint, seq: bigint): bigint {
  // key: up to 192 bits
  // seq: up to 64 bits
  return (key << 64n) | seq;
}

const main = async () => {
  const owner = privateKeyToAccount((PRIVATE_KEY ?? generatePrivateKey()) as Hex);

  const client = createPublicClient({
    chain,
    transport: http()
  });

  const account = toGelatoSmartAccount({
    client,
    owner
  });

  const relayer = await createGelatoSmartAccountClient({
    account,
    apiKey: GELATO_API_KEY
  });

  const start = Date.now();

  /**
   * Note:
   * You may also call relayer.sendTransaction if preferred
   * Then you can use relayer.waitForReceipt to wait for the transaction receipt
   * You can also define timeout or pollingInterval
   */
  const receipt = await relayer.sendTransactionSync({
    calls: [
      {
        data: '0xd09de08a',
        to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
      }
    ],
    /**
     * (Optional) Here you may specify a nonce or nonceKey
     */
    nonce: encodeNonce(BigInt(Date.now()), 0n),
    skipSimulation: true
  });

  const end = Date.now();
  console.log(
    `Sent transaction request and got receipt with transaction hash ${receipt.transactionHash} included in block ${receipt.blockNumber} in ${end - start}ms`
  );

  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
