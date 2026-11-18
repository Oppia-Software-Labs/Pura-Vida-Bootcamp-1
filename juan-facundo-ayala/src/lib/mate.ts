import {
  Asset,
  BASE_FEE,
  Memo,
  NotFoundError,
  Operation,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk'
import { horizon, NETWORK_PASSPHRASE } from '@/lib/config'

/** Un memo de texto admite hasta 28 bytes (docs de Stellar, vía Raven). */
export const MEMO_MAX_BYTES = 28

/** Crear una cuenta nueva exige mandarle al menos 1 XLM (2 reservas base). */
export const MIN_NEW_ACCOUNT_XLM = 1

/** Margen para la comisión de red, que es de fracciones de centavo de XLM. */
export const FEE_MARGIN_XLM = 0.001

/**
 * Cuenta de demostración en Testnet para probar la app sin tener a quién
 * enviarle. Nadie guarda su clave secreta.
 */
export const DEMO_RECIPIENT =
  'GCNSDFBITP4K2EGOVKMASXXMOEK3CZQ4EBOH2B4M4XRETTTOCRJ2EIMO'

export const memoBytes = (text: string) => new TextEncoder().encode(text).length

export const isValidAddress = (address: string) =>
  StrKey.isValidEd25519PublicKey(address)

async function accountExists(address: string): Promise<boolean> {
  try {
    await horizon.loadAccount(address)
    return true
  } catch (error) {
    if (error instanceof NotFoundError) return false
    throw error
  }
}

type MateParams = {
  from: string
  to: string
  /** Monto en XLM. */
  amount: number
  /** Mensaje opcional, viaja como memo de texto. */
  message: string
}

/** Arma la transacción sin firmar y la devuelve como XDR en base64. */
export async function buildMateTx({
  from,
  to,
  amount,
  message,
}: MateParams): Promise<string> {
  const [source, destinationExists] = await Promise.all([
    horizon.loadAccount(from),
    accountExists(to),
  ])

  if (!destinationExists && amount < MIN_NEW_ACCOUNT_XLM) {
    throw new Error(
      `Esa cuenta todavía no existe en la red. Para crearla tenés que enviarle al menos ${MIN_NEW_ACCOUNT_XLM} XLM.`,
    )
  }

  // Stellar trabaja con 7 decimales.
  const value = amount.toFixed(7)

  // Si el destino no existe, un pago falla: hay que crear la cuenta.
  const operation = destinationExists
    ? Operation.payment({
        destination: to,
        asset: Asset.native(),
        amount: value,
      })
    : Operation.createAccount({ destination: to, startingBalance: value })

  const builder = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(180)

  const memo = message.trim()
  if (memo) builder.addMemo(Memo.text(memo))

  return builder.build().toXDR()
}

/** Envía la transacción ya firmada y devuelve su hash. */
export async function submitMateTx(signedXdr: string): Promise<string> {
  const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  const response = await horizon.submitTransaction(transaction)
  return response.hash
}

const RESULT_CODE_MESSAGES: Record<string, string> = {
  op_underfunded: 'No te alcanza el saldo para ese monto.',
  op_no_destination: 'La cuenta de destino no existe en la red.',
  op_low_reserve: 'El monto no alcanza para crear la cuenta de destino.',
  op_already_exists: 'La cuenta de destino ya existe. Probá de nuevo.',
  tx_insufficient_balance: 'No te alcanza el saldo para pagar la comisión.',
  tx_bad_seq: 'La transacción quedó desactualizada. Probá de nuevo.',
  tx_too_late: 'La transacción venció antes de enviarse. Probá de nuevo.',
  tx_bad_auth: 'La firma no corresponde a esta cuenta o a esta red.',
}

type HorizonErrorShape = {
  response?: {
    data?: {
      extras?: {
        result_codes?: { transaction?: string; operations?: string[] }
      }
    }
  }
}

/** Traduce un rechazo de Horizon a un mensaje entendible, o '' si no aplica. */
export function horizonErrorMessage(error: unknown): string {
  const codes = (error as HorizonErrorShape)?.response?.data?.extras
    ?.result_codes
  if (!codes) return ''
  const all = [...(codes.operations ?? []), codes.transaction ?? '']
  for (const code of all) {
    if (RESULT_CODE_MESSAGES[code]) return RESULT_CODE_MESSAGES[code]
  }
  return 'La red rechazó la transacción. Probá de nuevo.'
}
