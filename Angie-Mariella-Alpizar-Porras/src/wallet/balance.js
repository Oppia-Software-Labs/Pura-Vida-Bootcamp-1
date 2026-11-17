import { Horizon, NotFoundError, StrKey } from '@stellar/stellar-sdk'

export const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org'

const horizon = new Horizon.Server(HORIZON_TESTNET)

export function formatNativeBalance(balance, lang) {
  if (!/^\d{1,20}(\.\d{1,7})?$/.test(balance)) return null
  const [whole, fraction = ''] = balance.split('.')
  const digits = fraction.replace(/0+$/, '')
  const locale = lang === 'es' ? 'es-CR' : 'en-US'
  const grouped = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(BigInt(whole))
  const decimal =
    new Intl.NumberFormat(locale).formatToParts(1.1).find((part) => part.type === 'decimal')?.value || '.'
  const fractionText = digits ? `${decimal}${digits}` : ''
  return { whole: grouped, fraction: fractionText, text: `${grouped}${fractionText}` }
}

function isMissingAccount(error) {
  return error instanceof NotFoundError || error?.response?.status === 404
}

export async function loadNativeBalance(address, server = horizon) {
  if (!StrKey.isValidEd25519PublicKey(address)) {
    return { status: 'invalid', amount: '' }
  }

  try {
    const account = await server.loadAccount(address)
    const native = account.balances.find((line) => line.asset_type === 'native')
    if (!native || !/^\d+(\.\d+)?$/.test(native.balance)) {
      return { status: 'error', amount: '' }
    }
    return { status: 'ready', amount: native.balance }
  } catch (error) {
    if (isMissingAccount(error)) return { status: 'unfunded', amount: '' }
    return { status: 'error', amount: '' }
  }
}
