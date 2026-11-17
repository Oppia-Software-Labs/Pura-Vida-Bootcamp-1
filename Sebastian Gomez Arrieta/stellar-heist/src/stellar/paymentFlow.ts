import { createPayment, inspectPayment, PaymentError, restorePayment, verifyPaymentReceipt, verifySignedPayment } from './payment.ts'
import type { PaymentAccount, PaymentDraft, PaymentIssue, PaymentLookup, VerifiedPayment } from './payment.ts'
import type { WalletContext } from './walletSession.ts'
import { Networks } from '@stellar/stellar-sdk/base'

export interface PaymentPort {
  load(address: string): Promise<PaymentAccount>
  sign(draft: PaymentDraft, context: WalletContext): Promise<{ signedTxXdr: string; signerAddress: string }>
  send(xdr: string, signal?: AbortSignal): Promise<{ hash: string; status: 'PENDING' | 'DUPLICATE' | 'TRY_AGAIN_LATER' | 'ERROR' }>
  lookup(hash: string): Promise<PaymentLookup>
}
export interface PaymentJournal {
  read(address: string): unknown
  save(draft: PaymentDraft): void
  clear(address: string): void
}
export interface PaymentState {
  status: 'idle' | 'preparing' | 'review' | 'signing' | 'submitting' | 'confirming' | 'uncertain' | 'failed' | 'success'
  /** Established facts only; never inferred from elapsed animation time. */
  authorized: boolean
  submissionStatus: Awaited<ReturnType<PaymentPort['send']>>['status'] | null
  lookupStatus: PaymentLookup['status'] | null
  draft: PaymentDraft | null
  hash: string | null
  receipt: VerifiedPayment | null
  issue: PaymentIssue | null
}
export const initialPayment = (): PaymentState => ({ status: 'idle', authorized: false, submissionStatus: null, lookupStatus: null, draft: null, hash: null, receipt: null, issue: null })
export function waitForLedger(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(new PaymentError('session')); return }
    const cancel = () => { clearTimeout(timer); signal.removeEventListener('abort', cancel); reject(new PaymentError('session')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve() }, 2000)
    signal.addEventListener('abort', cancel, { once: true })
  })
}
/** Single active attempt; ambiguous broadcasts retain only public tracking data across reloads. */
export class PaymentFlow {
  private state = initialPayment()
  private generation = 0
  private abort = new AbortController()
  private readonly port: PaymentPort
  private readonly journal: PaymentJournal
  private readonly guard: () => Promise<WalletContext>
  private readonly publish: (state: PaymentState) => void
  private readonly wait: (signal: AbortSignal) => Promise<void>
  constructor(port: PaymentPort, journal: PaymentJournal, guard: () => Promise<WalletContext>, publish: (state: PaymentState) => void, wait = waitForLedger) {
    this.port = port; this.journal = journal; this.guard = guard; this.publish = publish; this.wait = wait
  }
  getSnapshot = () => this.state
  private update(patch: Partial<PaymentState>) { this.state = { ...this.state, ...patch }; this.publish(this.state) }
  reset = () => {
    this.generation++; this.abort.abort(); this.abort = new AbortController()
    this.state = initialPayment(); this.publish(this.state)
  }
  cancel = () => { if (['preparing', 'review', 'signing'].includes(this.state.status)) this.reset() }
  private busy() { return ['preparing', 'signing', 'submitting', 'confirming'].includes(this.state.status) }
  private async validate(address: string, generation: number) {
    const context = await this.guard()
    if (generation !== this.generation || context.address !== address) throw new PaymentError('session')
    if (context.passphrase !== Networks.TESTNET) throw new PaymentError('network')
    return context
  }
  private problem(error: unknown): PaymentIssue {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
    return ['session', 'inactive', 'funds', 'fee', 'network', 'expired', 'signature', 'modified', 'failed', 'uncertain', 'storage', 'history', 'rejected', 'locked', 'timeout'].includes(code) ? code as PaymentIssue : 'rpc'
  }
  prepare = async () => {
    if (this.busy() || this.state.receipt) return
    const generation = this.generation
    this.update({ ...initialPayment(), status: 'preparing' })
    try {
      const context = await this.guard()
      if (generation !== this.generation) return
      if (context.passphrase !== Networks.TESTNET) throw new PaymentError('network')
      let stored: unknown
      try { stored = this.journal.read(context.address) } catch { throw new PaymentError('storage') }
      const existing = restorePayment(stored, context.address)
      if (existing) { this.update({ draft: existing, hash: existing.hash, status: 'uncertain', issue: 'uncertain' }); return }
      const account = await this.port.load(context.address)
      await this.validate(context.address, generation)
      const draft = createPayment(account)
      if (draft.account !== context.address) throw new PaymentError('session')
      this.update({ status: 'review', draft, hash: null, issue: null })
    } catch (error) { if (generation === this.generation) this.update({ status: 'failed', issue: this.problem(error), draft: null }) }
  }
  submit = async (approvedHash: string) => {
    if (this.state.status !== 'review' || !this.state.draft || approvedHash !== this.state.draft.hash) return
    const draft = this.state.draft
    const generation = this.generation
    let broadcast = false
    this.update({ status: 'signing', issue: null })
    try {
      const context = await this.validate(draft.account, generation)
      if (Date.now() / 1000 >= draft.expiresAt) throw new PaymentError('expired')
      inspectPayment(draft)
      const signed = await this.port.sign(draft, context)
      await this.validate(draft.account, generation)
      verifySignedPayment(draft, signed)
      if (Date.now() / 1000 >= draft.expiresAt) throw new PaymentError('expired')
      try { this.journal.save(draft) } catch { throw new PaymentError('storage') }
      // Save public hash/unsigned body before handoff. Never save signatures or signed XDR.
      broadcast = true
      this.update({ status: 'submitting', hash: draft.hash, authorized: true })
      const sent = await this.port.send(signed.signedTxXdr, this.abort.signal)
      if (generation !== this.generation) return
      if (sent.hash !== draft.hash) throw new PaymentError('modified')
      this.update({ status: 'confirming', submissionStatus: sent.status, issue: sent.status === 'ERROR' ? 'failed' : null })
      await this.poll(draft, generation)
    } catch (error) {
      if (generation !== this.generation) return
      this.update({ status: broadcast ? 'uncertain' : 'failed', issue: broadcast && this.problem(error) === 'rpc' ? 'uncertain' : this.problem(error), draft: broadcast ? draft : null })
    }
  }
  check = async () => {
    if (this.busy() || !this.state.draft || this.state.receipt) return
    const generation = this.generation
    const draft = this.state.draft
    this.update({ status: 'confirming', issue: null })
    try { await this.validate(draft.account, generation); await this.poll(draft, generation) }
    catch (error) { if (generation === this.generation) this.update({ status: 'uncertain', issue: this.problem(error) }) }
  }
  private async poll(draft: PaymentDraft, generation: number) {
    const signal = this.abort.signal
    for (let count = 0; count < 15; count++) {
      if (generation !== this.generation) return
      const result = await this.port.lookup(draft.hash)
      await this.validate(draft.account, generation)
      if (result.hash !== draft.hash) throw new PaymentError('modified')
      if (this.state.lookupStatus !== result.status) this.update({ lookupStatus: result.status })
      if (result.status === 'SUCCESS') {
        const receipt = verifyPaymentReceipt(draft, result)
        try { this.journal.clear(draft.account) } catch { /* Keeping a public record is safe; next reload rechecks RPC. */ }
        this.update({ status: 'success', receipt, issue: null }); return
      }
      if (result.status === 'FAILED') {
        try { this.journal.clear(draft.account) } catch { throw new PaymentError('storage') }
        this.update({ status: 'failed', draft: null, issue: 'failed' }); return
      }
      if (result.oldestLedger > draft.ledger) throw new PaymentError('history')
      // Only release a missing attempt once this RPC has ingested ledgers beyond its time bounds.
      if (result.latestLedgerCloseTime > draft.expiresAt + 15) {
        try { this.journal.clear(draft.account) } catch { throw new PaymentError('storage') }
        this.update({ status: 'failed', draft: null, issue: 'expired' }); return
      }
      if (count < 14) await this.wait(signal)
    }
    this.update({ status: 'uncertain', issue: 'uncertain' })
  }
}
