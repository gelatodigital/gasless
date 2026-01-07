import { createGelatoEvmRelayerClient, sponsored } from '@gelatocloud/gasless';
import 'dotenv/config';
import { baseSepolia } from 'viem/chains';

const GELATO_API_KEY = process.env['GELATO_API_KEY'];

if (!GELATO_API_KEY) {
  throw new Error('GELATO_API_KEY is not set');
}

const chain = baseSepolia;

const main = async () => {
  const relayer = createGelatoEvmRelayerClient({ apiKey: GELATO_API_KEY, testnet: chain.testnet });

  const receipt = await relayer.sendTransactionSync({
    chainId: chain.id,
    data: '0xd09de08a',
    payment: sponsored(),
    to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
  });

  console.log(`Transaction hash: ${receipt.transactionHash}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
