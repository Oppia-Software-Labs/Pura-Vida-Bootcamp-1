import { paymentVisualStage } from '../src/experience/paymentCinema.ts'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Keypair, Networks, Transaction, TransactionBuilder, xdr } from '@stellar/stellar-sdk/base'
import { createPayment, hex, inspectPayment, PaymentError, restorePayment, rpcInteger, verifyPaymentReceipt, verifySignedPayment, xlmToStroops } from '../src/stellar/payment.ts'
import type { PaymentAccount, PaymentDraft, PaymentLookup } from '../src/stellar/payment.ts'
import { PaymentFlow } from '../src/stellar/paymentFlow.ts'
import type { PaymentState, PaymentJournal, PaymentPort } from '../src/stellar/paymentFlow.ts'
import { WalletSession } from '../src/stellar/walletSession.ts'
import type { WalletPort } from '../src/stellar/walletSession.ts'
import { artifactAppearance } from '../src/experience/artifact.ts'

// All ledger responses/providers are test fixtures; no transaction is sent by these tests.
const key = Keypair.random()
const other = Keypair.random()
const address = key.publicKey()
const context = { address, passphrase: Networks.TESTNET }
function account(patch: Partial<PaymentAccount> = {}): PaymentAccount {
  return { address, passphrase: Networks.TESTNET, sequence: '100', balance: 100000000n, sellingLiabilities: 0n, subentries: 0, sponsoring: 0, sponsored: 0, baseReserve: 5000000n, baseFee: 100n, ledger: 500, closeTime: Math.floor(Date.now() / 1000), ...patch }
}
function signed(draft: PaymentDraft, signer = key) {
  const tx = TransactionBuilder.fromXDR(draft.unsignedXdr, Networks.TESTNET)
  assert(tx instanceof Transaction); tx.sign(signer)
  return { signedTxXdr: tx.toXDR(), signerAddress: signer.publicKey() }
}
function result(success = true) {
  return new xdr.TransactionResult({
    feeCharged: 100n,
    result: success ? xdr.TransactionResultResult.txSuccess([xdr.OperationResult.opInner(xdr.OperationResultTr.payment(xdr.PaymentResult.paymentSuccess()))]) : xdr.TransactionResultResult.txBadAuth(),
    ext: xdr.TransactionResultExt.v0(),
  }).toXdr('base64')
}
function confirmed(draft: PaymentDraft, envelope = signed(draft).signedTxXdr): PaymentLookup {
  return { status: 'SUCCESS', hash: draft.hash, latestLedger: 502, oldestLedger: 1, latestLedgerCloseTime: draft.minTime + 20, ledger: 501, createdAt: draft.minTime + 15, envelope, result: result() }
}
function missing(draft: PaymentDraft): PaymentLookup {
  return { status: 'NOT_FOUND', hash: draft.hash, latestLedger: 502, oldestLedger: 1, latestLedgerCloseTime: draft.minTime + 20 }
}
function journalFixture() {
  const data = new Map<string, unknown>()
  const journal: PaymentJournal = { read: account => data.get(account) ?? null, save: draft => { data.set(draft.account, JSON.parse(JSON.stringify(draft))) }, clear: account => { data.delete(account) } }
  return { data, journal }
}
function fixture(overrides: Partial<PaymentPort> = {}, journal?: PaymentJournal) {
  const stored = journalFixture()
  let draft: PaymentDraft; let envelope = ''; let signatures = 0; let sends = 0
  const port: PaymentPort = {
    load: async () => account(),
    sign: async value => { draft = value; signatures++; return signed(value) },
    send: async value => { envelope = value; sends++; return { status: 'PENDING', hash: draft.hash } },
    lookup: async () => confirmed(draft, envelope), ...overrides,
  }
  const flow = new PaymentFlow(port, journal ?? stored.journal, async () => context, () => {}, async () => {})
  return { flow, port, ...stored, counts: () => ({ signatures, sends }) }
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done }); return { promise, resolve } }
const issue = (code: string) => (error: unknown) => error instanceof PaymentError && error.code === code

