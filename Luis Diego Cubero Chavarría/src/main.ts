import varial from '@stellar/varial-sdk';
import './style.css';

const connectButton = document.querySelector<HTMLButtonElement>('#connect-wallet')!;
const walletStatus = document.querySelector<HTMLElement>('#wallet-status')!;
const walletAddress = document.querySelector<HTMLElement>('#wallet-address')!;
const walletNetwork = document.querySelector<HTMLElement>('#wallet-network')!;
const testnetPassphrase = 'Test SDF Network ; September 2015';
const disconnectButton = document.querySelector<HTMLButtonElement>('#disconnect-wallet')!;
let busy = false;
let connected = false;
let currentAddress = '';
let currentNetwork = '';
let currentPassphrase = '';
let connectionStatus = '';

function clearDetails() {
  walletAddress.textContent = '';
  walletAddress.hidden = true;
  walletNetwork.textContent = '';
  walletNetwork.hidden = true;
}

function updateControls() {
  connectButton.disabled = busy || connected;
  connectButton.textContent = connected ? 'Connected' : 'Connect Varial';
  disconnectButton.hidden = !connected;
  disconnectButton.disabled = busy;
  disconnectButton.textContent = 'Disconnect';
}

function resetConnection() {
  connected = false;
  currentAddress = '';
  currentNetwork = '';
  currentPassphrase = '';
  connectionStatus = '';
  clearDetails();
}

connectButton.addEventListener('click', async () => {
  if (busy || connected) return;

  busy = true;
  connectButton.disabled = true;
  connectButton.textContent = 'Connecting…';
  walletStatus.textContent = 'Waiting for Varial approval…';
  walletAddress.textContent = '';
  walletAddress.hidden = true;
  walletNetwork.textContent = '';
  walletNetwork.hidden = true;

  try {
    const extension = await varial.isConnected();
    if (extension.error) {
      walletStatus.textContent = 'Unable to connect to Varial. Please retry.';
      return;
    }
    if (!extension.isConnected) {
      walletStatus.textContent = 'Varial extension not found. Install or enable it, then retry.';
      return;
    }

    const result = await varial.requestAccess();
    if (result.error) {
      walletStatus.textContent = 'Connection was not approved. Try again in Varial.';
      return;
    }
    const address = result.address.trim();
    if (!address) {
      walletStatus.textContent = 'Varial returned no public address. Please retry.';
      return;
    }

    let approvedPassphrase = '';
    walletStatus.textContent = 'Reading wallet network…';
    try {
      const details = await varial.getNetwork();
      if (details.error || !details.network?.trim() || !details.networkPassphrase?.trim()) {
        walletStatus.textContent = 'Unable to read the wallet network. Please retry.';
        return;
      }
      approvedPassphrase = details.networkPassphrase;
      walletNetwork.textContent = details.network;
      walletNetwork.hidden = false;
      walletStatus.textContent = details.networkPassphrase === testnetPassphrase
        ? 'Connected. Testnet confirmed — ready for practice.'
        : 'Connected to a non-Testnet network. This lab is for Testnet practice; change networks in Varial.';
    } catch {
      walletStatus.textContent = 'Unable to read the wallet network. Please retry.';
      return;
    }

    walletAddress.textContent = address;
    walletAddress.hidden = false;
    connected = true;
    currentAddress = address;
    currentNetwork = walletNetwork.textContent!;
    // Keep the exact passphrase for return-to-page comparison.
    currentPassphrase = approvedPassphrase;
    connectionStatus = walletStatus.textContent!;
  } catch {
    walletStatus.textContent = 'Unable to connect to Varial. Please retry.';
  } finally {
    busy = false;
    updateControls();
  }
});

disconnectButton.addEventListener('click', async () => {
  if (busy || !connected) return;
  busy = true;
  updateControls();
  disconnectButton.textContent = 'Disconnecting…';
  walletStatus.textContent = 'Disconnecting…';
  clearDetails();
  try {
    const result = await varial.disconnect();
    if (result.error) throw new Error('Disconnect not confirmed');
    resetConnection();
    walletStatus.textContent = 'Disconnected for the active account and network.';
  } catch {
    connectionStatus = 'Disconnection could not be confirmed. Retry disconnect.';
    walletStatus.textContent = connectionStatus;
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
  walletStatus.textContent = 'Checking wallet connection…';
  try {
    const account = await varial.getAddress();
    if (account.error || !account.address?.trim() || account.address !== currentAddress) {
      throw new Error('Account unavailable or changed');
    }
    const details = await varial.getNetwork();
    if (details.error || !details.network?.trim() || !details.networkPassphrase?.trim()
      || details.network !== currentNetwork || details.networkPassphrase !== currentPassphrase) {
      throw new Error('Network unavailable or changed');
    }
    walletAddress.textContent = currentAddress;
    walletAddress.hidden = false;
    walletNetwork.textContent = currentNetwork;
    walletNetwork.hidden = false;
    walletStatus.textContent = connectionStatus;
  } catch {
    resetConnection();
    walletStatus.textContent = 'Wallet connection changed or is unavailable. Please reconnect.';
  } finally {
    busy = false;
    updateControls();
  }
};
