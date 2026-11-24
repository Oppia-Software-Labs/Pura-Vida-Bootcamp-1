import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Keypair, Networks } from '@stellar/stellar-sdk/base'
import { WalletError, WalletSession, stroopsToXlm } from '../src/stellar/walletSession.ts'
import type { WalletPort } from '../src/stellar/walletSession.ts'

// Test-only provider doubles. Never included in the application or exposed as a preview.
const address = Keypair.random().publicKey()
const otherAddress = Keypair.random().publicKey()
function fixture(overrides: Partial<WalletPort> = {}) {
  const port: WalletPort = {
    installed: async () => true, authorize: async () => {},
    context: async () => ({ address, passphrase: Networks.TESTNET }),
    balance: async () => '100.1234567', ...overrides,
    signMessage: async () => { throw new Error('Signing is not used in identity tests') },
  }
  return { port, session: new WalletSession(port) }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

test('only an authorized, valid Testnet account completes identity', async () => {
  const { session } = fixture()
  assert.equal(session.getSnapshot().identity, false)
  await session.connect()
  assert.equal(session.getSnapshot().identity, true)
  assert.equal(session.getSnapshot().balance, '100.1234567')
  session.disconnect()
  assert.equal(session.getSnapshot().identity, false)
  assert.equal(session.getSnapshot().address, null)
})
for (const [name, overrides, expected] of [
  ['missing extension', { installed: async () => false }, 'missing'],
  ['rejected permission', { authorize: async () => { throw new WalletError('rejected') } }, 'rejected'],
  ['wrong network despite name', { context: async () => ({ address, passphrase: Networks.PUBLIC }) }, 'network'],
  ['invalid public key', { context: async () => ({ address: 'Ginvalid', passphrase: Networks.TESTNET }) }, 'address'],
  ['revoked authorization', { context: async () => { throw new WalletError('revoked') } }, 'revoked'],
] as const) test(name, async () => {
  const { session } = fixture(overrides)
  await session.connect()
  assert.equal(session.getSnapshot().identity, false)
  assert.equal(session.getSnapshot().issue, expected)
})
for (const [name, context, issue] of [
  ['account change', async () => ({ address: otherAddress, passphrase: Networks.TESTNET }), 'changed'],
  ['network change', async () => ({ address, passphrase: Networks.PUBLIC }), 'network'],
  ['permission lost', async () => { throw new WalletError('revoked') }, 'revoked'],
] as const) test(`invalidates session on ${name}`, async () => {
  const { session, port } = fixture()
  await session.connect(); port.context = context; await session.check()
  assert.equal(session.getSnapshot().identity, false)
  assert.equal(session.getSnapshot().balance, null)
  assert.equal(session.getSnapshot().issue, issue)
})
for (const [name, balance, status] of [
  ['inactive', async () => null, 'inactive'],
  ['empty', async () => '0', 'empty'],
  ['rpc failure', async () => { throw new Error('network failure') }, 'error'],
] as const) test(`balance ${name} does not masquerade as another state`, async () => {
  const { session } = fixture({ balance })
  await session.connect()
  assert.equal(session.getSnapshot().balanceStatus, status)
  assert.equal(session.getSnapshot().identity, true)
})
test('late authorization cannot reconnect a locally disconnected session', async () => {
  const authorization = deferred<void>()
  const { session } = fixture({ authorize: () => authorization.promise })
  const pending = session.connect()
  await Promise.resolve(); session.disconnect(); authorization.resolve(); await pending
  assert.equal(session.getSnapshot().status, 'disconnected')
  assert.equal(session.getSnapshot().identity, false)
})
test('a disconnected account cannot receive a stale RPC balance', async () => {
  const read = deferred<string>()
  const { session } = fixture({ balance: () => read.promise })
  const pending = session.connect()
  while (session.getSnapshot().balanceStatus !== 'loading') await Promise.resolve()
  session.disconnect(); read.resolve('999'); await pending
  assert.equal(session.getSnapshot().balance, null)
  assert.equal(session.getSnapshot().identity, false)
})
test('account change during RPC cancels the old account response', async () => {
  const read = deferred<string>()
  const { session, port } = fixture({ balance: () => read.promise })
  const pending = session.connect()
  while (session.getSnapshot().balanceStatus !== 'loading') await Promise.resolve()
  port.context = async () => ({ address: otherAddress, passphrase: Networks.TESTNET })
  read.resolve('999'); await pending
  assert.equal(session.getSnapshot().identity, false)
  assert.equal(session.getSnapshot().balance, null)
})
test('balance waits for an ongoing permission check instead of bypassing it', async () => {
  const { session, port } = fixture()
  await session.connect()
  const context = deferred<{ address: string; passphrase: string }>()
  port.context = () => context.promise
  let balanceReads = 0
  port.balance = async () => { balanceReads++; return '999' }
  const check = session.check()
  const refresh = session.refreshBalance()
  await Promise.resolve()
  assert.equal(balanceReads, 0)
  context.resolve({ address: otherAddress, passphrase: Networks.TESTNET })
  await Promise.all([check, refresh])
  assert.equal(balanceReads, 0)
  assert.equal(session.getSnapshot().identity, false)
  assert.equal(session.getSnapshot().balance, null)
})
test('decimal conversion preserves stroops without floating point rounding', () => {
  assert.equal(stroopsToXlm(1n), '0.0000001')
  assert.equal(stroopsToXlm(10000000n), '1')
  assert.equal(stroopsToXlm(9223372036854775807n), '922337203685.4775807')
  assert.throws(() => stroopsToXlm(-1n))
})
