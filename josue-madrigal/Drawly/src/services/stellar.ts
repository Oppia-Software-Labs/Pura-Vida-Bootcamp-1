import * as StellarSdk from '@stellar/stellar-sdk';

export const STELLAR_CONFIG = {
  network: 'TESTNET',
  networkPassphrase: StellarSdk.Networks.TESTNET,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  friendbotUrl: 'https://friendbot.stellar.org',
  explorerUrl: 'https://stellar.expert/explorer/testnet/account',
};

// Instancia única del servidor Horizon para Testnet
export const horizonServer = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);

export interface AccountBalanceInfo {
  balance: string;
  exists: boolean;
  error?: string;
}

/**
 * Consulta el balance actual de XLM nativo en Horizon Testnet
 */
export async function fetchXlmBalance(publicKey: string): Promise<AccountBalanceInfo> {
  if (!publicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
    return { balance: '0', exists: false, error: 'Clave pública inválida' };
  }

  try {
    const account = await horizonServer.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b) => b.asset_type === 'native');
    return {
      balance: nativeBalance ? parseFloat(nativeBalance.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0',
      exists: true,
    };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number }; name?: string; message?: string };
    if (err?.response?.status === 404 || err?.name === 'NotFoundError') {
      return { balance: '0', exists: false };
    }
    console.error('Error al consultar Horizon:', error);
    return { balance: '0', exists: false, error: err?.message || 'Error al consultar la red' };
  }
}

/**
 * Fondea la cuenta con 10,000 XLM usando Friendbot en Testnet
 */
export async function requestFriendbotFunding(publicKey: string): Promise<{ success: boolean; message: string }> {
  if (!publicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
    return { success: false, message: 'Dirección pública inválida' };
  }

  try {
    const response = await fetch(`${STELLAR_CONFIG.friendbotUrl}?addr=${encodeURIComponent(publicKey)}`);
    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: '¡Cuenta fondeada exitosamente con 10,000 XLM de Friendbot!',
      };
    } else {
      return {
        success: false,
        message: data?.detail || data?.title || 'Friendbot no pudo procesar la solicitud.',
      };
    }
  } catch (error: unknown) {
    const err = error as Error;
    return {
      success: false,
      message: `Error al conectar con Friendbot: ${err.message}`,
    };
  }
}

/**
 * Acorta una clave pública de Stellar (ej: GABC...WXYZ)
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
