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

if (!GELATO_API_KEY) throw new Error('GELATO_API_KEY is not set');

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

  const relayer = await createGelatoSmartAccountClient({
    account,
    apiKey: GELATO_API_KEY
  });

  // Subscribe to ALL transaction updates (no id)
  const subscription = await relayer.ws.subscribe();

  console.log(
    'Listening for all transaction updates... You can send more transactions in another process using the same api key and status updates will be emitted here... (Ctrl+C to stop)\n'
  );

  // Log every event type
  subscription.on('submitted', (data) =>
    console.log(`[submitted] Transaction ${data.id} submitted with hash: ${data.hash}`)
  );
  subscription.on('success', (data) =>
    console.log(
      `[success] Transaction ${data.id} succeded and was included in block ${data.receipt.blockNumber}`
    )
  );
  subscription.on('rejected', (data) =>
    console.log(`[rejected] Transaction ${data.id} was rejected: ${data.message}`)
  );
  subscription.on('reverted', (data) =>
    console.log(`[reverted] Transaction ${data.id} reverted on block ${data.receipt.blockNumber}`)
  );

  const id = await relayer.sendTransaction({
    calls: [
      {
        data: '0xd09de08a',
        to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
      }
    ]
  });

  console.log(`Sent transaction ${id}`);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await relayer.ws.unsubscribe(subscription.subscriptionId);
    relayer.ws.disconnect();
    process.exit(0);
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
