import { NotFoundError } from '@stellar/stellar-sdk'
import { FRIENDBOT_URL, horizon } from '@/lib/config'

// Una reserva base son 0.5 XLM. Toda cuenta debe mantener 2 reservas (1 XLM)
// más una por cada subentrada (trustlines, ofertas, firmantes, datos).
// Fuente: docs de Stellar "Lumens > Minimum balance", consultadas con Raven.
const BASE_RESERVE_XLM = 0.5

export type AccountInfo = {
  /** false cuando la cuenta todavía no existe en la red. */
  funded: boolean
  /** Saldo total en XLM. */
  balance: number
  /** XLM bloqueados por la reserva mínima y por ofertas abiertas. */
  reserved: number
  /** Lo que realmente se puede enviar. */
  available: number
}

const UNFUNDED: AccountInfo = {
  funded: false,
  balance: 0,
  reserved: 0,
  available: 0,
}

export async function getAccountInfo(address: string): Promise<AccountInfo> {
  try {
    const account = await horizon.loadAccount(address)
    const native = account.balances.find((b) => b.asset_type === 'native')
    const balance = Number(native?.balance ?? 0)
    const sellingLiabilities = Number(native?.selling_liabilities ?? 0)
    const reserveEntries =
      2 +
      account.subentry_count +
      (account.num_sponsoring ?? 0) -
      (account.num_sponsored ?? 0)
    const reserved = reserveEntries * BASE_RESERVE_XLM + sellingLiabilities

    return {
      funded: true,
      balance,
      reserved,
      available: Math.max(0, balance - reserved),
    }
  } catch (error) {
    // Horizon responde 404 cuando la cuenta nunca recibió fondos.
    if (error instanceof NotFoundError) return UNFUNDED
    throw error
  }
}

/** Pide a Friendbot que cree la cuenta en Testnet con 10.000 XLM de prueba. */
export async function fundWithFriendbot(address: string): Promise<void> {
  const response = await fetch(
    `${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`,
  )
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

export const formatXlm = (amount: number) => xlmFormatter.format(amount)
