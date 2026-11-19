import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk'

export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const server = new Horizon.Server(HORIZON_URL)

// Devuelve el saldo de XLM como texto, o null si la cuenta todavía no existe en la red
// (en Stellar una cuenta existe recién cuando recibe su primer depósito).
export async function getXlmBalance(address) {
  try {
    const account = await server.loadAccount(address)
    const native = account.balances.find((b) => b.asset_type === 'native')
    return native ? native.balance : '0'
  } catch (err) {
    if (err?.response?.status === 404) return null
    throw err
  }
}

export function formatXlm(value) {
  return Number(value).toLocaleString('es-CR', { maximumFractionDigits: 7 })
}

// Friendbot es el servicio de la testnet que regala 10.000 XLM de prueba para crear o fondear una cuenta.
export async function fundWithFriendbot(address) {
  const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Friendbot no pudo fondear la cuenta (puede que ya tenga fondos).')
  }
  return res.json()
}

export const NETWORK_PASSPHRASE = Networks.TESTNET

export function txExplorerUrl(hash) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`
}

// Arma un pago de XLM, lo firma la wallet del usuario y lo envía a Horizon.
// Si la cuenta destino todavía no existe, se usa createAccount (mínimo 1 XLM) en vez de payment.
export async function sendXlm({ from, to, amount, memo, sign }) {
  if (!StrKey.isValidEd25519PublicKey(to)) throw new Error('La dirección destino no es válida (debe empezar con G).')
  if (to === from) throw new Error('No puedes enviarte XLM a tu misma cuenta.')
  const value = Number(amount)
  if (!(value > 0)) throw new Error('El monto debe ser mayor que 0.')

  const source = await server.loadAccount(from)
  const destinationExists = (await getXlmBalance(to)) !== null
  if (!destinationExists && value < 1) {
    throw new Error('La cuenta destino no existe todavía: el primer envío tiene que ser de al menos 1 XLM.')
  }

  const op = destinationExists
    ? Operation.payment({ destination: to, asset: Asset.native(), amount: value.toFixed(7) })
    : Operation.createAccount({ destination: to, startingBalance: value.toFixed(7) })

  let builder = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(op)
    .setTimeout(180)
  if (memo) builder = builder.addMemo(Memo.text(memo.slice(0, 28)))
  const tx = builder.build()

  const signedXdr = await sign(tx.toXDR())
  const signed = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  try {
    const result = await server.submitTransaction(signed)
    return result.hash
  } catch (err) {
    throw new Error(friendlyError(err?.response?.data?.extras?.result_codes) || err.message)
  }
}

// Mensajes claros para los errores comunes que lista el checklist de Stellar Raven.
const ERRORS = {
  op_underfunded: 'No tienes saldo suficiente para ese monto (recuerda que la cuenta debe guardar una reserva mínima de XLM).',
  tx_insufficient_balance: 'No tienes saldo suficiente para pagar el monto y la comisión.',
  op_low_reserve: 'El monto no alcanza para la reserva mínima de la cuenta destino.',
  tx_bad_seq: 'La transacción quedó desactualizada. Intenta de nuevo.',
  tx_too_late: 'La transacción expiró antes de enviarse. Intenta de nuevo.',
  op_no_destination: 'La cuenta destino no existe.',
}

function friendlyError(codes) {
  if (!codes) return null
  const all = [codes.transaction, ...(codes.operations || [])]
  const known = all.find((c) => ERRORS[c])
  return known ? ERRORS[known] : `Horizon rechazó la transacción (${all.filter(Boolean).join(', ')}).`
}
