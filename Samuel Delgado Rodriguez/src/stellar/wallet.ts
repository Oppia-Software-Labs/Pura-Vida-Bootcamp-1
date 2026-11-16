import { getAddress, getNetwork, isConnected, requestAccess } from '@stellar/varial-sdk';

export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

export type WalletErrorCode = 'missing-extension' | 'access-denied' | 'wrong-network' | 'wallet-error';

export class WalletError extends Error {
  constructor(public readonly code: WalletErrorCode, message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

export async function connectWallet(): Promise<string> {
  const connection = await isConnected();
  if (!connection.isConnected) {
    throw new WalletError('missing-extension', 'Instala Varial para conectar tu wallet.');
  }

  const access = await requestAccess();
  if (access.error || !access.address) {
    throw new WalletError('access-denied', 'No se autorizó la conexión. Vuelve a intentarlo desde Varial.');
  }

  const network = await getNetwork();
  if (network.error) {
    throw new WalletError('wallet-error', 'No se pudo comprobar la red de Varial.');
  }
  if (network.networkPassphrase !== TESTNET_PASSPHRASE) {
    throw new WalletError('wrong-network', 'Cambia Varial a Testnet y vuelve a conectar.');
  }

  return access.address;
}

export async function restoreWallet(): Promise<string | null> {
  const connection = await isConnected();
  if (!connection.isConnected) return null;

  const account = await getAddress();
  if (account.error || !account.address) return null;

  const network = await getNetwork();
  if (network.error || network.networkPassphrase !== TESTNET_PASSPHRASE) return null;

  return account.address;
}