test('builds a finite Testnet self-payment of exactly 0.1 XLM with fresh nonce and bounded fee', () => {
  const draft = createPayment(account())
  const transaction = inspectPayment(draft)
  assert.equal(transaction.source, address)
  assert.equal(transaction.sequence, '101')
  assert.equal(draft.amount, '0.1'); assert.equal(draft.destination, address)
  assert.equal(draft.fee, '1000'); assert.equal(transaction.signatures.length, 0)
  assert.equal(draft.hash, hex(transaction.hash()))
  assert.notEqual(createPayment(account()).nonce, draft.nonce)
  assert.equal(xlmToStroops('0.1000000'), 1000000n)
  for (const amount of ['0.00000001', '-1', '1e2', 'NaN', '01']) assert.throws(() => xlmToStroops(amount))
})
for (const [name, patch, expected] of [
  ['Mainnet', { passphrase: Networks.PUBLIC }, 'network'],
  ['insufficient native balance', { balance: 1000n }, 'funds'],
  ['liabilities', { balance: 12000000n, sellingLiabilities: 2000000n }, 'funds'],
  ['subentry reserve', { balance: 20000000n, subentries: 3 }, 'funds'],
  ['sponsoring reserve', { balance: 20000000n, sponsoring: 3 }, 'funds'],
  ['unbounded fee', { baseFee: 1001n }, 'fee'],
  ['invalid reserve', { baseReserve: 0n }, 'rpc'],
] as const) test(`preflight rejects ${name}`, () => assert.throws(() => createPayment(account(patch)), issue(expected)))
test('sponsored reserve is accounted for using integer stroops', () => {
  assert.doesNotThrow(() => createPayment(account({ sponsored: 2, balance: 1100000n })))
})
test('signed body must be identical to the reviewed body and use the connected key', () => {
  const draft = createPayment(account())
  assert(verifySignedPayment(draft, signed(draft)))
  assert.throws(() => verifySignedPayment(draft, signed(draft, other)), issue('signature'))
  assert.throws(() => verifySignedPayment(draft, { ...signed(draft, other), signerAddress: address }), issue('signature'))
  assert.throws(() => verifySignedPayment(draft, { signedTxXdr: draft.unsignedXdr, signerAddress: address }), issue('signature'))
  const changed = createPayment(account({ sequence: '101' }))
  assert.throws(() => verifySignedPayment(draft, signed(changed)), issue('modified'))
})
test('a signature over Mainnet cannot authorize the same reviewed Testnet body', () => {
  const draft = createPayment(account())
  const transaction = TransactionBuilder.fromXDR(draft.unsignedXdr, Networks.PUBLIC)
  assert(transaction instanceof Transaction); transaction.sign(key)
  assert.throws(() => verifySignedPayment(draft, { signedTxXdr: transaction.toXDR(), signerAddress: address }), issue('signature'))
})
test('only a matching successful RPC envelope, result, ledger and time produces a receipt', () => {
  const draft = createPayment(account())
  const receipt = verifyPaymentReceipt(draft, confirmed(draft))
  assert.equal(receipt.transactionHash, draft.hash); assert.equal(receipt.verification, 'rpc-browser')
  assert.equal(receipt.fee, '100'); assert.equal(receipt.ledger, 501)
  assert(Object.isFrozen(receipt))
})
for (const mode of ['pending', 'failed status', 'wrong hash', 'wrong envelope', 'failed XDR', 'outside time', 'old ledger', 'missing signature'] as const) test(`receipt rejects ${mode}`, () => {
  const draft = createPayment(account())
  let response = confirmed(draft)
  if (mode === 'pending') response = missing(draft)
  if (mode === 'failed status') response.status = 'FAILED'
  if (mode === 'wrong hash') response.hash = createPayment(account()).hash
  if (mode === 'wrong envelope') response.envelope = signed(createPayment(account())).signedTxXdr
  if (mode === 'failed XDR') response.result = result(false)
  if (mode === 'outside time') response.createdAt = draft.expiresAt + 1
  if (mode === 'old ledger') response.ledger = 499
  if (mode === 'missing signature') response.envelope = draft.unsignedXdr
  assert.throws(() => verifyPaymentReceipt(draft, response))
})
test('successful flow verifies on RPC before completion and keeps only a public journal', async () => {
  const { flow, data, counts } = fixture()
  await flow.prepare()
  const draft = flow.getSnapshot().draft!
  await flow.submit('unapproved')
  assert.equal(counts().sends, 0)
  await flow.submit(draft.hash)
  assert.equal(flow.getSnapshot().status, 'success')
  assert.equal(flow.getSnapshot().receipt?.transactionHash, draft.hash)
  assert.equal(data.size, 0)
})
for (const status of ['PENDING', 'DUPLICATE', 'TRY_AGAIN_LATER', 'ERROR'] as const) test(`${status} is not success and does not create duplicate attempts`, async () => {
  const { flow, port, data } = fixture()
  let sends = 0
  port.send = async () => { sends++; return { status, hash: flow.getSnapshot().draft!.hash } }
  port.lookup = async () => missing(flow.getSnapshot().draft!)
  await flow.prepare(); const draft = flow.getSnapshot().draft!
  await flow.submit(draft.hash)
  assert.equal(flow.getSnapshot().receipt, null)
  assert.equal(flow.getSnapshot().status, 'uncertain')
  await flow.prepare()
  assert.equal(flow.getSnapshot().draft!.hash, draft.hash)
  assert.equal(sends, 1)
  const stored = data.get(address) as PaymentDraft
  assert.equal(inspectPayment(stored).signatures.length, 0)
  assert.equal('signedTxXdr' in stored, false)
})
test('broadcast timeout retains the hash and later lookup can confirm without re-signing', async () => {
  const { flow, port, counts } = fixture({ send: async () => { throw new Error('lost transport after handoff') } })
  await flow.prepare(); const draft = flow.getSnapshot().draft!
  await flow.submit(draft.hash)
  assert.equal(flow.getSnapshot().status, 'uncertain')
  port.lookup = async () => confirmed(draft)
  await flow.check()
  assert.equal(flow.getSnapshot().receipt?.transactionHash, draft.hash)
  assert.equal(counts().signatures, 1)
})
test('an uncertain attempt survives reload without storing the signed envelope', async () => {
  const shared = journalFixture()
  const first = fixture({ send: async () => { throw new Error('network') } }, shared.journal)
  await first.flow.prepare(); const draft = first.flow.getSnapshot().draft!
  await first.flow.submit(draft.hash)
  const second = fixture({ load: async () => { throw new Error('must not construct another attempt') }, lookup: async () => confirmed(draft) }, shared.journal)
  await second.flow.prepare()
  assert.equal(second.flow.getSnapshot().status, 'uncertain')
  assert.equal(second.flow.getSnapshot().hash, draft.hash)
  await second.flow.check()
  assert.equal(second.flow.getSnapshot().receipt?.transactionHash, draft.hash)
  assert.deepEqual(second.counts(), { signatures: 0, sends: 0 })
})
test('journal failure prevents any broadcast', async () => {
  const journal: PaymentJournal = { read: () => null, save: () => { throw new Error('quota denied') }, clear: () => {} }
  const { flow, counts } = fixture({}, journal)
  await flow.prepare(); await flow.submit(flow.getSnapshot().draft!.hash)
  assert.equal(flow.getSnapshot().issue, 'storage'); assert.equal(counts().sends, 0)
})
test('rejected approval preserves the previous missions and allows a fresh reviewed attempt', async () => {
  const { flow, port, counts } = fixture({ sign: async () => { throw new PaymentError('rejected') } })
  await flow.prepare(); const old = flow.getSnapshot().draft!
  await flow.submit(old.hash)
  assert.equal(flow.getSnapshot().issue, 'rejected'); assert.equal(counts().sends, 0)
  port.sign = async draft => signed(draft)
  await flow.prepare()
  assert.notEqual(flow.getSnapshot().draft!.hash, old.hash)
})
test('cancellation ignores a late signature, and duplicate clicks cannot broadcast twice', async () => {
  const signature = deferred<{ signedTxXdr: string; signerAddress: string }>(); const started = deferred<void>()
  const { flow, counts } = fixture({ sign: async () => { started.resolve(); return signature.promise } })
  await flow.prepare(); const draft = flow.getSnapshot().draft!
  const pending = flow.submit(draft.hash)
  await started.promise
  await flow.submit(draft.hash)
  flow.cancel(); signature.resolve(signed(draft)); await pending
  assert.equal(flow.getSnapshot().status, 'idle'); assert.equal(counts().sends, 0)
})
test('reset after broadcast cannot undo the chain operation or complete the next session', async () => {
  const lookup = deferred<PaymentLookup>(); const started = deferred<void>()
  const { flow, data } = fixture({ lookup: async () => { started.resolve(); return lookup.promise } })
  await flow.prepare(); const draft = flow.getSnapshot().draft!
  const pending = flow.submit(draft.hash)
  await started.promise
  flow.cancel(); assert.equal(flow.getSnapshot().status, 'confirming')
  flow.reset(); lookup.resolve(confirmed(draft)); await pending
  assert.equal(flow.getSnapshot().receipt, null); assert.equal(flow.getSnapshot().status, 'idle')
  assert(data.has(address))
})
test('only an ingested ledger beyond time bounds releases a missing attempt', async () => {
  const { flow, port, data } = fixture()
  port.lookup = async () => ({ ...missing(flow.getSnapshot().draft!), latestLedgerCloseTime: flow.getSnapshot().draft!.expiresAt + 16 })
  await flow.prepare(); await flow.submit(flow.getSnapshot().draft!.hash)
  assert.equal(flow.getSnapshot().issue, 'expired'); assert.equal(flow.getSnapshot().receipt, null); assert.equal(data.size, 0)
})
test('history pruning is never treated as proof of failure or success', async () => {
  const { flow, port, data } = fixture()
  port.lookup = async () => ({ ...missing(flow.getSnapshot().draft!), oldestLedger: 501 })
  await flow.prepare(); await flow.submit(flow.getSnapshot().draft!.hash)
  assert.equal(flow.getSnapshot().status, 'uncertain'); assert.equal(flow.getSnapshot().issue, 'history'); assert(data.has(address))
})
test('invalid public tracking records cannot authorize a different destination', () => {
  const draft = createPayment(account())
  assert.throws(() => restorePayment({ ...draft, destination: other.publicKey() }, address))
  assert.throws(() => restorePayment(draft, other.publicKey()))
})
test('wallet account or network changes while signing prevent submission', async () => {
  for (const mode of ['account', 'network']) {
    let current = context
    const signature = deferred<{ signedTxXdr: string; signerAddress: string }>(); const started = deferred<void>()
    let sends = 0
    const port: PaymentPort = { load: async () => account(), sign: async () => { started.resolve(); return signature.promise }, send: async () => { sends++; throw new Error('must not send') }, lookup: async () => { throw new Error('must not look up') } }
    const flow = new PaymentFlow(port, journalFixture().journal, async () => current, () => {}, async () => {})
    await flow.prepare(); const draft = flow.getSnapshot().draft!
    const operation = flow.submit(draft.hash); await started.promise
    current = mode === 'account' ? { ...context, address: other.publicKey() } : { ...context, passphrase: Networks.PUBLIC }
    signature.resolve(signed(draft)); await operation
    assert.equal(sends, 0); assert.equal(flow.getSnapshot().receipt, null)
  }
})
test('final mission requires identity and verified message proof; disconnect removes all completion', async () => {
  let draft: PaymentDraft
  const wallet: WalletPort = { installed: async () => true, authorize: async () => {}, context: async () => context, balance: async () => '10', signMessage: async message => ({ signedMessage: key.signMessage(message), signerAddress: address }) }
  const port: PaymentPort = { load: async () => account(), sign: async value => { draft = value; return signed(value) }, send: async () => ({ status: 'PENDING', hash: draft.hash }), lookup: async () => confirmed(draft) }
  const session = new WalletSession(wallet, undefined, { port, journal: journalFixture().journal, wait: async () => {} })
  await session.preparePayment(); assert.equal(session.getSnapshot().payment.draft, null)
  await session.connect(); await session.preparePayment(); assert.equal(session.getSnapshot().payment.draft, null)
  await session.signProof('https://heist.example'); await session.preparePayment()
  await session.submitPayment(session.getSnapshot().payment.draft!.hash)
  assert(session.getSnapshot().payment.receipt)
  session.disconnect()
  assert.equal(session.getSnapshot().identity, false); assert.equal(session.getSnapshot().proof, false); assert.equal(session.getSnapshot().payment.receipt, null)
})
test('artifact appearance is deterministic from the transaction hash', () => {
  const hash = createPayment(account()).hash
  assert.deepEqual(artifactAppearance(hash), artifactAppearance(hash))
  assert.throws(() => artifactAppearance('not-a-real-hash'))
})
test('RPC timestamp strings are normalized despite numeric SDK declarations', () => {
  assert.equal(rpcInteger('1794851615'), 1794851615)
  assert.equal(rpcInteger(1794851615), 1794851615)
  for (const bad of [null, undefined, '', '1.5', '-1', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '9007199254740993']) assert.throws(() => rpcInteger(bad), issue('rpc'))
})

