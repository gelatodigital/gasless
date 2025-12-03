import { baseSepolia } from 'viem/chains';
import 'dotenv/config';
import { createGelatoBundlerClient, sponsored } from '@gelatonetwork/ferry-sdk';
import { toKernelSmartAccount } from 'permissionless/accounts';
import { createWalletClient, type Hex, http, publicActions } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const GELATO_API_KEY = process.env['GELATO_API_KEY'];
const PRIVATE_KEY = process.env['PRIVATE_KEY'];

if (!GELATO_API_KEY) {
  throw new Error('GELATO_API_KEY is not set');
}

const chain = baseSepolia;

const main = async () => {
  const owner = privateKeyToAccount((PRIVATE_KEY ?? generatePrivateKey()) as Hex);

  const client = createWalletClient({
    account: owner,
    chain,
    transport: http()
  }).extend(publicActions);

  const account = await toKernelSmartAccount({
    client,
    owners: [owner],
    version: '0.3.3'
  });

  const bundler = await createGelatoBundlerClient({
    account,
    apiKey: GELATO_API_KEY,
    client,
    payment: sponsored(),
    pollingInterval: 100
  });

  const hash = await bundler.sendUserOperation({
    calls: [
      {
        data: '0xd09de08a',
        to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
      }
    ]
  });

  console.log('userOpHash:', hash);

  const { receipt } = await bundler.waitForUserOperationReceipt({ hash });

  console.log('transaction hash:', receipt.transactionHash);
  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
