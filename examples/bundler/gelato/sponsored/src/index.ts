import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load root .env first (defaults)
config({ path: resolve(__dirname, '../../../../.env'), quiet: true });

// Load local .env to override (optional)
config({ override: true, quiet: true });

import { createGelatoBundlerClient, toGelatoSmartAccount } from '@gelatocloud/gasless';
import { createPublicClient, type Hex, http, type SignedAuthorization } from 'viem';
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
    pollingInterval: 100,
    sponsored: true
  });

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

  /**
   * Note:
   * You may also call bundler.sendUserOperationSync if preferred
   */
  const hash = await bundler.sendUserOperation({
    authorization,
    calls: [
      {
        data: '0xd09de08a',
        to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
      }
    ]
  });

  console.log(`User operation hash: ${hash}`);

  const { receipt } = await bundler.waitForUserOperationReceipt({ hash });

  console.log(`Transaction hash: ${receipt.transactionHash}`);

  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
