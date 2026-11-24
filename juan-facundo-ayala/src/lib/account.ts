import { NotFoundError } from '@stellar/stellar-sdk'
import { type AssetCode, matchAsset } from '@/lib/assets'
import { FRIENDBOT_URL, horizon } from '@/lib/config'

// Una reserva base son 0.5 XLM. Toda cuenta debe mantener 2 reservas (1 XLM)
// más una por cada subentrada (trustlines, ofertas, firmantes, datos).
// Fuente: docs de Stellar "Lumens > Minimum balance", consultadas con Raven.
export const BASE_RESERVE_XLM = 0.5

/** Margen para la comisión de red, que es de fracciones de centavo de XLM. */
export const FEE_MARGIN_XLM = 0.001

export type AccountInfo = {
  /** false cuando la cuenta todavía no existe en la red. */
  funded: boolean
  /** Saldo total en XLM. */
  balance: number
  /** XLM bloqueados por la reserva mínima y por ofertas abiertas. */
  reserved: number
  /** Lo que realmente se puede enviar. */
  available: number
  /**
   * Saldo de los otros activos que la cuenta tiene habilitados (trustlines).
   * Si un activo no figura, la cuenta todavía no puede recibirlo.
   */
  tokens: Partial<Record<AssetCode, number>>
}

const UNFUNDED: AccountInfo = {
  funded: false,
  balance: 0,
  reserved: 0,
  available: 0,
  tokens: {},
}

type ReserveInput = {
  subentries: number
  sponsoring?: number
  sponsored?: number
  /** XLM comprometidos en ofertas de venta abiertas. */
  sellingLiabilities?: number
}

/** XLM que la cuenta no puede gastar: reserva mínima más ofertas abiertas. */
export function reservedXlm({
  subentries,
  sponsoring = 0,
  sponsored = 0,
  sellingLiabilities = 0,
}: ReserveInput): number {
  const entries = 2 + subentries + sponsoring - sponsored
  return entries * BASE_RESERVE_XLM + sellingLiabilities
}

/**
 * Tope de un envío: lo disponible menos el margen de comisión, truncado a
 * dos decimales para que coincida con lo que se muestra en pantalla.
 */
export function maxSendable(info: AccountInfo | null): number {
  const available = (info?.available ?? 0) - FEE_MARGIN_XLM
  return Math.max(0, Math.floor(available * 100) / 100)
}

export async function getAccountInfo(address: string): Promise<AccountInfo> {
  try {
    const account = await horizon.loadAccount(address)
    const native = account.balances.find((b) => b.asset_type === 'native')
    const balance = Number(native?.balance ?? 0)
    const reserved = reservedXlm({
      subentries: account.subentry_count,
      sponsoring: account.num_sponsoring,
      sponsored: account.num_sponsored,
      sellingLiabilities: Number(native?.selling_liabilities ?? 0),
    })

    const tokens: AccountInfo['tokens'] = {}
    for (const line of account.balances) {
      const asset = matchAsset(line)
      if (asset && asset.issuer !== null) {
        tokens[asset.code] = Number(line.balance)
      }
    }

    return {
      funded: true,
      balance,
      reserved,
      available: Math.max(0, balance - reserved),
      tokens,
    }
  } catch (error) {
    // Horizon responde 404 cuando la cuenta nunca recibió fondos.
    if (error instanceof NotFoundError) return UNFUNDED
    throw error
  }
}

/** Pide a Friendbot que cree la cuenta en Testnet con 10.000 XLM de prueba. */
export async function fundWithFriendbot(address: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(
      `${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`,
    )
  } catch {
    throw new Error(
      'No pudimos contactar a Friendbot. Revisá tu conexión y probá de nuevo.',
    )
  }
  if (response.ok) return
  if (response.status === 429) {
    throw new Error(
      'Friendbot está saturado. Esperá un minuto y probá de nuevo.',
    )
  }
  throw new Error('Friendbot no pudo fondear la cuenta. Probá de nuevo.')
}

const xlmFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const exactXlmFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 7,
})

/** Para saldos: siempre dos decimales. */
export const formatXlm = (amount: number) => xlmFormatter.format(amount)

/** Para montos de un envío: no redondea, así 0,001 no se ve como 0,00. */
export const formatXlmExact = (amount: number) =>
  exactXlmFormatter.format(amount)
