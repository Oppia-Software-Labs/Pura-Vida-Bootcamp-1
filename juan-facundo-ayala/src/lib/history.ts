import { HORIZON_URL } from '@/lib/config'

export type MateRecord = {
  id: string
  hash: string
  direction: 'sent' | 'received'
  /** La otra cuenta del movimiento. */
  counterparty: string
  /** Monto en XLM. */
  amount: number
  message: string
  date: Date
}

// Forma de los registros de GET /accounts/{id}/payments?join=transactions
// (referencia de Horizon consultada con Stellar Raven).
type PaymentJson = {
  id: string
  type: string
  created_at: string
  transaction_hash: string
  asset_type?: string
  from?: string
  to?: string
  amount?: string
  funder?: string
  account?: string
  starting_balance?: string
  transaction?: { memo_type?: string; memo?: string }
}

function toRecord(address: string, json: PaymentJson): MateRecord | null {
  let from: string | undefined
  let to: string | undefined
  let amount: string | undefined

  if (json.type === 'payment' && json.asset_type === 'native') {
    ;({ from, to, amount } = json)
  } else if (json.type === 'create_account') {
    from = json.funder
    to = json.account
    amount = json.starting_balance
  }
  // Se ignoran otros tipos (pagos en otros activos, path payments, etc.).
  if (!from || !to || !amount) return null

  const sent = from === address
  return {
    id: json.id,
    hash: json.transaction_hash,
    direction: sent ? 'sent' : 'received',
    counterparty: sent ? to : from,
    amount: Number(amount),
    message:
      json.transaction?.memo_type === 'text'
        ? (json.transaction.memo ?? '')
        : '',
    date: new Date(json.created_at),
  }
}

/** Últimos movimientos en XLM de la cuenta, del más nuevo al más viejo. */
export async function getRecentMates(
  address: string,
  limit = 8,
): Promise<MateRecord[]> {
  const response = await fetch(
    `${HORIZON_URL}/accounts/${address}/payments?order=desc&limit=30&join=transactions`,
  )
  // 404: la cuenta todavía no existe, así que no tiene movimientos.
  if (response.status === 404) return []
  if (!response.ok) throw new Error('Horizon no respondió.')

  const data = (await response.json()) as {
    _embedded?: { records?: PaymentJson[] }
  }
  return (data._embedded?.records ?? [])
    .map((json) => toRecord(address, json))
    .filter((record): record is MateRecord => record !== null)
    .slice(0, limit)
}
