export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015'

export function isTestnet(network, networkPassphrase) {
  if (networkPassphrase === TESTNET_PASSPHRASE) return true
  const normalized = String(network || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
  return normalized === 'TESTNET'
}

export function abbreviateAddress(address) {
  if (!address || address.length < 10) return address || ''
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

export function isAccessDeclined(error) {
  if (!error) return false
  if (error.code === -4) return true
  return /declin|reject|denied|cancel/i.test(String(error.message || ''))
}
