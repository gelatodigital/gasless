import type { Address, Chain, Client, Transport } from 'viem';

export type Capabilities = {
  feeCollector: Address;
};

export const getCapabilities = async (client: Client<Transport, Chain>): Promise<Capabilities> => {
  const capabilities = await client.request({
    method: 'relayer_getCapabilities',
    params: [client.chain.id.toString()]
  } as never);

  return capabilities[client.chain.id.toString()];
};
