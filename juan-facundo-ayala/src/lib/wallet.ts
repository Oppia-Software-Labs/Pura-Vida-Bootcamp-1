import {
  KitEventType,
  Networks,
  StellarWalletsKit,
} from '@creit.tech/stellar-wallets-kit'
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo'
import { HanaModule } from '@creit.tech/stellar-wallets-kit/modules/hana'
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr'
import { RabetModule } from '@creit.tech/stellar-wallets-kit/modules/rabet'
import { VarialModule } from '@creit.tech/stellar-wallets-kit/modules/varial'
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull'
import { NETWORK_PASSPHRASE } from '@/lib/config'

// Stellar Wallets Kit v2 es un singleton estático: se inicializa una sola vez
// y después se usan sus métodos estáticos (patrón sacado de Stellar Raven).
// En vez de cargar todas las wallets que trae el kit, se eligen seis de las
// que la documentación oficial de Stellar lista como compatibles. Varial es el nuevo nombre de Freighter, la wallet de SDF.
StellarWalletsKit.init({
  modules: [
    new VarialModule(),
    new xBullModule(),
    new AlbedoModule(),
    new LobstrModule(),
    new HanaModule(),
    new RabetModule(),
  ],
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
  if (/network error|failed to fetch|load failed|timeout/i.test(message)) {
    return 'No hay conexión con la red de Stellar. Revisá tu internet y probá de nuevo.'
  }
  return message || 'La wallet no respondió. Probá de nuevo.'
}
