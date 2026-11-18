// DEMO / MOCK: la "cola offline" es solo estado en memoria de React.
// No se guarda en IndexedDB, no se firma nada y no se envía nada a Stellar.

export type Currency = 'CRC' | 'USDC'
export type PaymentStatus = 'pending' | 'synced'

export interface Payment {
  id: string
  amount: number
  currency: Currency
  status: PaymentStatus
  createdAt: number
}

export function createPayment(amount: number, currency: Currency): Payment {
  return {
    id: crypto.randomUUID(),
    amount,
    currency,
    status: 'pending',
    createdAt: Date.now(),
  }
}

export function formatAmount(amount: number, currency: Currency) {
  return currency === 'CRC'
    ? `₡${amount.toLocaleString('es-CR')}`
    : `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC`
}
