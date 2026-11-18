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
