import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load root .env first (defaults)
config({ path: resolve(__dirname, '../../../../.env') });

// Load local .env to override (optional)
config({ override: true });

import { createGelatoBundlerClient, sponsored } from '@gelatocloud/gasless';
import { to7702KernelSmartAccount } from 'permissionless/accounts';
import { createPublicClient, type Hex, http, type SignedAuthorization } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { inkSepolia } from 'viem/chains';

const GELATO_API_KEY = process.env['GELATO_API_KEY'];
const PRIVATE_KEY = process.env['PRIVATE_KEY'];

if (!GELATO_API_KEY) {
  throw new Error('GELATO_API_KEY is not set');
}

const chain = inkSepolia;

const main = async () => {
  const owner = privateKeyToAccount((PRIVATE_KEY ?? generatePrivateKey()) as Hex);

  const client = createPublicClient({
    chain,
    transport: http()
  });

  const account = await to7702KernelSmartAccount({
    client,
    owner,
    version: '0.3.3'
  });

  const bundler = await createGelatoBundlerClient({
    account,
    apiKey: GELATO_API_KEY,
    client,
    payment: sponsored(),
    pollingInterval: 100
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
