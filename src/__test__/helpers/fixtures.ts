import type { Address, Hex, TransactionReceipt } from 'viem';
import { StatusCode } from '../../types/schema.js';

// Shared test addresses
export const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678' as Address;
export const MOCK_FEE_COLLECTOR = '0xaabbccddee11223344556677889900aabbccddee' as Address;
export const MOCK_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;
export const MOCK_ENTRY_POINT = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address;

// Shared test hashes
export const MOCK_TX_HASH =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hex;
export const MOCK_ID = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' as Hex;

// Shared test data
export const MOCK_CALL_DATA = '0xabcdef' as Hex;
export const MOCK_CHAIN_ID = 1;

// RPC response fixtures for status
export const pendingStatusResponse = {
  chainId: MOCK_CHAIN_ID,
  createdAt: 1700000000,
  id: MOCK_ID,
  status: StatusCode.Pending
};

export const submittedStatusResponse = {
  chainId: MOCK_CHAIN_ID,
  createdAt: 1700000000,
  hash: MOCK_TX_HASH,
  id: MOCK_ID,
  status: StatusCode.Submitted
};

export const successStatusResponse = {
  chainId: MOCK_CHAIN_ID,
  createdAt: 1700000000,
  id: MOCK_ID,
  receipt: mockRpcTransactionReceipt(),
  status: StatusCode.Success
};

export const rejectedStatusResponse = {
  chainId: MOCK_CHAIN_ID,
  createdAt: 1700000000,
  data: '0x',
  id: MOCK_ID,
  message: 'Transaction rejected',
  status: StatusCode.Rejected
};

export const revertedStatusResponse = {
  chainId: MOCK_CHAIN_ID,
  createdAt: 1700000000,
  data: '0x08c379a0',
  id: MOCK_ID,
  message: 'Execution reverted',
  receipt: mockRpcTransactionReceipt(),
  status: StatusCode.Reverted
};

export function mockRpcTransactionReceipt() {
  return {
    blockHash: MOCK_TX_HASH,
    blockNumber: '0x1',
    contractAddress: null,
    cumulativeGasUsed: '0x5208',
    effectiveGasPrice: '0x3b9aca00',
    from: MOCK_ADDRESS,
    gasUsed: '0x5208',
    logs: [],
    logsBloom: `0x${'0'.repeat(512)}`,
    status: '0x1',
    to: MOCK_ADDRESS,
    transactionHash: MOCK_TX_HASH,
    transactionIndex: '0x0',
    type: '0x2'
  };
}

export function mockTransactionReceipt(): TransactionReceipt {
  return {
    blockHash: MOCK_TX_HASH,
    blockNumber: 1n,
    contractAddress: null,
    cumulativeGasUsed: 21000n,
    effectiveGasPrice: 1000000000n,
    from: MOCK_ADDRESS,
    gasUsed: 21000n,
    logs: [],
    logsBloom: `0x${'0'.repeat(512)}` as Hex,
    root: undefined,
    status: 'success',
    to: MOCK_ADDRESS,
    transactionHash: MOCK_TX_HASH,
    transactionIndex: 0,
    type: 'eip1559'
  } as TransactionReceipt;
}

// Balance response
export const mockBalanceResponse = {
  balance: 1000000000,
  decimals: 6,
  unit: 'usd'
};

// Capabilities response
export const mockCapabilitiesResponse = {
  1: {
    feeCollector: MOCK_FEE_COLLECTOR,
    tokens: [{ address: MOCK_TOKEN_ADDRESS, decimals: 18 }]
  }
};

// Fee data response
export const mockFeeDataResponse = {
  chainId: MOCK_CHAIN_ID,
  expiry: 1700001000,
  gasPrice: '1000000000',
  rate: 1.0,
  token: { address: MOCK_TOKEN_ADDRESS, decimals: 18 }
};

// Fee quote response
export const mockFeeQuoteResponse = {
  chainId: MOCK_CHAIN_ID,
  expiry: 1700001000,
  fee: '100000000000000',
  token: { address: MOCK_TOKEN_ADDRESS, decimals: 18 }
};
