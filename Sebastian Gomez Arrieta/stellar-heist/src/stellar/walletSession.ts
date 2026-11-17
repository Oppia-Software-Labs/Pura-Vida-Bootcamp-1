import { Networks, StrKey } from '@stellar/stellar-sdk/base'
import { MessageChallenges, ProofError } from './messageProof.ts'
import type { MessageChallenge, ProofIssue, SignedMessage } from './messageProof.ts'

export interface WalletContext { address: string; passphrase: string }
export interface WalletPort {
  installed(): Promise<boolean>
  authorize(): Promise<void>
  context(): Promise<WalletContext>
  balance(address: string): Promise<string | null>
  signMessage(message: string, context: WalletContext): Promise<SignedMessage>
}
export type WalletIssue = 'locked' | 'missing' | 'rejected' | 'network' | 'address' | 'revoked' | 'changed' | 'timeout' | 'provider' | 'rpc'
export class WalletError extends Error {
  readonly code: WalletIssue
  constructor(code: WalletIssue) { super(code); this.code = code }
}
export interface WalletState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  address: string | null
  balance: string | null
  balanceStatus: 'idle' | 'loading' | 'ready' | 'inactive' | 'empty' | 'error'
  issue: WalletIssue | null
  identity: boolean
  proof: boolean
  proofStatus: 'idle' | 'requesting' | 'verifying' | 'verified' | 'error'
  proofIssue: ProofIssue | WalletIssue | null
}
const initial = (): WalletState => ({ status: 'disconnected', address: null, balance: null, balanceStatus: 'idle', issue: null, identity: false, proof: false, proofStatus: 'idle', proofIssue: null })

export function validateContext(context: WalletContext) {
  if (!StrKey.isValidEd25519PublicKey(context.address)) throw new WalletError('address')
  if (context.passphrase !== Networks.TESTNET) throw new WalletError('network')
  return context
}
export function stroopsToXlm(value: bigint): string {
  if (value < 0n) throw new Error('Invalid balance')
  const fraction = (value % 10000000n).toString().padStart(7, '0').replace(/0+$/, '')
  return `${value / 10000000n}${fraction ? `.${fraction}` : ''}`
}
export const walletMessages: Record<WalletIssue, string> = {
  locked: 'Desbloquea Varial y vuelve a intentarlo.',
  missing: 'Instala Varial y vuelve a intentarlo.', rejected: 'No autorizaste la conexión. Puedes intentarlo de nuevo.',
  network: 'Cambia tu wallet a Testnet y vuelve a conectar.', address: 'La wallet no devolvió una dirección Stellar válida.',
  revoked: 'Se perdió la autorización. Vuelve a conectar.', changed: 'La cuenta cambió. Vuelve a conectar para validar tu identidad.',
  timeout: 'La wallet no respondió a tiempo. Vuelve a intentarlo.', provider: 'No pudimos comunicarnos con Varial.',
  rpc: 'No pudimos consultar Testnet. Actualiza el saldo para reintentar.',
}

/** Local educational proof, no persistence or transaction methods. */
export class WalletSession {
  private state = initial()
  private listeners = new Set<() => void>()
  private generation = 0
  private checking: { generation: number; promise: Promise<void> } | null = null
  private balanceRequest = 0
  private proofRequest = 0
  private challenges: MessageChallenges
  private readonly port: WalletPort
  constructor(port: WalletPort, challenges = new MessageChallenges()) { this.port = port; this.challenges = challenges }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private update(patch: Partial<WalletState>) {
    const next = { ...this.state, ...patch }
    if (JSON.stringify(next) === JSON.stringify(this.state)) return
    this.state = next
    this.listeners.forEach(listener => listener())
  }
  disconnect = () => {
    this.generation++; this.balanceRequest++
    this.proofRequest++; this.challenges.clear()
    this.update(initial())
  }
  private fail(error: unknown) {
    this.generation++; this.balanceRequest++
    this.proofRequest++; this.challenges.clear()
    this.update({ ...initial(), status: 'error', issue: error instanceof WalletError ? error.code : 'provider' })
  }
  connect = async () => {
    if (this.state.status === 'connecting') return
    const generation = ++this.generation
    this.proofRequest++; this.challenges.clear()
    this.update({ ...initial(), status: 'connecting' })
    try {
      if (!await this.port.installed()) throw new WalletError('missing')
      if (generation !== this.generation) return
      await this.port.authorize()
      if (generation !== this.generation) return
      const context = validateContext(await this.port.context())
      if (generation !== this.generation) return
      this.update({ status: 'connected', address: context.address, identity: true, issue: null })
      await this.refreshBalance()
    } catch (error) { if (generation === this.generation) this.fail(error) }
  }
  check = (fresh = false): Promise<void> => {
    if (!this.state.identity || !this.state.address) return Promise.resolve()
    if (this.checking?.generation === this.generation) {
      const generation = this.generation
      return fresh ? this.checking.promise.then(() => { if (generation === this.generation) return this.check() }) : this.checking.promise
    }
    const generation = this.generation
    const address = this.state.address
    const promise = (async () => {
      try {
        const context = validateContext(await this.port.context())
        if (generation !== this.generation) return
        if (context.address !== address) throw new WalletError('changed')
      } catch (error) { if (generation === this.generation) this.fail(error) }
    })().finally(() => { if (this.checking?.promise === promise) this.checking = null })
    this.checking = { generation, promise }
    return promise
  }
  refreshBalance = async () => {
    if (!this.state.identity || !this.state.address) return
    const generation = this.generation
    const request = ++this.balanceRequest
    const address = this.state.address
    this.update({ balance: null, balanceStatus: 'loading' })
    try {
      await this.check()
      if (generation !== this.generation) return
      const balance = await this.port.balance(address)
      // Revalidate after the RPC read; never commit an old account's response.
      await this.check()
      if (generation !== this.generation || request !== this.balanceRequest) return
      this.update({ balance, balanceStatus: balance === null ? 'inactive' : /^0(?:\.0+)?$/.test(balance) ? 'empty' : 'ready' })
    } catch { if (generation === this.generation && request === this.balanceRequest) this.update({ balance: null, balanceStatus: 'error' }) }
  }
  cancelProof = () => {
    if (!['requesting', 'verifying'].includes(this.state.proofStatus)) return
    this.proofRequest++
    this.challenges.cancel()
    this.update({ proof: false, proofStatus: 'idle', proofIssue: 'cancelled' })
  }
  signProof = async (origin: string) => {
    if (!this.state.identity || !this.state.address || this.state.proof || ['requesting', 'verifying'].includes(this.state.proofStatus)) return
    const generation = this.generation
    const request = ++this.proofRequest
    const address = this.state.address
    const current = () => generation === this.generation && request === this.proofRequest && this.state.identity
    let challenge: MessageChallenge | undefined
    this.update({ proofStatus: 'requesting', proofIssue: null })
    try {
      await this.check(true)
      if (!current()) return
      const context = { address, passphrase: Networks.TESTNET }
      challenge = this.challenges.create(context, origin)
      const response = await this.port.signMessage(challenge.message, context)
      if (!current()) return
      this.update({ proofStatus: 'verifying' })
      await this.check(true)
      if (!current()) return
      this.challenges.verifyAndConsume(challenge, response, context, origin)
      this.update({ proof: true, proofStatus: 'verified', proofIssue: null })
    } catch (error) {
      if (!current()) return
      await this.check(true)
      if (current()) this.update({ proof: false, proofStatus: 'error', proofIssue: error instanceof ProofError || error instanceof WalletError ? error.code : 'provider' })
    } finally { this.challenges.abandon(challenge) }
  }
}
