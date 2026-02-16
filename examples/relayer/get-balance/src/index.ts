import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load root .env first (defaults)
config({ path: resolve(__dirname, '../../../../.env'), quiet: true });

// Load local .env to override (optional)
config({ override: true, quiet: true });

import { createGelatoEvmRelayerClient } from '@gelatocloud/gasless';

const GELATO_API_KEY = process.env['GELATO_API_KEY'];

if (!GELATO_API_KEY) {
  throw new Error('GELATO_API_KEY is not set');
}

const main = async () => {
  const relayer = createGelatoEvmRelayerClient({ apiKey: GELATO_API_KEY });

  const { balance, decimals, unit } = await relayer.getBalance();

  console.log(`Balance: ${balance} (${decimals} decimals, ${unit})`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
