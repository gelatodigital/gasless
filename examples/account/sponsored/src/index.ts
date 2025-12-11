import {
  createGelatoSmartAccountClient,
  StatusCode,
  sponsored,
  toGelatoSmartAccount
} from '@gelatocloud/gasless';
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

function encodeNonce(key: bigint, seq: bigint): bigint {
  // key: up to 192 bits
  // seq: up to 64 bits
  return (key << 64n) | seq;
}

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
   * This avoids having sendTransaction fetch the quote again (duplicate)
   */
  const result = await relayer.sendTransactionSync({
    calls: [
      {
        data: '0xd09de08a',
        to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
      }
    ],
    /**
     * (Optional) Here you may specify a nonce or nonceKey
     */
    nonce: encodeNonce(BigInt(Date.now()), 0n),
    payment: sponsored()
  });

  if (result.status === StatusCode.Included) {
    console.log(
      `Transaction got ${result.status} status with hash: ${result.receipt.transactionHash}`
    );
  } else {
    console.log(`Transaction failed, message: ${result.message}, data: ${result.data}`);
    process.exit(1);
  }

  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
