import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load root .env first (defaults)
config({ path: resolve(__dirname, '../../../../.env'), quiet: true });

// Load local .env to override (optional)
config({ override: true, quiet: true });

import { createGelatoBundlerClient } from '@gelatocloud/gasless';
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

  const start = Date.now();
  /**
   * Note:
   * You may also call bundler.sendUserOperationS if preferred
   * Then you can use bundler.waitForUserOperationReceipt to wait for the user operation receipt
   * You can also define timeout or pollingInterval
   */
  const { receipt } = await bundler.sendUserOperationSync({
    authorization,
    calls: [
      {
        data: '0xd09de08a',
        to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
      }
    ],
    timeout: 10_000
  });

  const end = Date.now();
  console.log(
    `Sent user operation and got receipt with transaction hash ${receipt.transactionHash} included in block ${receipt.blockNumber} in ${end - start}ms`
  );

  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
