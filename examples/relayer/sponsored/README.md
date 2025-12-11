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

2. Configure environment:
   ```bash
   cp .env.example .env
   ```

3. Add your API key to `.env`:
   ```
   GELATO_API_KEY="your-api-key"
   ```

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
