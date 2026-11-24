import { Networks, StrKey } from '@stellar/stellar-sdk'

const maxStroops = 9223372036854775807n
export const conceptLength = 60
export const amountError = 'Ingresá un monto válido, mayor que 0 y con hasta 7 decimales.'

export type PaymentDetails = {
  address: string
  amount: string
  concept: string
}

export function normalizeAmount(input: string) {
  const amount = input.trim().replace(',', '.').replace(/^\./, '0.')
  if (!/^\d{1,12}(?:\.\d{1,7})?$/.test(amount)) return null

  const [whole, fraction = ''] = amount.split('.')
  const stroops = BigInt(whole + fraction.padEnd(7, '0'))
  if (stroops === 0n || stroops > maxStroops) return null

  const decimals = fraction.replace(/0+$/, '')
  return decimals ? `${BigInt(whole)}.${decimals}` : String(BigInt(whole))
}

export function getPaymentUrl(details: PaymentDetails) {
  const url = new URL(window.location.href)
  const params = new URLSearchParams({ destino: details.address, monto: details.amount })
  if (details.concept) params.set('concepto', details.concept)
  url.search = params.toString()
  url.hash = ''
  return url.href
}

export function readPaymentLink(search: string) {
  const params = new URLSearchParams(search)
  if (!params.has('destino') && !params.has('monto')) return { kind: 'create' } as const

  const address = params.get('destino') ?? ''
  const amount = normalizeAmount(params.get('monto') ?? '')
  const concept = params.get('concepto')?.trim() ?? ''

  if (!amount || concept.length > conceptLength || !StrKey.isValidEd25519PublicKey(address)) {
    return { kind: 'invalid' } as const
  }

  return { kind: 'payment', details: { address, amount, concept } } as const
}

export function getWalletPaymentUri(details: PaymentDetails) {
  const params = new URLSearchParams({
    destination: details.address,
    amount: details.amount,
    network_passphrase: Networks.TESTNET,
  })
  if (details.concept) params.set('msg', details.concept)
  return `web+stellar:pay?${params.toString().replaceAll('+', '%20')}`
}
