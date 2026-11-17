import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { Keypair, Networks } from '@stellar/stellar-sdk/base'
import { CHALLENGE_LIFETIME, MessageChallenges, ProofError, signatureBytes, verifySep53 } from '../src/stellar/messageProof.ts'
import type { SignedMessage } from '../src/stellar/messageProof.ts'
import { WalletError, WalletSession } from '../src/stellar/walletSession.ts'
import type { WalletContext, WalletPort } from '../src/stellar/walletSession.ts'

// Ephemeral keys and provider doubles are confined to this test bundle. No secrets are saved.
const key = Keypair.random()
const other = Keypair.random()
const context = { address: key.publicKey(), passphrase: Networks.TESTNET }
const origin = 'https://heist.example'
function sign(message: string, signer = key): SignedMessage {
  // Independently construct SEP-53 bytes using Node crypto, not SDK signMessage.
  const hash = createHash('sha256').update('Stellar Signed Message:\n').update(message, 'utf8').digest()
  return { signedMessage: Buffer.from(signer.sign(hash)).toString('base64'), signerAddress: signer.publicKey() }
}
function challengeFixture() {
  let clock = 1700000000000
  const challenges = new MessageChallenges(() => clock)
  const challenge = challenges.create(context, origin)
  return { challenges, challenge, setClock: (value: number) => { clock = value } }
}
function code(expected: string) { return (error: unknown) => error instanceof ProofError && error.code === expected }
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
async function sessionFixture(overrides: Partial<WalletPort> = {}, challenges?: MessageChallenges) {
  const port: WalletPort = {
    installed: async () => true, authorize: async () => {}, context: async () => context,
    balance: async () => '10', signMessage: async message => sign(message), ...overrides,
  }
  const session = new WalletSession(port, challenges)
  await session.connect()
  return { port, session }
}

