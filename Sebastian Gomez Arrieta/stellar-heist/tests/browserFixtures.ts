// Isolated browser QA data. Never imported by src/ or included in the application.
// These responses are NOT evidence of a real on-chain submission.
import { Keypair, Networks, Transaction, TransactionBuilder, xdr } from '@stellar/stellar-sdk/base'
import { hex } from '../src/stellar/payment'

export function transaction(envelope: string) {
  const tx = TransactionBuilder.fromXDR(envelope, Networks.TESTNET)
  if (!(tx instanceof Transaction)) throw new Error('Expected classic transaction')
  return tx
}
export function addSignature(envelope: string, address: string, signature: string) {
  const tx = transaction(envelope); tx.addSignature(address, signature); return tx.toXDR()
}
export function accountEntry(address: string) {
  return xdr.LedgerEntryData.account(new xdr.AccountEntry({
    accountId: Keypair.fromPublicKey(address).xdrPublicKey(), balance: 1000000000n, seqNum: 100n,
    numSubEntries: 0, inflationDest: null, flags: 0, homeDomain: '', thresholds: new Uint8Array([1, 1, 1, 1]), signers: [], ext: xdr.AccountEntryExt.v0(),
  })).toXdr('base64')
}
export function successfulResponse(envelope: string, ledger: number) {
  const tx = transaction(envelope)
  const result = new xdr.TransactionResult({
    feeCharged: 100n, result: xdr.TransactionResultResult.txSuccess([xdr.OperationResult.opInner(xdr.OperationResultTr.payment(xdr.PaymentResult.paymentSuccess()))]), ext: xdr.TransactionResultExt.v0(),
  })
  return { status: 'SUCCESS', txHash: hex(tx.hash()), latestLedger: ledger + 1, oldestLedger: ledger - 100,
    latestLedgerCloseTime: String(Math.floor(Date.now() / 1000)), ledger, createdAt: String(Math.floor(Date.now() / 1000)),
    applicationOrder: 1, feeBump: false, envelopeXdr: envelope, resultXdr: result.toXdr('base64'),
    resultMetaXdr: xdr.TransactionMeta.operations([]).toXdr('base64'), events: { transactionEventsXdr: [], contractEventsXdr: [] },
  }
}
