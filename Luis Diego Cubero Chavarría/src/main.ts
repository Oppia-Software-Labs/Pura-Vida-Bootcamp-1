import varial from '@stellar/varial-sdk';
import './style.css';

const connectButton = document.querySelector<HTMLButtonElement>('#connect-wallet')!;
const walletStatus = document.querySelector<HTMLElement>('#wallet-status')!;
const walletAddress = document.querySelector<HTMLElement>('#wallet-address')!;
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

    walletAddress.textContent = address;
    walletAddress.hidden = false;
    connected = true;
    walletStatus.textContent = 'Connected. Network has not been checked.';
  } catch {
    walletStatus.textContent = 'Unable to connect to Varial. Please retry.';
  } finally {
    busy = false;
    connectButton.disabled = connected;
    connectButton.textContent = connected ? 'Connected' : 'Connect Varial';
  }
});