test('SEP-53 official ASCII and Unicode public test vectors verify without any secret fixture', () => {
  const address = 'GBXFXNDLV4LSWA4VB7YIL5GBD7BVNR22SGBTDKMO2SBZZHDXSKZYCP7L'
  assert(verifySep53(address, 'Hello, World!', 'fO5dbYhXUhBMhe6kId/cuVq/AfEnHRHEvsP8vXh03M1uLpi5e46yO2Q8rEBzu3feXQewcQE5GArp88u6ePK6BA=='))
  assert(verifySep53(address, 'こんにちは、世界！', 'CDU265Xs8y3OWbB/56H9jPgUss5G9A0qFuTqH2zs2YDgTm+++dIfmAEceFqB7bhfN3am59lCtDXrCtwH2k1GBA=='))
})
test('canonical base64 and legacy Buffer bytes decode to exactly 64 signature bytes', () => {
  const result = sign('Prueba de firma')
  const bytes = signatureBytes(result.signedMessage)
  assert.equal(bytes.length, 64)
  assert.deepEqual(signatureBytes(Buffer.from(bytes)), bytes)
  for (const malformed of [null, '', 'a'.repeat(128), 'a'.repeat(86) + '==', new Uint8Array(63), { type: 'Buffer', data: [...bytes] }]) {
    assert.throws(() => signatureBytes(malformed), code('invalid'))
  }
})
test('raw Ed25519 signing without SEP-53 prefix or with double prefix is rejected', () => {
  const message = 'Prueba sin pagos'
  assert.equal(verifySep53(context.address, message, key.sign(new TextEncoder().encode(message))), false)
  assert.equal(verifySep53(context.address, message, sign('Stellar Signed Message:\n' + message).signedMessage), false)
})
test('challenge binds origin, purpose, account, network, time and a fresh 256-bit nonce', () => {
  const { challenge, challenges } = challengeFixture()
  assert(Object.isFrozen(challenge))
  assert.match(challenge.nonce, /^[a-f0-9]{64}$/)
  assert.equal(challenge.expiresAt - challenge.issuedAt, CHALLENGE_LIFETIME)
  for (const field of [origin, context.address, Networks.TESTNET, challenge.nonce, 'Propósito:', 'Emitido:', 'Vence:', 'No gastarás XLM.']) assert(challenge.message.includes(field))
  assert.notEqual(challenges.create(context, origin).nonce, challenge.nonce)
})
test('valid signature consumes the issued challenge exactly once', () => {
  const { challenge, challenges } = challengeFixture()
  const response = sign(challenge.message)
  challenges.verifyAndConsume(challenge, response, context, origin)
  assert.throws(() => challenges.verifyAndConsume(challenge, response, context, origin), code('replayed'))
})
for (const mode of ['altered message', 'modified signature', 'wrong signer', 'wrong account', 'wrong network', 'wrong origin', 'expired', 'future', 'unissued challenge', 'cancelled challenge'] as const) {
  test(`challenge rejects ${mode}`, () => {
    const fixture = challengeFixture()
    const { challenges, challenge } = fixture
    let response = sign(challenge.message)
    let account: WalletContext = context
    let site = origin
    let submitted = challenge
    let expected = 'invalid'
    if (mode === 'altered message') response = sign(challenge.message + '\nExtra')
    if (mode === 'modified signature') { const bytes = signatureBytes(response.signedMessage); bytes[0] ^= 1; response = { ...response, signedMessage: bytes } }
    if (mode === 'wrong signer') { response = sign(challenge.message, other); expected = 'account' }
    if (mode === 'wrong account') { account = { ...context, address: other.publicKey() }; expected = 'account' }
    if (mode === 'wrong network') { account = { ...context, passphrase: Networks.PUBLIC }; expected = 'network' }
    if (mode === 'wrong origin') { site = 'https://other.example'; expected = 'origin' }
    if (mode === 'expired') { fixture.setClock(challenge.expiresAt); expected = 'expired' }
    if (mode === 'future') { fixture.setClock(challenge.issuedAt - 1); expected = 'expired' }
    if (mode === 'unissued challenge') { submitted = { ...challenge, message: challenge.message + '!' }; expected = 'challenge' }
    if (mode === 'cancelled challenge') { challenges.cancel(); expected = 'challenge' }
    assert.throws(() => challenges.verifyAndConsume(submitted, response, account, site), code(expected))
  })
}
test('wrong key cannot pass by falsely reporting the connected signer address', () => {
  const { challenge, challenges } = challengeFixture()
  const response = { ...sign(challenge.message, other), signerAddress: context.address }
  assert.throws(() => challenges.verifyAndConsume(challenge, response, context, origin), code('invalid'))
})
test('successful real cryptographic verification completes only the second mission', async () => {
  const { session } = await sessionFixture()
  assert.equal(session.getSnapshot().proof, false)
  await session.signProof(origin)
  assert.equal(session.getSnapshot().identity, true)
  assert.equal(session.getSnapshot().proof, true)
  assert.equal(session.getSnapshot().proofStatus, 'verified')
})
test('provider success with an invalid signature does not complete proof', async () => {
  const { session } = await sessionFixture({ signMessage: async () => ({ signedMessage: new Uint8Array(64), signerAddress: context.address }) })
  await session.signProof(origin)
  assert.equal(session.getSnapshot().identity, true)
  assert.equal(session.getSnapshot().proof, false)
  assert.equal(session.getSnapshot().proofIssue, 'invalid')
})
test('user rejection keeps identity and permits a new challenge on retry', async () => {
  const { session, port } = await sessionFixture({ signMessage: async () => { throw new WalletError('rejected') } })
  await session.signProof(origin)
  assert.equal(session.getSnapshot().proofIssue, 'rejected')
  assert.equal(session.getSnapshot().proof, false)
  assert.equal(session.getSnapshot().identity, true)
  port.signMessage = async message => sign(message)
  await session.signProof(origin)
  assert.equal(session.getSnapshot().proof, true)
})
for (const mode of ['account', 'network', 'authorization'] as const) test(`wallet ${mode} changes during signing invalidate both missions`, async () => {
  const signature = deferred<SignedMessage>()
  let message = ''
  const started = deferred<void>()
  const { session, port } = await sessionFixture({ signMessage: async value => { message = value; started.resolve(); return signature.promise } })
  const operation = session.signProof(origin)
  await started.promise
  assert.equal(session.getSnapshot().proof, false)
  port.context = async () => {
    if (mode === 'authorization') throw new WalletError('revoked')
    return { address: mode === 'account' ? other.publicKey() : context.address, passphrase: mode === 'network' ? Networks.PUBLIC : Networks.TESTNET }
  }
  signature.resolve(sign(message))
  await operation
  assert.equal(session.getSnapshot().identity, false)
  assert.equal(session.getSnapshot().proof, false)
})
test('wrong network before signing prevents the wallet request', async () => {
  let requests = 0
  const { session, port } = await sessionFixture({ signMessage: async message => { requests++; return sign(message) } })
  port.context = async () => ({ ...context, passphrase: Networks.PUBLIC })
  await session.signProof(origin)
  assert.equal(requests, 0)
  assert.equal(session.getSnapshot().identity, false)
})
test('cancellation and retry ignore a late response from the previous popup', async () => {
  const first = deferred<SignedMessage>()
  const started = deferred<void>()
  let oldMessage = ''; let newMessage = ''
  const { session, port } = await sessionFixture({ signMessage: async message => { oldMessage = message; started.resolve(); return first.promise } })
  const pending = session.signProof(origin)
  await started.promise
  session.cancelProof()
  assert.equal(session.getSnapshot().proof, false)
  port.signMessage = async message => { newMessage = message; return sign(message) }
  await session.signProof(origin)
  assert.notEqual(oldMessage, newMessage)
  assert.equal(session.getSnapshot().proof, true)
  first.resolve(sign(oldMessage, other))
  await pending
  assert.equal(session.getSnapshot().proof, true)
  assert.equal(session.getSnapshot().proofIssue, null)
})
test('disconnect ignores late valid signatures and reconnect never restores proof', async () => {
  const signature = deferred<SignedMessage>()
  const started = deferred<void>()
  let message = ''
  const { session } = await sessionFixture({ signMessage: async value => { message = value; started.resolve(); return signature.promise } })
  const operation = session.signProof(origin)
  await started.promise
  session.disconnect(); signature.resolve(sign(message)); await operation
  assert.equal(session.getSnapshot().proof, false)
  assert.equal(session.getSnapshot().identity, false)
  await session.connect()
  assert.equal(session.getSnapshot().identity, true)
  assert.equal(session.getSnapshot().proof, false)
})
test('proof checks expiry again when the wallet returns after the deadline', async () => {
  let clock = 1700000000000
  const { session } = await sessionFixture({ signMessage: async message => { clock += CHALLENGE_LIFETIME; return sign(message) } }, new MessageChallenges(() => clock))
  await session.signProof(origin)
  assert.equal(session.getSnapshot().proof, false)
  assert.equal(session.getSnapshot().proofIssue, 'expired')
})
test('duplicate clicks cannot request two signatures or replay a completed proof', async () => {
  let requests = 0
  const started = deferred<void>(); const signature = deferred<SignedMessage>()
  const { session } = await sessionFixture({ signMessage: async message => { requests++; started.resolve(); return signature.promise.then(() => sign(message)) } })
  const operation = session.signProof(origin)
  await started.promise
  await session.signProof(origin)
  assert.equal(requests, 1)
  signature.resolve(sign('unused')); await operation
  await session.signProof(origin)
  assert.equal(requests, 1)
})
test('completed proof is removed when authorization is later revoked', async () => {
  const { session, port } = await sessionFixture()
  await session.signProof(origin)
  port.context = async () => { throw new WalletError('revoked') }
  await session.check()
  assert.equal(session.getSnapshot().identity, false)
  assert.equal(session.getSnapshot().proof, false)
})
test('signing waits for a fresh context after an older background check', async () => {
  let requests = 0
  const { session, port } = await sessionFixture({ signMessage: async message => { requests++; return sign(message) } })
  const oldContext = deferred<WalletContext>()
  port.context = () => oldContext.promise
  const check = session.check()
  const operation = session.signProof(origin)
  port.context = async () => ({ ...context, passphrase: Networks.PUBLIC })
  oldContext.resolve(context)
  await Promise.all([check, operation])
  assert.equal(requests, 0)
  assert.equal(session.getSnapshot().proof, false)
  assert.equal(session.getSnapshot().identity, false)
})
test('a valid signature cannot use a stale background check to bypass a network change', async () => {
  const signature = deferred<SignedMessage>(); const started = deferred<void>()
  let message = ''
  const { session, port } = await sessionFixture({ signMessage: async value => { message = value; started.resolve(); return signature.promise } })
  const operation = session.signProof(origin)
  await started.promise
  const oldContext = deferred<WalletContext>()
  port.context = () => oldContext.promise
  const check = session.check()
  port.context = async () => ({ ...context, passphrase: Networks.PUBLIC })
  signature.resolve(sign(message))
  oldContext.resolve(context)
  await Promise.all([operation, check])
  assert.equal(session.getSnapshot().proof, false)
  assert.equal(session.getSnapshot().identity, false)
})
