import {
  AccountRequiresMemoError,
  Asset,
  BASE_FEE,
  type Horizon,
  Memo,
  NotFoundError,
  Operation,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk'
import { type MateAsset, matchAsset, toSdkAsset } from '@/lib/assets'
import { horizon, NETWORK_PASSPHRASE } from '@/lib/config'

/** Un memo de texto admite hasta 28 bytes (docs de Stellar, vía Raven). */
export const MEMO_MAX_BYTES = 28

/** Crear una cuenta nueva exige mandarle al menos 1 XLM (2 reservas base). */
export const MIN_NEW_ACCOUNT_XLM = 1

/**
 * Margen sobre la cotización al convertir XLM en otro activo: el precio puede
 * moverse entre que se cotiza y se firma. Si se mueve más, la red rechaza el
 * envío en vez de cobrar de más.
 */
export const SLIPPAGE = 0.01

/**
 * Cuenta de demostración en Testnet para probar la app sin tener a quién
 * enviarle. Ya tiene habilitado USDC.
 */
export const DEMO_RECIPIENT =
  'GAM4VM3ZUVFRSOFYAO7ML62PE64WQVPV2ZCIZVZWILFX6RJ3KF5E55WZ'

/**
 * Fondo yerbatero: cuenta de demostración en Testnet que recibe el aporte
 * opcional de cada mate. En producción sería la cuenta de una cooperativa de
 * productores de Misiones; acá es una cuenta de prueba, sin fondos reales.
 */
export const YERBA_FUND =
  'GCSOWPXTFS2EAREZJHJUQQMJ53ZWZBJBNJOGZJK4MEQEIZWMSSBXLJ3U'

/** Parte de cada mate que se suma como aporte al fondo yerbatero. */
export const YERBA_SHARE = 0.05

/** Redondea a los 7 decimales con los que trabaja Stellar. */
const round7 = (value: number) => Math.round(value * 1e7) / 1e7

/** Aporte que corresponde a un monto, con la precisión de Stellar. */
export const yerbaShare = (amount: number) => round7(amount * YERBA_SHARE)

export type MatePlan = {
  /** Aporte al fondo; 0 si no se pidió o si el destino ya es el fondo. */
  share: number
  /** Lo que queda del activo para pagar el aporte, después del mate. */
  heldForShare: number
  /** El mate se paga con XLM y la red lo convierte. */
  mateConverts: boolean
  /** El aporte se paga con XLM y la red lo convierte. */
  shareConverts: boolean
  /** Cuánto del activo hay que conseguir a cambio de XLM, en total. */
  toConvert: number
}

/**
 * Decide cómo se reparte un envío entre el mate y el aporte, y qué parte hay
 * que convertir desde XLM. El formulario y la transacción usan esta misma
 * cuenta, así lo que se muestra coincide con lo que se firma.
 */
export function planMate(params: {
  to: string
  asset: MateAsset
  amount: number
  /** Cuánto de ese activo tiene quien envía. */
  held: number
  withYerba: boolean
}): MatePlan {
  const { amount, held } = params
  const share =
    params.withYerba && params.to !== YERBA_FUND ? yerbaShare(amount) : 0
  if (params.asset.issuer === null) {
    return {
      share,
      heldForShare: held,
      mateConverts: false,
      shareConverts: false,
      toConvert: 0,
    }
  }
  const mateConverts = held < amount
  // Lo que ya se usó para el mate no cuenta para el aporte.
  const heldForShare = mateConverts ? held : round7(held - amount)
  const shareConverts = share > 0 && heldForShare < share
  return {
    share,
    heldForShare,
    mateConverts,
    shareConverts,
    toConvert: round7(
      (mateConverts ? amount : 0) + (shareConverts ? share : 0),
    ),
  }
}

export const memoBytes = (text: string) => new TextEncoder().encode(text).length

export const isValidAddress = (address: string) =>
  StrKey.isValidEd25519PublicKey(address)

/**
 * Convierte lo que escribió la persona en un monto. Acepta coma o punto y
 * hasta 7 decimales, que es la precisión de Stellar. Devuelve null si el
 * texto no es un monto válido mayor a cero.
 */
export function parseAmount(text: string): number | null {
  const clean = text.trim()
  if (!/^\d+([.,]\d{1,7})?$/.test(clean)) return null
  const amount = Number(clean.replace(',', '.'))
  return amount > 0 ? amount : null
}

/** Stellar trabaja con 7 decimales. */
const toStellarAmount = (amount: number) => amount.toFixed(7)

/** Error con un mensaje ya pensado para mostrarle a la persona. */
export class MateError extends Error {}

async function loadAccountOrNull(
  address: string,
): Promise<Horizon.AccountResponse | null> {
  try {
    return await horizon.loadAccount(address)
  } catch (error) {
    if (error instanceof NotFoundError) return null
    throw error
  }
}

/** Saldo de un activo en una cuenta, o null si no lo tiene habilitado. */
function balanceOf(
  account: Horizon.AccountResponse,
  asset: MateAsset,
): number | null {
  const line = account.balances.find(
    (balance) => matchAsset(balance)?.code === asset.code,
  )
  return line ? Number(line.balance) : null
}

export type Quote = {
  /** XLM que cuesta hoy entregar el monto pedido. */
  cost: number
  /** Activos intermedios por los que pasa la conversión. */
  path: Asset[]
}

/**
 * Cotiza cuántos XLM hacen falta para que el destino reciba `amount` de otro
 * activo, usando el exchange que Stellar trae incorporado. Devuelve null si
 * hoy nadie ofrece ese cambio.
 */
export async function quoteInXlm(
  asset: MateAsset,
  amount: number,
): Promise<Quote | null> {
  const { records } = await horizon
    .strictReceivePaths(
      [Asset.native()],
      toSdkAsset(asset),
      toStellarAmount(amount),
    )
    .call()
  if (records.length === 0) return null

  const best = records.reduce((a, b) =>
    Number(b.source_amount) < Number(a.source_amount) ? b : a,
  )
  return {
    cost: Number(best.source_amount),
    path: best.path.map((step) =>
      step.asset_type === 'native'
        ? Asset.native()
        : new Asset(step.asset_code, step.asset_issuer),
    ),
  }
}

/** Tope de XLM a gastar en una conversión: la cotización más el margen. */
export const maxCost = (cost: number) => cost * (1 + SLIPPAGE)

type MateParams = {
  from: string
  to: string
  asset: MateAsset
  /** Monto que tiene que recibir la otra persona, en ese activo. */
  amount: number
  /** Mensaje opcional, viaja como memo de texto. */
  message: string
  /** Suma el aporte al fondo yerbatero en la misma transacción. */
  withYerba?: boolean
}

type Delivery = {
  to: string
  asset: MateAsset
  amount: number
  /** Cuánto de ese activo tiene quien envía para pagar esta entrega. */
  held: number
}

/**
 * Elige la operación de Stellar que corresponde a cada caso:
 * - XLM a una cuenta que existe: un pago.
 * - XLM a una cuenta que no existe: se crea la cuenta con ese monto.
 * - Otro activo que quien envía ya tiene: un pago en ese activo.
 * - Otro activo que quien envía no tiene: paga con XLM y la red lo convierte
 *   en el camino (path payment), todo en una sola operación.
 */
async function chooseOperation(
  destination: Horizon.AccountResponse | null,
  { to, asset, amount, held }: Delivery,
) {
  const value = toStellarAmount(amount)

  if (asset.issuer === null) {
    if (destination) {
      return Operation.payment({
        destination: to,
        asset: Asset.native(),
        amount: value,
      })
    }
    if (amount < MIN_NEW_ACCOUNT_XLM) {
      throw new MateError(
        `Esa cuenta todavía no existe en la red. Para crearla tenés que enviarle al menos ${MIN_NEW_ACCOUNT_XLM} XLM.`,
      )
    }
    return Operation.createAccount({ destination: to, startingBalance: value })
  }

  // Para recibir un activo que no es XLM, la cuenta tiene que existir y
  // haberlo habilitado antes (trustline). Si no, el envío rebota.
  if (!destination) {
    throw new MateError(
      `Esa cuenta todavía no existe en la red. Primero convidale XLM para activarla; después va a poder habilitar ${asset.code}.`,
    )
  }
  if (balanceOf(destination, asset) === null) {
    throw new MateError(
      `Esa cuenta todavía no habilitó ${asset.code}. Tiene que aceptarlo en su wallet antes de poder recibirlo.`,
    )
  }

  const sdkAsset = toSdkAsset(asset)
  if (held >= amount) {
    return Operation.payment({
      destination: to,
      asset: sdkAsset,
      amount: value,
    })
  }

  const quote = await quoteInXlm(asset, amount)
  if (!quote) {
    throw new MateError(
      `No te alcanzan los ${asset.code} y en este momento nadie lo cambia por XLM en la red.`,
    )
  }
  return Operation.pathPaymentStrictReceive({
    sendAsset: Asset.native(),
    sendMax: toStellarAmount(maxCost(quote.cost)),
    destination: to,
    destAsset: sdkAsset,
    destAmount: value,
    path: quote.path,
  })
}

/** Arma la transacción sin firmar y la devuelve como XDR en base64. */
export async function buildMateTx(params: MateParams): Promise<string> {
  const { to, asset, amount } = params
  const withYerba = Boolean(params.withYerba) && to !== YERBA_FUND

  const [source, destination, fund] = await Promise.all([
    horizon.loadAccount(params.from),
    loadAccountOrNull(to),
    withYerba ? loadAccountOrNull(YERBA_FUND) : null,
  ])
  const held = balanceOf(source, asset) ?? 0
  const { share, heldForShare } = planMate({
    to,
    asset,
    amount,
    held,
    withYerba,
  })

  // La comisión es por operación: BASE_FEE se cobra una vez por cada una.
  const builder = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  }).setTimeout(180)

  builder.addOperation(
    await chooseOperation(destination, { to, asset, amount, held }),
  )
  // El aporte viaja en la misma transacción: o se hacen los dos envíos o no
  // se hace ninguno.
  if (share > 0) {
    builder.addOperation(
      await chooseOperation(fund, {
        to: YERBA_FUND,
        asset,
        amount: share,
        held: heldForShare,
      }),
    )
  }

  const memo = params.message.trim()
  if (memo) builder.addMemo(Memo.text(memo))

  return builder.build().toXDR()
}

