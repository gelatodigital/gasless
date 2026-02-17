import { describe, expect, it, vi } from 'vitest';
import {
  MOCK_ADDRESS,
  MOCK_CALL_DATA,
  mockTransactionReceipt
} from '../../__test__/helpers/fixtures.js';
import { createMockSmartAccount } from '../../__test__/helpers/mockSmartAccount.js';
import { sendTransactionSync } from './sendTransactionSync.js';

describe('sendTransactionSync', () => {
  const receipt = mockTransactionReceipt();

  const mockClient = {
    sendTransactionSync: vi.fn().mockResolvedValue(receipt)
  };

  it('encodes, signs if needed, and delegates to client.sendTransactionSync', async () => {
    const account = createMockSmartAccount();

    const result = await sendTransactionSync(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }]
    });

    expect(account.getNonce).toHaveBeenCalled();
    expect(account.isDeployed).toHaveBeenCalled();
    expect(account.encodeCallData).toHaveBeenCalled();
    expect(mockClient.sendTransactionSync).toHaveBeenCalledWith(
      expect.objectContaining({
        authorizationList: undefined,
        chainId: 1,
        data: MOCK_CALL_DATA,
        to: MOCK_ADDRESS
      }),
      expect.objectContaining({})
    );
    expect(result).toBe(receipt);
  });

  it('includes authorizationList when not deployed', async () => {
    const account = createMockSmartAccount();
    (account.isDeployed as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    await sendTransactionSync(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }]
    });

    expect(account.signAuthorization).toHaveBeenCalled();
    expect(mockClient.sendTransactionSync).toHaveBeenCalledWith(
      expect.objectContaining({
        authorizationList: expect.any(Array)
      }),
      expect.objectContaining({})
    );
  });

  it('passes timeout parameter through as option', async () => {
    const account = createMockSmartAccount();

    await sendTransactionSync(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }],
      timeout: 30000
    });

    expect(mockClient.sendTransactionSync).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ timeout: 30000 })
    );
  });
});
