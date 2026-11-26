import {
  BASE_FEE,
  Horizon,
  Networks,
  NotFoundError,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk'

const horizon = new Horizon.Server('https://horizon-testnet.stellar.org')
const STROOPS_PER_XLM = 10_000_000

export const ACCOUNT_MESSAGE = {
  name: 'mensaje',
  value: 'pura vida',
} as const

export type AccountFunds = {
  total: string
  reserved: string
  available: string
}

export type AccountEntry = {
  name: string
  value: string
}

export type AccountSnapshot = AccountFunds & {
  entries: AccountEntry[]
}

function xlmToStroops(amount: string): number {
  const [whole = '0', fraction = ''] = amount.split('.')
  const fractionStroops = Number((fraction + '0000000').slice(0, 7))
  return Number(whole) * STROOPS_PER_XLM + fractionStroops
}

function formatXlm(stroops: number): string {
  const whole = Math.trunc(stroops / STROOPS_PER_XLM)
  const fraction = String(Math.abs(stroops % STROOPS_PER_XLM)).padStart(7, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : String(whole)
}

function decodeDataValue(value: string): string {
  const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export async function getAccountSnapshot(address: string): Promise<AccountSnapshot> {
  const [account, ledgers] = await Promise.all([
    horizon.loadAccount(address),
    horizon.ledgers().order('desc').limit(1).call(),
  ])

  const native = account.balances.find((balance) => balance.asset_type === 'native')
  const totalStroops = xlmToStroops(native?.balance ?? '0')
  const sellingStroops = xlmToStroops(native?.selling_liabilities ?? '0')
  const baseReserve = ledgers.records[0]?.base_reserve_in_stroops ?? 5_000_000
  const reservedStroops = (2 + account.subentry_count) * baseReserve
  const availableStroops = Math.max(0, totalStroops - reservedStroops - sellingStroops)
  const entries = Object.entries(account.data_attr).map(([name, value]) => ({
    name,
    value: decodeDataValue(value),
  }))

  return {
    total: formatXlm(totalStroops),
    reserved: formatXlm(reservedStroops),
    available: formatXlm(availableStroops),
    entries,
  }
}

export async function saveAccountMessage(
  address: string,
  sign: (xdr: string) => Promise<string>,
): Promise<void> {
  const account = await horizon.loadAccount(address)
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.manageData({
        name: ACCOUNT_MESSAGE.name,
        value: ACCOUNT_MESSAGE.value,
      }),
    )
    .setTimeout(180)
    .build()

  const signedXdr = await sign(transaction.toXDR())
  const signed = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET)
  await horizon.submitTransaction(signed)
}

export async function fundTestnetAccount(address: string): Promise<void> {
  await horizon.friendbot(address).call()
}

export function isUnfundedAccount(error: unknown): boolean {
  return error instanceof NotFoundError
}
