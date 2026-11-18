import { Horizon, Networks } from '@stellar/stellar-sdk'

// La app corre siempre sobre Testnet: no se usan fondos reales.
export const NETWORK_NAME = 'Testnet'
export const NETWORK_PASSPHRASE = Networks.TESTNET
export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const FRIENDBOT_URL = 'https://friendbot.stellar.org'
const EXPLORER_URL = 'https://stellar.expert/explorer/testnet'

export const horizon = new Horizon.Server(HORIZON_URL)

export const explorerTxUrl = (hash: string) => `${EXPLORER_URL}/tx/${hash}`

export const explorerAccountUrl = (address: string) =>
  `${EXPLORER_URL}/account/${address}`

export const shortAddress = (address: string) =>
  `${address.slice(0, 5)}…${address.slice(-5)}`
