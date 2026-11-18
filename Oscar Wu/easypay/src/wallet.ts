// REAL: conexión de wallet de Stellar (testnet) con Stellar Wallets Kit.
// El selector de wallets es propio (WalletModal.tsx); el kit solo aporta la lista y la conexión.
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'
import { KitEventType, Networks, type ISupportedWallet } from '@creit.tech/stellar-wallets-kit/types'
import { Horizon, Keypair, StrKey } from '@stellar/stellar-sdk'

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

export type WalletInfo = ISupportedWallet

/** Todas las wallets que soporta el kit (con `isAvailable` = extensión detectada). */
export async function listWallets(): Promise<WalletInfo[]> {
  initWalletKit()
  const wallets = await StellarWalletsKit.refreshSupportedWallets()
  // Las instaladas primero, luego por nombre.
  return [...wallets].sort(
    (a, b) => Number(b.isAvailable) - Number(a.isAvailable) || a.name.localeCompare(b.name),
  )
}

/** REAL: pide la dirección a la wallet elegida (la wallet muestra su propia aprobación). */
export async function connectWithWallet(id: string): Promise<string> {
  initWalletKit()
  StellarWalletsKit.setWallet(id)
  const { address } = await StellarWalletsKit.fetchAddress()
  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new Error('La wallet devolvió una dirección inválida')
  }
  return address
}

/** DEMO: genera una dirección de testnet nueva (sin fondos) para probar sin wallet instalada. */
export function createDemoAddress(): string {
  return Keypair.random().publicKey()
}

export async function disconnectWallet() {
  try {
    await StellarWalletsKit.disconnect()
  } catch {
    // En modo demo no hay wallet real que desconectar.
  }
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

/** REAL (testnet): ¿llegó a esta cuenta una transacción con este memo? Se usa para confirmar el cobro por QR. */
export async function hasPaymentWithMemo(address: string, memo: string): Promise<boolean> {
  try {
    const res = await new Horizon.Server(HORIZON_TESTNET)
      .transactions()
      .forAccount(address)
      .order('desc')
      .limit(15)
      .call()
    return res.records.some((t) => t.memo === memo)
  } catch {
    return false
  }
}
