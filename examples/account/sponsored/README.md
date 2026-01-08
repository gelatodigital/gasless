# Smart Account Sponsored Example

This example demonstrates how to use **Gelato Smart Account** for gasless transactions with sponsored payments.

## Overview

The Smart Account provides account abstraction capabilities including:
- Batching multiple calls in one transaction
- 2D nonce support for parallel execution
- ERC-7821 delegation pattern

## Prerequisites

- Node.js >= 23
- Gelato API Key from [app.gelato.cloud](https://app.gelato.cloud/)

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure environment variables (see [Environment Variables](#environment-variables) section below)

## Environment Variables

This example loads environment variables from two sources:

1. **Root `.env`** (at project root) - Shared defaults for all examples
2. **Local `.env`** (in this directory) - Optional overrides

Local values take precedence over root values. To set up:

1. Copy the root `.env.example` to `.env` at the project root:
   ```bash
   cp ../../../.env.example ../../../.env
   ```

2. Add your credentials to the root `.env`:
   ```
   GELATO_API_KEY="your-api-key"
   PRIVATE_KEY="0x..."  # Optional - generates random key if not set
   ```

3. (Optional) Create a local `.env` in this directory to override specific values for this example

## Run

```bash
pnpm dev
```

## Code Walkthrough

### Step 1: Create Owner Account

```typescript
const owner = privateKeyToAccount((PRIVATE_KEY ?? generatePrivateKey()) as Hex);
```

Creates an EOA (Externally Owned Account) that will sign transactions. If no private key is provided, a random one is generated.

### Step 2: Create Gelato Smart Account

```typescript
const account = toGelatoSmartAccount({
  client,
  owner
});
```

Creates a smart account that delegates execution to Gelato's infrastructure.

### Step 3: Create Smart Account Client

```typescript
const relayer = await createGelatoSmartAccountClient({
  account,
  apiKey: GELATO_API_KEY
});
```

Wraps the smart account with Gelato's relayer capabilities.

### Step 4: Send Transaction with 2D Nonce

```typescript
function encodeNonce(key: bigint, seq: bigint): bigint {
  return (key << 64n) | seq;
}

const result = await relayer.sendTransactionSync({
  calls: [
    {
      data: '0xd09de08a',
      to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
    }
  ],
  nonce: encodeNonce(BigInt(Date.now()), 0n),
  payment: sponsored()
});
```

Sends a sponsored transaction using `sendTransactionSync` which waits for the final status.

### Step 5: Check Result

```typescript
if (result.status === StatusCode.Included) {
  console.log(`Transaction hash: ${result.receipt.transactionHash}`);
}
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| `toGelatoSmartAccount` | Creates ERC-7821 delegation-based smart account |
| `calls` | Array of transactions to batch together |
| `sendTransactionSync` | Waits for final status before returning |
| 2D Nonce | `(key << 64) \| seq` - enables parallel execution with different keys |
| `getFeeQuote` | Optional - pre-fetch fee quote to avoid duplicate calls |

## 2D Nonce Explained

The nonce is split into two parts:
- **Key** (192 bits): Identifies independent transaction streams
- **Sequence** (64 bits): Order within a stream

This allows multiple transactions with different keys to execute in parallel.
