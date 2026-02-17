# @gelatocloud/gasless

[![npm version](https://img.shields.io/npm/v/@gelatocloud/gasless.svg)](https://www.npmjs.com/package/@gelatocloud/gasless)

### All-in-one solution for gasless transactions.

## Features

- **Three abstraction levels** - Choose the optimal integration model for your application::
  - **Turbo Relayer**: The fastest, most efficient way to submit transactions on-chain with zero gas overhead, ideal for latency-sensitive workflows.
  - **Turbo Relayer with Smart Account** - Leverage Smart Accounts for streamlined transaction encoding and signing while retaining Turbo-level performance.
  - **ERC-4337 Bundler** - A fully compliant ERC-4337 bundler for native Account Abstraction flows.
- **Sponsorship via Gas Tank** - Support for sponsored transactions using your Gas Tank.
- **2D nonce support** - Advanced nonce management using both `nonce` and `nonceKey` for parallelized execution.
- **Type-safe** - Implemented on top of [viem](https://viem.sh), offering complete TypeScript type safety and developer ergonomics.
- **Synchronous methods**: Send transaction and get the receipt in a single call
- **WebSockets**: Live notifications and updates via WebSockets

### Learn more in our [docs](https://docs.gelato.cloud)

## Installation

```bash
pnpm install viem @gelatocloud/gasless
```

**Peer dependencies:** `viem`

## Quick Start

1. Get your API key at [https://app.gelato.cloud/](https://app.gelato.cloud/)
2. Set your environment variable:

```bash
export GELATO_API_KEY="your-api-key"
```

## Usage

### Turbo Relayer

Direct gasless transaction relay without smart accounts. Best for simple sponsored transactions.

**Synchronous:**
```typescript
import { createGelatoEvmRelayerClient } from '@gelatocloud/gasless';
import { baseSepolia } from 'viem/chains';

const relayer = createGelatoEvmRelayerClient({
  apiKey: process.env.GELATO_API_KEY,
  testnet: true
});

// Send and wait for inclusion in one call
const receipt = await relayer.sendTransactionSync({
  chainId: baseSepolia.id,
  to: '0xTargetContract...',
  data: '0xCalldata...'
});

console.log(`Transaction hash: ${receipt.transactionHash}`);
```

**Asynchronous:**
```typescript
import { createGelatoEvmRelayerClient } from '@gelatocloud/gasless';
import { baseSepolia } from 'viem/chains';

const relayer = createGelatoEvmRelayerClient({
  apiKey: process.env.GELATO_API_KEY,
  testnet: true
});

// Send transaction (returns immediately with ID)
const id = await relayer.sendTransaction({
  chainId: baseSepolia.id,
  to: '0xTargetContract...',
  data: '0xCalldata...'
});

// Poll for status separately
const receipt = await relayer.waitForReceipt({ id });

console.log(`Transaction hash: ${receipt.transactionHash}`);
```

### Account (Gelato Smart Account)

Gelato's smart account implementation with ERC-7821 delegation pattern.

**Synchronous:**
```typescript
import {
  createGelatoSmartAccountClient,
  toGelatoSmartAccount } from '@gelatocloud/gasless';
import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const owner = privateKeyToAccount('0xYourPrivateKey...');

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

// Create a Gelato smart account
const account = toGelatoSmartAccount({ client: publicClient, owner });

// Create the smart account client
const client = await createGelatoSmartAccountClient({
  account,
  apiKey: process.env.GELATO_API_KEY
});

// Send and wait for inclusion in one call
const receipt = await client.sendTransactionSync({
  calls: [
    { to: '0xContract1...', data: '0xCalldata1...' },
    { to: '0xContract2...', data: '0xCalldata2...' }
  ]// Optional: nonce or nonceKey for 2D nonce management
});

console.log(`Transaction hash: ${receipt.transactionHash}`);
```

**Asynchronous:**
```typescript
import {
  createGelatoSmartAccountClient,
  toGelatoSmartAccount } from '@gelatocloud/gasless';

// ... same setup as above ...

// Send transaction (returns immediately with ID)
const id = await client.sendTransaction({
  calls: [{ to: '0xContract...', data: '0xCalldata...' }] });

// Poll for status separately
const receipt = await client.waitForReceipt({ id });

console.log(`Transaction hash: ${receipt.transactionHash}`);
```


### Bundler (ERC-4337)

Compatible with any ERC-4337 smart account.

```typescript
import { createGelatoBundlerClient } from '@gelatocloud/gasless';
import { to7702SimpleSmartAccount } from 'permissionless/accounts';
import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const owner = privateKeyToAccount('0xYourPrivateKey...');

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

// Create a smart account 
const account = await to7702SimpleSmartAccount({
  client,
  owner
});

// Create the Gelato bundler client
const bundler = await createGelatoBundlerClient({
  account,
  client,
  apiKey: process.env.GELATO_API_KEY,
  sponsored: true
});

// Send a user operation
const hash = await bundler.sendUserOperation({
  calls: [{ to: '0x...', data: '0x...' }]
});

// Wait for the receipt
const { receipt } = await bundler.waitForUserOperationReceipt({ hash });

console.log(`Transaction hash: ${receipt.transactionHash}`);
```

### WebSocket Subscriptions

WebSockets are enabled by default. Methods automatically race WebSocket notifications against HTTP polling for the fastest result. To disable:

```typescript
const relayer = createGelatoEvmRelayerClient({
  apiKey: process.env.GELATO_API_KEY,
  ws: { disable: true }
});
```

**Relayer — single transaction:**
```typescript
const id = await relayer.sendTransaction({
  chainId: baseSepolia.id,
  to: '0xTargetContract...',
  data: '0xCalldata...'
});

const subscription = await relayer.ws.subscribe({ id });

subscription.on('success', (data) => {
  console.log(`Included in block ${data.receipt.blockNumber}`);
});

subscription.on('reverted', (data) => {
  console.log(`Reverted: ${data.receipt.blockNumber}`);
});

// Cleanup when done
await relayer.ws.unsubscribe(subscription.subscriptionId);
relayer.ws.disconnect();
```

**Relayer — global (all transactions):**
```typescript
const subscription = await relayer.ws.subscribe();

subscription.on('submitted', (data) => console.log(`${data.id} submitted`));
subscription.on('success', (data) => console.log(`${data.id} success`));
subscription.on('rejected', (data) => console.log(`${data.id} rejected`));
```

**Bundler** — same patterns apply via `bundler.ws`:
```typescript
const subscription = await bundler.ws.subscribe({ id: userOpHash });
subscription.on('success', (data) => console.log(data.receipt));
```

**Events:**

| Event | Description |
|-------------|-------------------------------------|
| `pending` | Transaction pending |
| `submitted` | Submitted to network |
| `success` | Successfully included on-chain |
| `rejected` | Rejected by relayer |
| `reverted` | Reverted on-chain |

**Cleanup:**
```typescript
await relayer.ws.unsubscribe(subscription.subscriptionId);
relayer.ws.disconnect();
```

### Get Balance

Check your Gas Tank balance. Available on all client types.

```typescript
const { balance, decimals, unit } = await relayer.getBalance();
// Also: client.getBalance(), bundler.getBalance()
```

## Sync vs Async

The SDK offers two ways to send transactions:

| | Sync (`sendTransactionSync`) | Async (`sendTransaction` + WS) |
|---|---|---|
| Returns | Final `TransactionReceipt` | ID (`Hex`) immediately |
| Lifecycle events | None (handled internally) | All: `pending`, `submitted`, `success`, `rejected`, `reverted` |
| Tx hash on (re)submission | Not exposed | `hash` field on every `submitted` event |
| Control | Minimal — fire and forget | Full — react to each status change via WS subscription |
| Reorg Protection | None | Yes, a new update event is published |

**Sync** — call `sendTransactionSync` to send the transaction and get the receipt in the same call. If the transaction is not included, the SDK will handle it internally and return a final `TransactionReceipt` by racing http polls and ws updates. Simplest approach when you just need the result:

```typescript
const receipt = await relayer.sendTransactionSync({ chainId, to, data });
```

**Async** — call `sendTransaction` to get a ID immediately, then subscribe via WebSocket for granular status updates. **WS subscriptions give you full control over the transaction lifecycle** — you can react to resubmissions, display tx hashes to users in real time, handle rejections immediately, and more. The `submitted` event includes the transaction `hash` each time the relay (re)submits the transaction (e.g. with bumped gas):

```typescript
const id = await relayer.sendTransaction({ chainId, to, data });
const subscription = await relayer.ws.subscribe({ id });

subscription.on('submitted', (data) => {
  console.log(`Tx hash: ${data.hash}`); // available on every (re)submission
});

subscription.on('success', (data) => {
  console.log(`Confirmed in block ${data.receipt.blockNumber}`);
});
```

## API Reference

### Relayer API

#### `createGelatoEvmRelayerClient(config)`

Creates a low-level relayer client for direct transaction submission.

```typescript
const client = createGelatoEvmRelayerClient({
  apiKey: string,    // Your Gelato API key
  testnet: boolean   // true for testnets, false for mainnet
});
```

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `sendTransaction` | `{ chainId, to, data, authorizationList?, context? }` | `Promise<Hex>` | Submit a transaction |
| `sendTransactionSync` | `{ chainId, to, data, timeout?, pollingInterval?, throwOnReverted?, ... }` | `Promise<TransactionReceipt>` | Send and wait for receipt |
| `getStatus` | `{ id: string }` | `Promise<Status>` | Get transaction status |
| `waitForReceipt` | `{ id: string, timeout?, pollingInterval?, throwOnReverted? }` | `Promise<TransactionReceipt>` | Wait for receipt, throws on failure |
| `getBalance` | - | `Promise<Balance>` | Get Gas Tank balance |
| `getCapabilities` | - | `Promise<Capabilities>` | Get supported chains |
| `getFeeData` | `{ chainId, gas, l1Fee? }` | `Promise<FeeData>` | Get network fee data |

---

### Account API

#### `toGelatoSmartAccount(params)`

Creates a Gelato smart account using ERC-7821 delegation.

```typescript
const account = toGelatoSmartAccount({
  client: Client,   // viem public client
  owner: Account    // EOA that owns the smart account
});
```

#### `createGelatoSmartAccountClient(config)`

Creates a client for interacting with a Gelato smart account.

```typescript
const client = await createGelatoSmartAccountClient({
  apiKey: string,              // Your Gelato API key
  account: SmartAccount        // From toGelatoSmartAccount()
});
```

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `sendTransaction` | `{ calls, nonce?, nonceKey?}` | `Promise<Hex>` | Send transaction(s) |
| `sendTransactionSync` | `{ calls, nonce?, nonceKey?, timeout?, pollingInterval?, throwOnReverted?, ... }` | `Promise<TransactionReceipt>` | Send and wait for receipt |
| `getStatus` | `{ id: string }` | `Promise<Status>` | Get transaction status |
| `waitForReceipt` | `{ id: string, timeout?, pollingInterval?, throwOnReverted? }` | `Promise<TransactionReceipt>` | Wait for receipt, throws on failure |
| `getBalance` | - | `Promise<Balance>` | Get Gas Tank balance |
| `getCapabilities` | - | `Promise<Capabilities>` | Get supported chains |

**Nonce Options:**
- `nonce`: Explicit nonce value
- `nonceKey`: Key for 2D nonce (allows parallel transactions)

**Polling Configuration:**

All synchronous methods (`sendTransactionSync`, `sendUserOperationSync`, `waitForReceipt`) support customizable polling behavior:

- `timeout` (optional): Maximum wait time in milliseconds
  - Default: `120000` (2 minutes)
  - Must not exceed `600000` (10 minutes)
- `pollingInterval` (optional): Frequency to check status in milliseconds
  - Default: `1000` (1 second)

**Example:**
```typescript
// Wait up to 30 seconds, checking every 500ms
const receipt = await relayer.sendTransactionSync({
  chainId: baseSepolia.id,
  to: '0xTargetContract...',
  data: '0xCalldata...',
  timeout: 30000,
  pollingInterval: 500
});
```

---

### Bundler API

#### `createGelatoBundlerClient(config)`

Creates an ERC-4337 bundler client. Extends viem's `BundlerClient`.

```typescript
const bundler = await createGelatoBundlerClient({
  account: SmartAccount,       // Any ERC-4337 smart account
  client: Client,              // viem public client
  apiKey: string,              // Your Gelato API key
  sponsored: boolean,          // Whether to use sponsored payment via Gas Tank
  pollingInterval?: number     // Polling interval in ms
});
```

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `sendUserOperation` | `{ calls }` | `Promise<Hex>` | Send a user operation |
| `sendUserOperationSync` | `{ calls, timeout?, pollingInterval? }` | `Promise<UserOperationReceipt>` | Send and wait for receipt |
| `waitForUserOperationReceipt` | `{ hash }` | `Promise<{ receipt }>` | Wait for receipt |
| `getBalance` | - | `Promise<Balance>` | Get Gas Tank balance |
| `estimateUserOperationGas` | `UserOperationParams` | `Promise<GasEstimate>` | Estimate gas |
| `prepareUserOperation` | `UserOperationParams` | `Promise<UserOperation>` | Prepare operation |
| `getUserOperationGasPrice` | - | `Promise<GasPrice>` | Get current gas prices |
| `getUserOperationQuote` | `UserOperationParams` | `Promise<Quote>` | Get fee quote |

---

### Types

#### StatusCode

```typescript
enum StatusCode {
  Pending = 100,    // Transaction pending
  Submitted = 110,  // Submitted to network
  Success = 200,   // Successfully included
  Rejected = 400,   // Rejected by relayer
  Reverted = 500    // Reverted on-chain
}
```

#### ErrorCode

```typescript
enum ErrorCode {
  // JSON-RPC
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  TimeoutError = -32070,

  // Relayer
  Unauthorized = 4100,
  UnsupportedPaymentToken = 4202,
  InsufficientPayment = 4200,
  InsufficientBalance = 4205,
  UnsupportedChain = 4206,
  UnknownTransactionId = 4208,
  InvalidAuthorizationList = 4210,
  SimulationFailed = 4211,

  // Bundler
  ValidationFailed = -32500,
  PaymasterValidationFailed = -32501,
  InvalidSignature = -32507,
  ExecutionFailed = -32521
}
```

#### Call

```typescript
type Call = {
  to: Address;      // Target contract address
  data?: Hex;       // Calldata (optional)
  value?: bigint;   // ETH value (optional)
};
```

## Status Handling

```typescript
const status = await client.getStatus({ id: hash });

switch (status.status) {
  case StatusCode.Success:
    console.log('Success:', status.receipt.transactionHash);
    break;
  case StatusCode.Rejected:
    console.log('Rejected:', status.message);
    break;
  case StatusCode.Reverted:
    console.log('Reverted:', status.data);
    break;
}
```

## Error Handling

### Timeout Errors

Synchronous methods (`sendTransactionSync`, `waitForReceipt`) throw `TimeoutError` when operations don't complete within the configured timeout:

```typescript
import { TimeoutError } from '@gelatocloud/gasless';

try {
  const receipt = await relayer.sendTransactionSync({
    chainId: baseSepolia.id,
    to: '0xTargetContract...',
    data: '0xCalldata...',
    timeout: 10000
  });
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error('Transaction timed out:', error.message);
    // Transaction may still be pending - you can retry with longer timeout
    // or use async methods to check status manually
  } else {
    console.error('Other error:', error);
  }
}
```

### Revert Handling

By default, `sendTransactionSync` and `waitForReceipt` return the receipt even when a transaction reverts on-chain. Set `throwOnReverted: true` to throw a `TransactionRevertedError` instead:

```typescript
import { TransactionRevertedError } from '@gelatocloud/gasless';

try {
  const receipt = await relayer.sendTransactionSync({
    chainId: baseSepolia.id,
    to: '0xTargetContract...',
    data: '0xCalldata...',
    throwOnReverted: true
  });
} catch (error) {
  if (error instanceof TransactionRevertedError) {
    console.error('Transaction reverted:', error.receipt.transactionHash);
    console.error('Error message:', error.erroMessage);
    console.error('Error data:', error.errorData);
    // Also available: error.id, error.chainId, error.createdAt
  }
}
```

Available on both relayer and account clients via `sendTransactionSync` and `waitForReceipt`. Properties on `TransactionRevertedError`: `receipt`, `id`, `chainId`, `createdAt`, `errorData`, `errorMessage`.

### Simulation Errors

When the relayer simulates a transaction before submission and the simulation reverts, a `SimulationFailedRpcError` is thrown with error code `4211`. This happens _before_ the transaction is sent on-chain:

```typescript
import { SimulationFailedRpcError } from '@gelatocloud/gasless';

try {
  const receipt = await relayer.sendTransactionSync({
    chainId: baseSepolia.id,
    to: '0xTargetContract...',
    data: '0xCalldata...'
  });
} catch (error) {
  if (error instanceof SimulationFailedRpcError) {
    console.error('Simulation reverted:', error.message);
    console.error('Revert data:', error.revertData);
    // error.params contains the original { to, chainId, data } sent
  }
}
```

Properties on `SimulationFailedRpcError`: `revertData`, `params`, `code` (`4211`).

### Automatic Retries

Relayer methods (`sendTransaction`, `sendTransactionSync`) support automatic retries when specific error codes are encountered. This is useful for transient failures like simulation errors (`4211`) that may succeed on a subsequent attempt.

```typescript
const receipt = await relayer.sendTransactionSync(
  {
    chainId: baseSepolia.id,
    to: '0xTargetContract...',
    data: '0xCalldata...'
  },
  {
    retries: {
      max: 3,          // Retry up to 3 times (default: 0, max: 10)
      max: 3,          // Retry up to 3 times (default: 0, max: 5)
      delay: 1000,     // Wait 1s between retries (default: 200ms)
      backoff: 'fixed', // 'exponential' (default) or 'fixed'
      errorCodes: [4211] // Error codes that trigger a retry (default: [4211])
    }
  }
);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `max` | `number` | `0` | Maximum number of retries (0–10). Clamped to 10. |
| `delay` | `number` | `200` | Delay in milliseconds before each retry. |
| `max` | `number` | `0` | Maximum number of retries (0–5). Clamped to 5. |
| `delay` | `number` | `200` | Base delay in milliseconds before each retry. |
| `backoff` | `'fixed' \| 'exponential'` | `'exponential'` | Backoff strategy. `'fixed'` keeps constant delay; `'exponential'` doubles each retry (`delay × 2^attempt`). |
| `errorCodes` | `number[]` | `[4211]` | RPC error codes that trigger a retry. Default is `SimulationFailedRpcError`. |

Works with both async and sync relayer methods:

```typescript
// Async
const id = await relayer.sendTransaction(
  { chainId, to, data },
  { retries: { max: 3 } }
);

// Sync
const receipt = await relayer.sendTransactionSync(
  { chainId, to, data },
  { retries: { max: 3 } }
);
```

Only errors with a matching `code` property are retried. All other errors are thrown immediately.

### Automatic Fallback on Timeout

When `sendTransactionSync` rpc request times out, the SDK automatically falls back to polling for the transaction status. If you see a warning message like:

```
Transaction 0x... sync call timed out, falling back to polling for completion. DO NOT RETRY this transaction.
```

This means your transaction was successfully submitted but the sync method timed out. The SDK will continue polling for completion automatically. **Do not retry the operation** as this could result in duplicate transactions.

### Recovery Strategies

If a timeout occurs:
1. **Wait for automatic fallback**: `sendTransactionSync` automatically polls after timeout
2. **Check status manually**: Use `getStatus({ id })` to check if transaction is still processing if needed
3. **Retry with longer timeout**: Increase `timeout` and call `waitForReceipt` again
4. **Use async methods**: Switch to async pattern for more control


### Configuration Limits

The SDK enforces the following limits to prevent denial of service:

```typescript
import {
  TimeoutError,
  TransactionRevertedError,
  SimulationFailedRpcError,
  MIN_TIMEOUT,
  MAX_TIMEOUT,
  MIN_POLLING_INTERVAL,
  MAX_POLLING_INTERVAL
} from '@gelatocloud/gasless';

console.log(MIN_TIMEOUT); // 1000ms (1 second)
console.log(MAX_TIMEOUT); // 600000ms (10 minutes)
console.log(MIN_POLLING_INTERVAL); // 100ms
console.log(MAX_POLLING_INTERVAL); // 300000ms (5 minutes)
```

You can set default timeout and polling interval at the client level:

```typescript
const relayer = createGelatoEvmRelayerClient({
  apiKey: process.env.GELATO_API_KEY,
  timeout: 30000, // Default 30 second timeout
  pollingInterval: 500 // Default 500ms polling interval
});

// Methods use client defaults unless overridden
const receipt = await relayer.sendTransactionSync({
  chainId: baseSepolia.id,
  to: '0xTargetContract...',
  data: '0xCalldata...',
  // timeout: 60000 // Optional: override client default
});
```

## Requirements

- Node.js >= 23
- Peer dependencies: `viem`, `zod`
- Optional: `typescript`

## Examples

See the [`/examples`](./examples) directory for complete working examples:

- [`examples/relayer/sponsored`](./examples/relayer/sponsored) - Direct relayer usage
- [`examples/relayer/get-balance`](./examples/relayer/get-balance) - Get Gas Tank balance
- [`examples/account/sponsored`](./examples/account/sponsored) - Gelato smart account
- [`examples/bundler/sponsored`](./examples/bundler/sponsored) - ERC-4337 bundler
- [`examples/bundler/get-balance`](./examples/bundler/get-balance) - Get Gas Tank balance (bundler)
- [`examples/relayer/ws`](./examples/relayer/ws) - Relayer WebSocket usage
- [`examples/bundler/ws`](./examples/bundler/ws) - Bundler WebSocket usage
- [`examples/account/ws`](./examples/account/ws) - Account WebSocket usage

Run an example:

```bash
cd examples/account/sponsored
npm install
GELATO_API_KEY=your-key npm run dev
```

## Links

- [GitHub Repository](https://github.com/gelatodigital/gasless)
- [Gelato Cloud](https://app.gelato.cloud/)
- [Gelato Documentation](https://docs.gelato.network/)

## License

MIT