/**
 * Arma la transacción que habilita un activo en la cuenta (trustline). Cada
 * activo habilitado suma media reserva: 0,5 XLM que quedan inmovilizados.
 */
export async function buildTrustTx(
  address: string,
  asset: MateAsset,
): Promise<string> {
  const source = await horizon.loadAccount(address)
  return new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset: toSdkAsset(asset) }))
    .setTimeout(180)
    .build()
    .toXDR()
}

/** Envía la transacción ya firmada y devuelve su hash. */
export async function submitMateTx(signedXdr: string): Promise<string> {
  const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  try {
    const response = await horizon.submitTransaction(transaction)
    return response.hash
  } catch (error) {
    // Si la red la rechazó, se relanza el error tal cual: el motivo se
    // traduce después con horizonErrorMessage.
    if (horizonErrorMessage(error)) throw error
    // El SDK revisa antes de enviar si el destino exige memo: acá no salió nada.
    if (error instanceof AccountRequiresMemoError) {
      throw new MateError(
        'Esa cuenta exige un mensaje. Escribí uno y probá de nuevo.',
      )
    }
    // Si se cortó la conexión no sabemos si llegó: se busca por su hash para
    // no invitar a reintentar un envío que quizás ya se hizo.
    const hash = Array.from(transaction.hash(), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')
    let successful: boolean
    try {
      const record = await horizon.transactions().transaction(hash).call()
      successful = record.successful
    } catch {
      throw new MateError(
        'No pudimos confirmar el envío. Mirá tus últimos mates antes de reintentar.',
      )
    }
    // Horizon también devuelve por hash las que entraron al ledger y fallaron.
    if (!successful) {
      throw new MateError('La red rechazó la transacción. Probá de nuevo.')
    }
    return hash
  }
}

const RESULT_CODE_MESSAGES: Record<string, string> = {
  op_underfunded: 'No te alcanza el saldo para ese monto.',
  op_no_destination: 'La cuenta de destino no existe en la red.',
  op_low_reserve:
    'No te alcanzan los XLM: una parte queda como reserva de la cuenta.',
  op_already_exists: 'La cuenta de destino ya existe. Probá de nuevo.',
  op_no_trust: 'La cuenta de destino no habilitó ese activo.',
  op_not_authorized: 'El emisor no autorizó a esa cuenta a usar el activo.',
  op_line_full: 'La cuenta de destino no puede recibir más de ese activo.',
  op_too_few_offers: 'En este momento nadie cambia XLM por ese activo.',
  op_over_source_max:
    'El precio se movió mientras firmabas. Probá de nuevo para ver la cotización nueva.',
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
