import type { GelatoEvmRelayerClient } from '@gelatocloud/gasless';
import { createGelatoEvmRelayerClient } from '@gelatocloud/gasless';
import { baseSepolia } from 'viem/chains';

const chain = baseSepolia;
const TARGET_CONTRACT = '0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De';
const INCREMENT_CALLDATA = '0xd09de08a';

// Pre-fill API key from env (Vite exposes VITE_-prefixed vars)
const envApiKey = import.meta.env['VITE_GELATO_API_KEY'] as string | undefined;

// DOM elements
const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
const disconnectBtn = document.getElementById('disconnectBtn') as HTMLButtonElement;
const statusDot = document.getElementById('statusDot') as HTMLSpanElement;
const statusText = document.getElementById('statusText') as HTMLSpanElement;
const logEl = document.getElementById('log') as HTMLDivElement;

if (envApiKey) apiKeyInput.value = envApiKey;

let relayer: GelatoEvmRelayerClient | null = null;
let subscriptionId: string | null = null;

function log(
  message: string,
  type: 'info' | 'submitted' | 'success' | 'rejected' | 'reverted' | 'error' = 'info'
) {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `<span class="time">${time}</span>${message}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function setConnected(connected: boolean) {
  connectBtn.disabled = connected;
  apiKeyInput.disabled = connected;
  sendBtn.disabled = !connected;
  disconnectBtn.disabled = !connected;
  statusDot.className = connected ? 'dot connected' : 'dot';
  statusText.textContent = connected ? 'Connected' : 'Disconnected';
}

connectBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    log('Please enter an API key', 'error');
    return;
  }

  try {
    log('Creating relayer client...');

    relayer = createGelatoEvmRelayerClient({
      apiKey,
      testnet: chain.testnet
    });

    log('Subscribing to transaction updates...');
    const subscription = await relayer.ws.subscribe();
    subscriptionId = subscription.subscriptionId;

    subscription.on('submitted', (data) =>
      log(`[submitted] Transaction ${data.id} submitted with hash: ${data.hash}`, 'submitted')
    );
    subscription.on('success', (data) =>
      log(
        `[success] Transaction ${data.id} included in block ${data.receipt.blockNumber}`,
        'success'
      )
    );
    subscription.on('rejected', (data) =>
      log(`[rejected] Transaction ${data.id} was rejected: ${data.message}`, 'rejected')
    );
    subscription.on('reverted', (data) =>
      log(
        `[reverted] Transaction ${data.id} reverted on block ${data.receipt.blockNumber}`,
        'reverted'
      )
    );

    setConnected(true);
    log('Connected! Listening for transaction updates...');
  } catch (err) {
    log(`Connection failed: ${err instanceof Error ? err.message : err}`, 'error');
  }
});

sendBtn.addEventListener('click', async () => {
  if (!relayer) return;

  try {
    sendBtn.disabled = true;
    log(`Sending increment() to ${TARGET_CONTRACT} on ${chain.name}...`);

    const id = await relayer.sendTransaction({
      chainId: chain.id,
      data: INCREMENT_CALLDATA,
      to: TARGET_CONTRACT
    });

    log(`Transaction sent: ${id}`);
    sendBtn.disabled = false;
  } catch (err) {
    log(`Send failed: ${err instanceof Error ? err.message : err}`, 'error');
    sendBtn.disabled = false;
  }
});

disconnectBtn.addEventListener('click', async () => {
  if (!relayer) return;

  try {
    if (subscriptionId) {
      await relayer.ws.unsubscribe(subscriptionId);
      subscriptionId = null;
    }
    relayer.ws.disconnect();
    relayer = null;
    setConnected(false);
    log('Disconnected.');
  } catch (err) {
    log(`Disconnect error: ${err instanceof Error ? err.message : err}`, 'error');
  }
});
