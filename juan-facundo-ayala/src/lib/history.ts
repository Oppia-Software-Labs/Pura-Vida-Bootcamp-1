import { type AssetCode, matchAsset } from '@/lib/assets'
import { HORIZON_URL } from '@/lib/config'

export type MateRecord = {
  id: string
  hash: string
  direction: 'sent' | 'received'
  /** 'activation' cuando el movimiento creó la cuenta de destino. */
  kind: 'payment' | 'activation'
  /** La otra cuenta del movimiento. */
  counterparty: string
  /** Monto que recibió el destino, en `asset`. */
  amount: number
  asset: AssetCode
  message: string
  date: Date
}

// Forma de los registros de GET /accounts/{id}/payments?join=transactions
// (referencia de Horizon consultada con Stellar Raven).
export type PaymentJson = {
  id: string
  type: string
  created_at: string
  transaction_hash: string
  asset_type?: string
  asset_code?: string
  asset_issuer?: string
  from?: string
  to?: string
  amount?: string
  funder?: string
  account?: string
  starting_balance?: string
  transaction?: { memo_type?: string; memo?: string }
}

// Un pago directo y uno con conversión en el camino traen los mismos campos
// para lo que recibe el destino, así que se leen igual.
const PAYMENT_TYPES = [
  'payment',
  'path_payment_strict_receive',
  'path_payment_strict_send',
]

/** Convierte un registro de Horizon en un movimiento, o null si no aplica. */
export function toRecord(
  address: string,
  json: PaymentJson,
): MateRecord | null {
  let from: string | undefined
  let to: string | undefined
  let amount: string | undefined
  let asset: AssetCode | undefined
  let kind: MateRecord['kind'] = 'payment'

  if (PAYMENT_TYPES.includes(json.type)) {
    ;({ from, to, amount } = json)
    // Solo se muestran los activos conocidos, validando también el emisor.
    asset = matchAsset(json)?.code
  } else if (json.type === 'create_account') {
    from = json.funder
    to = json.account
    amount = json.starting_balance
    asset = 'XLM'
    kind = 'activation'
  }
  if (!from || !to || !amount || !asset) return null

  const sent = from === address
  return {
    id: json.id,
    hash: json.transaction_hash,
    direction: sent ? 'sent' : 'received',
    kind,
    counterparty: sent ? to : from,
    amount: Number(amount),
    asset,
    message:
      json.transaction?.memo_type === 'text'
        ? (json.transaction.memo ?? '')
        : '',
    date: new Date(json.created_at),
  }
}

// Se piden más registros de los que se muestran porque después se descartan
// los que no son movimientos de los activos conocidos.
const FETCH_LIMIT = 30

/** Últimos movimientos de la cuenta, del más nuevo al más viejo. */
export async function getRecentMates(
  address: string,
  limit = 8,
): Promise<MateRecord[]> {
  const response = await fetch(
    `${HORIZON_URL}/accounts/${address}/payments?order=desc&limit=${FETCH_LIMIT}&join=transactions`,
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
