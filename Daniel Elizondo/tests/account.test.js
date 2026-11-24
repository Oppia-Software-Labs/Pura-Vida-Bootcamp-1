import test from 'node:test'
import assert from 'node:assert/strict'
import { HORIZON_TESTNET, TESTNET_PASSPHRASE, formatBalance, isTestnet, loadAccount, shortAddress } from '../src/account.js'

const address = `G${'A'.repeat(55)}`

test('requires exactly the Testnet network and passphrase', () => {
  assert.equal(isTestnet('TESTNET', TESTNET_PASSPHRASE), true)
  assert.equal(isTestnet('PUBLIC', TESTNET_PASSPHRASE), false)
  assert.equal(isTestnet('TESTNET', 'Public Global Stellar Network ; September 2015'), false)
})

test('reads native balance and separates non-native assets', async () => {
  const result = await loadAccount(address, async (url) => {
    assert.equal(url, `${HORIZON_TESTNET}/accounts/${address}`)
    return { ok: true, json: async () => ({ balances: [
      { asset_type: 'credit_alphanum4', asset_code: 'USD', balance: '3.0000000' },
      { asset_type: 'native', balance: '42.1234567' },
    ] }) }
  })
  assert.deepEqual(result, { funded: true, balance: '42.1234567', assets: [{ asset_type: 'credit_alphanum4', asset_code: 'USD', balance: '3.0000000' }] })
})

test('reports an unfunded account without crashing', async () => {
  assert.deepEqual(await loadAccount(address, async () => ({ ok: false, status: 404 })), { funded: false, balance: '0', assets: [] })
})

test('reports Horizon failures and rejects invalid addresses', async () => {
  await assert.rejects(loadAccount('bad', async () => { throw new Error('should not fetch') }), /dirección/)
  await assert.rejects(loadAccount(address, async () => ({ ok: false, status: 503 })), /HTTP 503/)
})

test('formats a balance and abbreviates public addresses', () => {
  assert.equal(shortAddress(address), 'GAAAAA…AAAAAA')
  assert.equal(formatBalance('0'), '0,00')
  assert.equal(formatBalance('not-a-balance'), '—')
})
