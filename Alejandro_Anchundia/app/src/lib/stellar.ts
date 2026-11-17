import { Horizon, Networks, NotFoundError } from '@stellar/stellar-sdk'

export const horizon = new Horizon.Server('https://horizon-testnet.stellar.org')
export const networkPassphrase = Networks.TESTNET

export type PaymentItem = {
  id: string
  type: string
  from: string
  to: string
  amount: string
  asset: string
  createdAt: string
}

export type AccountSummary = {
  balance: string
  subentryCount: number
  payments: PaymentItem[]
}

type PaymentRecord = {
  id: string
  type: string
  from?: string
  to?: string
  account?: string
  funder?: string
  destination?: string
  source_account?: string
  amount?: string
  starting_balance?: string
  asset_type?: string
  asset_code?: string
  created_at: string
}

export function isUnfunded(error: unknown): boolean {
  return error instanceof NotFoundError || (error as { name?: string })?.name === 'NotFoundError'
}

export async function loadAccountSummary(address: string): Promise<AccountSummary> {
  const account = await horizon.loadAccount(address)
  const native = account.balances.find((line) => line.asset_type === 'native')
  const page = await horizon.payments().forAccount(address).order('desc').limit(4).call()

  return {
    balance: native && 'balance' in native ? native.balance : '0',
    subentryCount: account.subentry_count,
    payments: (page.records as unknown as PaymentRecord[]).map((record) => ({
      id: record.id,
      type: record.type,
      from: record.from ?? record.funder ?? record.source_account ?? '',
      to: record.to ?? record.account ?? record.destination ?? '',
      amount: record.amount ?? record.starting_balance ?? '0',
      asset:
        !record.asset_type || record.asset_type === 'native'
          ? 'XLM'
          : (record.asset_code ?? 'OTRO'),
      createdAt: record.created_at,
    })),
  }
}

export async function fundWithFriendbot(address: string): Promise<void> {
  const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`)
  if (!response.ok) throw new Error('Friendbot no pudo financiar esta cuenta en este momento')
}
