# Relayer Sponsored Example

This example demonstrates how to use Gelato's **Turbo Relayer** for gasless transactions with sponsored payments.

## Overview

The Relayer is the simplest integration path - it relays transactions directly without requiring a smart account. Gelato pays the gas fees (sponsored mode).

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

2. Add your API key to the root `.env`:
   ```
   GELATO_API_KEY="your-api-key"
   ```

3. (Optional) Create a local `.env` in this directory to override specific values for this example

## Run

```bash
pnpm dev
```

## Code Walkthrough

### Step 1: Create the Relayer Client

```typescript
const relayer = createGelatoEvmRelayerClient({
  apiKey: GELATO_API_KEY,
  testnet: chain.testnet
});
```

Creates a relayer client configured for Base Sepolia testnet.

### Step 2: Send a Sponsored Transaction

```typescript
const id = await relayer.sendTransaction({
  chainId: chain.id,
  data: '0xd09de08a',
  payment: sponsored(),
  to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
});
```

Submits a transaction to Gelato. The `sponsored()` payment type means Gelato covers gas costs.

### Step 3: Wait for Confirmation

```typescript
const status = await relayer.waitForStatus({ id });

if (status.status === StatusCode.Included) {
  console.log(`Transaction hash: ${status.receipt.transactionHash}`);
}
```

Polls until the transaction reaches a final state (Included, Rejected, or Reverted).

## Key Concepts

| Concept | Description |
|---------|-------------|
| `sponsored()` | Gelato pays gas fees |
| `sendTransaction` | Async - returns immediately with task ID |
| `waitForStatus` | Blocks until transaction is finalized |
| `StatusCode.Included` | Transaction successfully included on-chain |
