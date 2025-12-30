# Bundler Sponsored Example

This example demonstrates how to use Gelato's **ERC-4337 Bundler** with third-party smart accounts for gasless transactions.

## Overview

The Bundler provides full ERC-4337 compliance, allowing you to use any compatible smart account (like Kernel, Safe, etc.) with Gelato's infrastructure.

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

3. Add your credentials to `.env`:
   ```
   GELATO_API_KEY="your-api-key"
   PRIVATE_KEY="0x..."  # Optional - generates random key if not set
   ```

## Run

```bash
pnpm dev
```

## Code Walkthrough

### Step 1: Create Owner Account

```typescript
const owner = privateKeyToAccount((PRIVATE_KEY ?? generatePrivateKey()) as Hex);
```

Creates an EOA that will own the smart account.

### Step 2: Create Kernel Smart Account

```typescript
const account = await toKernelSmartAccount({
  client,
  owners: [owner],
  useMetaFactory: false,
  version: '0.3.3'
});
```

Creates a Kernel v0.3.3 smart account using the `permissionless` library. You can substitute any ERC-4337 compatible account.

### Step 3: Create Bundler Client

```typescript
const bundler = await createGelatoBundlerClient({
  account,
  apiKey: GELATO_API_KEY,
  client,
  payment: sponsored(),
  pollingInterval: 100
});
```

Creates a bundler client that handles user operation submission and gas sponsorship.

### Step 4: Send User Operation

```typescript
const hash = await bundler.sendUserOperation({
  calls: [
    {
      data: '0xd09de08a',
      to: '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De'
    }
  ]
});
```

Submits an ERC-4337 user operation. Returns the user operation hash.

### Step 5: Wait for Receipt

```typescript
const { receipt } = await bundler.waitForUserOperationReceipt({ hash });
console.log(`Transaction hash: ${receipt.transactionHash}`);
```

Waits for the user operation to be bundled and included on-chain.

## Key Concepts

| Concept | Description |
|---------|-------------|
| ERC-4337 | Account Abstraction standard for user operations |
| User Operation | Transaction format for smart accounts |
| `toKernelSmartAccount` | Creates a Kernel smart account (from `permissionless`) |
| `sendUserOperation` | Submits user operation to the bundler |
| `waitForUserOperationReceipt` | Waits for on-chain inclusion |

## When to Use Bundler vs Smart Account

| Use Case | Recommended |
|----------|-------------|
| Need ERC-4337 ecosystem compatibility | Bundler |
| Using third-party smart accounts (Kernel, Safe, etc.) | Bundler |
| Want Gelato's native smart account | Smart Account |
| Simplest possible integration | Relayer |
