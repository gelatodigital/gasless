import {
  type Address,
  type Chain,
  type ChainContract,
  type Client,
  type Hex,
  type Transport,
  zeroAddress
} from 'viem';
import { estimateL1Fee as viem_estimateL1Fee } from 'viem/op-stack';

export const estimateL1Fee = async (
  client: Client<Transport, Chain>,
  to: Address,
  data: Hex
): Promise<bigint | undefined> => {
  const gasPriceOracle = client.chain.contracts?.['gasPriceOracle'] as ChainContract | undefined;

  if (!gasPriceOracle) {
    return undefined;
  }

  return await viem_estimateL1Fee(client, {
    account: zeroAddress,
    data,
    gasPriceOracleAddress: gasPriceOracle.address,
    to
  });
};
