import { Horizon } from '@stellar/stellar-sdk'

export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const server = new Horizon.Server(HORIZON_URL)

// Devuelve el saldo de XLM como texto, o null si la cuenta todavía no existe en la red
// (en Stellar una cuenta existe recién cuando recibe su primer depósito).
export async function getXlmBalance(address) {
  try {
    const account = await server.loadAccount(address)
    const native = account.balances.find((b) => b.asset_type === 'native')
    return native ? native.balance : '0'
  } catch (err) {
    if (err?.response?.status === 404) return null
    throw err
  }
}

export function formatXlm(value) {
  return Number(value).toLocaleString('es-CR', { maximumFractionDigits: 7 })
}

// Friendbot es el servicio de la testnet que regala 10.000 XLM de prueba para crear o fondear una cuenta.
export async function fundWithFriendbot(address) {
  const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Friendbot no pudo fondear la cuenta (puede que ya tenga fondos).')
  }
  return res.json()
}
