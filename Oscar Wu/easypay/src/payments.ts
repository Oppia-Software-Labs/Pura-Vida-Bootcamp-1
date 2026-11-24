// DEMO / MOCK: la lista de cobros es solo estado en memoria de React.
// No se guarda en IndexedDB y nada se envía a Stellar desde la lista.
// El QR de cobro sí genera un enlace de pago Stellar válido (SEP-7) para XLM en testnet.

import type { CartItem } from './products'

export type Currency = 'CRC' | 'USDC'
/** pending = guardado sin conexión, por sincronizar · synced = confirmado en la red */
export type PaymentStatus = 'pending' | 'synced'
/** qr = el cliente pagó escaneando el QR · offline = cobro guardado sin conexión */
export type PaymentVia = 'qr' | 'offline'

export interface Payment {
  id: string
  ref: string
  amount: number
  currency: Currency
  status: PaymentStatus
  via: PaymentVia
  createdAt: number
  items?: CartItem[]
}

// Tasas de DEMOSTRACIÓN (no son precios reales).
export const DEMO_RATES = { USDC_CRC: 520, XLM_USD: 0.12 }

export function newRef() {
  return 'EP' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

export function createPayment(amount: number, currency: Currency, via: PaymentVia, ref = newRef(), items?: CartItem[]): Payment {
  return {
    id: crypto.randomUUID(),
    ref,
    amount,
    currency,
    status: via === 'qr' ? 'synced' : 'pending',
    via,
    createdAt: Date.now(),
    items,
  }
}

export function formatAmount(amount: number, currency: Currency) {
  return currency === 'CRC'
    ? `₡${amount.toLocaleString('es-CR')}`
    : `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC`
}

export function toCrc(amount: number, currency: Currency) {
  return currency === 'CRC' ? amount : amount * DEMO_RATES.USDC_CRC
}

/** XLM equivalente (tasa de demo) que se pide en el QR. */
export function toXlm(amount: number, currency: Currency) {
  const usd = currency === 'USDC' ? amount : amount / DEMO_RATES.USDC_CRC
  return Math.max(0.0000001, usd / DEMO_RATES.XLM_USD)
}

/** Enlace de pago SEP-7: lo entienden las wallets de Stellar al escanear el QR. */
export function stellarPayUri(destination: string, xlm: number, ref: string) {
  const params = new URLSearchParams({
    destination,
    amount: xlm.toFixed(7),
    memo: ref,
    memo_type: 'MEMO_TEXT',
    msg: 'Pago EasyPay',
  })
  return `web+stellar:pay?${params.toString()}`
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
}

export function paymentsToCsv(payments: Payment[]) {
  const rows = payments.map((p) =>
    [p.ref, new Date(p.createdAt).toISOString(), p.amount, p.currency, p.via, p.status].join(','),
  )
  return ['referencia,fecha,monto,moneda,origen,estado', ...rows].join('\n')
}
