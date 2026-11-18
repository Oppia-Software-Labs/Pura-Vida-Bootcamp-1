import {
  getAddress,
  getNetworkDetails,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/varial-sdk";
import { network } from "@config/network";

async function assertTestnet(): Promise<void> {
  const details = await getNetworkDetails();
  if (details.error) throw new Error(details.error.message);
  if (details.networkPassphrase !== network.passphrase) {
    throw new Error("Wallet is not on testnet");
  }
}

export async function getConnectedAddress(): Promise<string | null> {
  const connected = await isConnected();
  if (connected.error || !connected.isConnected) return null;
  const { address, error } = await getAddress();
  return error || !address ? null : address;
}

export async function connectWallet(): Promise<string> {
  const connected = await isConnected();
  if (connected.error || !connected.isConnected) {
    throw new Error("Varial extension not installed");
  }
  const { address, error } = await requestAccess();
  if (error) throw new Error(error.message);
  await assertTestnet();
  return address;
}

export async function signXdr(xdr: string, address: string): Promise<string> {
  const { signedTxXdr, error } = await signTransaction(xdr, {
    networkPassphrase: network.passphrase,
    address,
  });
  if (error) throw new Error(`Wallet signature failed: ${error.message}`);
  return signedTxXdr;
}
