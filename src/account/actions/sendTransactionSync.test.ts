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
      {
        authorizationList: undefined,
        chainId: 1,
        data: MOCK_CALL_DATA,
        to: MOCK_ADDRESS
      },
      undefined
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
      {
        authorizationList: expect.any(Array),
        chainId: 1,
        data: MOCK_CALL_DATA,
        to: MOCK_ADDRESS
      },
      undefined
    );
  });

  it('passes timeout option through to client.sendTransactionSync', async () => {
    const account = createMockSmartAccount();

    await sendTransactionSync(
      mockClient as never,
      account as never,
      { calls: [{ to: MOCK_ADDRESS, value: 0n }] },
      { timeout: 30000 }
    );

    expect(mockClient.sendTransactionSync).toHaveBeenCalledWith(
      {
        authorizationList: undefined,
        chainId: 1,
        data: MOCK_CALL_DATA,
        to: MOCK_ADDRESS
      },
      { timeout: 30000 }
    );
  });

  it('passes gas and skipSimulation through to client.sendTransactionSync', async () => {
    const account = createMockSmartAccount();

    await sendTransactionSync(mockClient as never, account as never, {
      calls: [{ to: MOCK_ADDRESS, value: 0n }],
      gas: 100000n,
      skipSimulation: true
    });

    expect(mockClient.sendTransactionSync).toHaveBeenCalledWith(
      {
        authorizationList: undefined,
        chainId: 1,
        data: MOCK_CALL_DATA,
        gas: 100000n,
        skipSimulation: true,
        to: MOCK_ADDRESS
      },
      undefined
    );
  });

  it('passes retries option through to client.sendTransactionSync', async () => {
    const account = createMockSmartAccount();

    await sendTransactionSync(
      mockClient as never,
      account as never,
      { calls: [{ to: MOCK_ADDRESS, value: 0n }] },
      { retries: { max: 5 } }
    );

    expect(mockClient.sendTransactionSync).toHaveBeenCalledWith(
      {
        authorizationList: undefined,
        chainId: 1,
        data: MOCK_CALL_DATA,
        to: MOCK_ADDRESS
      },
      { retries: { max: 5 } }
    );
  });
});
