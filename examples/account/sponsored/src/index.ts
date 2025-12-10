import {
  createGelatoSmartAccountClient,
  StatusCode,
  sponsored,
  toGelatoSmartAccount
} from '@gelatonetwork/ferry-sdk';
import 'dotenv/config';
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

  const relayer = await createGelatoSmartAccountClient({
    account,
    apiKey: GELATO_API_KEY
  });

  /**
   * Note:
   * You may also call relayer.getFeeQuote first
   * The returned quote should then be passed to relayer.sendTransaction
   * This avoids sendTransaction from getting the quote again (duplicate)
   */

  const hash = await relayer.sendTransaction({
    calls: [
      {
        data: '0xd09de08a',
        to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
      }
    ],
    payment: sponsored()
    /**
     * Here you may specify a nonce or nonceKey (2-dimensional nonces)
     */
  });

  console.log(`hash: ${hash}`);

  const status = await relayer.waitForStatus({ id: hash });

  if (status.status === StatusCode.Confirmed) {
    console.log(`transaction hash ${status.receipt.transactionHash}`);
    process.exit(0);
  } else {
    console.log(`transaction failed, message: ${status.message}, data: ${status.data}`);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
