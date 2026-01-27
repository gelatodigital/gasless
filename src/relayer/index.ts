export * from './evm/index.js';

// Tron exports with explicit namespacing to avoid conflicts
export {
  createGelatoTronRelayerClient,
  createRpcClient as createTronRpcClient,
  type GelatoTronRelayerClient,
  type GelatoTronRelayerClientConfig,
  // Types
  type GetExchangeRateParameters as GetTronExchangeRateParameters,
  type GetStatusParameters as GetTronStatusParameters,
  // Actions
  getExchangeRate as getTronExchangeRate,
  getStatus as getTronStatus,
  handleTerminalStatus as handleTronTerminalStatus,
  hexDataSchema as tronHexDataSchema,
  type Payment as TronPayment,
  // Payment types (Tron-specific, no viem dependency)
  PaymentType as TronPaymentType,
  // Client types
  type RpcClient as TronRpcClient,
  type RpcClientConfig as TronRpcClientConfig,
  RpcError as TronRpcError,
  type SendTransactionParameters as SendTronTransactionParameters,
  type SendTransactionSyncParameters as SendTronTransactionSyncParameters,
  type SponsoredPayment as TronSponsoredPayment,
  StatusCode as TronStatusCode,
  sendTransaction as sendTronTransaction,
  sendTransactionSync as sendTronTransactionSync,
  sponsored as tronSponsored,
  statusSchema as tronStatusSchema,
  type TokenPayment as TronTokenPayment,
  type TronExchangeRate,
  type TronReceipt,
  type TronStatus,
  type TronTerminalStatus,
  type TronToken,
  // Errors
  TronTransactionRejectedError,
  TronTransactionRevertedError,
  terminalStatusSchema as tronTerminalStatusSchema,
  token as tronToken,
  // Schema types
  tronAddressSchema,
  tronTokenSchema,
  tronTxHashSchema,
  waitForInclusion as waitForTronInclusion,
  waitForStatus as waitForTronStatus
} from './tron/index.js';
