# @gelatocloud/gasless

[![npm version](https://img.shields.io/npm/v/@gelatocloud/gasless.svg)](https://www.npmjs.com/package/@gelatocloud/gasless)

### All-in-one solution for gasless transactions.

## Features

- **Three abstraction levels** - Choose the optimal integration model for your application::
  - **Turbo Relayer**: The fastest, most efficient way to submit transactions on-chain with zero gas overhead, ideal for latency-sensitive workflows.
  - **Turbo Relayer with Smart Account** - Leverage Smart Accounts for streamlined transaction encoding and signing while retaining Turbo-level performance.
  - **ERC-4337 Bundler** - A fully compliant ERC-4337 bundler for native Account Abstraction flows.
- **Flexible payment models** - Support for sponsored transactions, ERC-20 token payments, or native currency.
- **2D nonce support** - Advanced nonce management using both `nonce` and `nonceKey` for parallelized execution.
- **Type-safe** - Implemented on top of [viem](https://viem.sh), offering complete TypeScript type safety and developer ergonomics.
- **Synchronous methods**: Send transaction and get the receipt in a single call

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
import { createGelatoEvmRelayerClient, sponsored } from '@gelatocloud/gasless';
import { baseSepolia } from 'viem/chains';

const relayer = createGelatoEvmRelayerClient({
  apiKey: process.env.GELATO_API_KEY,
  testnet: true
});

// Send and wait for inclusion in one call
const receipt = await relayer.sendTransactionSync({
  chainId: baseSepolia.id,
  to: '0xTargetContract...',
  data: '0xCalldata...',
  payment: sponsored()
});

console.log(`Transaction hash: ${receipt.transactionHash}`);
```

**Asynchronous:**
```typescript
import { createGelatoEvmRelayerClient, StatusCode, sponsored } from '@gelatocloud/gasless';
import { baseSepolia } from 'viem/chains';

const relayer = createGelatoEvmRelayerClient({
  apiKey: process.env.GELATO_API_KEY,
  testnet: true
});

// Send transaction (returns immediately with task ID)
const taskId = await relayer.sendTransaction({
  chainId: baseSepolia.id,
  to: '0xTargetContract...',
  data: '0xCalldata...',
  payment: sponsored()
});

// Poll for status separately
const status = await relayer.waitForStatus({ id: taskId });

if (status.status === StatusCode.Included) {
  console.log(`Transaction hash: ${status.receipt.transactionHash}`);
}
```

### Account (Gelato Smart Account)

Gelato's smart account implementation with ERC-7821 delegation pattern.

**Synchronous:**
```typescript
import {
  createGelatoSmartAccountClient,
  toGelatoSmartAccount,
  sponsored
} from '@gelatocloud/gasless';
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
  ],
  payment: sponsored()
  // Optional: nonce or nonceKey for 2D nonce management
});

console.log(`Transaction hash: ${receipt.transactionHash}`);
```

**Asynchronous:**
```typescript
import {
  createGelatoSmartAccountClient,
  toGelatoSmartAccount,
  StatusCode,
  sponsored
} from '@gelatocloud/gasless';

// ... same setup as above ...

// Send transaction (returns immediately with task ID)
const taskId = await client.sendTransaction({
  calls: [{ to: '0xContract...', data: '0xCalldata...' }],
  payment: sponsored()
});

// Poll for status separately
const status = await client.waitForStatus({ id: taskId });

if (status.status === StatusCode.Included) {
  console.log(`Transaction hash: ${status.receipt.transactionHash}`);
}
```

**Fee Quote (Optional):** Pre-fetch a quote to avoid duplicate requests:

```typescript
const quote = await client.getFeeQuote({
  calls: [{ to: '0x...', data: '0x...' }],
  payment: token('0xTokenAddress...')
});

const hash = await client.sendTransaction({
  calls: [{ to: '0x...', data: '0x...' }],
  payment: token('0xTokenAddress...'),
  quote // Pass the pre-fetched quote
});
```

### Bundler (ERC-4337)

Compatible with any ERC-4337 smart account.

```typescript
import { createGelatoBundlerClient, sponsored } from '@gelatocloud/gasless';
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
  payment: sponsored()
});

