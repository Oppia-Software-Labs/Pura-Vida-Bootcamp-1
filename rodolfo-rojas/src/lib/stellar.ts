import { Horizon, Networks } from '@stellar/stellar-sdk'

export const NETWORK_PASSPHRASE = Networks.TESTNET
export const horizon = new Horizon.Server('https://horizon-testnet.stellar.org')

const FRIENDBOT_URL = 'https://friendbot.stellar.org'
const EXPLORER_URL = 'https://stellar.expert/explorer/testnet'

export type AccountSnapshot =
  | { status: 'unfunded' }
  | { status: 'funded'; xlm: string }

export async function loadAccountSnapshot(address: string): Promise<AccountSnapshot> {
  try {
    const account = await horizon.loadAccount(address)
    const native = account.balances.find((b) => b.asset_type === 'native')
    return { status: 'funded', xlm: native?.balance ?? '0' }
  } catch (error) {
    if (isNotFound(error)) return { status: 'unfunded' }
    throw error
  }
}

export async function fundWithFriendbot(address: string): Promise<void> {
  const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`)
  if (!response.ok) throw new Error('Friendbot no pudo darte los XLM de juguete. Probá de nuevo en un rato.')
}

export function accountExplorerUrl(address: string): string {
  return `${EXPLORER_URL}/account/${address}`
}

export function formatXlm(amount: string): string {
  return Number(amount).toLocaleString('es-CR', { maximumFractionDigits: 2 })
}

export function balanceLabel(account: AccountSnapshot | null): string {
  if (account?.status !== 'funded') return '0 XLM'
  return `${formatXlm(account.xlm)} XLM`
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

function isNotFound(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 404
}
