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

/**
 * REAL (testnet): ¿llegó a esta cuenta un pago con este memo?
 * Un memo igual no basta (los memos no son únicos): se revisan las operaciones de la transacción
 * y se exige un pago en XLM nativo a esta cuenta por al menos el monto pedido (con 1 % de tolerancia).
 * Esta verificación surgió de una consulta a Stellar Raven.
 */
export async function hasPaymentWithMemo(address: string, memo: string, minXlm: number): Promise<boolean> {
  try {
    const server = new Horizon.Server(HORIZON_TESTNET)
    const txs = await server.transactions().forAccount(address).order('desc').limit(50).call()
    for (const tx of txs.records) {
      if (tx.memo_type !== 'text' || tx.memo !== memo || !tx.successful) continue
      const ops = await server.operations().forTransaction(tx.id).call()
      const paid = ops.records.some(
        (op) =>
          op.type === 'payment' &&
          op.to === address &&
          op.asset_type === 'native' &&
          Number(op.amount) >= minXlm * 0.99,
      )
      if (paid) return true
    }
    return false
  } catch {
    return false
  }
}
