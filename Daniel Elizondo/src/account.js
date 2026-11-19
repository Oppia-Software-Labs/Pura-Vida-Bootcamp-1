export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015'
export const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org'

export function isTestnet(network, passphrase) {
  return network === 'TESTNET' && passphrase === TESTNET_PASSPHRASE
}

export function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-6)}`
}

export async function loadAccount(address, fetcher = fetch) {
  if (!/^G[A-Z2-7]{55}$/.test(address)) {
    throw new Error('La dirección pública de Stellar no es válida.')
  }

  const response = await fetcher(`${HORIZON_TESTNET}/accounts/${address}`)
  if (response.status === 404) {
    return { funded: false, balance: '0', assets: [] }
  }
  if (!response.ok) {
    throw new Error(`No se pudo consultar Horizon (HTTP ${response.status}). Intenta nuevamente.`)
  }

  const account = await response.json()
  const balances = Array.isArray(account.balances) ? account.balances : []
  const native = balances.find((item) => item.asset_type === 'native')

  return {
    funded: true,
    balance: native?.balance ?? '0',
    assets: balances.filter((item) => item.asset_type !== 'native'),
  }
}

export function formatBalance(balance) {
  const amount = Number(balance)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 7 }).format(amount)
    : '—'
}
