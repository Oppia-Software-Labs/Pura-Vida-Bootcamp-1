import varial from '@stellar/varial-sdk';
import './style.css';
import { initializeUI, label, status } from './ui';
import type { MessageKey } from './messages';
import { walletOperation } from './operations';

initializeUI();
const connectButton = document.querySelector<HTMLButtonElement>('#connect-wallet')!;
const walletAddress = document.querySelector<HTMLElement>('#wallet-address')!;
const walletNetwork = document.querySelector<HTMLElement>('#wallet-network')!;
const testnetPassphrase = 'Test SDF Network ; September 2015';
const disconnectButton = document.querySelector<HTMLButtonElement>('#disconnect-wallet')!;
let busy = false;
let connected = false;
let currentAddress = '';
let currentNetwork = '';
let currentPassphrase = '';
let connectionStatus: MessageKey = 'idle';

function clearDetails() {
  walletAddress.textContent = '';
  walletAddress.hidden = true;
  walletNetwork.textContent = '';
  walletNetwork.hidden = true;
}
function updateControls() {
  connectButton.disabled = busy || connected;
  label(connectButton, connectionStatus === 'uncertain' ? 'unconfirmed' : connected ? 'connected' : 'connect');
  disconnectButton.hidden = !connected;
  disconnectButton.disabled = busy;
  label(disconnectButton, 'disconnect');
}
function resetConnection() {
  connected = false;
  currentAddress = '';
  currentNetwork = '';
  currentPassphrase = '';
  connectionStatus = 'idle';
  clearDetails();
}
connectButton.addEventListener('click', async () => {
  if (busy || connected) return;
  busy = true;
  connectButton.disabled = true;
  label(connectButton, 'connecting');
  status('waiting');
  clearDetails();
  try {
    const extension = await walletOperation('extension_check', () => varial.isConnected());
    if (extension.error) {
      status('failed');
      return;
    }
    if (!extension.isConnected) {
      status('missing');
      return;
    }
    const result = await walletOperation('access', () => varial.requestAccess());
    if (result.error) {
      status('denied');
      return;
    }
    const address = result.address.trim();
    if (!address) {
      status('empty');
      return;
    }
    let approvedPassphrase = '';
    status('reading');
    try {
      const details = await walletOperation('network_read', () => varial.getNetwork());
      if (details.error || !details.network?.trim() || !details.networkPassphrase?.trim()) {
        status('networkError');
        return;
      }
      approvedPassphrase = details.networkPassphrase;
      walletNetwork.textContent = details.network;
      walletNetwork.hidden = false;
      connectionStatus = details.networkPassphrase === testnetPassphrase ? 'testnet' : 'other';
      status(connectionStatus);
    } catch {
      status('networkError');
      return;
    }
    walletAddress.textContent = address;
    walletAddress.hidden = false;
    connected = true;
    currentAddress = address;
    currentNetwork = walletNetwork.textContent!;
    // Keep the exact passphrase for return-to-page comparison.
    currentPassphrase = approvedPassphrase;
  } catch {
    status('failed');
  } finally {
    busy = false;
    updateControls();
  }
});
disconnectButton.addEventListener('click', async () => {
  if (busy || !connected) return;
  busy = true;
  updateControls();
  label(disconnectButton, 'disconnecting');
  status('disconnecting');
  clearDetails();
  try {
    const result = await walletOperation('disconnect', () => varial.disconnect());
    if (result.error) throw new Error('Disconnect not confirmed');
    resetConnection();
    status('disconnected');
  } catch {
    connectionStatus = 'uncertain';
    status(connectionStatus);
    // Do not restore potentially stale data after an uncertain outcome.
    currentAddress = '';
    currentNetwork = '';
    currentPassphrase = '';
  } finally {
    busy = false;
    updateControls();
    if (!connected) connectButton.focus();
    else disconnectButton.focus();
  }
});
// This single-page app owns one focus handler; no polling or permission prompt.
window.onfocus = async () => {
  if (busy || !connected) return;
  busy = true;
  updateControls();
  clearDetails();
  status('checking');
  try {
    const account = await walletOperation('account_read', () => varial.getAddress());
    if (account.error || !account.address?.trim() || account.address !== currentAddress) {
      throw new Error('Account unavailable or changed');
    }
    const details = await walletOperation('network_read', () => varial.getNetwork());
    if (details.error || !details.network?.trim() || !details.networkPassphrase?.trim()
      || details.network !== currentNetwork || details.networkPassphrase !== currentPassphrase) {
      throw new Error('Network unavailable or changed');
    }
    walletAddress.textContent = currentAddress;
    walletAddress.hidden = false;
    walletNetwork.textContent = currentNetwork;
    walletNetwork.hidden = false;
    status(connectionStatus);
  } catch {
    resetConnection();
    status('changed');
  } finally {
    busy = false;
    updateControls();
  }
};
