import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load root .env first (defaults)
config({ path: resolve(__dirname, '../../../../.env'), quiet: true });

// Load local .env to override (optional)
config({ override: true, quiet: true });

import { createGelatoEvmRelayerClient } from '@gelatocloud/gasless';
import { baseSepolia } from 'viem/chains';

const GELATO_API_KEY = process.env['GELATO_API_KEY'];

if (!GELATO_API_KEY) {
  throw new Error('GELATO_API_KEY is not set');
}

const chain = baseSepolia;

const main = async () => {
  const relayer = createGelatoEvmRelayerClient({ apiKey: GELATO_API_KEY, testnet: chain.testnet });

  const start = Date.now();
  /**
   * Note:
   * You may also call relayer.sendTransaction if preferred
   * Then you can use relayer.waitForReceipt to wait for the transaction receipt
   * You can also define timeout or pollingInterval
   */
  const receipt = await relayer.sendTransactionSync({
    chainId: chain.id,
    data: '0xd09de08a',
    to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
  });

  const end = Date.now();
  console.log(
    `Sent transaction and got receipt with transaction hash ${receipt.transactionHash} included in block ${receipt.blockNumber} in ${end - start}ms`
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
