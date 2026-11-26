// Wallet connection via the Varial extension SDK (formerly Freighter), as
// recommended by Stellar Raven's dApp skill.
import { getAddress, getNetworkDetails, isConnected, requestAccess, signTransaction } from "@stellar/varial-sdk";

export async function walletInstalled() {
  const res = await isConnected();
  return !res.error && res.isConnected;
}

/** Returns the address if the site was already authorised, else null (no popup). */
export async function restoreWallet() {
  if (!(await walletInstalled())) return null;
  const { address, error } = await getAddress();
  return error || !address ? null : address;
}

/** Prompts the user to share their address. */
export async function connectWallet() {
  if (!(await walletInstalled())) {
    throw new Error("No Stellar wallet extension found. Install Varial (Freighter) from varial.app / freighter.app and reload.");
  }
  const { address, error } = await requestAccess();
  if (error) throw new Error(error.message ?? String(error));
  return address;
}

export async function walletPassphrase() {
  const res = await getNetworkDetails();
  return res.error ? null : res.networkPassphrase;
}

export async function signXdr(xdr, networkPassphrase, address) {
  const { signedTxXdr, error } = await signTransaction(xdr, { networkPassphrase, address });
  if (error) throw new Error(error.message ?? String(error));
  return signedTxXdr;
}
