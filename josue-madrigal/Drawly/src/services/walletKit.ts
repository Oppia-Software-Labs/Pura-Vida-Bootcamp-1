import {
  StellarWalletsKit,
  Networks,
  type ModuleInterface,
} from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import {
  WalletConnectModule,
  WalletConnectTargetChain,
} from '@creit.tech/stellar-wallets-kit/modules/wallet-connect';

let isInitialized = false;

/**
 * Inicializa el Stellar Wallets Kit configurado con Freighter, xBull, Albedo, LOBSTR y WalletConnect (para Decaf y wallets móviles) en TESTNET
 */
export function initWalletKit(): void {
  if (isInitialized) return;

  const modules: ModuleInterface[] = [
    new FreighterModule(),
    new xBullModule(),
    new AlbedoModule(),
    new LobstrModule(), // Soporte directo para extensión LOBSTR
  ];

  // Decaf y LOBSTR Mobile se conectan mediante el estándar WalletConnect
  // Si existe un Project ID de WalletConnect (Reown), lo inicializamos
  const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

  if (walletConnectProjectId) {
    modules.push(
      new WalletConnectModule({
        projectId: walletConnectProjectId,
        metadata: {
          name: 'Drawly',
          description: 'Rifas verificables en Stellar Testnet',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://drawly.app',
          icons: ['https://stellar.org/favicon.ico'],
        },
        allowedChains: [WalletConnectTargetChain.TESTNET],
      })
    );
  }

  StellarWalletsKit.init({
    modules,
    network: Networks.TESTNET,
  });

  isInitialized = true;
}

/**
 * Abre el modal oficial para seleccionar wallet (Freighter, xBull, Albedo, LOBSTR, WalletConnect/Decaf) y obtener la dirección
 */
export async function openWalletModal(): Promise<string> {
  initWalletKit();
  const response = await StellarWalletsKit.authModal();
  return response.address;
}

/**
 * Desconecta la wallet activa
 */
export async function disconnectWallet(): Promise<void> {
  initWalletKit();
  await StellarWalletsKit.disconnect();
}

/**
 * Obtiene la dirección guardada en memoria del kit
 */
export async function getActiveAddress(): Promise<string | null> {
  try {
    initWalletKit();
    const { address } = await StellarWalletsKit.getAddress();
    return address || null;
  } catch {
    return null;
  }
}
