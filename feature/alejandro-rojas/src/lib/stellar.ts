import { Horizon, NotFoundError } from '@stellar/stellar-sdk'

const horizon = new Horizon.Server('https://horizon-testnet.stellar.org')
const STROOPS_PER_XLM = 10_000_000

export type AccountFunds = {
  total: string
  reserved: string
  available: string
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

export async function getAccountFunds(address: string): Promise<AccountFunds> {
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

  return {
    total: formatXlm(totalStroops),
    reserved: formatXlm(reservedStroops),
    available: formatXlm(availableStroops),
  }
}

export async function fundTestnetAccount(address: string): Promise<void> {
  await horizon.friendbot(address).call()
}

export function isUnfundedAccount(error: unknown): boolean {
  return error instanceof NotFoundError
}
