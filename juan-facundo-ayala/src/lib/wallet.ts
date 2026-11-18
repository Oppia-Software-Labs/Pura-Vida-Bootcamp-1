import {
  KitEventType,
  Networks,
  StellarWalletsKit,
} from '@creit.tech/stellar-wallets-kit'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'
import { NETWORK_PASSPHRASE } from '@/lib/config'

// Stellar Wallets Kit v2 es un singleton estático: se inicializa una sola vez
// y después se usan sus métodos estáticos (patrón sacado de Stellar Raven).
// defaultModules() carga las wallets que no necesitan configuración extra
// (Varial -ex Freighter-, xBull, Albedo, Lobstr, Rabet, Hana, entre otras).
StellarWalletsKit.init({
  modules: defaultModules(),
  network: Networks.TESTNET,
})

/** Abre el selector de wallets y devuelve la dirección elegida. */
export async function connectWallet(): Promise<string> {
  const { address } = await StellarWalletsKit.authModal()
  return address
}

export async function disconnectWallet(): Promise<void> {
  await StellarWalletsKit.disconnect()
}

/** Pide a la wallet conectada que firme la transacción (XDR en base64). */
export async function signWithWallet(
  xdr: string,
  address: string,
): Promise<string> {
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address,
  })
  return signedTxXdr
}

/**
 * Devuelve true/false si la wallet informa en qué red está, o null si no lo
 * informa (no todas las wallets implementan getNetwork).
 */
export async function isWalletOnTestnet(): Promise<boolean | null> {
  try {
    const { networkPassphrase } = await StellarWalletsKit.getNetwork()
    return networkPassphrase === NETWORK_PASSPHRASE
  } catch {
    return null
  }
}

/** Avisa cuando cambia la cuenta activa (también al restaurar la sesión). */
export function onWalletChange(
  callback: (address: string | null) => void,
): () => void {
  const offState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) =>
    callback(event.payload.address ?? null),
  )
  const offDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () =>
    callback(null),
  )
  return () => {
    offState()
    offDisconnect()
  }
}

/** Las wallets rechazan con objetos { code, message } en vez de Error. */
export function walletErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : ''
  // Cerrar el selector sin elegir wallet no es un error para mostrar.
  if (/closed the modal/i.test(message)) return ''
  if (/reject|denied|declin|cancel/i.test(message)) {
    return 'Cancelaste la operación en la wallet.'
  }
  // La sesión se restauró pero la wallet ya no está disponible para firmar.
  if (/set the wallet first|no active address/i.test(message)) {
    return 'Se perdió la conexión con tu wallet. Desconectá y volvé a conectarla.'
  }
  return message || 'La wallet no respondió. Probá de nuevo.'
}