// These are RPC/wallet fixtures, never artificial success in the application.
test('cinematic stages follow validated signature, actual enqueue, and independently verified receipt', async () => {
  const signature = deferred<ReturnType<typeof signed>>()
  const send = deferred<Awaited<ReturnType<PaymentPort['send']>>>()
  const nextLedger = deferred<void>()
  const states: PaymentState[] = []
  let draft: PaymentDraft
  let lookups = 0
  let sends = 0
  const port: PaymentPort = {
    load: async () => account(), sign: async value => { draft = value; return signature.promise },
    send: async () => { sends++; return send.promise },
    lookup: async () => ++lookups === 1 ? missing(draft) : confirmed(draft),
  }
  const flow = new PaymentFlow(port, journalFixture().journal, async () => context, state => states.push(state), () => nextLedger.promise)
  await flow.prepare()
  const current = flow.getSnapshot().draft!
  const operation = flow.submit(current.hash)
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(flow.getSnapshot().status, 'signing')
  assert.equal(paymentVisualStage(flow.getSnapshot()), 'inactive')
  signature.resolve(signed(current))
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(paymentVisualStage(flow.getSnapshot()), 'authorized')
  assert.equal(flow.getSnapshot().receipt, null)
  send.resolve({ hash: current.hash, status: 'PENDING' })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(paymentVisualStage(flow.getSnapshot()), 'pending')
  assert.equal(flow.getSnapshot().lookupStatus, 'NOT_FOUND')
  assert.equal(flow.getSnapshot().receipt, null)
  await flow.submit(current.hash) // Cannot replay an animation by sending again.
  nextLedger.resolve(); await operation
  assert.equal(paymentVisualStage(flow.getSnapshot()), 'verified')
  assert(flow.getSnapshot().receipt)
  assert.equal(sends, 1)
  const rawSuccess = states.find(state => state.lookupStatus === 'SUCCESS' && !state.receipt)!
  assert(rawSuccess)
  assert.notEqual(paymentVisualStage(rawSuccess), 'verified')
  flow.reset(); assert.equal(paymentVisualStage(flow.getSnapshot()), 'inactive')
})
for (const status of ['TRY_AGAIN_LATER', 'ERROR'] as const) test(`cinema does not claim network acceptance for ${status}`, async () => {
  const { flow, port } = fixture()
  const next = deferred<void>()
  port.send = async () => ({ hash: flow.getSnapshot().draft!.hash, status })
  port.lookup = async () => { await next.promise; return missing(flow.getSnapshot().draft!) }
  await flow.prepare()
  const pending = flow.submit(flow.getSnapshot().draft!.hash)
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(flow.getSnapshot().submissionStatus, status)
  assert.equal(paymentVisualStage(flow.getSnapshot()), 'uncertain')
  next.resolve(); await pending
  assert.equal(flow.getSnapshot().receipt, null)
})
test('recovered tracking never invents a new authorization or enqueue acknowledgement', async () => {
  const stored = journalFixture(); const draft = createPayment(account()); stored.journal.save(draft)
  const { flow } = fixture({ lookup: async () => confirmed(draft) }, stored.journal)
  await flow.prepare()
  assert.equal(flow.getSnapshot().authorized, false)
  assert.equal(flow.getSnapshot().submissionStatus, null)
  assert.equal(paymentVisualStage(flow.getSnapshot()), 'uncertain')
  await flow.check(); assert.equal(paymentVisualStage(flow.getSnapshot()), 'verified')
})
test('failed and rejected operations never become a verified cinematic stage', async () => {
  for (const reject of [true, false]) {
    const { flow, port } = fixture()
    if (reject) port.sign = async () => { throw new PaymentError('rejected') }
    else port.lookup = async () => ({ ...confirmed(flow.getSnapshot().draft!), status: 'FAILED' })
    await flow.prepare(); await flow.submit(flow.getSnapshot().draft!.hash)
    assert.equal(paymentVisualStage(flow.getSnapshot()), 'failed')
    assert.equal(flow.getSnapshot().receipt, null)
    if (reject) assert.equal(flow.getSnapshot().authorized, false)
  }
})
