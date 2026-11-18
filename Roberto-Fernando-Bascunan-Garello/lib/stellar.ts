/**
 * Utilidades de Stellar compartidas por cliente y servidor.
 * El envío real de transacciones a Stellar Testnet vive en app/actions/stellar.ts.
 */

export const STELLAR_RED = "Stellar Testnet"
export const STELLAR_TOKEN = "StellarPoints"
const EXPLORER_BASE = "https://stellar.expert/explorer/testnet"

export type ResultadoStellar = { ok: true; txHash: string } | { ok: false; error: string }

export function generarHashFalso(random: () => number = Math.random): string {
  let hash = ""
  for (let i = 0; i < 64; i++) hash += Math.floor(random() * 16).toString(16)
  return hash
}

export function generarClavePublicaFalsa(random: () => number = Math.random): string {
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let clave = "G"
  for (let i = 0; i < 55; i++) clave += alfabeto[Math.floor(random() * alfabeto.length)]
  return clave
}

export function urlTransaccion(txHash: string) {
  return `${EXPLORER_BASE}/tx/${txHash}`
}

export function urlCuenta(clavePublica: string) {
  return `${EXPLORER_BASE}/account/${clavePublica}`
}

export function abreviarHash(hash: string, inicio = 4, fin = 4) {
  if (hash.length <= inicio + fin) return hash
  return `${hash.slice(0, inicio)}…${hash.slice(-fin)}`
}
