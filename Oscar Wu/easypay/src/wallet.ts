// REAL: conexión de wallet de Stellar (testnet) con Stellar Wallets Kit.
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'
import { KitEventType, Networks } from '@creit.tech/stellar-wallets-kit/types'
import { Horizon, StrKey } from '@stellar/stellar-sdk'

const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org'

let started = false

export function initWalletKit() {
  if (started) return
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
  })
  started = true
}

/** Abre el modal del kit, el usuario elige wallet y se devuelve su clave pública. */
export async function connectWallet(): Promise<string> {
  initWalletKit()
  const { address } = await StellarWalletsKit.authModal()
  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new Error('La wallet devolvió una dirección inválida')
  }
  return address
}

export async function disconnectWallet() {
  await StellarWalletsKit.disconnect()
}

export function onWalletDisconnect(cb: () => void) {
  initWalletKit()
  return StellarWalletsKit.on(KitEventType.DISCONNECT, cb)
}

/** Saldo de XLM en testnet (null si la cuenta aún no está fondeada). */
export async function fetchXlmBalance(address: string): Promise<string | null> {
  try {
    const account = await new Horizon.Server(HORIZON_TESTNET).loadAccount(address)
    return account.balances.find((b) => b.asset_type === 'native')?.balance ?? '0'
  } catch {
    return null
  }
}

export function shortAddress(address: string) {
  return `${address.slice(0, 5)}…${address.slice(-5)}`
}
