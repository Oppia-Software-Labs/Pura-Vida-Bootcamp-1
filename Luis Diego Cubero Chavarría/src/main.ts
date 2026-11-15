import varial from '@stellar/varial-sdk';
import './style.css';

const connectButton = document.querySelector<HTMLButtonElement>('#connect-wallet')!;
const walletStatus = document.querySelector<HTMLElement>('#wallet-status')!;
const walletAddress = document.querySelector<HTMLElement>('#wallet-address')!;
const walletNetwork = document.querySelector<HTMLElement>('#wallet-network')!;
const testnetPassphrase = 'Test SDF Network ; September 2015';
let busy = false;
let connected = false;

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

    walletStatus.textContent = 'Reading wallet network…';
    try {
      const details = await varial.getNetwork();
      if (details.error || !details.network?.trim() || !details.networkPassphrase?.trim()) {
        walletStatus.textContent = 'Unable to read the wallet network. Please retry.';
        return;
      }
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
  } catch {
    walletStatus.textContent = 'Unable to connect to Varial. Please retry.';
  } finally {
    busy = false;
    connectButton.disabled = connected;
    connectButton.textContent = connected ? 'Connected' : 'Connect Varial';
  }
});
