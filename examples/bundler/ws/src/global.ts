import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load root .env first (defaults)
config({ path: resolve(__dirname, '../../../../../.env'), quiet: true });

// Load local .env to override (optional)
config({ override: true, quiet: true });

import { createGelatoBundlerClient, toGelatoSmartAccount } from '@gelatocloud/gasless';
import { createPublicClient, type Hex, http, type SignedAuthorization } from 'viem';
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

  const bundler = await createGelatoBundlerClient({
    account,
    apiKey: GELATO_API_KEY,
    client,
    sponsored: true
  });

  // Subscribe to ALL operation updates (no id)
  const subscription = await bundler.ws.subscribe();

  console.log('Listening for all operation updates... (Ctrl+C to stop)\n');

  const deployed = await account.isDeployed();

  let authorization: SignedAuthorization | undefined;

  if (!deployed) {
    const nonce = await client.getTransactionCount({ address: owner.address });

    authorization = await owner.signAuthorization({
      address: account.authorization.address,
      chainId: chain.id,
      nonce
    });
  }

  console.log(
    'Listening for all transaction updates... You can send more user ops in another process using the same api key and status updates will be emitted here... (Ctrl+C to stop)\n'
  );

  // Log every event type
  subscription.on('submitted', (data) =>
    console.log(`[submitted] User Operation ${data.id} submitted with hash: ${data.hash}`)
  );
  subscription.on('success', (data) =>
    console.log(
      `[success] User Operation ${data.id} succeded and was included in block ${data.receipt.blockNumber}`
    )
  );
  subscription.on('rejected', (data) =>
    console.log(`[rejected] User Operation ${data.id} was rejected: ${data.message}`)
  );
  subscription.on('reverted', (data) =>
    console.log(
      `[reverted] User Operation ${data.id} reverted on block ${data.receipt.blockNumber}`
    )
  );

  const hash = await bundler.sendUserOperation({
    authorization,
    calls: [
      {
        data: '0xd09de08a',
        to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
      }
    ]
  });

  console.log(`Sent user operation ${hash}`);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await bundler.ws.unsubscribe(subscription.subscriptionId);
    bundler.ws.disconnect();
    process.exit(0);
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
