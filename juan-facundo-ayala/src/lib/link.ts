import { type AssetCode, getAsset } from '@/lib/assets'
import {
  isValidAddress,
  MEMO_MAX_BYTES,
  memoBytes,
  parseAmount,
} from '@/lib/mate'

/** Datos que puede traer un link para pedir un mate. */
export type MateLink = {
  to: string
  amount: string
  asset: AssetCode
  message: string
}

/**
 * Arma el link para que otra persona te convide: abre la app con tu
 * dirección ya cargada en el formulario.
 */
export function buildMateLink(baseUrl: string, to: string): string {
  const url = new URL(baseUrl)
  url.search = new URLSearchParams({ para: to }).toString()
  url.hash = ''
  return url.toString()
}

/**
 * Lee los datos de un link (?para=&monto=&activo=&mensaje=). Todo lo que no sea
 * válido se descarta: un link nunca puede cargar un dato roto en el
 * formulario. Devuelve null si no trae un destinatario válido.
 */
export function parseMateLink(search: string): MateLink | null {
  const params = new URLSearchParams(search)
  const to = (params.get('para') ?? '').trim()
  if (!isValidAddress(to)) return null

  const amount = (params.get('monto') ?? '').trim()
  const message = (params.get('mensaje') ?? '').trim()
  return {
    to,
    asset: getAsset((params.get('activo') ?? '').toUpperCase())?.code ?? 'XLM',
    amount: parseAmount(amount) === null ? '' : amount,
    message: memoBytes(message) <= MEMO_MAX_BYTES ? message : '',
  }
}
