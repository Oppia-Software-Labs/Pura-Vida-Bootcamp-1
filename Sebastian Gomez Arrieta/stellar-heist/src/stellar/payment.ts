import { Account, Asset, Keypair, Memo, Networks, Operation, StrKey, Transaction, TransactionBuilder, xdr } from '@stellar/stellar-sdk/base'

export const PAYMENT_AMOUNT = '0.1'
export const PAYMENT_TIMEOUT = 300
export const MAX_FEE = 10000n
export type PaymentIssue = 'session' | 'inactive' | 'funds' | 'fee' | 'network' | 'rpc' | 'expired' | 'signature' | 'modified' | 'failed' | 'uncertain' | 'storage' | 'history' | 'rejected' | 'locked' | 'timeout'
export class PaymentError extends Error {
  readonly code: PaymentIssue
  constructor(code: PaymentIssue) { super(code); this.code = code }
}
export interface PaymentAccount {
  address: string; passphrase: string; sequence: string; balance: bigint; sellingLiabilities: bigint
  subentries: number; sponsoring: number; sponsored: number
  baseReserve: bigint; baseFee: bigint; ledger: number; closeTime: number
}
export interface PaymentDraft {
  readonly account: string; readonly destination: string; readonly amount: string; readonly fee: string
  readonly hash: string; readonly unsignedXdr: string; readonly nonce: string
  readonly ledger: number; readonly minTime: number; readonly expiresAt: number
}
export interface PaymentLookup {
  status: 'SUCCESS' | 'FAILED' | 'NOT_FOUND'
  hash: string; latestLedger: number; oldestLedger: number; latestLedgerCloseTime: number
  envelope?: string; result?: string; ledger?: number; createdAt?: number
}
declare const confirmedByRpc: unique symbol
/** Local RPC verification, not a server attestation or a token with monetary value. */
export interface VerifiedPayment {
  readonly [confirmedByRpc]: true
  readonly verification: 'rpc-browser'; readonly network: 'TESTNET'
  readonly transactionHash: string; readonly account: string; readonly destination: string
  readonly amount: string; readonly fee: string; readonly ledger: number; readonly createdAt: number
}
export const hex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
export function rpcInteger(value: unknown): number {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) throw new PaymentError('rpc')
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 0) throw new PaymentError('rpc')
  return number
}
export function transactionUrl(hash: string) {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new PaymentError('modified')
  return `https://stellar.expert/explorer/testnet/tx/${hash}`
}
export function xlmToStroops(value: string) {
  if (!/^(0|[1-9]\d*)(?:\.\d{1,7})?$/.test(value)) throw new PaymentError('modified')
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * 10000000n + BigInt(fraction.padEnd(7, '0'))
}
export function createPayment(account: PaymentAccount): PaymentDraft {
  if (account.passphrase !== Networks.TESTNET) throw new PaymentError('network')
  if (!StrKey.isValidEd25519PublicKey(account.address)) throw new PaymentError('session')
  const units = 2 + account.subentries + account.sponsoring - account.sponsored
  if (!Number.isSafeInteger(units) || units < 0 || account.balance < 0n || account.sellingLiabilities < 0n || account.baseReserve <= 0n || account.baseFee <= 0n || !Number.isSafeInteger(account.closeTime) || account.closeTime <= 0 || !Number.isSafeInteger(account.ledger) || account.ledger <= 0) throw new PaymentError('rpc')
  const fee = account.baseFee * 10n > 1000n ? account.baseFee * 10n : 1000n
  if (fee > MAX_FEE) throw new PaymentError('fee')
  const available = account.balance - BigInt(units) * account.baseReserve - account.sellingLiabilities
  // Conservative even for a self-payment: retain amount + fee above reserves/liabilities.
  if (available < xlmToStroops(PAYMENT_AMOUNT) + fee) throw new PaymentError('funds')
  const nonce = hex(crypto.getRandomValues(new Uint8Array(32)))
  const minTime = Math.max(0, account.closeTime - 10)
  const expiresAt = account.closeTime + PAYMENT_TIMEOUT
  const transaction = new TransactionBuilder(new Account(account.address, account.sequence), {
    fee: fee.toString(), networkPassphrase: Networks.TESTNET,
    timebounds: { minTime, maxTime: expiresAt },
  }).addOperation(Operation.payment({ destination: account.address, asset: Asset.native(), amount: PAYMENT_AMOUNT }))
    .addMemo(Memo.hash(nonce)).build()
  return Object.freeze({ account: account.address, destination: account.address, amount: PAYMENT_AMOUNT, fee: fee.toString(), hash: hex(transaction.hash()), unsignedXdr: transaction.toXDR(), nonce, ledger: account.ledger, minTime, expiresAt })
}
export function inspectPayment(draft: PaymentDraft, envelope = draft.unsignedXdr): Transaction {
  try {
    const tx = TransactionBuilder.fromXDR(envelope, Networks.TESTNET)
    if (!(tx instanceof Transaction)) throw new PaymentError('modified')
    const operation = tx.operations[0]
    const policyValid = StrKey.isValidEd25519PublicKey(draft.account) && draft.destination === draft.account && draft.amount === PAYMENT_AMOUNT
    const memoValid = /^[a-f0-9]{64}$/.test(draft.nonce) && tx.memo.type === 'hash' && tx.memo.value instanceof Uint8Array && hex(tx.memo.value) === draft.nonce
    const feeValid = /^\d+$/.test(draft.fee) && BigInt(draft.fee) > 0n && BigInt(draft.fee) <= MAX_FEE && tx.fee === draft.fee
    const timeValid = Number.isSafeInteger(draft.minTime) && Number.isSafeInteger(draft.expiresAt) && draft.expiresAt - draft.minTime === PAYMENT_TIMEOUT + 10 && tx.timeBounds?.minTime === String(draft.minTime) && tx.timeBounds.maxTime === String(draft.expiresAt)
    const bodyValid = /^[a-f0-9]{64}$/.test(draft.hash) && hex(tx.hash()) === draft.hash && tx.source === draft.account && Number.isSafeInteger(draft.ledger) && draft.ledger > 0
    const operationValid = tx.operations.length === 1 && operation.type === 'payment' && (operation.source === undefined || operation.source === draft.account) && operation.destination === draft.destination && operation.asset.isNative() && xlmToStroops(operation.amount) === xlmToStroops(draft.amount)
    if (!policyValid || !memoValid || !feeValid || !timeValid || !bodyValid || !operationValid) throw new PaymentError('modified')
    return tx
  } catch { throw new PaymentError('modified') }
}
export function verifySignedPayment(draft: PaymentDraft, response: { signedTxXdr: string; signerAddress: string }) {
  if (response.signerAddress !== draft.account) throw new PaymentError('signature')
  const tx = inspectPayment(draft, response.signedTxXdr)
  const key = Keypair.fromPublicKey(draft.account)
  if (!tx.signatures.some(signature => key.verify(tx.hash(), signature.signature.toBytes()))) throw new PaymentError('signature')
  return tx
}
export function verifyPaymentReceipt(draft: PaymentDraft, response: PaymentLookup): VerifiedPayment {
  if (response.status !== 'SUCCESS') throw new PaymentError(response.status === 'FAILED' ? 'failed' : 'uncertain')
  if (response.hash !== draft.hash || !response.envelope || !response.result || !Number.isSafeInteger(response.ledger) || response.ledger! < draft.ledger || !Number.isSafeInteger(response.createdAt) || response.createdAt! < draft.minTime || response.createdAt! > draft.expiresAt) throw new PaymentError('modified')
  verifySignedPayment(draft, { signedTxXdr: response.envelope, signerAddress: draft.account })
  const result = xdr.TransactionResult.fromXdr(response.result, 'base64')
  if (result.result.type !== 'txSuccess' || result.result.value.length !== 1) throw new PaymentError('failed')
  const operation = result.result.value[0]
  if (operation.type !== 'opInner' || operation.value.type !== 'payment' || operation.value.value.type !== 'paymentSuccess' || result.feeCharged <= 0n || result.feeCharged > BigInt(draft.fee)) throw new PaymentError('failed')
  return Object.freeze({ verification: 'rpc-browser', network: 'TESTNET', transactionHash: draft.hash, account: draft.account, destination: draft.destination, amount: draft.amount, fee: result.feeCharged.toString(), ledger: response.ledger!, createdAt: response.createdAt! }) as VerifiedPayment
}
export function restorePayment(value: unknown, address: string): PaymentDraft | null {
  if (value === null) return null
  if (!value || typeof value !== 'object') throw new PaymentError('storage')
  const draft = value as PaymentDraft
  if (draft.account !== address) throw new PaymentError('storage')
  inspectPayment(draft)
  return Object.freeze({ ...draft })
}