// Send a user operation
const hash = await bundler.sendUserOperation({
  calls: [{ to: '0x...', data: '0x...' }]
});

// Wait for the receipt
const { receipt } = await bundler.waitForUserOperationReceipt({ hash });

console.log(`Transaction hash: ${receipt.transactionHash}`);
```

## Payment Options

```typescript
import { sponsored, token, native } from '@gelatocloud/gasless';

// Gelato pays gas (gasless for user)
payment: sponsored()

// Pay with an ERC-20 token
payment: token('0xTokenAddress...')

// Pay with native currency (ETH, MATIC, etc.)
payment: native()
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
| `sendTransaction` | `{ chainId, to, data, payment, authorizationList?, context? }` | `Promise<Hex>` | Submit a transaction |
| `sendTransactionSync` | `{ chainId, to, data, payment, ... }` | `Promise<TransactionReceipt>` | Send and wait for receipt |
| `getStatus` | `{ id: string }` | `Promise<Status>` | Get transaction status |
| `waitForStatus` | `{ id: string }` | `Promise<TerminalStatus>` | Wait for final status |
| `waitForInclusion` | `{ id: string }` | `Promise<TransactionReceipt>` | Wait for receipt, throws on failure |
| `getCapabilities` | - | `Promise<Capabilities>` | Get supported chains |
| `getFeeData` | `{ chainId, gas, l1Fee? }` | `Promise<FeeData>` | Get network fee data |
| `getFeeQuote` | `{ chainId, gas, token, l1Fee? }` | `Promise<FeeQuote>` | Get fee quote for token payment |

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
| `sendTransaction` | `{ calls, payment, nonce?, nonceKey?, quote? }` | `Promise<Hex>` | Send transaction(s) |
| `sendTransactionSync` | `{ calls, payment, nonce?, nonceKey?, ... }` | `Promise<TransactionReceipt>` | Send and wait for receipt |
| `getFeeQuote` | `{ calls, payment }` | `Promise<FeeQuote>` | Get fee quote |
| `getStatus` | `{ id: string }` | `Promise<Status>` | Get transaction status |
| `waitForStatus` | `{ id: string }` | `Promise<TerminalStatus>` | Wait for final status |
| `waitForInclusion` | `{ id: string }` | `Promise<TransactionReceipt>` | Wait for receipt, throws on failure |
| `getCapabilities` | - | `Promise<Capabilities>` | Get supported chains |

**Nonce Options:**
- `nonce`: Explicit nonce value
- `nonceKey`: Key for 2D nonce (allows parallel transactions)

---

### Bundler API

#### `createGelatoBundlerClient(config)`

Creates an ERC-4337 bundler client. Extends viem's `BundlerClient`.

```typescript
const bundler = await createGelatoBundlerClient({
  account: SmartAccount,       // Any ERC-4337 smart account
  client: Client,              // viem public client
  apiKey: string,              // Your Gelato API key
  payment?: Payment,           // Default payment method
  pollingInterval?: number     // Polling interval in ms
});
```

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `sendUserOperation` | `{ calls }` | `Promise<Hex>` | Send a user operation |
| `sendUserOperationSync` | `{ calls, timeout }` | `Promise<UserOperationReceipt>` | Send and wait for receipt |
| `waitForUserOperationReceipt` | `{ hash }` | `Promise<{ receipt }>` | Wait for receipt |
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
  Included = 200,   // Successfully included
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

#### PaymentType

```typescript
enum PaymentType {
  Token = 'token',        // Pay with ERC-20 or native
  Sponsored = 'sponsored' // Gelato pays (gasless)
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
import { StatusCode } from '@gelatocloud/gasless';

const status = await client.waitForStatus({ id: hash });

switch (status.status) {
  case StatusCode.Included:
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

## Requirements

- Node.js >= 23
- Peer dependencies: `viem`, `zod`
- Optional: `typescript`

## Examples

See the [`/examples`](./examples) directory for complete working examples:

- [`examples/relayer/sponsored`](./examples/relayer/sponsored) - Direct relayer usage
- [`examples/account/sponsored`](./examples/account/sponsored) - Gelato smart account
- [`examples/bundler/sponsored`](./examples/bundler/sponsored) - ERC-4337 bundler

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
