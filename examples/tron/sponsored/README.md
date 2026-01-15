# Tron Sponsored Transaction Example

This example demonstrates how to send gasless transactions on the Tron blockchain using the Gelato Gasless SDK.

## Features

- **Sponsored transactions**: Gelato pays the gas fees (energy/bandwidth) for you
- **TRX payment**: Pay transaction fees with TRX
- **TronWeb integration**: Uses TronWeb for function encoding
- **No viem dependency**: The `@gelatocloud/gasless/tron` subpath has zero viem dependency

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set your environment variables:

```bash
export GELATO_API_KEY="your-api-key"
```

Or create a `.env` file in this directory:

```
GELATO_API_KEY=your-api-key
```

3. Get your API key at [https://app.gelato.cloud/](https://app.gelato.cloud/)

## Run

```bash
npm run dev
```

## Chain IDs

- **Tron Mainnet**: `728126428`
- **Tron Shasta (testnet)**: `2494104990`
- **Tron Nile (testnet)**: `3448148188`

## Payment Options

```typescript
import { sponsored, token } from '@gelatocloud/gasless/tron';

// Gelato pays gas (gasless for user)
payment: sponsored()

// Pay with TRX (native currency)
payment: token('TRX')

// Pay with a TRC-20 token
payment: token('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')
```

## Encoding Function Calls

Use TronWeb to encode your contract calls:

```typescript
import { TronWeb } from 'tronweb';

const tronWeb = new TronWeb({ fullHost: 'https://nile.trongrid.io' });

// Encode function selector
const hashHex = tronWeb.sha3('transfer(address,uint256)', false);
const selector = '0x' + hashHex.slice(0, 8);

// Encode with parameters using ABI
const functionABI = {
  inputs: [
    { name: 'to', type: 'address' },
    { name: 'amount', type: 'uint256' }
  ],
  name: 'transfer',
  outputs: [],
  type: 'function'
};

const params = tronWeb.utils.abi.encodeParamsV2ByABI(functionABI, ['TRecipient...', '1000000']);
const data = selector + params.slice(2);
```

## API Reference

### `createGelatoTronRelayerClient(config)`

Creates a Tron relayer client.

```typescript
const client = createGelatoTronRelayerClient({
  apiKey: string,    // Your Gelato API key
  testnet: boolean   // true for testnets, false for mainnet
});
```

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `sendTransaction` | `{ chainId, to, data, payment }` | `Promise<string>` | Submit a transaction, returns task ID |
| `sendTransactionSync` | `{ chainId, to, data, payment }` | `Promise<TronReceipt>` | Send and wait for receipt |
| `getStatus` | `{ id: string }` | `Promise<TronStatus>` | Get transaction status |
| `waitForStatus` | `{ id: string }` | `Promise<TronTerminalStatus>` | Wait for final status |
| `waitForInclusion` | `{ id: string }` | `Promise<TronReceipt>` | Wait for receipt, throws on failure |
| `getExchangeRate` | `{ chainId, token }` | `Promise<TronExchangeRate>` | Get fee estimation data |
