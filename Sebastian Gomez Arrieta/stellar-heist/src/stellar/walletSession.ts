import { Networks, StrKey } from '@stellar/stellar-sdk/base'

export interface WalletContext { address: string; passphrase: string }
export interface WalletPort {
  installed(): Promise<boolean>
  authorize(): Promise<void>
  context(): Promise<WalletContext>
  balance(address: string): Promise<string | null>
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
}
const initial = (): WalletState => ({ status: 'disconnected', address: null, balance: null, balanceStatus: 'idle', issue: null, identity: false })

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

/** No persistence, signing or transaction methods. All completion is scoped to this session. */
export class WalletSession {
  private state = initial()
  private listeners = new Set<() => void>()
  private generation = 0
  private checking: { generation: number; promise: Promise<void> } | null = null
  private balanceRequest = 0
  private readonly port: WalletPort
  constructor(port: WalletPort) { this.port = port }
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
    this.update(initial())
  }
  private fail(error: unknown) {
    this.generation++; this.balanceRequest++
    this.update({ ...initial(), status: 'error', issue: error instanceof WalletError ? error.code : 'provider' })
  }
  connect = async () => {
    if (this.state.status === 'connecting') return
    const generation = ++this.generation
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
  check = (): Promise<void> => {
    if (!this.state.identity || !this.state.address) return Promise.resolve()
    if (this.checking?.generation === this.generation) return this.checking.promise
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
}
