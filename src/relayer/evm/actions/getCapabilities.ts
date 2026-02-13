import type { Transport } from 'viem';
import { z } from 'zod';
import { evmAddressSchema, evmTokenSchema } from '../../../types/index.js';
import { handleRpcError } from '../../../utils/index.js';

const capabilitiesByChainSchema = z.object({
  feeCollector: evmAddressSchema,
  tokens: z.array(evmTokenSchema)
});

const capabilitiesSchema = z.record(z.string().pipe(z.coerce.number()), capabilitiesByChainSchema);

export type CapabilitiesByChain = z.infer<typeof capabilitiesByChainSchema>;
export type Capabilities = z.infer<typeof capabilitiesSchema>;

export const getCapabilities = async (client: ReturnType<Transport>): Promise<Capabilities> => {
  try {
    const result = await client.request({
      method: 'relayer_getCapabilities',
      params: []
    });

    return capabilitiesSchema.parse(result);
  } catch (error) {
    handleRpcError(error);
  }
};
