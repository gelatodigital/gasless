import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load root .env first (defaults)
config({ path: resolve(__dirname, '../../../../.env'), quiet: true });

// Load local .env to override (optional)
config({ override: true, quiet: true });

import { createGelatoBundlerClient, toGelatoSmartAccount } from '@gelatocloud/gasless';
import { createPublicClient, type Hex, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const GELATO_API_KEY = process.env['GELATO_API_KEY'];
const PRIVATE_KEY = process.env['PRIVATE_KEY'];

if (!GELATO_API_KEY) {
  throw new Error('GELATO_API_KEY is not set');
}

const chain = baseSepolia;

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

  const bundler = await createGelatoBundlerClient({
    account,
    apiKey: GELATO_API_KEY,
    client,
    sponsored: true
  });

  const { balance, decimals, unit } = await bundler.getBalance();

  console.log(`Balance: ${balance} (${decimals} decimals, ${unit})`);

  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
