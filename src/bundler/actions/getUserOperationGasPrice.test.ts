import { describe, expect, it } from 'vitest';
import { createMockBundlerClient } from '../../__test__/helpers/mockTransport.js';
import { getUserOperationGasPrice } from './getUserOperationGasPrice.js';

describe('getUserOperationGasPrice', () => {
  it('returns 0n for both fees when sponsored', async () => {
    const { client } = createMockBundlerClient();

    const result = await getUserOperationGasPrice(client, true);

    expect(result.maxFeePerGas).toBe(0n);
    expect(result.maxPriorityFeePerGas).toBe(0n);
  });

  it('calls gelato_getUserOperationGasPrice when not sponsored', async () => {
    const { client, request } = createMockBundlerClient();
    request.mockResolvedValue({
      maxFeePerGas: '0x3b9aca00',
      maxPriorityFeePerGas: '0x77359400'
    });

    const result = await getUserOperationGasPrice(client, false);

    expect(request).toHaveBeenCalled();
    expect(result.maxFeePerGas).toBe(BigInt('0x3b9aca00'));
    expect(result.maxPriorityFeePerGas).toBe(BigInt('0x77359400'));
  });

  it('does not make RPC call when sponsored', async () => {
    const { client, request } = createMockBundlerClient();

    await getUserOperationGasPrice(client, true);

    expect(request).not.toHaveBeenCalled();
  });
});
