import { describe, expect, it, vi } from 'vitest';
import { MOCK_ADDRESS, MOCK_CALL_DATA, MOCK_TX_HASH } from '../../__test__/helpers/fixtures.js';
import { createMockSmartAccount } from '../../__test__/helpers/mockSmartAccount.js';
import { sendTransaction } from './sendTransaction.js';

describe('sendTransaction', () => {
  const mockClient = {
    sendTransaction: vi.fn().mockResolvedValue(MOCK_TX_HASH)
  };

  it('gets nonce and deployment status in parallel, then encodes and sends', async () => {
    const account = createMockSmartAccount();

    const result = await sendTransaction(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }]
    });

    expect(account.getNonce).toHaveBeenCalled();
    expect(account.isDeployed).toHaveBeenCalled();
    expect(account.encodeCallData).toHaveBeenCalled();
    expect(mockClient.sendTransaction).toHaveBeenCalledWith({
      authorizationList: undefined,
      chainId: 1,
      data: MOCK_CALL_DATA,
      to: MOCK_ADDRESS
    });
    expect(result).toBe(MOCK_TX_HASH);
  });

  it('signs authorization when not deployed', async () => {
    const account = createMockSmartAccount();
    (account.isDeployed as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    await sendTransaction(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }]
    });

    expect(account.signAuthorization).toHaveBeenCalled();
    expect(mockClient.sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        authorizationList: expect.any(Array)
      })
    );
  });

  it('does not sign authorization when deployed', async () => {
    const account = createMockSmartAccount();

    await sendTransaction(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }]
    });

    expect(account.signAuthorization).not.toHaveBeenCalled();
    expect(mockClient.sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ authorizationList: undefined })
    );
  });

  it('uses provided nonce', async () => {
    const account = createMockSmartAccount();

    await sendTransaction(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }],
      nonce: 42n
    });

    expect(account.getNonce).not.toHaveBeenCalled();
    expect(account.encodeCallData).toHaveBeenCalledWith(expect.objectContaining({ nonce: 42n }));
  });

  it('uses nonceKey when provided', async () => {
    const account = createMockSmartAccount();

    await sendTransaction(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }],
      nonceKey: 5n
    });

    expect(account.getNonce).toHaveBeenCalledWith({ key: 5n });
  });
});
