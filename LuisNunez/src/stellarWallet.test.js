import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  connectFreighter,
  WalletNotInstalledError,
} from './stellarWallet.js'

function createSdk(overrides = {}) {
  return {
    isConnected: async () => ({ isConnected: true }),
    requestAccess: async () => ({
      address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    }),
    getNetworkDetails: async () => ({
      network: 'TESTNET',
      networkUrl: 'https://horizon-testnet.stellar.org',
    }),
    ...overrides,
  }
}

test('returns the public address and network after connecting', async () => {
  const wallet = await connectFreighter(createSdk())

  assert.deepEqual(wallet, {
    address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    network: 'TESTNET',
    networkUrl: 'https://horizon-testnet.stellar.org',
  })
})

test('reports when Freighter is not installed without requesting access', async () => {
  let accessRequested = false
  const sdk = createSdk({
    isConnected: async () => ({ isConnected: false }),
    requestAccess: async () => {
      accessRequested = true
      return { address: 'GTEST' }
    },
  })

  await assert.rejects(connectFreighter(sdk), WalletNotInstalledError)
  assert.equal(accessRequested, false)
})

test('shows an SDK error when access is denied', async () => {
  const sdk = createSdk({
    requestAccess: async () => ({
      address: '',
      error: { message: 'Acceso denegado.' },
    }),
  })

  await assert.rejects(connectFreighter(sdk), /Acceso denegado/)
})

test('ends with an error when the wallet does not answer', async () => {
  const sdk = createSdk({
    requestAccess: () => new Promise(() => {}),
  })

  await assert.rejects(
    connectFreighter(sdk, 5),
    /Freighter no respondió a la solicitud de acceso/,
  )
})

test('requires a valid network endpoint', async () => {
  const sdk = createSdk({
    getNetworkDetails: async () => ({ network: 'TESTNET', networkUrl: '' }),
  })

  await assert.rejects(connectFreighter(sdk), /red Stellar válida/)
})
